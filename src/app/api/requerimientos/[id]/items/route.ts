import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationError,
  serverErrorResponse,
} from '@/lib/api-utils';
import { createItemSchema } from '@/lib/validations/item';
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
      select: { id: true, estado: true, solicitanteId: true },
    });

    if (!requerimiento) {
      return notFoundResponse('Requerimiento no encontrado');
    }

    // TECNICO can only see items of their own requirements
    if (user.rol === 'TECNICO' && requerimiento.solicitanteId !== user.id) {
      return forbiddenResponse('No tienes permiso para ver este requerimiento');
    }

    const items = await prisma.requerimientoItem.findMany({
      where: {
        requerimientoId: id,
        eliminado: false,
      },
      include: {
        categoria: true,
        unidadMedida: true,
        producto: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ data: items });
  } catch (error) {
    console.error('Get items error:', error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // TECNICO can only add items to their own requirements
    const isOwner = requerimiento.solicitanteId === user.id;
    if (user.rol === 'TECNICO' && !isOwner) {
      return forbiddenResponse('No tienes permiso para modificar este requerimiento');
    }

    // Check permissions
    const permissions = getPermissions(
      requerimiento.estado as RequerimientoStatus,
      user.rol as UserRole,
      isOwner
    );

    if (!permissions.canAddItems) {
      return forbiddenResponse('No puedes agregar items a este requerimiento');
    }

    const body = await request.json();

    const validation = createItemSchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error);
    }

    const item = await prisma.requerimientoItem.create({
      data: {
        ...validation.data,
        requerimientoId: id,
      },
      include: {
        categoria: true,
        unidadMedida: true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Create item error:', error);
    return serverErrorResponse();
  }
}
