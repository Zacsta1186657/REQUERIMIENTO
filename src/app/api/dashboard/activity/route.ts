import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, serverErrorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

      // Get recent status changes (timeline activity)
      const recentActivity = await prisma.historialEstado.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requerimiento: {
            select: {
              id: true,
              numero: true,
              motivo: true,
            },
          },
          usuario: {
            select: {
              id: true,
              nombre: true,
              rol: true,
            },
          },
        },
        ...(user.rol === 'TECNICO' && {
          where: {
            requerimiento: {
              solicitanteId: user.id,
            },
          },
        }),
      });

      // Format activity for frontend
      const activity = recentActivity.map((item) => ({
        id: item.id,
        tipo: getActivityType(item.estadoNuevo),
        descripcion: getActivityDescription(item),
        fecha: item.createdAt.toISOString(),
        usuario: item.usuario.nombre,
        requerimientoId: item.requerimiento.id,
        requerimientoNumero: item.requerimiento.numero,
        estadoAnterior: item.estadoAnterior,
        estadoNuevo: item.estadoNuevo,
        comentario: item.comentario,
      }));

      return NextResponse.json({ data: activity });
    } catch (error) {
      console.error('Get activity error:', error);
      return serverErrorResponse();
    }
  });
}

function getActivityType(estado: string): string {
  const typeMap: Record<string, string> = {
    CREADO: 'creado',
    VALIDACION_SEGURIDAD: 'pendiente',
    APROBADO_SEGURIDAD: 'aprobado',
    RECHAZADO_SEGURIDAD: 'rechazado',
    VALIDACION_GERENCIA: 'pendiente',
    APROBADO_GERENCIA: 'aprobado',
    RECHAZADO_GERENCIA: 'rechazado',
    REVISION_LOGISTICA: 'pendiente',
    EN_COMPRA: 'compra',
    APROBADO_ADM: 'aprobado',
    RECHAZADO_ADM: 'rechazado',
    LISTO_DESPACHO: 'despacho',
    ENVIADO: 'enviado',
    ENTREGADO_PARCIAL: 'entregado',
    ENTREGADO: 'entregado',
  };
  return typeMap[estado] || 'cambio';
}

function getActivityDescription(item: {
  estadoAnterior: string | null;
  estadoNuevo: string;
  requerimiento: { numero: string };
  comentario: string | null;
}): string {
  const stateLabels: Record<string, string> = {
    BORRADOR: 'Borrador',
    CREADO: 'Creado',
    VALIDACION_SEGURIDAD: 'Validación Seguridad',
    APROBADO_SEGURIDAD: 'Aprobado Seguridad',
    RECHAZADO_SEGURIDAD: 'Rechazado Seguridad',
    VALIDACION_GERENCIA: 'Validación Gerencia',
    APROBADO_GERENCIA: 'Aprobado Gerencia',
    RECHAZADO_GERENCIA: 'Rechazado Gerencia',
    REVISION_LOGISTICA: 'Revisión Logística',
    EN_COMPRA: 'En Compra',
    APROBADO_ADM: 'Aprobado Administración',
    RECHAZADO_ADM: 'Rechazado Administración',
    LISTO_DESPACHO: 'Listo para Despacho',
    ENVIADO: 'Enviado',
    ENTREGADO_PARCIAL: 'Entregado Parcial',
    ENTREGADO: 'Entregado',
  };

  const newState = stateLabels[item.estadoNuevo] || item.estadoNuevo;
  return `${item.requerimiento.numero} - ${newState}`;
}
