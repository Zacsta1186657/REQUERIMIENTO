import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  jsonResponse,
  errorResponse,
  validationError,
  withAuth,
  withLogisticaAuth,
  paginationParams,
  paginatedResponse,
} from '@/lib/api-utils';
import { createCategoriaSchema } from '@/lib/validations/categoria';
import { ZodError } from 'zod';

// GET /api/catalogos/categorias - Listar categorías
export async function GET(request: NextRequest) {
  return withAuth(async () => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const { page, limit, skip } = paginationParams(searchParams);
      const search = searchParams.get('search') || '';
      const activo = searchParams.get('activo');

      const where = {
        ...(search && {
          nombre: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }),
        ...(activo !== null && activo !== undefined && activo !== '' && {
          activo: activo === 'true',
        }),
      };

      const [categorias, total] = await Promise.all([
        prisma.categoria.findMany({
          where,
          skip,
          take: limit,
          orderBy: { nombre: 'asc' },
          include: {
            _count: {
              select: {
                productos: true,
                requerimientoItems: true,
              },
            },
          },
        }),
        prisma.categoria.count({ where }),
      ]);

      return paginatedResponse(categorias, total, page, limit);
    } catch (error) {
      console.error('GET /api/catalogos/categorias error:', error);
      return errorResponse('Error al obtener categorías', 500);
    }
  });
}

// POST /api/catalogos/categorias - Crear categoría
export async function POST(request: NextRequest) {
  return withLogisticaAuth(async () => {
    try {
      const body = await request.json();
      const data = createCategoriaSchema.parse(body);

      // Verificar si ya existe una categoría con el mismo nombre
      const existing = await prisma.categoria.findUnique({
        where: { nombre: data.nombre },
      });

      if (existing) {
        return errorResponse('Ya existe una categoría con ese nombre', 400);
      }

      const categoria = await prisma.categoria.create({
        data,
      });

      return jsonResponse(categoria, 201);
    } catch (error) {
      if (error instanceof ZodError) {
        return validationError(error);
      }
      console.error('POST /api/catalogos/categorias error:', error);
      return errorResponse('Error al crear categoría', 500);
    }
  });
}
