import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Roles allowed to manage files
const ALLOWED_ROLES = ["LOGISTICA", "ADMINISTRACION", "ADMIN"];

// GET - Get archivo details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const archivo = await prisma.archivo.findUnique({
      where: { id },
      include: {
        subidoPor: {
          select: { id: true, nombre: true, email: true },
        },
        requerimiento: {
          select: { id: true, numero: true, motivo: true },
        },
      },
    });

    if (!archivo) {
      return NextResponse.json(
        { error: "Archivo no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: archivo });
  } catch (error) {
    console.error("Error fetching archivo:", error);
    return NextResponse.json(
      { error: "Error al obtener archivo" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete archivo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check role permissions
    if (!ALLOWED_ROLES.includes(user.rol)) {
      return NextResponse.json(
        { error: "No tiene permisos para eliminar archivos" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const archivo = await prisma.archivo.findUnique({
      where: { id },
    });

    if (!archivo) {
      return NextResponse.json(
        { error: "Archivo no encontrado" },
        { status: 404 }
      );
    }

    // Soft delete - just mark as inactive
    await prisma.archivo.update({
      where: { id },
      data: { activo: false },
    });

    return NextResponse.json({ message: "Archivo eliminado" });
  } catch (error) {
    console.error("Error deleting archivo:", error);
    return NextResponse.json(
      { error: "Error al eliminar archivo" },
      { status: 500 }
    );
  }
}

// PATCH - Restore archivo (undo soft delete)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check role permissions
    if (!ALLOWED_ROLES.includes(user.rol)) {
      return NextResponse.json(
        { error: "No tiene permisos para restaurar archivos" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const archivo = await prisma.archivo.findUnique({
      where: { id },
    });

    if (!archivo) {
      return NextResponse.json(
        { error: "Archivo no encontrado" },
        { status: 404 }
      );
    }

    // Restore archivo
    const restored = await prisma.archivo.update({
      where: { id },
      data: { activo: true },
    });

    return NextResponse.json({ data: restored });
  } catch (error) {
    console.error("Error restoring archivo:", error);
    return NextResponse.json(
      { error: "Error al restaurar archivo" },
      { status: 500 }
    );
  }
}
