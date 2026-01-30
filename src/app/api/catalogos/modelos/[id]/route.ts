import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  jsonResponse,
  errorResponse,
  validationError,
  notFoundResponse,
  withLogisticaAuth,
} from '@/lib/api-utils';
import { updateModeloSchema } from '@/lib/validations/modelo';
import { ZodError } from 'zod';

// GET /api/catalogos/modelos/[id] - Obtener modelo por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const modelo = await prisma.modelo.findUnique({
      where: { id },
      include: {
        marca: true,
        _count: {
          select: {
            productos: true,
          },
        },
      },
    });

    if (!modelo) {
      return notFoundResponse('Modelo no encontrado');
    }

    return jsonResponse(modelo);
  } catch (error) {
    console.error('GET /api/catalogos/modelos/[id] error:', error);
    return errorResponse('Error al obtener modelo', 500);
  }
}

// PUT /api/catalogos/modelos/[id] - Actualizar modelo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withLogisticaAuth(async () => {
    try {
      const { id } = await params;
      const body = await request.json();
      const data = updateModeloSchema.parse(body);

      // Verificar si existe
      const existing = await prisma.modelo.findUnique({
        where: { id },
      });

      if (!existing) {
        return notFoundResponse('Modelo no encontrado');
      }

      // Si se cambia la marca, verificar que existe
      if (data.marcaId && data.marcaId !== existing.marcaId) {
        const marca = await prisma.marca.findUnique({
          where: { id: data.marcaId },
        });

        if (!marca) {
          return errorResponse('La marca especificada no existe', 400);
        }
      }

      // Verificar constraint único (marcaId + nombre)
      const marcaIdFinal = data.marcaId || existing.marcaId;
      const nombreFinal = data.nombre || existing.nombre;

      if (
        (data.nombre && data.nombre !== existing.nombre) ||
        (data.marcaId && data.marcaId !== existing.marcaId)
      ) {
        const duplicate = await prisma.modelo.findUnique({
          where: {
            marcaId_nombre: {
              marcaId: marcaIdFinal,
              nombre: nombreFinal,
            },
          },
        });

        if (duplicate && duplicate.id !== id) {
          return errorResponse('Ya existe un modelo con ese nombre para esta marca', 400);
        }
      }

      const modelo = await prisma.modelo.update({
        where: { id },
        data,
        include: {
          marca: true,
        },
      });

      return jsonResponse(modelo);
    } catch (error) {
      if (error instanceof ZodError) {
        return validationError(error);
      }
      console.error('PUT /api/catalogos/modelos/[id] error:', error);
      return errorResponse('Error al actualizar modelo', 500);
    }
  });
}

// DELETE /api/catalogos/modelos/[id] - Eliminar o desactivar modelo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withLogisticaAuth(async () => {
    try {
      const { id } = await params;

      // Verificar si existe
      const modelo = await prisma.modelo.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              productos: true,
            },
          },
        },
      });

      if (!modelo) {
        return notFoundResponse('Modelo no encontrado');
      }

      // Si tiene productos asociados, solo desactivar
      if (modelo._count.productos > 0) {
        const updated = await prisma.modelo.update({
          where: { id },
          data: { activo: false },
        });
        return jsonResponse({
          message: 'Modelo desactivado (tiene productos asociados)',
          modelo: updated,
        });
      }

      // Si no tiene dependencias, eliminar físicamente
      await prisma.modelo.delete({
        where: { id },
      });

      return jsonResponse({
        message: 'Modelo eliminado exitosamente',
      });
    } catch (error) {
      console.error('DELETE /api/catalogos/modelos/[id] error:', error);
      return errorResponse('Error al eliminar modelo', 500);
    }
  });
}
