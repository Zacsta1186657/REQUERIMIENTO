-- AlterTable
ALTER TABLE "requerimiento_items" ADD COLUMN     "fechaValidacion" TIMESTAMP(3),
ADD COLUMN     "observacionCompra" TEXT,
ADD COLUMN     "validadoCompra" BOOLEAN,
ADD COLUMN     "validadoPorId" TEXT;

-- AddForeignKey
ALTER TABLE "requerimiento_items" ADD CONSTRAINT "requerimiento_items_validadoPorId_fkey" FOREIGN KEY ("validadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
