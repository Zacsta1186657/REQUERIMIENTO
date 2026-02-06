import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  unauthorizedResponse,
  serverErrorResponse,
  paginationParams,
  paginatedResponse,
} from '@/lib/api-utils';
import { getPendingApprovalStatuses } from '@/lib/workflow/permissions';
import type { UserRole, RequerimientoStatus, ItemStatus } from '@/types';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = paginationParams(searchParams);
    const categoria = searchParams.get('categoria');

    // Get statuses that this user role can approve
    const pendingStatuses = getPendingApprovalStatuses(user.rol as UserRole);

    if (pendingStatuses.length === 0) {
      return paginatedResponse([], 0, page, limit);
    }

    const where: Prisma.RequerimientoWhereInput = {
      estado: { in: pendingStatuses },
    };

    // Para ADMINISTRACION: solo mostrar requerimientos que tengan ítems pendientes de validación
    // Esto filtra los que ya no tienen trabajo pendiente para Admin
    if (user.rol === 'ADMINISTRACION') {
      where.items = {
        some: {
          eliminado: false,
          estadoItem: 'PENDIENTE_VALIDACION_ADMIN' as ItemStatus,
        },
      };
    }

    // Para LOGISTICA: mostrar requerimientos que tengan trabajo pendiente
    // (clasificación, recepción de compras, o despacho)
    if (user.rol === 'LOGISTICA') {
      where.items = {
        some: {
          eliminado: false,
          estadoItem: {
            in: [
              'PENDIENTE_CLASIFICACION',
              'EN_STOCK',
              'REQUIERE_COMPRA',
              'APROBADO_COMPRA',
              'LISTO_PARA_DESPACHO',
              'DESPACHO_PARCIAL',
            ] as ItemStatus[],
          },
        },
      };
    }

    // Para RECEPTOR: mostrar requerimientos que tengan lotes por confirmar
    // Se maneja a nivel de lotes, no de ítems directamente

    // Filter by category if provided (se combina con el filtro anterior si existe)
    if (categoria) {
      // Si ya hay un filtro de items, agregar la condición de categoría
      if (where.items && typeof where.items === 'object' && 'some' in where.items) {
        const existingSome = where.items.some as Prisma.RequerimientoItemWhereInput;
        where.items = {
          some: {
            ...existingSome,
            categoria: { nombre: categoria },
          },
        };
      } else {
        where.items = {
          some: {
            categoria: { nombre: categoria },
            eliminado: false,
          },
        };
      }
    }

    const [requerimientos, total] = await Promise.all([
      prisma.requerimiento.findMany({
        where,
        include: {
          solicitante: {
            select: { id: true, nombre: true, email: true },
          },
          operacion: {
            select: { id: true, nombre: true, codigo: true },
          },
          centroCosto: {
            select: { id: true, nombre: true, codigo: true },
          },
          items: {
            where: { eliminado: false },
            include: {
              categoria: true,
              unidadMedida: true,
            },
          },
          _count: {
            select: { items: true },
          },
        },
        skip,
        take: limit,
        orderBy: { fecha: 'asc' }, // Oldest first for approval queue
      }),
      prisma.requerimiento.count({ where }),
    ]);

    // Group by status for summary
    // Para roles que filtran por estado de ítems, usar el mismo filtro
    let summary: Record<string, number> = {};

    if (user.rol === 'ADMINISTRACION') {
      // Para Admin: contar requerimientos con ítems pendientes de validación
      const adminCount = await prisma.requerimiento.count({
        where: {
          estado: { in: pendingStatuses },
          items: {
            some: {
              eliminado: false,
              estadoItem: 'PENDIENTE_VALIDACION_ADMIN',
            },
          },
        },
      });
      summary = { EN_COMPRA: adminCount };
    } else if (user.rol === 'LOGISTICA') {
      // Para Logística: contar por tipo de trabajo pendiente
      const [clasificacionCount, recepcionCount, despachoCount] = await Promise.all([
        prisma.requerimiento.count({
          where: {
            estado: { in: pendingStatuses },
            items: {
              some: {
                eliminado: false,
                estadoItem: { in: ['PENDIENTE_CLASIFICACION', 'EN_STOCK', 'REQUIERE_COMPRA'] },
              },
            },
          },
        }),
        prisma.requerimiento.count({
          where: {
            estado: { in: pendingStatuses },
            items: {
              some: {
                eliminado: false,
                estadoItem: 'APROBADO_COMPRA',
              },
            },
          },
        }),
        prisma.requerimiento.count({
          where: {
            estado: { in: pendingStatuses },
            items: {
              some: {
                eliminado: false,
                estadoItem: { in: ['LISTO_PARA_DESPACHO', 'DESPACHO_PARCIAL'] },
              },
            },
          },
        }),
      ]);
      summary = {
        REVISION_LOGISTICA: clasificacionCount,
        APROBADO_ADM: recepcionCount,
        LISTO_DESPACHO: despachoCount,
      };
    } else {
      // Para otros roles: comportamiento original por estado de requerimiento
      const statusCounts = await prisma.requerimiento.groupBy({
        by: ['estado'],
        where: { estado: { in: pendingStatuses } },
        _count: true,
      });

      summary = pendingStatuses.reduce((acc, status) => {
        const found = statusCounts.find((s) => s.estado === status);
        acc[status] = found?._count || 0;
        return acc;
      }, {} as Record<RequerimientoStatus, number>);
    }

    return NextResponse.json({
      data: requerimientos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      summary,
    });
  } catch (error) {
    console.error('Get aprobaciones error:', error);
    return serverErrorResponse();
  }
}
