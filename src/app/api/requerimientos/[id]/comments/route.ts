import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
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

    // Get all history entries that have comments
    const comments = await prisma.historialEstado.findMany({
      where: {
        requerimientoId: id,
        comentario: { not: null },
      },
      select: {
        id: true,
        comentario: true,
        estadoAnterior: true,
        estadoNuevo: true,
        createdAt: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            rol: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: comments });
  } catch (error) {
    console.error('Get comments error:', error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { id } = await params;

    const body = await request.json();
    const { comentario } = body;

    if (!comentario || comentario.trim().length === 0) {
      return errorResponse('El comentario no puede estar vacío', 400);
    }

    const requerimiento = await prisma.requerimiento.findUnique({
      where: { id },
      select: { id: true, estado: true },
    });

    if (!requerimiento) {
      return notFoundResponse('Requerimiento no encontrado');
    }

    // Create a history entry just for the comment (no status change)
    const comment = await prisma.historialEstado.create({
      data: {
        estadoAnterior: requerimiento.estado,
        estadoNuevo: requerimiento.estado,
        requerimientoId: id,
        usuarioId: user.id,
        comentario,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            rol: true,
          },
        },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return serverErrorResponse();
  }
}
