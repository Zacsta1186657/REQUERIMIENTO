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

const confirmPurchaseReceivedSchema = z.object({
  itemIds: z.array(z.string()).min(1, 'Debe incluir al menos un item'),
});

// POST /api/requerimientos/[id]/items/confirm-purchase-received
// Permite a Logística confirmar que los items comprados ya llegaron al almacén
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    // Only LOGISTICA and ADMIN can confirm purchase received
    if (user.rol !== 'LOGISTICA' && user.rol !== 'ADMIN') {
      return forbiddenResponse('No tienes permiso para confirmar recepción de compras');
    }

    const { id } = await params;
    const body = await request.json();

    const validation = confirmPurchaseReceivedSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { itemIds } = validation.data;

    // Get the requerimiento
    const requerimiento = await prisma.requerimiento.findUnique({
      where: { id },
      include: {
        items: {
          where: {
            eliminado: false,
            requiereCompra: true,
            validadoCompra: true,
          },
        },
        solicitante: {
          select: { id: true, nombre: true },
        },
      },
    });

    if (!requerimiento) {
      return notFoundResponse('Requerimiento no encontrado');
    }

    // Must be in LISTO_DESPACHO, EN_COMPRA, or APROBADO_ADM status
    const validStatuses = ['LISTO_DESPACHO', 'EN_COMPRA', 'APROBADO_ADM'];
    if (!validStatuses.includes(requerimiento.estado)) {
      return errorResponse(
        'El requerimiento debe estar en estado Listo para Despacho, En Compra o Aprobado',
        400
      );
    }

    // Validate that all items to confirm belong to this requirement and are valid for this operation
    const validItemIds = requerimiento.items.map((i) => i.id);
    const invalidItems = itemIds.filter((itemId) => !validItemIds.includes(itemId));

    if (invalidItems.length > 0) {
      return errorResponse(
        'Algunos items no pertenecen a este requerimiento, no requieren compra o no han sido validados',
        400
      );
    }

    // Check that items are not already marked as received
    const alreadyReceived = requerimiento.items.filter(
      (item) => itemIds.includes(item.id) && item.compraRecibida === true
    );

    if (alreadyReceived.length > 0) {
      return errorResponse(
        'Algunos items ya fueron marcados como recibidos',
        400
      );
    }

    // Update each item's compraRecibida status
    const now = new Date();
    await Promise.all(
      itemIds.map((itemId) =>
        prisma.requerimientoItem.update({
          where: { id: itemId },
          data: {
            compraRecibida: true,
            fechaRecepcionCompra: now,
          },
        })
      )
    );

    // Create modification history for each item
    await Promise.all(
      itemIds.map((itemId) =>
        prisma.modificacionItem.create({
          data: {
            requerimientoItemId: itemId,
            usuarioId: user.id,
            campo: 'compraRecibida',
            valorAnterior: 'false',
            valorNuevo: 'true',
            motivo: 'Confirmación de recepción de compra en almacén',
          },
        })
      )
    );

    // Notify requester
    await prisma.notificacion.create({
      data: {
        tipo: 'ESTADO_CAMBIO',
        titulo: 'Items recibidos en almacén',
        mensaje: `${itemIds.length} item(s) del requerimiento ${requerimiento.numero} han sido recibidos en almacén y están listos para despacho`,
        usuarioId: requerimiento.solicitanteId,
        requerimientoId: id,
      },
    });

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
            validadoPor: {
              select: { id: true, nombre: true },
            },
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
      message: `${itemIds.length} item(s) marcados como recibidos en almacén`,
      requerimiento: updated,
    });
  } catch (error) {
    console.error('Error confirming purchase received:', error);
    return serverErrorResponse();
  }
}
