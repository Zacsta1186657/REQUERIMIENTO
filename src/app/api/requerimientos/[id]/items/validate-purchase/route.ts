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
import { RequerimientoStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const validatePurchaseSchema = z.object({
  items: z.array(z.object({
    itemId: z.string(),
    validado: z.boolean(),
    observacion: z.string().optional(),
  })).min(1, 'Debe incluir al menos un item'),
});

// PUT /api/requerimientos/[id]/items/validate-purchase
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    // Only ADMINISTRACION and ADMIN can validate purchases
    if (user.rol !== 'ADMINISTRACION' && user.rol !== 'ADMIN') {
      return forbiddenResponse('No tienes permiso para validar compras');
    }

    const { id } = await params;
    const body = await request.json();

    const validation = validatePurchaseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { items } = validation.data;

    // Get the requerimiento
    const requerimiento = await prisma.requerimiento.findUnique({
      where: { id },
      include: {
        items: {
          where: {
            eliminado: false,
            requiereCompra: true
          },
        },
        solicitante: {
          select: { id: true, nombre: true },
        },
      },
    });

    if (!requerimiento) {
      return notFoundResponse('Requerimiento no encontrado');
    }

    // Must be in EN_COMPRA status
    if (requerimiento.estado !== 'EN_COMPRA') {
      return errorResponse('El requerimiento debe estar en estado En Compra', 400);
    }

    // Validate that all items to validate belong to this requirement
    const itemIds = items.map((i) => i.itemId);
    const purchaseItemIds = requerimiento.items.map((i) => i.id);

    const invalidItems = itemIds.filter((id) => !purchaseItemIds.includes(id));
    if (invalidItems.length > 0) {
      return errorResponse('Algunos items no pertenecen a este requerimiento o no requieren compra', 400);
    }

    // Update each item's validation status
    const now = new Date();
    await Promise.all(
      items.map((item) =>
        prisma.requerimientoItem.update({
          where: { id: item.itemId },
          data: {
            validadoCompra: item.validado,
            validadoPorId: user.id,
            fechaValidacion: now,
            observacionCompra: item.observacion || null,
          },
        })
      )
    );

    // Check if all purchase items have been validated
    const updatedItems = await prisma.requerimientoItem.findMany({
      where: {
        requerimientoId: id,
        eliminado: false,
        requiereCompra: true,
      },
    });

    const allValidated = updatedItems.every((item) => item.validadoCompra !== null);
    const allApproved = updatedItems.every((item) => item.validadoCompra === true);
    const allRejected = updatedItems.every((item) => item.validadoCompra === false);

    let newStatus: RequerimientoStatus = requerimiento.estado;
    let statusComment = '';

    if (allValidated) {
      if (allApproved) {
        newStatus = 'LISTO_DESPACHO';
        statusComment = 'Todas las compras han sido validadas y aprobadas';
      } else if (allRejected) {
        newStatus = 'RECHAZADO_ADM';
        statusComment = 'Todas las compras han sido rechazadas';
      } else {
        // Mixed: some approved, some rejected
        // Move to LISTO_DESPACHO for approved items
        newStatus = 'LISTO_DESPACHO';
        statusComment = 'Compras validadas parcialmente - items aprobados listos para despacho';
      }

      // Update requerimiento status
      await prisma.requerimiento.update({
        where: { id },
        data: { estado: newStatus },
      });

      // Create history entry
      await prisma.historialEstado.create({
        data: {
          requerimientoId: id,
          usuarioId: user.id,
          estadoAnterior: 'EN_COMPRA',
          estadoNuevo: newStatus,
          comentario: statusComment,
        },
      });

      // Notify requester
      await prisma.notificacion.create({
        data: {
          tipo: newStatus === 'RECHAZADO_ADM' ? 'RECHAZADO' : 'ESTADO_CAMBIO',
          titulo: newStatus === 'RECHAZADO_ADM'
            ? 'Compras rechazadas'
            : 'Compras validadas',
          mensaje: statusComment,
          usuarioId: requerimiento.solicitanteId,
          requerimientoId: id,
        },
      });

      // If approved, notify LOGISTICA for dispatch
      if (newStatus === 'LISTO_DESPACHO') {
        const logisticaUsers = await prisma.user.findMany({
          where: { rol: 'LOGISTICA', activo: true },
          select: { id: true },
        });

        if (logisticaUsers.length > 0) {
          await prisma.notificacion.createMany({
            data: logisticaUsers.map((u) => ({
              tipo: 'LISTO_DESPACHO' as const,
              titulo: 'Requerimiento listo para despacho',
              mensaje: `El requerimiento ${requerimiento.numero} tiene items listos para despachar`,
              usuarioId: u.id,
              requerimientoId: id,
            })),
          });
        }
      }
    }

    // Return updated requerimiento
    const updated = await prisma.requerimiento.findUnique({
      where: { id },
      include: {
        solicitante: {
          select: { id: true, nombre: true, email: true, rol: true },
        },
        operacion: true,
        centroCosto: true,
        items: {
          where: { eliminado: false },
          include: {
            categoria: true,
            unidadMedida: true,
            validadoPor: {
              select: { id: true, nombre: true },
            },
          },
        },
        lotes: {
          include: {
            items: {
              include: {
                requerimientoItem: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error validating purchase:', error);
    return serverErrorResponse();
  }
}
