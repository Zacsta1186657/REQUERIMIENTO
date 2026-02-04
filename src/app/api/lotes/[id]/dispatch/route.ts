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
import { RequerimientoStatus } from '@prisma/client';
import { calculateRequerimientoStatus } from '@/lib/workflow/item-transitions';

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
        items: {
          include: {
            requerimientoItem: true,
          },
        },
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

    // Update estadoItem for each item in the lote
    for (const loteItem of lote.items) {
      const requerimientoItem = loteItem.requerimientoItem;
      if (!requerimientoItem) continue;

      // Calculate total dispatched quantity for this item across ALL lotes
      const allLoteItems = await prisma.loteItem.findMany({
        where: {
          requerimientoItemId: requerimientoItem.id,
          lote: {
            estado: { in: ['DESPACHADO', 'EN_TRANSITO', 'ENTREGADO'] },
          },
        },
      });

      // Include current lote's quantity (since we just updated it)
      const totalDespachado = allLoteItems.reduce(
        (sum, item) => sum + item.cantidadEnviada,
        loteItem.cantidadEnviada // Add current lote item if not already counted
      );

      // Avoid double counting if allLoteItems already includes this lote
      const alreadyCounted = allLoteItems.some(item => item.id === loteItem.id);
      const finalDespachado = alreadyCounted
        ? allLoteItems.reduce((sum, item) => sum + item.cantidadEnviada, 0)
        : totalDespachado;

      const cantidadTotal = requerimientoItem.cantidadAprobada ?? requerimientoItem.cantidadSolicitada;

      // Determine new estadoItem
      let newEstadoItem: 'DESPACHO_PARCIAL' | 'DESPACHADO';
      if (finalDespachado >= cantidadTotal) {
        newEstadoItem = 'DESPACHADO';
      } else {
        newEstadoItem = 'DESPACHO_PARCIAL';
      }

      // Only update if the item was in a dispatchable state
      if (['LISTO_PARA_DESPACHO', 'DESPACHO_PARCIAL'].includes(requerimientoItem.estadoItem)) {
        await prisma.requerimientoItem.update({
          where: { id: requerimientoItem.id },
          data: { estadoItem: newEstadoItem },
        });

        // Create modification history
        await prisma.modificacionItem.create({
          data: {
            requerimientoItemId: requerimientoItem.id,
            usuarioId: user.id,
            campo: 'estadoItem',
            valorAnterior: requerimientoItem.estadoItem,
            valorNuevo: newEstadoItem,
            motivo: `Despachado en lote ${lote.numero}`,
          },
        });
      }
    }

    // Get all items to recalculate requerimiento status
    const allItems = await prisma.requerimientoItem.findMany({
      where: { requerimientoId: lote.requerimientoId, eliminado: false },
    });

    const itemStatuses = allItems.map((i) => i.estadoItem);
    const suggestedStatus = calculateRequerimientoStatus(itemStatuses) as RequerimientoStatus;

    // Update requerimiento status if changed
    if (suggestedStatus !== lote.requerimiento.estado) {
      await prisma.requerimiento.update({
        where: { id: lote.requerimientoId },
        data: { estado: suggestedStatus },
      });

      // Create history entry
      await prisma.historialEstado.create({
        data: {
          estadoAnterior: lote.requerimiento.estado,
          estadoNuevo: suggestedStatus,
          requerimientoId: lote.requerimientoId,
          usuarioId: user.id,
          comentario: `Lote ${lote.numero} despachado`,
        },
      });
    }

    // Notify requester
    await prisma.notificacion.create({
      data: {
        tipo: 'ESTADO_CAMBIO',
        titulo: 'Lote despachado',
        mensaje: `El lote ${lote.numero} del requerimiento ${lote.requerimiento.numero} ha sido despachado`,
        usuarioId: lote.requerimiento.solicitanteId,
        requerimientoId: lote.requerimientoId,
      },
    });

    // Notify RECEPTOR
    const receptorUsers = await prisma.user.findMany({
      where: { rol: 'RECEPTOR', activo: true },
      select: { id: true },
    });

    if (receptorUsers.length > 0) {
      await prisma.notificacion.createMany({
        data: receptorUsers.map((u) => ({
          tipo: 'ESTADO_CAMBIO' as const,
          titulo: 'Lote en camino',
          mensaje: `El lote ${lote.numero} del requerimiento ${lote.requerimiento.numero} está en camino. Confirmar recepción cuando llegue.`,
          usuarioId: u.id,
          requerimientoId: lote.requerimientoId,
        })),
      });
    }

    return NextResponse.json(updatedLote);
  } catch (error) {
    console.error('Dispatch lote error:', error);
    return serverErrorResponse();
  }
}
