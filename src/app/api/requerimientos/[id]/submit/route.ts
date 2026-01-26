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
import type { RequerimientoStatus, UserRole } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { id } = await params;

    const requerimiento = await prisma.requerimiento.findUnique({
      where: { id },
      include: {
        items: {
          where: { eliminado: false },
        },
      },
    });

    if (!requerimiento) {
      return notFoundResponse('Requerimiento no encontrado');
    }

    // Only owner can submit
    if (requerimiento.solicitanteId !== user.id && user.rol !== 'ADMIN') {
      return forbiddenResponse('Solo el solicitante puede enviar el requerimiento');
    }

    // Must be in BORRADOR status
    if (requerimiento.estado !== 'BORRADOR') {
      return errorResponse('Solo se pueden enviar requerimientos en estado Borrador', 400);
    }

    // Must have at least one item
    if (requerimiento.items.length === 0) {
      return errorResponse('El requerimiento debe tener al menos un item', 400);
    }

    // Update status directly to VALIDACION_SEGURIDAD
    const updated = await prisma.requerimiento.update({
      where: { id },
      data: { estado: 'VALIDACION_SEGURIDAD' },
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
        estadoAnterior: 'BORRADOR' as RequerimientoStatus,
        estadoNuevo: 'VALIDACION_SEGURIDAD' as RequerimientoStatus,
        requerimientoId: id,
        usuarioId: user.id,
        comentario: 'Requerimiento enviado para validación de seguridad',
      },
    });

    // Create notification for security role users
    const securityUsers = await prisma.user.findMany({
      where: { rol: 'SEGURIDAD', activo: true },
      select: { id: true },
    });

    if (securityUsers.length > 0) {
      await prisma.notificacion.createMany({
        data: securityUsers.map((u) => ({
          tipo: 'APROBACION_PENDIENTE',
          titulo: 'Nuevo requerimiento para validar',
          mensaje: `El requerimiento ${updated.numero} requiere validación de seguridad`,
          usuarioId: u.id,
          requerimientoId: id,
        })),
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Submit requerimiento error:', error);
    return serverErrorResponse();
  }
}
