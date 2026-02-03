import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import {
  unauthorizedResponse,
  forbiddenResponse,
  errorResponse,
  validationError,
  serverErrorResponse,
  paginationParams,
  paginatedResponse,
} from '@/lib/api-utils';
import { createUserSchema } from '@/lib/validations/user';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    // Only ADMIN and ADMINISTRACION can manage users
    if (user.rol !== 'ADMIN' && user.rol !== 'ADMINISTRACION') {
      return forbiddenResponse('No tienes permiso para ver usuarios');
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = paginationParams(searchParams);
    const search = searchParams.get('search');
    const rol = searchParams.get('rol');
    const activo = searchParams.get('activo');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (rol) {
      where.rol = rol;
    }

    if (activo !== null && activo !== undefined) {
      where.activo = activo === 'true';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          nombre: true,
          rol: true,
          activo: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          operacion: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
            },
          },
          _count: {
            select: {
              requerimientos: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { nombre: 'asc' },
      }),
      prisma.user.count({ where }),
    ]);

    return paginatedResponse(users, total, page, limit);
  } catch (error) {
    console.error('Get users error:', error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    // Solo ADMIN puede crear usuarios
    if (user.rol !== 'ADMIN') {
      return forbiddenResponse('No tienes permiso para crear usuarios');
    }

    const body = await request.json();

    const validation = createUserSchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error);
    }

    const { email, password, nombre, rol, activo, operacionId } = validation.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return errorResponse('Ya existe un usuario con este correo', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        nombre,
        rol,
        activo: activo ?? true,
        operacionId: operacionId || null,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        avatar: true,
        createdAt: true,
        operacion: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return serverErrorResponse();
  }
}
