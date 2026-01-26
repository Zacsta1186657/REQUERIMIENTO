import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, serverErrorResponse } from '@/lib/api-utils';

export async function GET() {
  return withAuth(async (_user) => {
    try {
      const operaciones = await prisma.operacion.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' },
      });

      return NextResponse.json({ data: operaciones });
    } catch (error) {
      console.error('Get operaciones error:', error);
      return serverErrorResponse();
    }
  });
}
