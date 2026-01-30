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

    // Lote must be in DESPACHADO or EN_TRANSITO
    if (!['DESPACHADO', 'EN_TRANSITO'].includes(lote.estado)) {
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

    // Check if all lotes are delivered
    const allLotes = await prisma.lote.findMany({
      where: { requerimientoId: lote.requerimientoId },
      select: { estado: true },
    });

    const allDelivered = allLotes.every((l) => l.estado === 'ENTREGADO');
    const someDelivered = allLotes.some((l) => l.estado === 'ENTREGADO');

    // Update requirement status
    let newStatus = lote.requerimiento.estado;
    if (allDelivered) {
      newStatus = 'ENTREGADO';
    } else if (someDelivered) {
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
          comentario: allDelivered
            ? 'Entrega completa confirmada'
            : `Lote ${lote.numero} entregado - Entrega parcial`,
        },
      });

      // Notify requester
      await prisma.notificacion.create({
        data: {
          tipo: 'ENTREGADO',
          titulo: allDelivered ? 'Requerimiento entregado' : 'Entrega parcial',
          mensaje: allDelivered
            ? `Tu requerimiento ${lote.requerimiento.numero} ha sido entregado completamente`
            : `El lote ${lote.numero} de tu requerimiento ${lote.requerimiento.numero} ha sido entregado`,
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
