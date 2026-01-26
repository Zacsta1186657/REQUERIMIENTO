import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createToken, setAuthCookie, comparePasswords } from '@/lib/auth';
import { loginSchema } from '@/lib/validations/auth';
import { errorResponse, validationError, serverErrorResponse } from '@/lib/api-utils';
import type { UserRole } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error);
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        nombre: true,
        rol: true,
        avatar: true,
        activo: true,
      },
    });

    if (!user) {
      return errorResponse('Credenciales inválidas', 401);
    }

    if (!user.activo) {
      return errorResponse('Tu cuenta ha sido desactivada. Contacta al administrador.', 401);
    }

    const isValidPassword = await comparePasswords(password, user.password);
    if (!isValidPassword) {
      return errorResponse('Credenciales inválidas', 401);
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      rol: user.rol as UserRole,
      nombre: user.nombre,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        avatar: user.avatar,
      },
      message: 'Inicio de sesión exitoso',
    });
  } catch (error) {
    console.error('Login error:', error);
    return serverErrorResponse();
  }
}
