import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationError,
  serverErrorResponse,
  errorResponse,
} from '@/lib/api-utils';
import { updateRequerimientoSchema } from '@/lib/validations/requerimiento';
import { getPermissions } from '@/lib/workflow/permissions';
import type { RequerimientoStatus, UserRole } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { id } = await params;

    const requerimiento = await prisma.requerimiento.findUnique({
      where: { id },
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
          orderBy: { createdAt: 'asc' },
        },
        lotes: {
          include: {
            items: {
              include: {
                requerimientoItem: {
                  include: {
                    categoria: true,
                    unidadMedida: true,
                  },
                },
              },
            },
          },
          orderBy: { numero: 'asc' },
        },
        _count: {
          select: { items: true, lotes: true },
        },
      },
    });

    if (!requerimiento) {
      return notFoundResponse('Requerimiento no encontrado');
    }

    // Check if user can view this requirement
    const isOwner = requerimiento.solicitanteId === user.id;
    const permissions = getPermissions(
      requerimiento.estado as RequerimientoStatus,
      user.rol as UserRole,
      isOwner
    );

    if (!permissions.canView && user.rol !== 'ADMIN' && !isOwner) {
      return forbiddenResponse('No tienes permiso para ver este requerimiento');
    }

    return NextResponse.json({ ...requerimiento, permissions });
  } catch (error) {
    console.error('Get requerimiento error:', error);
    return serverErrorResponse();
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { id } = await params;

    const requerimiento = await prisma.requerimiento.findUnique({
      where: { id },
      select: { id: true, estado: true, solicitanteId: true },
    });

    if (!requerimiento) {
      return notFoundResponse('Requerimiento no encontrado');
    }

    // Check permissions
    const isOwner = requerimiento.solicitanteId === user.id;
    const permissions = getPermissions(
      requerimiento.estado as RequerimientoStatus,
      user.rol as UserRole,
      isOwner
    );

    if (!permissions.canEdit) {
      return forbiddenResponse('No tienes permiso para editar este requerimiento');
    }

    const body = await request.json();

    const validation = updateRequerimientoSchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error);
    }

    const updated = await prisma.requerimiento.update({
      where: { id },
      data: validation.data,
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update requerimiento error:', error);
    return serverErrorResponse();
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { id } = await params;

    const requerimiento = await prisma.requerimiento.findUnique({
      where: { id },
      select: { id: true, estado: true, solicitanteId: true },
    });

    if (!requerimiento) {
      return notFoundResponse('Requerimiento no encontrado');
    }

    // Can only delete BORRADOR
    if (requerimiento.estado !== 'BORRADOR') {
      return errorResponse('Solo se pueden eliminar requerimientos en estado Borrador', 400);
    }

    // Check permissions
    const isOwner = requerimiento.solicitanteId === user.id;
    const permissions = getPermissions(
      requerimiento.estado as RequerimientoStatus,
      user.rol as UserRole,
      isOwner
    );

    if (!permissions.canDelete) {
      return forbiddenResponse('No tienes permiso para eliminar este requerimiento');
    }

    await prisma.requerimiento.delete({ where: { id } });

    return NextResponse.json({ message: 'Requerimiento eliminado' });
  } catch (error) {
    console.error('Delete requerimiento error:', error);
    return serverErrorResponse();
  }
}
