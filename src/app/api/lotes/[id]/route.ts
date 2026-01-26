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

    const lote = await prisma.lote.findUnique({
      where: { id },
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
        requerimiento: {
          select: {
            id: true,
            numero: true,
            motivo: true,
            solicitante: {
              select: { id: true, nombre: true },
            },
          },
        },
        receptor: {
          select: { id: true, nombre: true },
        },
      },
    });

    if (!lote) {
      return notFoundResponse('Lote no encontrado');
    }

    return NextResponse.json(lote);
  } catch (error) {
    console.error('Get lote error:', error);
    return serverErrorResponse();
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { id } = await params;

    const lote = await prisma.lote.findUnique({
      where: { id },
      select: { id: true, estado: true },
    });

    if (!lote) {
      return notFoundResponse('Lote no encontrado');
    }

    // Only allow updates on PENDIENTE or PREPARANDO status
    if (!['PENDIENTE', 'PREPARANDO'].includes(lote.estado)) {
      return NextResponse.json(
        { error: 'No se puede modificar un lote que ya fue despachado' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { transportista, destino, observaciones, estado } = body;

    const updated = await prisma.lote.update({
      where: { id },
      data: {
        ...(transportista !== undefined && { transportista }),
        ...(destino !== undefined && { destino }),
        ...(observaciones !== undefined && { observaciones }),
        ...(estado && ['PENDIENTE', 'PREPARANDO'].includes(estado) && { estado }),
      },
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
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update lote error:', error);
    return serverErrorResponse();
  }
}
