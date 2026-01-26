import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, serverErrorResponse } from '@/lib/api-utils';

export async function GET() {
  return withAuth(async (_user) => {
    try {
      const categorias = await prisma.categoria.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' },
      });

      return NextResponse.json({ data: categorias });
    } catch (error) {
      console.error('Get categorias error:', error);
      return serverErrorResponse();
    }
  });
}
