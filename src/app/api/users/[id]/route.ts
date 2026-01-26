import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  errorResponse,
  validationError,
  serverErrorResponse,
} from '@/lib/api-utils';
import { updateUserSchema } from '@/lib/validations/user';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { id } = await params;

    // Users can view their own profile, admins can view any
    if (user.id !== id && user.rol !== 'ADMIN' && user.rol !== 'ADMINISTRACION') {
      return forbiddenResponse('No tienes permiso para ver este usuario');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            requerimientos: true,
            historialEstados: true,
          },
        },
      },
    });

    if (!targetUser) {
      return notFoundResponse('Usuario no encontrado');
    }

    return NextResponse.json(targetUser);
  } catch (error) {
    console.error('Get user error:', error);
    return serverErrorResponse();
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { id } = await params;

    // Only ADMIN and ADMINISTRACION can update other users
    // Users can only update their own non-role fields
    const isSelf = user.id === id;
    const isAdmin = user.rol === 'ADMIN' || user.rol === 'ADMINISTRACION';

    if (!isSelf && !isAdmin) {
      return forbiddenResponse('No tienes permiso para modificar este usuario');
    }

    const body = await request.json();

    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error);
    }

    const updateData = { ...validation.data };

    // Non-admins can't change role or activo status
    if (!isAdmin) {
      delete updateData.rol;
      delete updateData.activo;
    }

    // If email is being updated, check for duplicates
    if (updateData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: updateData.email.toLowerCase(),
          NOT: { id },
        },
      });

      if (existingUser) {
        return errorResponse('Ya existe un usuario con este correo', 400);
      }

      updateData.email = updateData.email.toLowerCase();
    }

    // Hash password if being updated
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    return serverErrorResponse();
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { id } = await params;

    // Only ADMIN can delete users
    if (user.rol !== 'ADMIN') {
      return forbiddenResponse('Solo administradores pueden eliminar usuarios');
    }

    // Can't delete yourself
    if (user.id === id) {
      return errorResponse('No puedes eliminar tu propia cuenta', 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: { requerimientos: true },
        },
      },
    });

    if (!targetUser) {
      return notFoundResponse('Usuario no encontrado');
    }

    // If user has requirements, just deactivate instead of delete
    if (targetUser._count.requerimientos > 0) {
      await prisma.user.update({
        where: { id },
        data: { activo: false },
      });
      return NextResponse.json({
        message: 'Usuario desactivado (tiene requerimientos asociados)',
      });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: 'Usuario eliminado' });
  } catch (error) {
    console.error('Delete user error:', error);
    return serverErrorResponse();
  }
}
