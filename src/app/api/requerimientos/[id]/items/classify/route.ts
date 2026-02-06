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
import { ItemStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const classifyItemSchema = z.object({
  items: z.array(z.object({
    itemId: z.string(),
    nuevoEstado: z.enum(['EN_STOCK', 'REQUIERE_COMPRA']),
    cantidadAprobada: z.number().positive(),
    motivoStock: z.string().nullable().optional(),
    fechaEstimadaCompra: z.string().nullable().optional(),
  })).min(1, 'Debe incluir al menos un item'),
});

// POST /api/requerimientos/[id]/items/classify
// Clasifica ítems y actualiza sus estados
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    // Only LOGISTICA and ADMIN can classify items
    if (user.rol !== 'LOGISTICA' && user.rol !== 'ADMIN') {
      return forbiddenResponse('No tienes permiso para clasificar ítems');
    }

    const { id } = await params;
    const body = await request.json();

    const validation = classifyItemSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { items } = validation.data;

    // Get the requerimiento
    const requerimiento = await prisma.requerimiento.findUnique({
      where: { id },
      include: {
        items: {
          where: { eliminado: false },
        },
        solicitante: {
          select: { id: true, nombre: true },
        },
      },
    });

    if (!requerimiento) {
      return notFoundResponse('Requerimiento no encontrado');
    }

    // Validate all items belong to this requerimiento and are classifiable
    // SOLO PENDIENTE_CLASIFICACION: clasificación inicial
    // NOTA: Los ítems RECHAZADO_COMPRA NO pueden ser reclasificados - quedan descartados del flujo
    const requerimientoItemIds = requerimiento.items.map((i) => i.id);
    const classifiableItems = requerimiento.items.filter(
      (i) => i.estadoItem === 'PENDIENTE_CLASIFICACION'
    );
    const classifiableItemIds = classifiableItems.map((i) => i.id);

    for (const item of items) {
      if (!requerimientoItemIds.includes(item.itemId)) {
        return errorResponse(`El ítem ${item.itemId} no pertenece a este requerimiento`, 400);
      }
      // Verificar si el ítem está rechazado
      const reqItem = requerimiento.items.find((i) => i.id === item.itemId);
      if (reqItem?.estadoItem === 'RECHAZADO_COMPRA') {
        return errorResponse(`El ítem "${reqItem.descripcion}" fue rechazado por Administración y no puede ser procesado`, 400);
      }
      if (!classifiableItemIds.includes(item.itemId)) {
        return errorResponse(`El ítem ${item.itemId} no está disponible para clasificación`, 400);
      }
    }

    // Separate items by classification
    const itemsStock = items.filter((i) => i.nuevoEstado === 'EN_STOCK');
    const itemsCompra = items.filter((i) => i.nuevoEstado === 'REQUIERE_COMPRA');

    // Update items in stock -> directly to LISTO_PARA_DESPACHO
    if (itemsStock.length > 0) {
      await Promise.all(
        itemsStock.map((item) =>
          prisma.requerimientoItem.update({
            where: { id: item.itemId },
            data: {
              estadoItem: 'LISTO_PARA_DESPACHO',
              enStock: true,
              requiereCompra: false,
              cantidadAprobada: item.cantidadAprobada,
            },
          })
        )
      );

      // Create modification history
      await Promise.all(
        itemsStock.map((item) => {
          return prisma.modificacionItem.create({
            data: {
              requerimientoItemId: item.itemId,
              usuarioId: user.id,
              campo: 'estadoItem',
              valorAnterior: 'PENDIENTE_CLASIFICACION',
              valorNuevo: 'LISTO_PARA_DESPACHO',
              motivo: 'Clasificado como en stock por Logística',
            },
          });
        })
      );
    }

    // Update items that require purchase -> PENDIENTE_VALIDACION_ADMIN
    if (itemsCompra.length > 0) {
      await Promise.all(
        itemsCompra.map((item) =>
          prisma.requerimientoItem.update({
            where: { id: item.itemId },
            data: {
              estadoItem: 'PENDIENTE_VALIDACION_ADMIN',
              enStock: false,
              requiereCompra: true,
              cantidadAprobada: item.cantidadAprobada,
              motivoStock: item.motivoStock || null,
              fechaEstimadaCompra: item.fechaEstimadaCompra
                ? new Date(item.fechaEstimadaCompra)
                : null,
              // Limpiar campos de validación anterior si fue rechazado
              validadoCompra: null,
              validadoPorId: null,
              fechaValidacion: null,
              observacionCompra: null,
            },
          })
        )
      );

      // Create modification history
      // NOTA: Los ítems RECHAZADO_COMPRA no pueden ser reclasificados,
      // por lo que siempre vienen de PENDIENTE_CLASIFICACION
      await Promise.all(
        itemsCompra.map((item) => {
          return prisma.modificacionItem.create({
            data: {
              requerimientoItemId: item.itemId,
              usuarioId: user.id,
              campo: 'estadoItem',
              valorAnterior: 'PENDIENTE_CLASIFICACION',
              valorNuevo: 'PENDIENTE_VALIDACION_ADMIN',
              motivo: 'Clasificado como requiere compra por Logística',
            },
          });
        })
      );
    }

    // Update requerimiento status based on item states
    // Check all items to determine new status
    const allItems = await prisma.requerimientoItem.findMany({
      where: { requerimientoId: id, eliminado: false },
    });

    let newRequerimientoStatus = requerimiento.estado;
    const itemStatuses = allItems.map((i) => i.estadoItem);

    // If all items are ready for dispatch -> LISTO_DESPACHO
    if (itemStatuses.every((s) => s === 'LISTO_PARA_DESPACHO')) {
      newRequerimientoStatus = 'LISTO_DESPACHO';
    }
    // If any item needs admin validation -> EN_COMPRA
    else if (itemStatuses.some((s) => s === 'PENDIENTE_VALIDACION_ADMIN')) {
      newRequerimientoStatus = 'EN_COMPRA';
    }
    // If mixed (some ready, some pending) -> EN_COMPRA (prioritize validation)
    else if (
      itemStatuses.some((s) => s === 'LISTO_PARA_DESPACHO') &&
      itemStatuses.some((s) => s === 'PENDIENTE_CLASIFICACION')
    ) {
      newRequerimientoStatus = 'REVISION_LOGISTICA';
    }

    // Update requerimiento status if changed
    if (newRequerimientoStatus !== requerimiento.estado) {
      await prisma.requerimiento.update({
        where: { id },
        data: { estado: newRequerimientoStatus },
      });

      // Create history entry
      await prisma.historialEstado.create({
        data: {
          requerimientoId: id,
          usuarioId: user.id,
          estadoAnterior: requerimiento.estado,
          estadoNuevo: newRequerimientoStatus,
          comentario: `Clasificación de ítems: ${itemsStock.length} en stock, ${itemsCompra.length} requieren compra`,
        },
      });

      // Notify relevant users
      if (newRequerimientoStatus === 'EN_COMPRA') {
        // Notify ADMINISTRACION
        const adminUsers = await prisma.user.findMany({
          where: { rol: 'ADMINISTRACION', activo: true },
          select: { id: true },
        });

        if (adminUsers.length > 0) {
          await prisma.notificacion.createMany({
            data: adminUsers.map((u) => ({
              tipo: 'APROBACION_PENDIENTE' as const,
              titulo: 'Compras pendientes de validación',
              mensaje: `El requerimiento ${requerimiento.numero} tiene ${itemsCompra.length} ítem(s) pendientes de validación de compra`,
              usuarioId: u.id,
              requerimientoId: id,
            })),
          });
        }
      }

      if (newRequerimientoStatus === 'LISTO_DESPACHO') {
        // Notify LOGISTICA for dispatch
        const logisticaUsers = await prisma.user.findMany({
          where: { rol: 'LOGISTICA', activo: true },
          select: { id: true },
        });

        if (logisticaUsers.length > 0) {
          await prisma.notificacion.createMany({
            data: logisticaUsers.map((u) => ({
              tipo: 'LISTO_DESPACHO' as const,
              titulo: 'Requerimiento listo para despacho',
              mensaje: `El requerimiento ${requerimiento.numero} está listo para despachar`,
              usuarioId: u.id,
              requerimientoId: id,
            })),
          });
        }
      }
    }

    // Return updated requerimiento
    const updated = await prisma.requerimiento.findUnique({
      where: { id },
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

    return NextResponse.json({
      message: `${items.length} ítem(s) clasificados correctamente`,
      requerimiento: updated,
    });
  } catch (error) {
    console.error('Error classifying items:', error);
    return serverErrorResponse();
  }
}
