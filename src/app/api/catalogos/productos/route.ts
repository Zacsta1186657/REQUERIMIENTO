import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, paginationParams, paginatedResponse, serverErrorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  return withAuth(async (_user) => {
    try {
      const { searchParams } = new URL(request.url);
      const { page, limit, skip } = paginationParams(searchParams);
      const categoriaId = searchParams.get('categoriaId');
      const search = searchParams.get('search');

      const where = {
        activo: true,
        ...(categoriaId && { categoriaId }),
        ...(search && {
          OR: [
            { descripcion: { contains: search, mode: 'insensitive' as const } },
            { numeroParte: { contains: search, mode: 'insensitive' as const } },
            { marca: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      const [productos, total] = await Promise.all([
        prisma.producto.findMany({
          where,
          include: {
            categoria: true,
            unidadMedida: true,
          },
          skip,
          take: limit,
          orderBy: { descripcion: 'asc' },
        }),
        prisma.producto.count({ where }),
      ]);

      return paginatedResponse(productos, total, page, limit);
    } catch (error) {
      console.error('Get productos error:', error);
      return serverErrorResponse();
    }
  });
}
