@echo off
set PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION=yes
npx prisma migrate dev --name remove_unidad_medida_from_producto
pause
