@echo off
set PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION=Si
npx prisma migrate reset --force
pause
