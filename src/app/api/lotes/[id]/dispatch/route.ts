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

    // Only LOGISTICA and ADMIN can dispatch
    if (user.rol !== 'LOGISTICA' && user.rol !== 'ADMIN') {
      return forbiddenResponse('No tienes permiso para despachar lotes');
    }

    const { id } = await params;

    const lote = await prisma.lote.findUnique({
      where: { id },
      include: {
        requerimiento: {
          select: {
            id: true,
            numero: true,
            estado: true,
            solicitanteId: true,
          },
        },
      },
    });

    if (!lote) {
      return notFoundResponse('Lote no encontrado');
    }

    // Lote must be in PENDIENTE or PREPARANDO
    if (!['PENDIENTE', 'PREPARANDO'].includes(lote.estado)) {
      return errorResponse('El lote ya fue despachado', 400);
    }

    // Update lote status
    const updatedLote = await prisma.lote.update({
      where: { id },
      data: {
        estado: 'DESPACHADO',
        fechaDespacho: new Date(),
      },
    });

    // Update requirement status to ENVIADO if not already
    if (lote.requerimiento.estado === 'LISTO_DESPACHO') {
      await prisma.requerimiento.update({
        where: { id: lote.requerimientoId },
        data: { estado: 'ENVIADO' },
      });

      // Create history entry
      await prisma.historialEstado.create({
        data: {
          estadoAnterior: 'LISTO_DESPACHO',
          estadoNuevo: 'ENVIADO',
          requerimientoId: lote.requerimientoId,
          usuarioId: user.id,
          comentario: `Lote ${lote.numero} despachado`,
        },
      });

      // Notify requester
      await prisma.notificacion.create({
        data: {
          tipo: 'ESTADO_CAMBIO',
          titulo: 'Requerimiento en camino',
          mensaje: `El lote ${lote.numero} del requerimiento ${lote.requerimiento.numero} ha sido despachado`,
          usuarioId: lote.requerimiento.solicitanteId,
          requerimientoId: lote.requerimientoId,
        },
      });
    }

    return NextResponse.json(updatedLote);
  } catch (error) {
    console.error('Dispatch lote error:', error);
    return serverErrorResponse();
  }
}
