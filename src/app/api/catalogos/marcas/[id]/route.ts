import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  jsonResponse,
  errorResponse,
  validationError,
  notFoundResponse,
  withLogisticaAuth,
} from '@/lib/api-utils';
import { updateMarcaSchema } from '@/lib/validations/marca';
import { ZodError } from 'zod';

// GET /api/catalogos/marcas/[id] - Obtener marca por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const marca = await prisma.marca.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            modelos: true,
            productos: true,
          },
        },
      },
    });

    if (!marca) {
      return notFoundResponse('Marca no encontrada');
    }

    return jsonResponse(marca);
  } catch (error) {
    console.error('GET /api/catalogos/marcas/[id] error:', error);
    return errorResponse('Error al obtener marca', 500);
  }
}

// PUT /api/catalogos/marcas/[id] - Actualizar marca
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withLogisticaAuth(async () => {
    try {
      const { id } = await params;
      const body = await request.json();
      const data = updateMarcaSchema.parse(body);

      // Verificar si existe
      const existing = await prisma.marca.findUnique({
        where: { id },
      });

      if (!existing) {
        return notFoundResponse('Marca no encontrada');
      }

      // Si se cambia el nombre, verificar que no exista otra marca con ese nombre
      if (data.nombre && data.nombre !== existing.nombre) {
        const duplicate = await prisma.marca.findUnique({
          where: { nombre: data.nombre },
        });

        if (duplicate) {
          return errorResponse('Ya existe una marca con ese nombre', 400);
        }
      }

      const marca = await prisma.marca.update({
        where: { id },
        data,
      });

      return jsonResponse(marca);
    } catch (error) {
      if (error instanceof ZodError) {
        return validationError(error);
      }
      console.error('PUT /api/catalogos/marcas/[id] error:', error);
      return errorResponse('Error al actualizar marca', 500);
    }
  });
}

// DELETE /api/catalogos/marcas/[id] - Eliminar o desactivar marca
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withLogisticaAuth(async () => {
    try {
      const { id } = await params;

      // Verificar si existe
      const marca = await prisma.marca.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              modelos: true,
              productos: true,
            },
          },
        },
      });

      if (!marca) {
        return notFoundResponse('Marca no encontrada');
      }

      // Si tiene modelos o productos asociados, solo desactivar
      if (marca._count.modelos > 0 || marca._count.productos > 0) {
        const updated = await prisma.marca.update({
          where: { id },
          data: { activo: false },
        });
        return jsonResponse({
          message: 'Marca desactivada (tiene modelos o productos asociados)',
          marca: updated,
        });
      }

      // Si no tiene dependencias, eliminar físicamente
      await prisma.marca.delete({
        where: { id },
      });

      return jsonResponse({
        message: 'Marca eliminada exitosamente',
      });
    } catch (error) {
      console.error('DELETE /api/catalogos/marcas/[id] error:', error);
      return errorResponse('Error al eliminar marca', 500);
    }
  });
}
