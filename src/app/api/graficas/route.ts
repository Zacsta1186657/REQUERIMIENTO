import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, serverErrorResponse } from '@/lib/api-utils';
import type { RequerimientoStatus } from '@/types';

export async function GET() {
  return withAuth(async () => {
    try {
      // ============================================================
      // 1. KPIs
      // ============================================================
      const totalRequerimientos = await prisma.requerimiento.count();
      const totalItems = await prisma.requerimientoItem.count({ where: { eliminado: false } });
      const totalLotes = await prisma.lote.count();

      const aprobadosCount = await prisma.requerimiento.count({
        where: {
          estado: {
            in: [
              'APROBADO_SEGURIDAD',
              'APROBADO_GERENCIA',
              'APROBADO_ADM',
              'LISTO_DESPACHO',
              'ENVIADO',
              'ENTREGADO_PARCIAL',
              'ENTREGADO',
              'REVISION_LOGISTICA',
              'EN_COMPRA',
              'VALIDACION_GERENCIA',
            ] as RequerimientoStatus[],
          },
        },
      });

      const rechazadosCount = await prisma.requerimiento.count({
        where: {
          estado: {
            in: [
              'RECHAZADO_SEGURIDAD',
              'RECHAZADO_GERENCIA',
              'RECHAZADO_ADM',
            ] as RequerimientoStatus[],
          },
        },
      });

      const totalConDecision = aprobadosCount + rechazadosCount;
      const tasaAprobacion = totalConDecision > 0
        ? Math.round((aprobadosCount / totalConDecision) * 100)
        : 0;

      // ============================================================
      // 2. Requerimientos por grupo (pie chart)
      // ============================================================
      const enProcesoStates: RequerimientoStatus[] = [
        'BORRADOR', 'CREADO', 'VALIDACION_SEGURIDAD', 'VALIDACION_GERENCIA',
        'REVISION_LOGISTICA', 'EN_COMPRA',
      ];
      const aprobadosStates: RequerimientoStatus[] = [
        'APROBADO_SEGURIDAD', 'APROBADO_GERENCIA', 'APROBADO_ADM',
        'LISTO_DESPACHO', 'ENVIADO',
      ];
      const rechazadosStates: RequerimientoStatus[] = [
        'RECHAZADO_SEGURIDAD', 'RECHAZADO_GERENCIA', 'RECHAZADO_ADM',
      ];
      const completadosStates: RequerimientoStatus[] = [
        'ENTREGADO', 'ENTREGADO_PARCIAL',
      ];

      const [enProceso, aprobados, rechazados, completados] = await Promise.all([
        prisma.requerimiento.count({ where: { estado: { in: enProcesoStates } } }),
        prisma.requerimiento.count({ where: { estado: { in: aprobadosStates } } }),
        prisma.requerimiento.count({ where: { estado: { in: rechazadosStates } } }),
        prisma.requerimiento.count({ where: { estado: { in: completadosStates } } }),
      ]);

      const requerimientosPorGrupo = [
        { name: 'En Proceso', value: enProceso, color: '#3b82f6' },
        { name: 'Aprobados', value: aprobados, color: '#22c55e' },
        { name: 'Rechazados', value: rechazados, color: '#ef4444' },
        { name: 'Completados', value: completados, color: '#a855f7' },
      ];

      // ============================================================
      // 3. Items clasificacion (bar chart)
      // ============================================================
      const [enStock, requierenCompra, pendientesClasificacion] = await Promise.all([
        prisma.requerimientoItem.count({
          where: { eliminado: false, estadoItem: 'EN_STOCK' },
        }),
        prisma.requerimientoItem.count({
          where: {
            eliminado: false,
            estadoItem: {
              in: ['REQUIERE_COMPRA', 'PENDIENTE_VALIDACION_ADMIN', 'APROBADO_COMPRA', 'RECHAZADO_COMPRA'],
            },
          },
        }),
        prisma.requerimientoItem.count({
          where: { eliminado: false, estadoItem: 'PENDIENTE_CLASIFICACION' },
        }),
      ]);

      const itemsClasificacion = [
        { name: 'En Stock', value: enStock },
        { name: 'Requieren Compra', value: requierenCompra },
        { name: 'Pendientes', value: pendientesClasificacion },
      ];

      // ============================================================
      // 4. Aprobaciones por etapa (bar chart agrupado)
      // ============================================================
      const aprobacionesPorEtapa = await Promise.all([
        // Seguridad
        Promise.all([
          prisma.historialEstado.count({ where: { estadoNuevo: 'APROBADO_SEGURIDAD' } }),
          prisma.historialEstado.count({ where: { estadoNuevo: 'RECHAZADO_SEGURIDAD' } }),
        ]),
        // Gerencia
        Promise.all([
          prisma.historialEstado.count({ where: { estadoNuevo: 'APROBADO_GERENCIA' } }),
          prisma.historialEstado.count({ where: { estadoNuevo: 'RECHAZADO_GERENCIA' } }),
        ]),
        // Administracion
        Promise.all([
          prisma.historialEstado.count({ where: { estadoNuevo: 'APROBADO_ADM' } }),
          prisma.historialEstado.count({ where: { estadoNuevo: 'RECHAZADO_ADM' } }),
        ]),
      ]);

      const aprobacionesEtapa = [
        { etapa: 'Seguridad', aprobados: aprobacionesPorEtapa[0][0], rechazados: aprobacionesPorEtapa[0][1] },
        { etapa: 'Gerencia', aprobados: aprobacionesPorEtapa[1][0], rechazados: aprobacionesPorEtapa[1][1] },
        { etapa: 'Administración', aprobados: aprobacionesPorEtapa[2][0], rechazados: aprobacionesPorEtapa[2][1] },
      ];

      // ============================================================
      // 5. Lotes por estado (bar chart)
      // ============================================================
      const lotesGrouped = await prisma.lote.groupBy({
        by: ['estado'],
        _count: true,
      });

      const loteStatusLabels: Record<string, string> = {
        PENDIENTE: 'Pendiente',
        PREPARANDO: 'Preparando',
        DESPACHADO: 'Despachado',
        EN_TRANSITO: 'En Tránsito',
        PENDIENTE_RECEPCION: 'Pend. Recepción',
        ENTREGADO: 'Entregado',
      };

      const lotesPorEstado = lotesGrouped.map((l) => ({
        name: loteStatusLabels[l.estado] || l.estado,
        value: l._count,
      }));

      // ============================================================
      // 6. Requerimientos por mes (line chart - ultimos 6 meses)
      // ============================================================
      const now = new Date();
      const meses = [];
      for (let i = 5; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const count = await prisma.requerimiento.count({
          where: {
            createdAt: { gte: start, lt: end },
          },
        });
        const mesLabel = start.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
        meses.push({ name: mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1), value: count });
      }

      // ============================================================
      // 7. Tiempos promedio (dias entre transiciones)
      // ============================================================
      const transiciones = [
        { label: 'Creación → Seguridad', desde: 'CREADO' as RequerimientoStatus, hasta: 'APROBADO_SEGURIDAD' as RequerimientoStatus },
        { label: 'Seguridad → Gerencia', desde: 'APROBADO_SEGURIDAD' as RequerimientoStatus, hasta: 'APROBADO_GERENCIA' as RequerimientoStatus },
        { label: 'Gerencia → Logística', desde: 'APROBADO_GERENCIA' as RequerimientoStatus, hasta: 'REVISION_LOGISTICA' as RequerimientoStatus },
        { label: 'Total → Entrega', desde: 'CREADO' as RequerimientoStatus, hasta: 'ENTREGADO' as RequerimientoStatus },
      ];

      const tiemposPromedio = await Promise.all(
        transiciones.map(async (t) => {
          // Get all requerimiento IDs that have both transitions
          const reqs = await prisma.$queryRaw<Array<{ avg_days: number | null }>>`
            SELECT AVG(EXTRACT(EPOCH FROM (h2."createdAt" - h1."createdAt")) / 86400)::float as avg_days
            FROM historial_estados h1
            INNER JOIN historial_estados h2 ON h1."requerimientoId" = h2."requerimientoId"
            WHERE h1."estadoNuevo" = ${t.desde}::"RequerimientoStatus"
              AND h2."estadoNuevo" = ${t.hasta}::"RequerimientoStatus"
              AND h2."createdAt" > h1."createdAt"
          `;

          const avgDays = reqs[0]?.avg_days;
          return {
            label: t.label,
            dias: avgDays !== null && avgDays !== undefined ? Math.round(avgDays * 10) / 10 : null,
          };
        })
      );

      return NextResponse.json({
        kpis: {
          totalRequerimientos,
          totalItems,
          totalLotes,
          tasaAprobacion,
        },
        requerimientosPorGrupo,
        itemsClasificacion,
        aprobacionesEtapa,
        lotesPorEstado,
        requerimientosPorMes: meses,
        tiemposPromedio,
      });
    } catch (error) {
      console.error('Get graficas error:', error);
      return serverErrorResponse();
    }
  });
}
