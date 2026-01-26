import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api-utils';

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
      select: { id: true },
    });

    if (!requerimiento) {
      return notFoundResponse('Requerimiento no encontrado');
    }

    const historial = await prisma.historialEstado.findMany({
      where: { requerimientoId: id },
      include: {
        usuario: {
          select: { id: true, nombre: true, rol: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const timeline = historial.map((h) => ({
      id: h.id,
      estadoAnterior: h.estadoAnterior,
      estadoNuevo: h.estadoNuevo,
      comentario: h.comentario,
      fecha: h.createdAt.toISOString(),
      usuario: {
        id: h.usuario.id,
        nombre: h.usuario.nombre,
        rol: h.usuario.rol,
      },
    }));

    return NextResponse.json({ data: timeline });
  } catch (error) {
    console.error('Get timeline error:', error);
    return serverErrorResponse();
  }
}
