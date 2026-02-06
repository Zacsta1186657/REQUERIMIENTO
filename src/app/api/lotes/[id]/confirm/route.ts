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

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    // Only RECEPTOR and ADMIN can confirm delivery
    if (!['RECEPTOR', 'ADMIN'].includes(user.rol)) {
      return forbiddenResponse('Solo el rol RECEPTOR puede confirmar la recepción física de mercancía');
    }

    const { id } = await params;

    let observaciones: string | undefined;
    let items: Array<{ loteItemId: string; cantidadRecibida: number }> | undefined;
    try {
      const body = await request.json();
      observaciones = body.observaciones;
      items = body.items;
    } catch {
      // No body provided
    }

    const lote = await prisma.lote.findUnique({
      where: { id },
      include: {
        requerimiento: {
          select: {
            id: true,
            numero: true,
            estado: true,
            solicitanteId: true,
            _count: { select: { lotes: true } },
          },
        },
      },
    });

    if (!lote) {
      return notFoundResponse('Lote no encontrado');
    }

    // Lote must be in DESPACHADO, EN_TRANSITO or PENDIENTE_RECEPCION
    // PENDIENTE_RECEPCION: el receptor ya programó el recojo y ahora confirma la recepción
    if (!['DESPACHADO', 'EN_TRANSITO', 'PENDIENTE_RECEPCION'].includes(lote.estado)) {
      return errorResponse('El lote no puede ser confirmado en su estado actual', 400);
    }

    // Update lote items with received quantities if provided
    if (items && items.length > 0) {
      for (const item of items) {
        await prisma.loteItem.update({
          where: { id: item.loteItemId },
          data: { cantidadRecibida: item.cantidadRecibida },
        });
      }
    }

    // Update lote status
    await prisma.lote.update({
      where: { id },
      data: {
        estado: 'ENTREGADO',
        fechaEntrega: new Date(),
        confirmadoRecepcion: true,
        receptorId: user.id,
        ...(observaciones && { observaciones }),
      },
    });

    // Get all requerimiento items with their required quantities
    const requerimientoItems = await prisma.requerimientoItem.findMany({
      where: { requerimientoId: lote.requerimientoId },
      select: {
        id: true,
        cantidadSolicitada: true,
        cantidadAprobada: true,
      },
    });

    // Get all lote items that have been delivered (from delivered lotes)
    const allDeliveredLoteItems = await prisma.loteItem.findMany({
      where: {
        lote: {
          requerimientoId: lote.requerimientoId,
          estado: 'ENTREGADO',
        },
      },
      select: {
        requerimientoItemId: true,
        cantidadRecibida: true,
        cantidadEnviada: true,
      },
    });

    // Calculate total received per item
    const receivedByItem: Record<string, number> = {};
    allDeliveredLoteItems.forEach((loteItem) => {
      if (loteItem.requerimientoItemId) {
        receivedByItem[loteItem.requerimientoItemId] =
          (receivedByItem[loteItem.requerimientoItemId] || 0) +
          (loteItem.cantidadRecibida ?? loteItem.cantidadEnviada);
      }
    });

    // Check if all items are fully received
    let allItemsFullyReceived = true;
    let someItemsReceived = false;

    for (const item of requerimientoItems) {
      const requiredQuantity = item.cantidadAprobada ?? item.cantidadSolicitada;
      const receivedQuantity = receivedByItem[item.id] || 0;

      if (receivedQuantity > 0) {
        someItemsReceived = true;
      }

      if (receivedQuantity < requiredQuantity) {
        allItemsFullyReceived = false;
      }
    }

    // Update requirement status based on actual item quantities
    let newStatus = lote.requerimiento.estado;
    if (allItemsFullyReceived) {
      newStatus = 'ENTREGADO';
    } else if (someItemsReceived) {
      newStatus = 'ENTREGADO_PARCIAL';
    }

    if (newStatus !== lote.requerimiento.estado) {
      await prisma.requerimiento.update({
        where: { id: lote.requerimientoId },
        data: { estado: newStatus },
      });

      // Create history entry
      await prisma.historialEstado.create({
        data: {
          estadoAnterior: lote.requerimiento.estado,
          estadoNuevo: newStatus,
          requerimientoId: lote.requerimientoId,
          usuarioId: user.id,
          comentario: allItemsFullyReceived
            ? 'Todos los items han sido recibidos - Entrega completa'
            : `Lote ${lote.numero} recibido - Pendiente envío de items restantes`,
        },
      });

      // Notify requester
      await prisma.notificacion.create({
        data: {
          tipo: 'ENTREGADO',
          titulo: allItemsFullyReceived ? 'Requerimiento entregado' : 'Entrega parcial recibida',
          mensaje: allItemsFullyReceived
            ? `Tu requerimiento ${lote.requerimiento.numero} ha sido entregado completamente`
            : `Lote ${lote.numero} recibido. Quedan items pendientes de envío en tu requerimiento ${lote.requerimiento.numero}`,
          usuarioId: lote.requerimiento.solicitanteId,
          requerimientoId: lote.requerimientoId,
        },
      });
    }

    const updatedLote = await prisma.lote.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            requerimientoItem: true,
          },
        },
        receptor: {
          select: { id: true, nombre: true },
        },
      },
    });

    return NextResponse.json(updatedLote);
  } catch (error) {
    console.error('Confirm delivery error:', error);
    // Return more detailed error for debugging
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Error al confirmar recepción: ${error.message}` },
        { status: 500 }
      );
    }
    return serverErrorResponse();
  }
}
