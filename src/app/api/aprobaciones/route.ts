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
import type { UserRole, RequerimientoStatus } from '@/types';

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

    const where: Record<string, unknown> = {
      estado: { in: pendingStatuses },
    };

    // Filter by category if provided
    if (categoria) {
      where.items = {
        some: {
          categoria: { nombre: categoria },
          eliminado: false,
        },
      };
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
    const statusCounts = await prisma.requerimiento.groupBy({
      by: ['estado'],
      where: { estado: { in: pendingStatuses } },
      _count: true,
    });

    const summary = pendingStatuses.reduce((acc, status) => {
      const found = statusCounts.find((s) => s.estado === status);
      acc[status] = found?._count || 0;
      return acc;
    }, {} as Record<RequerimientoStatus, number>);

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
