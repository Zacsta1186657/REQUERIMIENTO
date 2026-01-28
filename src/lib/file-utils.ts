// Server-side file utilities
// This file contains Node.js specific code and should only be used in API routes

import fs from "fs/promises";
import path from "path";
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from "./file-constants";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

/**
 * Ensures the uploads directory exists
 */
export async function ensureUploadsDir(subPath?: string): Promise<string> {
  const targetDir = subPath ? path.join(UPLOADS_DIR, subPath) : UPLOADS_DIR;
  await fs.mkdir(targetDir, { recursive: true });
  return targetDir;
}

/**
 * Saves a file to the uploads directory
 */
export async function saveFile(
  buffer: Buffer,
  filename: string,
  subPath?: string
): Promise<string> {
  const targetDir = await ensureUploadsDir(subPath);
  const filePath = path.join(targetDir, filename);
  await fs.writeFile(filePath, buffer);
  return subPath ? `${subPath}/${filename}` : filename;
}

/**
 * Reads a file from the uploads directory
 */
export async function readFile(relativePath: string): Promise<Buffer> {
  const filePath = path.join(UPLOADS_DIR, relativePath);
  return fs.readFile(filePath);
}

/**
 * Deletes a file from the uploads directory
 */
export async function deleteFile(relativePath: string): Promise<void> {
  const filePath = path.join(UPLOADS_DIR, relativePath);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // File might not exist, which is fine
    console.error("Error deleting file:", error);
  }
}

/**
 * Checks if a file exists in the uploads directory
 */
export async function fileExists(relativePath: string): Promise<boolean> {
  const filePath = path.join(UPLOADS_DIR, relativePath);
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a file for upload
 */
export function validateFile(file: {
  name: string;
  size: number;
  type: string;
}): { valid: boolean; error?: string } {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido. Extensiones permitidas: ${ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Tipo MIME no permitido",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `El archivo excede el tamaño máximo de ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Generates a unique filename using UUID
 */
export function generateUniqueFilename(originalName: string): string {
  const extension = originalName.split(".").pop()?.toLowerCase() || "";
  const uuid = crypto.randomUUID();
  return `${uuid}.${extension}`;
}

/**
 * Gets the file path structure for a requerimiento
 */
export function getRequerimientoFilePath(requerimientoId: string): string {
  return `requerimientos/${requerimientoId}`;
}

/**
 * Gets the file path structure for general logistica files
 */
export function getLogisticaFilePath(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `logistica/${year}/${month}`;
}
