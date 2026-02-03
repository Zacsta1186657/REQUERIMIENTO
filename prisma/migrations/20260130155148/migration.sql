/*
  Warnings:

  - You are about to drop the column `unidadMedidaId` on the `productos` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "productos" DROP CONSTRAINT "productos_unidadMedidaId_fkey";

-- AlterTable
ALTER TABLE "productos" DROP COLUMN "unidadMedidaId";
