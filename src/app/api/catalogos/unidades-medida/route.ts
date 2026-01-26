import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, serverErrorResponse } from '@/lib/api-utils';

export async function GET() {
  return withAuth(async (_user) => {
    try {
      const unidadesMedida = await prisma.unidadMedida.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' },
      });

      return NextResponse.json({ data: unidadesMedida });
    } catch (error) {
      console.error('Get unidades medida error:', error);
      return serverErrorResponse();
    }
  });
}
