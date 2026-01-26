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

// Maps current status to next approved status (simplified flow)
const APPROVAL_TRANSITIONS: Partial<Record<RequerimientoStatus, RequerimientoStatus>> = {
  // SEGURIDAD approves -> goes directly to GERENCIA validation
  VALIDACION_SEGURIDAD: 'VALIDACION_GERENCIA',
  // GERENCIA approves -> goes directly to LOGISTICA review
  VALIDACION_GERENCIA: 'REVISION_LOGISTICA',
  // ADMINISTRACION approves purchase -> ready for dispatch
  EN_COMPRA: 'LISTO_DESPACHO',
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { id } = await params;

    let comentario: string | undefined;
    try {
      const body = await request.json();
      comentario = body.comentario;
    } catch {
      // No body provided, that's okay
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

    // Check if user can approve at this status
    const transitions = getAvailableTransitions(currentStatus, user.rol as UserRole);
    const approveTransition = transitions.find((t) => t.action === 'approve' || t.action === 'process');

    if (!approveTransition) {
      return forbiddenResponse('No tienes permiso para aprobar este requerimiento en su estado actual');
    }

    // Get next status
    const nextStatus = APPROVAL_TRANSITIONS[currentStatus];
    if (!nextStatus) {
      return errorResponse('No se puede aprobar este requerimiento', 400);
    }

    // Update status
    const updated = await prisma.requerimiento.update({
      where: { id },
      data: { estado: nextStatus },
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
        estadoNuevo: nextStatus,
        requerimientoId: id,
        usuarioId: user.id,
        comentario: comentario || `Aprobado por ${user.nombre}`,
      },
    });

    // Notify the requester
    await prisma.notificacion.create({
      data: {
        tipo: 'ESTADO_CAMBIO',
        titulo: 'Requerimiento aprobado',
        mensaje: `Tu requerimiento ${updated.numero} ha avanzado a ${nextStatus}`,
        usuarioId: requerimiento.solicitanteId,
        requerimientoId: id,
      },
    });

    // Notify next approvers based on new status
    const roleToNotify = getNextApproverRole(nextStatus);
    if (roleToNotify) {
      const nextApprovers = await prisma.user.findMany({
        where: { rol: roleToNotify, activo: true },
        select: { id: true },
      });

      if (nextApprovers.length > 0) {
        await prisma.notificacion.createMany({
          data: nextApprovers.map((u) => ({
            tipo: 'APROBACION_PENDIENTE',
            titulo: 'Requerimiento pendiente de aprobación',
            mensaje: `El requerimiento ${updated.numero} requiere tu validación`,
            usuarioId: u.id,
            requerimientoId: id,
          })),
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Approve requerimiento error:', error);
    return serverErrorResponse();
  }
}

function getNextApproverRole(status: RequerimientoStatus): UserRole | null {
  const roleMap: Partial<Record<RequerimientoStatus, UserRole>> = {
    VALIDACION_SEGURIDAD: 'SEGURIDAD',
    VALIDACION_GERENCIA: 'GERENCIA',
    REVISION_LOGISTICA: 'LOGISTICA',
    EN_COMPRA: 'ADMINISTRACION',
  };
  return roleMap[status] || null;
}
