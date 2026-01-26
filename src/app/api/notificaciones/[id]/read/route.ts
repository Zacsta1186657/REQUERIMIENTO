import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/api-utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { id } = await params;

    // Handle "all" to mark all as read
    if (id === 'all') {
      await prisma.notificacion.updateMany({
        where: {
          usuarioId: user.id,
          leida: false,
        },
        data: { leida: true },
      });

      return NextResponse.json({ message: 'Todas las notificaciones marcadas como leídas' });
    }

    const notificacion = await prisma.notificacion.findUnique({
      where: { id },
      select: { id: true, usuarioId: true },
    });

    if (!notificacion) {
      return notFoundResponse('Notificación no encontrada');
    }

    if (notificacion.usuarioId !== user.id) {
      return forbiddenResponse('No tienes permiso para marcar esta notificación');
    }

    const updated = await prisma.notificacion.update({
      where: { id },
      data: { leida: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Mark notification read error:', error);
    return serverErrorResponse();
  }
}
