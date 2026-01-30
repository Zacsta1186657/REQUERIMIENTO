import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  jsonResponse,
  errorResponse,
  validationError,
  notFoundResponse,
  withLogisticaAuth,
} from '@/lib/api-utils';
import { updateCategoriaSchema } from '@/lib/validations/categoria';
import { ZodError } from 'zod';

// GET /api/catalogos/categorias/[id] - Obtener categoría por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoria = await prisma.categoria.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            productos: true,
            requerimientoItems: true,
          },
        },
      },
    });

    if (!categoria) {
      return notFoundResponse('Categoría no encontrada');
    }

    return jsonResponse(categoria);
  } catch (error) {
    console.error('GET /api/catalogos/categorias/[id] error:', error);
    return errorResponse('Error al obtener categoría', 500);
  }
}

// PUT /api/catalogos/categorias/[id] - Actualizar categoría
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withLogisticaAuth(async () => {
    try {
      const { id } = await params;
      const body = await request.json();
      const data = updateCategoriaSchema.parse(body);

      // Verificar si existe
      const existing = await prisma.categoria.findUnique({
        where: { id },
      });

      if (!existing) {
        return notFoundResponse('Categoría no encontrada');
      }

      // Si se cambia el nombre, verificar que no exista otra categoría con ese nombre
      if (data.nombre && data.nombre !== existing.nombre) {
        const duplicate = await prisma.categoria.findUnique({
          where: { nombre: data.nombre },
        });

        if (duplicate) {
          return errorResponse('Ya existe una categoría con ese nombre', 400);
        }
      }

      const categoria = await prisma.categoria.update({
        where: { id },
        data,
      });

      return jsonResponse(categoria);
    } catch (error) {
      if (error instanceof ZodError) {
        return validationError(error);
      }
      console.error('PUT /api/catalogos/categorias/[id] error:', error);
      return errorResponse('Error al actualizar categoría', 500);
    }
  });
}

// DELETE /api/catalogos/categorias/[id] - Eliminar o desactivar categoría
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withLogisticaAuth(async () => {
    try {
      const { id } = await params;

      // Verificar si existe
      const categoria = await prisma.categoria.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              productos: true,
              requerimientoItems: true,
            },
          },
        },
      });

      if (!categoria) {
        return notFoundResponse('Categoría no encontrada');
      }

      // Si tiene productos o requerimientos asociados, solo desactivar
      if (categoria._count.productos > 0 || categoria._count.requerimientoItems > 0) {
        const updated = await prisma.categoria.update({
          where: { id },
          data: { activo: false },
        });
        return jsonResponse({
          message: 'Categoría desactivada (tiene productos o requerimientos asociados)',
          categoria: updated,
        });
      }

      // Si no tiene dependencias, eliminar físicamente
      await prisma.categoria.delete({
        where: { id },
      });

      return jsonResponse({
        message: 'Categoría eliminada exitosamente',
      });
    } catch (error) {
      console.error('DELETE /api/catalogos/categorias/[id] error:', error);
      return errorResponse('Error al eliminar categoría', 500);
    }
  });
}
