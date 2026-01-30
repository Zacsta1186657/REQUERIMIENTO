import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  jsonResponse,
  errorResponse,
  validationError,
  withLogisticaAuth,
  paginationParams,
  paginatedResponse,
} from '@/lib/api-utils';
import { createMarcaSchema } from '@/lib/validations/marca';
import { ZodError } from 'zod';

// GET /api/catalogos/marcas - Listar marcas
export async function GET(request: NextRequest) {
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

    const [marcas, total] = await Promise.all([
      prisma.marca.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nombre: 'asc' },
        include: {
          _count: {
            select: {
              modelos: true,
              productos: true,
            },
          },
        },
      }),
      prisma.marca.count({ where }),
    ]);

    return paginatedResponse(marcas, total, page, limit);
  } catch (error) {
    console.error('GET /api/catalogos/marcas error:', error);
    return errorResponse('Error al obtener marcas', 500);
  }
}

// POST /api/catalogos/marcas - Crear marca
export async function POST(request: NextRequest) {
  return withLogisticaAuth(async () => {
    try {
      const body = await request.json();
      const data = createMarcaSchema.parse(body);

      // Verificar si ya existe una marca con el mismo nombre
      const existing = await prisma.marca.findUnique({
        where: { nombre: data.nombre },
      });

      if (existing) {
        return errorResponse('Ya existe una marca con ese nombre', 400);
      }

      const marca = await prisma.marca.create({
        data,
      });

      return jsonResponse(marca, 201);
    } catch (error) {
      if (error instanceof ZodError) {
        return validationError(error);
      }
      console.error('POST /api/catalogos/marcas error:', error);
      return errorResponse('Error al crear marca', 500);
    }
  });
}
