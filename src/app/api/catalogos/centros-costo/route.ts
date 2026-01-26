import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, serverErrorResponse } from '@/lib/api-utils';

export async function GET() {
  return withAuth(async (_user) => {
    try {
      const centrosCosto = await prisma.centroCosto.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' },
      });

      return NextResponse.json({ data: centrosCosto });
    } catch (error) {
      console.error('Get centros costo error:', error);
      return serverErrorResponse();
    }
  });
}
