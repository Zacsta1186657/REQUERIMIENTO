import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/api-utils';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const processMixedSchema = z.object({
  itemsEnStock: z.array(z.string()).min(1, 'Debe haber al menos un item en stock'),
  itemsCompra: z.array(z.string()).min(1, 'Debe haber al menos un item de compra'),
  transportista: z.string().optional(),
  destino: z.string().optional(),
  observaciones: z.string().optional(),
});

// POST /api/requerimientos/[id]/process-mixed - Process mixed flow (stock + purchase)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    // Only LOGISTICA and ADMIN can process mixed flow
    if (user.rol !== 'LOGISTICA' && user.rol !== 'ADMIN') {
      return forbiddenResponse('No tienes permiso para procesar este requerimiento');
    }

    const { id } = await params;
    const body = await request.json();

    const validation = processMixedSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { itemsEnStock, itemsCompra, transportista, destino, observaciones } = validation.data;

    // Get the requerimiento
    const requerimiento = await prisma.requerimiento.findUnique({
      where: { id },
      include: {
        items: {
          where: { eliminado: false },
        },
        _count: { select: { lotes: true } },
      },
    });

    if (!requerimiento) {
      return notFoundResponse('Requerimiento no encontrado');
    }

    // Must be in REVISION_LOGISTICA status
    if (requerimiento.estado !== 'REVISION_LOGISTICA') {
      return errorResponse('El requerimiento debe estar en Revision de Logistica', 400);
    }

    // Validate all items belong to this requirement
    const allItemIds = [...itemsEnStock, ...itemsCompra];
    const requerimientoItemIds = requerimiento.items.map((i) => i.id);

    const invalidItems = allItemIds.filter((itemId) => !requerimientoItemIds.includes(itemId));
    if (invalidItems.length > 0) {
      return errorResponse('Algunos items no pertenecen a este requerimiento', 400);
    }

    // Verify no duplicates between stock and purchase
    const duplicates = itemsEnStock.filter((id) => itemsCompra.includes(id));
    if (duplicates.length > 0) {
      return errorResponse('Un item no puede estar en stock y requiere compra al mismo tiempo', 400);
    }

    // Get stock items with their quantities
    const stockItems = requerimiento.items.filter((item) =>
      itemsEnStock.includes(item.id)
    );

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update items - mark stock/purchase flags
      await Promise.all([
        ...itemsEnStock.map((itemId) =>
          tx.requerimientoItem.update({
            where: { id: itemId },
            data: {
              enStock: true,
              requiereCompra: false,
            },
          })
        ),
        ...itemsCompra.map((itemId) =>
          tx.requerimientoItem.update({
            where: { id: itemId },
            data: {
              enStock: false,
              requiereCompra: true,
            },
          })
        ),
      ]);

      // 2. Create automatic lote for stock items
      const loteNumber = requerimiento._count.lotes + 1;

      const lote = await tx.lote.create({
        data: {
          numero: loteNumber,
          requerimientoId: id,
          transportista,
          destino,
          observaciones: observaciones || 'Lote automatico para items en stock (flujo mixto)',
          items: {
            create: stockItems.map((item) => ({
              requerimientoItemId: item.id,
              cantidadEnviada: item.cantidadAprobada || item.cantidadSolicitada,
            })),
          },
        },
        include: {
          items: {
            include: {
              requerimientoItem: true,
            },
          },
        },
      });

      // 3. Update requerimiento status to EN_COMPRA
      const updated = await tx.requerimiento.update({
        where: { id },
        data: { estado: 'EN_COMPRA' },
        include: {
          solicitante: {
            select: { id: true, nombre: true, email: true, rol: true },
          },
          operacion: true,
          centroCosto: true,
          items: {
            where: { eliminado: false },
            include: {
              categoria: true,
              unidadMedida: true,
            },
          },
          lotes: {
            include: {
              items: {
                include: {
                  requerimientoItem: true,
                },
              },
            },
          },
        },
      });

      // 4. Create history entry
      await tx.historialEstado.create({
        data: {
          requerimientoId: id,
          usuarioId: user.id,
          estadoAnterior: 'REVISION_LOGISTICA',
          estadoNuevo: 'EN_COMPRA',
          comentario: `Flujo mixto: ${itemsEnStock.length} items en stock (Lote #${loteNumber} creado), ${itemsCompra.length} items enviados a validacion de compra`,
        },
      });

      // 5. Notify requester
      await tx.notificacion.create({
        data: {
          tipo: 'ESTADO_CAMBIO',
          titulo: 'Requerimiento en proceso mixto',
          mensaje: `Tu requerimiento ${updated.numero} tiene items en stock listos para despacho y otros pendientes de validacion de compra`,
          usuarioId: requerimiento.solicitanteId,
          requerimientoId: id,
        },
      });

      // 6. Notify ADMINISTRACION for purchase validation
      const adminUsers = await tx.user.findMany({
        where: { rol: 'ADMINISTRACION', activo: true },
        select: { id: true },
      });

      if (adminUsers.length > 0) {
        await tx.notificacion.createMany({
          data: adminUsers.map((u) => ({
            tipo: 'APROBACION_PENDIENTE' as const,
            titulo: 'Validacion de compra pendiente',
            mensaje: `El requerimiento ${updated.numero} tiene ${itemsCompra.length} items que requieren validacion de compra`,
            usuarioId: u.id,
            requerimientoId: id,
          })),
        });
      }

      return { requerimiento: updated, lote };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing mixed flow:', error);
    return serverErrorResponse();
  }
}
