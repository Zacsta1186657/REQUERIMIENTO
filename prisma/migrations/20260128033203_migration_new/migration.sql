-- CreateEnum
CREATE TYPE "TipoArchivo" AS ENUM ('FACTURA', 'GUIA_REMISION', 'ORDEN_COMPRA', 'COTIZACION', 'DOCUMENTO_GENERAL', 'OTRO');

-- AlterTable
ALTER TABLE "lote_items" ADD COLUMN     "cantidadRecibida" INTEGER;

-- CreateTable
CREATE TABLE "archivos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreAlmacenado" TEXT NOT NULL,
    "tipo" "TipoArchivo" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanio" INTEGER NOT NULL,
    "extension" TEXT NOT NULL,
    "ruta" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subidoPorId" TEXT NOT NULL,
    "requerimientoId" TEXT,

    CONSTRAINT "archivos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "archivos_nombreAlmacenado_key" ON "archivos"("nombreAlmacenado");

-- CreateIndex
CREATE INDEX "archivos_requerimientoId_idx" ON "archivos"("requerimientoId");

-- CreateIndex
CREATE INDEX "archivos_subidoPorId_idx" ON "archivos"("subidoPorId");

-- CreateIndex
CREATE INDEX "archivos_tipo_idx" ON "archivos"("tipo");

-- AddForeignKey
ALTER TABLE "archivos" ADD CONSTRAINT "archivos_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archivos" ADD CONSTRAINT "archivos_requerimientoId_fkey" FOREIGN KEY ("requerimientoId") REFERENCES "requerimientos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
