import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, comparePasswords, hashPassword } from '@/lib/auth';
import { changePasswordSchema } from '@/lib/validations/auth';
import {
  unauthorizedResponse,
  errorResponse,
  validationError,
  serverErrorResponse
} from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();

    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error);
    }

    const { currentPassword, newPassword } = validation.data;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    if (!dbUser) {
      return unauthorizedResponse();
    }

    const isValidPassword = await comparePasswords(currentPassword, dbUser.password);
    if (!isValidPassword) {
      return errorResponse('La contraseña actual es incorrecta', 400);
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Change password error:', error);
    return serverErrorResponse();
  }
}
