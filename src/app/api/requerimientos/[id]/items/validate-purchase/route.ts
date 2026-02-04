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
import { calculateRequerimientoStatus } from '@/lib/workflow/item-transitions';

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
// Permite a Administración validar items individuales que están en PENDIENTE_VALIDACION_ADMIN
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
            estadoItem: 'PENDIENTE_VALIDACION_ADMIN', // Solo items pendientes de validación
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

    // Validate that all items to validate belong to this requirement and are pending
    const itemIds = items.map((i) => i.itemId);
    const pendingItemIds = requerimiento.items.map((i) => i.id);

    const invalidItems = itemIds.filter((itemId) => !pendingItemIds.includes(itemId));
    if (invalidItems.length > 0) {
      return errorResponse(
        'Algunos items no pertenecen a este requerimiento o no están pendientes de validación',
        400
      );
    }

    // Update each item's status and validation fields
    const now = new Date();
    await Promise.all(
      items.map((item) =>
        prisma.requerimientoItem.update({
          where: { id: item.itemId },
          data: {
            // Actualizar estadoItem según la validación
            estadoItem: item.validado ? 'APROBADO_COMPRA' : 'RECHAZADO_COMPRA',
            validadoCompra: item.validado,
            validadoPorId: user.id,
            fechaValidacion: now,
            observacionCompra: item.observacion || null,
          },
        })
      )
    );

    // Create modification history for each item
    await Promise.all(
      items.map((item) =>
        prisma.modificacionItem.create({
          data: {
            requerimientoItemId: item.itemId,
            usuarioId: user.id,
            campo: 'estadoItem',
            valorAnterior: 'PENDIENTE_VALIDACION_ADMIN',
            valorNuevo: item.validado ? 'APROBADO_COMPRA' : 'RECHAZADO_COMPRA',
            motivo: item.validado
              ? 'Compra aprobada por Administración'
              : `Compra rechazada por Administración${item.observacion ? ': ' + item.observacion : ''}`,
          },
        })
      )
    );

    // Get all items to calculate new requerimiento status
    const allItems = await prisma.requerimientoItem.findMany({
      where: { requerimientoId: id, eliminado: false },
    });

    const itemStatuses = allItems.map((i) => i.estadoItem);
    const suggestedStatus = calculateRequerimientoStatus(itemStatuses) as RequerimientoStatus;

    // Update requerimiento status if changed
    if (suggestedStatus !== requerimiento.estado) {
      await prisma.requerimiento.update({
        where: { id },
        data: { estado: suggestedStatus },
      });

      // Create history entry
      await prisma.historialEstado.create({
        data: {
          requerimientoId: id,
          usuarioId: user.id,
          estadoAnterior: requerimiento.estado,
          estadoNuevo: suggestedStatus,
          comentario: `Validación de compras: ${items.filter(i => i.validado).length} aprobados, ${items.filter(i => !i.validado).length} rechazados`,
        },
      });
    }

    // Notify requester about the validation
    const approvedCount = items.filter(i => i.validado).length;
    const rejectedCount = items.filter(i => !i.validado).length;

    await prisma.notificacion.create({
      data: {
        tipo: rejectedCount > 0 ? 'RECHAZADO' : 'ESTADO_CAMBIO',
        titulo: 'Validación de compras procesada',
        mensaje: `${approvedCount} item(s) aprobado(s), ${rejectedCount} item(s) rechazado(s) del requerimiento ${requerimiento.numero}`,
        usuarioId: requerimiento.solicitanteId,
        requerimientoId: id,
      },
    });

    // Notify LOGISTICA if there are approved items
    if (approvedCount > 0) {
      const logisticaUsers = await prisma.user.findMany({
        where: { rol: 'LOGISTICA', activo: true },
        select: { id: true },
      });

      if (logisticaUsers.length > 0) {
        await prisma.notificacion.createMany({
          data: logisticaUsers.map((u) => ({
            tipo: 'ESTADO_CAMBIO' as const,
            titulo: 'Compras aprobadas - Pendiente recepción',
            mensaje: `${approvedCount} item(s) del requerimiento ${requerimiento.numero} han sido aprobados para compra. Confirmar recepción cuando lleguen al almacén.`,
            usuarioId: u.id,
            requerimientoId: id,
          })),
        });
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

    return NextResponse.json({
      message: `${approvedCount} item(s) aprobado(s), ${rejectedCount} item(s) rechazado(s)`,
      requerimiento: updated,
    });
  } catch (error) {
    console.error('Error validating purchase:', error);
    return serverErrorResponse();
  }
}
