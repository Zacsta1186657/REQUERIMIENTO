-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TECNICO', 'SEGURIDAD', 'GERENCIA', 'LOGISTICA', 'ADMINISTRACION', 'RECEPTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "RequerimientoStatus" AS ENUM ('BORRADOR', 'CREADO', 'VALIDACION_SEGURIDAD', 'APROBADO_SEGURIDAD', 'RECHAZADO_SEGURIDAD', 'VALIDACION_GERENCIA', 'APROBADO_GERENCIA', 'RECHAZADO_GERENCIA', 'REVISION_LOGISTICA', 'EN_COMPRA', 'APROBADO_ADM', 'RECHAZADO_ADM', 'LISTO_DESPACHO', 'ENVIADO', 'ENTREGADO_PARCIAL', 'ENTREGADO');

-- CreateEnum
CREATE TYPE "LoteStatus" AS ENUM ('PENDIENTE', 'PREPARANDO', 'DESPACHADO', 'EN_TRANSITO', 'ENTREGADO');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('REQUERIMIENTO_CREADO', 'APROBACION_PENDIENTE', 'ESTADO_CAMBIO', 'RECHAZADO', 'LISTO_DESPACHO', 'ENTREGADO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" "UserRole" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operaciones" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "operaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "centros_costo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "centros_costo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades_medida" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "abreviatura" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "unidades_medida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "numeroParte" TEXT,
    "descripcion" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "categoriaId" TEXT NOT NULL,
    "unidadMedidaId" TEXT NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requerimientos" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT NOT NULL,
    "comentarios" TEXT,
    "estado" "RequerimientoStatus" NOT NULL DEFAULT 'BORRADOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "operacionId" TEXT NOT NULL,
    "centroCostoId" TEXT NOT NULL,

    CONSTRAINT "requerimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requerimiento_items" (
    "id" TEXT NOT NULL,
    "numeroParte" TEXT,
    "descripcion" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "cantidadSolicitada" INTEGER NOT NULL,
    "cantidadAprobada" INTEGER,
    "serial" TEXT,
    "enStock" BOOLEAN,
    "requiereCompra" BOOLEAN,
    "motivoStock" TEXT,
    "fechaEstimadaCompra" TIMESTAMP(3),
    "eliminado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requerimientoId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "unidadMedidaId" TEXT NOT NULL,
    "productoId" TEXT,

    CONSTRAINT "requerimiento_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "estado" "LoteStatus" NOT NULL DEFAULT 'PENDIENTE',
    "fechaDespacho" TIMESTAMP(3),
    "fechaEntrega" TIMESTAMP(3),
    "transportista" TEXT,
    "destino" TEXT,
    "confirmadoRecepcion" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requerimientoId" TEXT NOT NULL,
    "receptorId" TEXT,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lote_items" (
    "id" TEXT NOT NULL,
    "cantidadEnviada" INTEGER NOT NULL,
    "loteId" TEXT NOT NULL,
    "requerimientoItemId" TEXT NOT NULL,

    CONSTRAINT "lote_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_estados" (
    "id" TEXT NOT NULL,
    "estadoAnterior" "RequerimientoStatus",
    "estadoNuevo" "RequerimientoStatus" NOT NULL,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requerimientoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "historial_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modificaciones_items" (
    "id" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "valorAnterior" TEXT NOT NULL,
    "valorNuevo" TEXT NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requerimientoItemId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "modificaciones_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "tipo" "NotificationType" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    "requerimientoId" TEXT,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "operaciones_codigo_key" ON "operaciones"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "centros_costo_codigo_key" ON "centros_costo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_medida_abreviatura_key" ON "unidades_medida"("abreviatura");

-- CreateIndex
CREATE UNIQUE INDEX "productos_numeroParte_key" ON "productos"("numeroParte");

-- CreateIndex
CREATE UNIQUE INDEX "requerimientos_numero_key" ON "requerimientos"("numero");

-- CreateIndex
CREATE INDEX "requerimientos_estado_idx" ON "requerimientos"("estado");

-- CreateIndex
CREATE INDEX "requerimientos_solicitanteId_idx" ON "requerimientos"("solicitanteId");

-- CreateIndex
CREATE INDEX "requerimientos_fecha_idx" ON "requerimientos"("fecha");

-- CreateIndex
CREATE INDEX "requerimiento_items_requerimientoId_idx" ON "requerimiento_items"("requerimientoId");

-- CreateIndex
CREATE UNIQUE INDEX "lotes_requerimientoId_numero_key" ON "lotes"("requerimientoId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "lote_items_loteId_requerimientoItemId_key" ON "lote_items"("loteId", "requerimientoItemId");

-- CreateIndex
CREATE INDEX "historial_estados_requerimientoId_idx" ON "historial_estados"("requerimientoId");

-- CreateIndex
CREATE INDEX "notificaciones_usuarioId_leida_idx" ON "notificaciones"("usuarioId", "leida");

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_unidadMedidaId_fkey" FOREIGN KEY ("unidadMedidaId") REFERENCES "unidades_medida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requerimientos" ADD CONSTRAINT "requerimientos_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requerimientos" ADD CONSTRAINT "requerimientos_operacionId_fkey" FOREIGN KEY ("operacionId") REFERENCES "operaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requerimientos" ADD CONSTRAINT "requerimientos_centroCostoId_fkey" FOREIGN KEY ("centroCostoId") REFERENCES "centros_costo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requerimiento_items" ADD CONSTRAINT "requerimiento_items_requerimientoId_fkey" FOREIGN KEY ("requerimientoId") REFERENCES "requerimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requerimiento_items" ADD CONSTRAINT "requerimiento_items_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requerimiento_items" ADD CONSTRAINT "requerimiento_items_unidadMedidaId_fkey" FOREIGN KEY ("unidadMedidaId") REFERENCES "unidades_medida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requerimiento_items" ADD CONSTRAINT "requerimiento_items_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_requerimientoId_fkey" FOREIGN KEY ("requerimientoId") REFERENCES "requerimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_receptorId_fkey" FOREIGN KEY ("receptorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lote_items" ADD CONSTRAINT "lote_items_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "lotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lote_items" ADD CONSTRAINT "lote_items_requerimientoItemId_fkey" FOREIGN KEY ("requerimientoItemId") REFERENCES "requerimiento_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estados" ADD CONSTRAINT "historial_estados_requerimientoId_fkey" FOREIGN KEY ("requerimientoId") REFERENCES "requerimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estados" ADD CONSTRAINT "historial_estados_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modificaciones_items" ADD CONSTRAINT "modificaciones_items_requerimientoItemId_fkey" FOREIGN KEY ("requerimientoItemId") REFERENCES "requerimiento_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modificaciones_items" ADD CONSTRAINT "modificaciones_items_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_requerimientoId_fkey" FOREIGN KEY ("requerimientoId") REFERENCES "requerimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
