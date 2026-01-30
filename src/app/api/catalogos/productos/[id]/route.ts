import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  jsonResponse,
  errorResponse,
  validationError,
  notFoundResponse,
  withLogisticaAuth,
} from '@/lib/api-utils';
import { updateProductoSchema } from '@/lib/validations/producto';
import { ZodError } from 'zod';

// GET /api/catalogos/productos/[id] - Obtener producto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('HOLAAAAAAAAAAAAAAAAAAAAAAAA', id);
    const producto = await prisma.producto.findUnique({
      where: { id },
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

    if (!producto) {
      return notFoundResponse('Producto no encontrado');
    }

    return jsonResponse(producto);
  } catch (error) {
    console.error('GET /api/catalogos/productos/[id] error:', error);
    return errorResponse('Error al obtener producto', 500);
  }
}

// PUT /api/catalogos/productos/[id] - Actualizar producto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withLogisticaAuth(async () => {
    try {
      const { id } = await params;
      const body = await request.json();
      const data = updateProductoSchema.parse(body);

      // Verificar si existe
      const existing = await prisma.producto.findUnique({
        where: { id },
      });

      if (!existing) {
        return notFoundResponse('Producto no encontrado');
      }

      // Verificar que las relaciones existen (si se están actualizando)
      if (data.categoriaId) {
        const categoria = await prisma.categoria.findUnique({
          where: { id: data.categoriaId },
        });
        if (!categoria) {
          return errorResponse('La categoría especificada no existe', 400);
        }
      }

      if (data.marcaId) {
        const marca = await prisma.marca.findUnique({
          where: { id: data.marcaId },
        });
        if (!marca) {
          return errorResponse('La marca especificada no existe', 400);
        }
      }

      if (data.modeloId) {
        const modelo = await prisma.modelo.findUnique({
          where: { id: data.modeloId },
        });
        if (!modelo) {
          return errorResponse('El modelo especificado no existe', 400);
        }

        // Verificar que el modelo pertenece a la marca
        const marcaIdFinal = data.marcaId || existing.marcaId;
        if (modelo.marcaId !== marcaIdFinal) {
          return errorResponse('El modelo no pertenece a la marca seleccionada', 400);
        }
      }

      // Verificar numeroParte único
      if (data.numeroParte && data.numeroParte !== existing.numeroParte) {
        const duplicate = await prisma.producto.findUnique({
          where: { numeroParte: data.numeroParte },
        });

        if (duplicate) {
          return errorResponse('Ya existe un producto con ese número de parte', 400);
        }
      }

      const producto = await prisma.producto.update({
        where: { id },
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

      return jsonResponse(producto);
    } catch (error) {
      if (error instanceof ZodError) {
        return validationError(error);
      }
      console.error('PUT /api/catalogos/productos/[id] error:', error);
      return errorResponse('Error al actualizar producto', 500);
    }
  });
}

// DELETE /api/catalogos/productos/[id] - Eliminar o desactivar producto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withLogisticaAuth(async () => {
    try {
      const { id } = await params;

      // Verificar si existe
      const producto = await prisma.producto.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              requerimientoItems: true,
            },
          },
        },
      });

      if (!producto) {
        return notFoundResponse('Producto no encontrado');
      }

      // Si tiene requerimientos asociados, solo desactivar
      if (producto._count.requerimientoItems > 0) {
        const updated = await prisma.producto.update({
          where: { id },
          data: { activo: false },
        });
        return jsonResponse({
          message: 'Producto desactivado (tiene requerimientos asociados)',
          producto: updated,
        });
      }

      // Si no tiene dependencias, eliminar físicamente
      await prisma.producto.delete({
        where: { id },
      });

      return jsonResponse({
        message: 'Producto eliminado exitosamente',
      });
    } catch (error) {
      console.error('DELETE /api/catalogos/productos/[id] error:', error);
      return errorResponse('Error al eliminar producto', 500);
    }
  });
}
