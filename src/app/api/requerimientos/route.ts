import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  unauthorizedResponse,
  validationError,
  serverErrorResponse,
  paginationParams,
  paginatedResponse,
} from '@/lib/api-utils';
import { createRequerimientoSchema } from '@/lib/validations/requerimiento';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = paginationParams(searchParams);

    const estado = searchParams.get('estado');
    const operacionId = searchParams.get('operacionId');
    const centroCostoId = searchParams.get('centroCostoId');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const search = searchParams.get('search');

    // Build where clause based on filters and user role
    const where: Record<string, unknown> = {};

    // TECNICO can only see their own requirements
    if (user.rol === 'TECNICO') {
      where.solicitanteId = user.id;
    }

    if (estado) {
      where.estado = estado;
    }

    if (operacionId) {
      where.operacionId = operacionId;
    }

    if (centroCostoId) {
      where.centroCostoId = centroCostoId;
    }

    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) {
        (where.fecha as Record<string, Date>).gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        (where.fecha as Record<string, Date>).lte = new Date(fechaHasta);
      }
    }

    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { motivo: { contains: search, mode: 'insensitive' } },
        { solicitante: { nombre: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [requerimientos, total] = await Promise.all([
      prisma.requerimiento.findMany({
        where,
        include: {
          solicitante: {
            select: { id: true, nombre: true },
          },
          operacion: {
            select: { nombre: true },
          },
          centroCosto: {
            select: { nombre: true },
          },
          _count: {
            select: { items: true },
          },
        },
        skip,
        take: limit,
        orderBy: { fecha: 'desc' },
      }),
      prisma.requerimiento.count({ where }),
    ]);

    return paginatedResponse(requerimientos, total, page, limit);
  } catch (error) {
    console.error('Get requerimientos error:', error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const body = await request.json();

    const validation = createRequerimientoSchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error);
    }

    const { operacionId, centroCostoId, motivo, comentarios } = validation.data;

    // Generate requirement number
    const year = new Date().getFullYear();
    const lastReq = await prisma.requerimiento.findFirst({
      where: {
        numero: { startsWith: `REQ-${year}-` },
      },
      orderBy: { numero: 'desc' },
    });

    let nextNumber = 1;
    if (lastReq) {
      const lastNumber = parseInt(lastReq.numero.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    const numero = `REQ-${year}-${String(nextNumber).padStart(4, '0')}`;

    const requerimiento = await prisma.requerimiento.create({
      data: {
        numero,
        motivo,
        comentarios,
        estado: 'BORRADOR',
        solicitanteId: user.id,
        operacionId,
        centroCostoId,
      },
      include: {
        solicitante: {
          select: { id: true, nombre: true, email: true, rol: true },
        },
        operacion: {
          select: { id: true, nombre: true, codigo: true },
        },
        centroCosto: {
          select: { id: true, nombre: true, codigo: true },
        },
        items: true,
      },
    });

    // Create initial history entry
    await prisma.historialEstado.create({
      data: {
        estadoNuevo: 'BORRADOR',
        requerimientoId: requerimiento.id,
        usuarioId: user.id,
        comentario: 'Requerimiento creado',
      },
    });

    return NextResponse.json(requerimiento, { status: 201 });
  } catch (error) {
    console.error('Create requerimiento error:', error);
    return serverErrorResponse();
  }
}
