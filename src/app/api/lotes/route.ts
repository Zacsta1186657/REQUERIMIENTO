import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/api-utils';
import { z } from 'zod';
import type { RequerimientoStatus, UserRole } from '@/types';

const createLoteSchema = z.object({
  requerimientoId: z.string().min(1, 'El requerimiento es requerido'),
  items: z.array(z.object({
    requerimientoItemId: z.string(),
    cantidadEnviada: z.number().int().positive(),
  })).min(1, 'Debe incluir al menos un item'),
  transportista: z.string().optional(),
  destino: z.string().optional(),
  observaciones: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    // Only LOGISTICA and ADMIN can create lotes
    if (user.rol !== 'LOGISTICA' && user.rol !== 'ADMIN') {
      return forbiddenResponse('No tienes permiso para crear lotes');
    }

    const body = await request.json();

    const validation = createLoteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { requerimientoId, items, transportista, destino, observaciones } = validation.data;

    // Verify requirement exists and is in correct status
    const requerimiento = await prisma.requerimiento.findUnique({
      where: { id: requerimientoId },
      select: {
        id: true,
        numero: true,
        estado: true,
        solicitanteId: true,
        _count: { select: { lotes: true } },
      },
    });

    if (!requerimiento) {
      return notFoundResponse('Requerimiento no encontrado');
    }

    const validStates = ['LISTO_DESPACHO', 'EN_COMPRA', 'ENVIADO', 'ENTREGADO_PARCIAL'];
    if (!validStates.includes(requerimiento.estado)) {
      return errorResponse('El requerimiento debe estar en estado Listo para Despacho, En Compra, Enviado o Entregado Parcial', 400);
    }

    // Validate items exist and belong to this requirement
    const itemIds = items.map((i) => i.requerimientoItemId);
    const existingItems = await prisma.requerimientoItem.findMany({
      where: {
        id: { in: itemIds },
        requerimientoId,
        eliminado: false,
      },
    });

    if (existingItems.length !== itemIds.length) {
      return errorResponse('Algunos items no son válidos o no pertenecen a este requerimiento', 400);
    }

    // Create lote with items
    const loteNumber = requerimiento._count.lotes + 1;

    const lote = await prisma.lote.create({
      data: {
        numero: loteNumber,
        requerimientoId,
        transportista,
        destino,
        observaciones,
        items: {
          create: items.map((item) => ({
            requerimientoItemId: item.requerimientoItemId,
            cantidadEnviada: item.cantidadEnviada,
          })),
        },
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
        requerimiento: {
          select: { numero: true },
        },
      },
    });

    return NextResponse.json(lote, { status: 201 });
  } catch (error) {
    console.error('Create lote error:', error);
    return serverErrorResponse();
  }
}
