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
  fechaEstimadaLlegada: z.string().optional(), // Fecha estimada de llegada (ISO string)
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

    const { requerimientoId, items, transportista, destino, observaciones, fechaEstimadaLlegada } = validation.data;

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

    // Estados válidos para crear lotes - debe coincidir con los permisos en permissions.ts
    const validStates = ['REVISION_LOGISTICA', 'LISTO_DESPACHO', 'EN_COMPRA', 'APROBADO_ADM', 'ENVIADO', 'ENTREGADO_PARCIAL'];
    if (!validStates.includes(requerimiento.estado)) {
      return errorResponse('El requerimiento no está en un estado válido para crear lotes', 400);
    }

    // Validate items exist, belong to this requirement, and are in a dispatchable state
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

    // Verificar que todos los ítems estén en un estado despachable
    // LISTO_PARA_DESPACHO: ítems que están listos (de stock o compra recibida)
    // DESPACHO_PARCIAL: ítems que ya tienen despachos parciales
    // EN_STOCK: permitir por retrocompatibilidad (aunque deberían estar en LISTO_PARA_DESPACHO)
    const dispatchableStates = ['LISTO_PARA_DESPACHO', 'DESPACHO_PARCIAL', 'EN_STOCK'];
    const nonDispatchableItems = existingItems.filter(
      (item) => !dispatchableStates.includes(item.estadoItem)
    );

    if (nonDispatchableItems.length > 0) {
      const descriptions = nonDispatchableItems.map(i => i.descripcion).join(', ');
      return errorResponse(
        `Los siguientes ítems no están listos para despacho: ${descriptions}. ` +
        `Estado requerido: Listo para Despacho o Despacho Parcial.`,
        400
      );
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
        fechaEstimadaLlegada: fechaEstimadaLlegada ? new Date(fechaEstimadaLlegada) : null,
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
