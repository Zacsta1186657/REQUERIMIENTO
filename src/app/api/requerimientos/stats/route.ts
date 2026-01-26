import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, serverErrorResponse } from '@/lib/api-utils';
import type { RequerimientoStatus } from '@/types';

export async function GET() {
  return withAuth(async (user) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Base filter for user-specific or all requirements
      const baseWhere = user.rol === 'TECNICO' ? { solicitanteId: user.id } : {};

      // Total requirements
      const total = await prisma.requerimiento.count({ where: baseWhere });

      // Pending approval (states that require action)
      const pendingStates: RequerimientoStatus[] = [
        'VALIDACION_SEGURIDAD',
        'VALIDACION_GERENCIA',
        'REVISION_LOGISTICA',
        'EN_COMPRA',
      ];
      const pendientes = await prisma.requerimiento.count({
        where: {
          ...baseWhere,
          estado: { in: pendingStates },
        },
      });

      // In transit
      const enTransito = await prisma.requerimiento.count({
        where: {
          ...baseWhere,
          estado: 'ENVIADO',
        },
      });

      // Delivered this month
      const deliveredStates: RequerimientoStatus[] = ['ENTREGADO', 'ENTREGADO_PARCIAL'];
      const entregadosMes = await prisma.requerimiento.count({
        where: {
          ...baseWhere,
          estado: { in: deliveredStates },
          updatedAt: { gte: startOfMonth },
        },
      });

      // Calculate month-over-month change
      const totalLastMonth = await prisma.requerimiento.count({
        where: {
          ...baseWhere,
          createdAt: {
            gte: startOfLastMonth,
            lt: startOfMonth,
          },
        },
      });

      const totalThisMonth = await prisma.requerimiento.count({
        where: {
          ...baseWhere,
          createdAt: { gte: startOfMonth },
        },
      });

      const cambioMes = totalLastMonth > 0
        ? Math.round(((totalThisMonth - totalLastMonth) / totalLastMonth) * 100)
        : totalThisMonth > 0 ? 100 : 0;

      // Status distribution
      const statusCounts = await prisma.requerimiento.groupBy({
        by: ['estado'],
        where: baseWhere,
        _count: true,
      });

      const distribucionEstados = statusCounts.reduce((acc, item) => {
        acc[item.estado] = item._count;
        return acc;
      }, {} as Record<string, number>);

      return NextResponse.json({
        total,
        pendientes,
        enTransito,
        entregadosMes,
        cambioMes,
        distribucionEstados,
      });
    } catch (error) {
      console.error('Get stats error:', error);
      return serverErrorResponse();
    }
  });
}
