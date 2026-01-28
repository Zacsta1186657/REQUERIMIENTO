import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { readFile, fileExists } from "@/lib/file-utils";
import { getContentType } from "@/lib/file-constants";

// GET - Download archivo
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
    });

    if (!archivo) {
      return NextResponse.json(
        { error: "Archivo no encontrado" },
        { status: 404 }
      );
    }

    if (!archivo.activo) {
      return NextResponse.json(
        { error: "Archivo no disponible" },
        { status: 404 }
      );
    }

    // Check if file exists on disk
    const exists = await fileExists(archivo.ruta);
    if (!exists) {
      return NextResponse.json(
        { error: "Archivo no encontrado en el servidor" },
        { status: 404 }
      );
    }

    // Read file from disk
    const buffer = await readFile(archivo.ruta);
    const contentType = getContentType(archivo.extension);

    // Return file as download
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(archivo.nombre)}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading archivo:", error);
    return NextResponse.json(
      { error: "Error al descargar archivo" },
      { status: 500 }
    );
  }
}
