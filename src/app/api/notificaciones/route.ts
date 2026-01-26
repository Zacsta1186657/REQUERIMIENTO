import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  unauthorizedResponse,
  serverErrorResponse,
  paginationParams,
} from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = paginationParams(searchParams);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const where = {
      usuarioId: user.id,
      ...(unreadOnly && { leida: false }),
    };

    const [notificaciones, total, unreadCount] = await Promise.all([
      prisma.notificacion.findMany({
        where,
        include: {
          requerimiento: {
            select: {
              id: true,
              numero: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notificacion.count({ where }),
      prisma.notificacion.count({
        where: { usuarioId: user.id, leida: false },
      }),
    ]);

    return NextResponse.json({
      data: notificaciones,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      unreadCount,
    });
  } catch (error) {
    console.error('Get notificaciones error:', error);
    return serverErrorResponse();
  }
}
