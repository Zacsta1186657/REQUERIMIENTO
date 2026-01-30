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
import { createProductoSchema } from '@/lib/validations/producto';
import { ZodError } from 'zod';

// GET /api/catalogos/productos - Listar productos
export async function GET(request: NextRequest) {
  return withAuth(async () => {
    try {
      const { searchParams } = new URL(request.url);
      const { page, limit, skip } = paginationParams(searchParams);
      const categoriaId = searchParams.get('categoriaId');
      const marcaId = searchParams.get('marcaId');
      const search = searchParams.get('search');
      const activo = searchParams.get('activo');

      const where = {
        ...(activo !== null && activo !== undefined && activo !== ''
          ? { activo: activo === 'true' }
          : { activo: true }
        ),
        ...(categoriaId && { categoriaId }),
        ...(marcaId && { marcaId }),
        ...(search && {
          OR: [
            { descripcion: { contains: search, mode: 'insensitive' as const } },
            { numeroParte: { contains: search, mode: 'insensitive' as const } },
            { marca: { nombre: { contains: search, mode: 'insensitive' as const } } },
            { modelo: { nombre: { contains: search, mode: 'insensitive' as const } } },
          ],
        }),
      };

      const [productos, total] = await Promise.all([
        prisma.producto.findMany({
          where,
          include: {
            categoria: true,
            marca: true,
            modelo: {
              include: {
                marca: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { descripcion: 'asc' },
        }),
        prisma.producto.count({ where }),
      ]);

      return paginatedResponse(productos, total, page, limit);
    } catch (error) {
      console.error('GET /api/catalogos/productos error:', error);
      return errorResponse('Error al obtener productos', 500);
    }
  });
}

// POST /api/catalogos/productos - Crear producto
export async function POST(request: NextRequest) {
  return withLogisticaAuth(async () => {
    try {
      const body = await request.json();
      const data = createProductoSchema.parse(body);

      // Verificar que las relaciones existen
      const [categoria, marca, modelo] = await Promise.all([
        prisma.categoria.findUnique({ where: { id: data.categoriaId } }),
        prisma.marca.findUnique({ where: { id: data.marcaId } }),
        prisma.modelo.findUnique({ where: { id: data.modeloId } }),
      ]);

      if (!categoria) {
        return errorResponse('La categoría especificada no existe', 400);
      }
      if (!marca) {
        return errorResponse('La marca especificada no existe', 400);
      }
      if (!modelo) {
        return errorResponse('El modelo especificado no existe', 400);
      }

      // Verificar que el modelo pertenece a la marca
      if (modelo.marcaId !== data.marcaId) {
        return errorResponse('El modelo no pertenece a la marca seleccionada', 400);
      }

      // Verificar si ya existe un producto con el mismo numeroParte
      if (data.numeroParte) {
        const existing = await prisma.producto.findUnique({
          where: { numeroParte: data.numeroParte },
        });

        if (existing) {
          return errorResponse('Ya existe un producto con ese número de parte', 400);
        }
      }

      const producto = await prisma.producto.create({
        data,
        include: {
          categoria: true,
          marca: true,
          modelo: {
            include: {
              marca: true,
            },
          },
        },
      });

      return jsonResponse(producto, 201);
    } catch (error) {
      if (error instanceof ZodError) {
        return validationError(error);
      }
      console.error('POST /api/catalogos/productos error:', error);
      return errorResponse('Error al crear producto', 500);
    }
  });
}
