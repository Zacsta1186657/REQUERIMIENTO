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
import { updateItemSchema } from '@/lib/validations/item';
import { getPermissions } from '@/lib/workflow/permissions';
import type { RequerimientoStatus, UserRole } from '@/types';

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { id, itemId } = await params;

    const requerimiento = await prisma.requerimiento.findUnique({
      where: { id },
      select: { id: true, estado: true, solicitanteId: true },
    });

    if (!requerimiento) {
      return notFoundResponse('Requerimiento no encontrado');
    }

    const existingItem = await prisma.requerimientoItem.findFirst({
      where: { id: itemId, requerimientoId: id },
    });

    if (!existingItem) {
      return notFoundResponse('Item no encontrado');
    }

    // Check permissions
    const isOwner = requerimiento.solicitanteId === user.id;
    const permissions = getPermissions(
      requerimiento.estado as RequerimientoStatus,
      user.rol as UserRole,
      isOwner
    );

    if (!permissions.canEditItems) {
      return forbiddenResponse('No puedes editar items de este requerimiento');
    }

    const body = await request.json();

    const validation = updateItemSchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error);
    }

    // Record modifications for audit
    const changes = validation.data;
    const modificationPromises = [];

    for (const [campo, valorNuevo] of Object.entries(changes)) {
      const valorAnterior = existingItem[campo as keyof typeof existingItem];
      if (valorAnterior !== valorNuevo) {
        modificationPromises.push(
          prisma.modificacionItem.create({
            data: {
              requerimientoItemId: itemId,
              usuarioId: user.id,
              campo,
              valorAnterior: String(valorAnterior ?? ''),
              valorNuevo: String(valorNuevo ?? ''),
            },
          })
        );
      }
    }

    // Process fechaEstimadaCompra if provided
    const updateData: Record<string, unknown> = { ...validation.data };
    if (updateData.fechaEstimadaCompra) {
      updateData.fechaEstimadaCompra = new Date(updateData.fechaEstimadaCompra as string);
    }

    const [item] = await Promise.all([
      prisma.requerimientoItem.update({
        where: { id: itemId },
        data: updateData,
        include: {
          categoria: true,
          unidadMedida: true,
        },
      }),
      ...modificationPromises,
    ]);

    return NextResponse.json(item);
  } catch (error) {
    console.error('Update item error:', error);
    return serverErrorResponse();
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { id, itemId } = await params;

    const requerimiento = await prisma.requerimiento.findUnique({
      where: { id },
      select: { id: true, estado: true, solicitanteId: true },
    });

    if (!requerimiento) {
      return notFoundResponse('Requerimiento no encontrado');
    }

    const existingItem = await prisma.requerimientoItem.findFirst({
      where: { id: itemId, requerimientoId: id },
    });

    if (!existingItem) {
      return notFoundResponse('Item no encontrado');
    }

    // Check permissions
    const isOwner = requerimiento.solicitanteId === user.id;
    const permissions = getPermissions(
      requerimiento.estado as RequerimientoStatus,
      user.rol as UserRole,
      isOwner
    );

    if (!permissions.canDeleteItems) {
      return forbiddenResponse('No puedes eliminar items de este requerimiento');
    }

    // Soft delete
    await prisma.requerimientoItem.update({
      where: { id: itemId },
      data: { eliminado: true },
    });

    // Record deletion
    await prisma.modificacionItem.create({
      data: {
        requerimientoItemId: itemId,
        usuarioId: user.id,
        campo: 'eliminado',
        valorAnterior: 'false',
        valorNuevo: 'true',
        motivo: 'Eliminado por usuario',
      },
    });

    return NextResponse.json({ message: 'Item eliminado' });
  } catch (error) {
    console.error('Delete item error:', error);
    return serverErrorResponse();
  }
}
