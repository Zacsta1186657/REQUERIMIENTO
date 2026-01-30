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
import { createModeloSchema } from '@/lib/validations/modelo';
import { ZodError } from 'zod';

// GET /api/catalogos/modelos - Listar modelos
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip } = paginationParams(searchParams);
    const search = searchParams.get('search') || '';
    const marcaId = searchParams.get('marcaId');
    const activo = searchParams.get('activo');

    const where = {
      ...(search && {
        nombre: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }),
      ...(marcaId && { marcaId }),
      ...(activo !== null && activo !== undefined && activo !== '' && {
        activo: activo === 'true',
      }),
    };

    const [modelos, total] = await Promise.all([
      prisma.modelo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nombre: 'asc' },
        include: {
          marca: true,
          _count: {
            select: {
              productos: true,
            },
          },
        },
      }),
      prisma.modelo.count({ where }),
    ]);

    return paginatedResponse(modelos, total, page, limit);
  } catch (error) {
    console.error('GET /api/catalogos/modelos error:', error);
    return errorResponse('Error al obtener modelos', 500);
  }
}

// POST /api/catalogos/modelos - Crear modelo
export async function POST(request: NextRequest) {
  return withLogisticaAuth(async () => {
    try {
      const body = await request.json();
      const data = createModeloSchema.parse(body);

      // Verificar que la marca existe
      const marca = await prisma.marca.findUnique({
        where: { id: data.marcaId },
      });

      if (!marca) {
        return errorResponse('La marca especificada no existe', 400);
      }

      // Verificar si ya existe un modelo con el mismo nombre para esta marca
      const existing = await prisma.modelo.findUnique({
        where: {
          marcaId_nombre: {
            marcaId: data.marcaId,
            nombre: data.nombre,
          },
        },
      });

      if (existing) {
        return errorResponse('Ya existe un modelo con ese nombre para esta marca', 400);
      }

      const modelo = await prisma.modelo.create({
        data,
        include: {
          marca: true,
        },
      });

      return jsonResponse(modelo, 201);
    } catch (error) {
      if (error instanceof ZodError) {
        return validationError(error);
      }
      console.error('POST /api/catalogos/modelos error:', error);
      return errorResponse('Error al crear modelo', 500);
    }
  });
}
