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
import { getAvailableTransitions } from '@/lib/workflow/transitions';
import type { RequerimientoStatus, UserRole } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Maps current status to rejected status
const REJECTION_TRANSITIONS: Partial<Record<RequerimientoStatus, RequerimientoStatus>> = {
  VALIDACION_SEGURIDAD: 'RECHAZADO_SEGURIDAD',
  VALIDACION_GERENCIA: 'RECHAZADO_GERENCIA',
  EN_COMPRA: 'RECHAZADO_ADM',
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { id } = await params;

    const body = await request.json();
    const { comentario } = body;

    // Comment is required for rejection
    if (!comentario || comentario.trim().length < 10) {
      return errorResponse('El comentario es obligatorio y debe tener al menos 10 caracteres', 400);
    }

    const requerimiento = await prisma.requerimiento.findUnique({
      where: { id },
      select: {
        id: true,
        numero: true,
        estado: true,
        solicitanteId: true,
      },
    });

    if (!requerimiento) {
      return notFoundResponse('Requerimiento no encontrado');
    }

    const currentStatus = requerimiento.estado as RequerimientoStatus;

    // Check if user can reject at this status
    const transitions = getAvailableTransitions(currentStatus, user.rol as UserRole);
    const rejectTransition = transitions.find((t) => t.action === 'reject');

    if (!rejectTransition) {
      return forbiddenResponse('No tienes permiso para rechazar este requerimiento en su estado actual');
    }

    // Get rejection status
    const rejectedStatus = REJECTION_TRANSITIONS[currentStatus];
    if (!rejectedStatus) {
      return errorResponse('No se puede rechazar este requerimiento', 400);
    }

    // Update status
    const updated = await prisma.requerimiento.update({
      where: { id },
      data: { estado: rejectedStatus },
      include: {
        solicitante: {
          select: { id: true, nombre: true, email: true, rol: true },
        },
        operacion: {
          select: { id: true, nombre: true, codigo: true },
        },
        centroCosto: {
          select: { id: true, nombre: true, codigo: true },
        },
        items: {
          where: { eliminado: false },
          include: {
            categoria: true,
            unidadMedida: true,
          },
        },
      },
    });

    // Create history entry
    await prisma.historialEstado.create({
      data: {
        estadoAnterior: currentStatus,
        estadoNuevo: rejectedStatus,
        requerimientoId: id,
        usuarioId: user.id,
        comentario,
      },
    });

    // Notify the requester
    await prisma.notificacion.create({
      data: {
        tipo: 'RECHAZADO',
        titulo: 'Requerimiento rechazado',
        mensaje: `Tu requerimiento ${updated.numero} ha sido rechazado. Motivo: ${comentario}`,
        usuarioId: requerimiento.solicitanteId,
        requerimientoId: id,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Reject requerimiento error:', error);
    return serverErrorResponse();
  }
}
