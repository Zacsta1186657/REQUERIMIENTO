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

interface RouteParams {
  params: Promise<{ id: string }>;
}

const schedulePickupSchema = z.object({
  fechaEstimadaRecepcion: z.string().min(1, 'La fecha estimada es requerida'),
  observacionRecepcion: z.string().min(10, 'La observación debe tener al menos 10 caracteres'),
});

// POST /api/lotes/[id]/schedule-pickup
// Registra la fecha estimada de recojo y observación del receptor
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    // Solo RECEPTOR y ADMIN pueden registrar fecha de recojo
    if (user.rol !== 'RECEPTOR' && user.rol !== 'ADMIN') {
      return forbiddenResponse('No tienes permiso para programar el recojo');
    }

    const { id } = await params;
    const body = await request.json();

    const validation = schedulePickupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { fechaEstimadaRecepcion, observacionRecepcion } = validation.data;

    // Buscar el lote
    const lote = await prisma.lote.findUnique({
      where: { id },
      include: {
        requerimiento: {
          select: { numero: true, solicitanteId: true },
        },
      },
    });

    if (!lote) {
      return notFoundResponse('Lote no encontrado');
    }

    // Verificar que el lote esté en un estado válido para programar recojo
    // Solo lotes despachados o en tránsito pueden programar recojo
    if (!['DESPACHADO', 'EN_TRANSITO'].includes(lote.estado)) {
      return errorResponse(
        'El lote no está en un estado válido para programar recojo. ' +
        'Solo lotes despachados o en tránsito pueden programar recojo.',
        400
      );
    }

    // Actualizar el lote con la fecha estimada y observación
    const updatedLote = await prisma.lote.update({
      where: { id },
      data: {
        estado: 'PENDIENTE_RECEPCION',
        fechaEstimadaRecepcion: new Date(fechaEstimadaRecepcion),
        observacionRecepcion,
        receptorId: user.id,
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

    // Notificar a Logística que el receptor programó el recojo
    const logisticaUsers = await prisma.user.findMany({
      where: { rol: 'LOGISTICA', activo: true },
      select: { id: true },
    });

    if (logisticaUsers.length > 0) {
      await prisma.notificacion.createMany({
        data: logisticaUsers.map((u) => ({
          tipo: 'ESTADO_CAMBIO' as const,
          titulo: 'Recojo programado por receptor',
          mensaje: `El receptor ha programado el recojo del Lote #${lote.numero} del requerimiento ${lote.requerimiento.numero} para el ${new Date(fechaEstimadaRecepcion).toLocaleDateString('es-ES')}`,
          usuarioId: u.id,
          requerimientoId: lote.requerimientoId,
        })),
      });
    }

    return NextResponse.json({
      message: 'Recojo programado correctamente',
      lote: updatedLote,
    });
  } catch (error) {
    console.error('Schedule pickup error:', error);
    return serverErrorResponse();
  }
}
