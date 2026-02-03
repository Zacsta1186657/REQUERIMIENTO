-- AlterTable
ALTER TABLE "users" ADD COLUMN     "operacionId" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_operacionId_fkey" FOREIGN KEY ("operacionId") REFERENCES "operaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
