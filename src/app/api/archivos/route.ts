import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  saveFile,
  generateUniqueFilename,
  getRequerimientoFilePath,
  validateFile,
} from "@/lib/file-utils";
import { TipoArchivo } from "@prisma/client";

// Roles allowed to manage files
const ALLOWED_ROLES = ["LOGISTICA", "ADMINISTRACION", "ADMIN"];

// GET - List archivos
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const requerimientoId = searchParams.get("requerimientoId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: {
      activo: boolean;
      requerimientoId?: string | null;
    } = {
      activo: true,
    };

    if (requerimientoId) {
      where.requerimientoId = requerimientoId;
    }

    const [archivos, total] = await Promise.all([
      prisma.archivo.findMany({
        where,
        include: {
          subidoPor: {
            select: { id: true, nombre: true },
          },
          requerimiento: {
            select: { id: true, numero: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.archivo.count({ where }),
    ]);

    return NextResponse.json({
      data: archivos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching archivos:", error);
    return NextResponse.json(
      { error: "Error al obtener archivos" },
      { status: 500 }
    );
  }
}

// POST - Upload archivo
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check role permissions
    if (!ALLOWED_ROLES.includes(user.rol)) {
      return NextResponse.json(
        { error: "No tiene permisos para subir archivos" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const tipo = formData.get("tipo") as TipoArchivo | null;
    const requerimientoId = formData.get("requerimientoId") as string | null;
    const descripcion = formData.get("descripcion") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó archivo" },
        { status: 400 }
      );
    }

    if (!tipo) {
      return NextResponse.json(
        { error: "Tipo de archivo requerido" },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Generate unique filename
    const nombreAlmacenado = generateUniqueFilename(file.name);
    const extension = file.name.split(".").pop()?.toLowerCase() || "";

    // Determine storage path
    const subPath = requerimientoId
      ? getRequerimientoFilePath(requerimientoId)
      : `logistica/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}`;

    // Save file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    const ruta = await saveFile(buffer, nombreAlmacenado, subPath);

    // Create database record
    const archivo = await prisma.archivo.create({
      data: {
        nombre: file.name,
        nombreAlmacenado,
        tipo,
        mimeType: file.type,
        tamanio: file.size,
        extension,
        ruta,
        descripcion,
        subidoPorId: user.id,
        requerimientoId,
      },
      include: {
        subidoPor: {
          select: { id: true, nombre: true },
        },
      },
    });

    return NextResponse.json({ data: archivo }, { status: 201 });
  } catch (error) {
    console.error("Error uploading archivo:", error);
    return NextResponse.json(
      { error: "Error al subir archivo" },
      { status: 500 }
    );
  }
}
