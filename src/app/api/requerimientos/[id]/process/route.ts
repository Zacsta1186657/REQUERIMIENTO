import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  errorResponse,
  serverErrorResponse,
} from "@/lib/api-utils";
import { RequerimientoStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/requerimientos/[id]/process - Change status (for Logistica workflow)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const body = await request.json();
    const { estado } = body;

    if (!estado) {
      return errorResponse("Estado es requerido", 400);
    }

    // Validate estado is a valid status
    const validStatuses: RequerimientoStatus[] = [
      "LISTO_DESPACHO",
      "EN_COMPRA",
      "ENVIADO",
      "ENTREGADO_PARCIAL",
      "ENTREGADO",
    ];

    if (!validStatuses.includes(estado)) {
      return errorResponse("Estado no válido para esta operación", 400);
    }

    // Get the requerimiento
    const requerimiento = await prisma.requerimiento.findUnique({
      where: { id },
    });

    if (!requerimiento) {
      return notFoundResponse("Requerimiento no encontrado");
    }

    // Validate transitions
    const allowedTransitions: Partial<
      Record<RequerimientoStatus, RequerimientoStatus[]>
    > = {
      REVISION_LOGISTICA: ["LISTO_DESPACHO", "EN_COMPRA"],
      EN_COMPRA: ["LISTO_DESPACHO"],
      LISTO_DESPACHO: ["ENVIADO"],
      ENVIADO: ["ENTREGADO_PARCIAL", "ENTREGADO"],
      ENTREGADO_PARCIAL: ["ENTREGADO"],
    };

    const allowed = allowedTransitions[requerimiento.estado];
    if (!allowed || !allowed.includes(estado)) {
      return errorResponse(
        `No se puede cambiar de ${requerimiento.estado} a ${estado}`,
        400
      );
    }

    // Check permissions based on role and target status
    const userRole = user.rol;
    const canProcess =
      userRole === "ADMIN" ||
      userRole === "LOGISTICA" ||
      (userRole === "ADMINISTRACION" && estado === "LISTO_DESPACHO");

    if (!canProcess) {
      return forbiddenResponse("No tiene permisos para realizar esta acción");
    }

    // Update the requerimiento
    const updated = await prisma.requerimiento.update({
      where: { id },
      data: {
        estado,
      },
      include: {
        solicitante: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
        operacion: true,
        centroCosto: true,
        items: {
          where: { eliminado: false },
          include: {
            categoria: true,
            unidadMedida: true,
          },
        },
        lotes: {
          include: {
            items: {
              include: {
                requerimientoItem: true,
              },
            },
          },
        },
      },
    });

    // Create history entry
    await prisma.historialEstado.create({
      data: {
        requerimientoId: id,
        usuarioId: user.id,
        estadoAnterior: requerimiento.estado,
        estadoNuevo: estado,
        comentario: `Estado cambiado a ${estado}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error processing requerimiento:", error);
    return serverErrorResponse();
  }
}
