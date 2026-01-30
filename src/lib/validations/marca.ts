import { z } from 'zod';

export const createMarcaSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede tener más de 100 caracteres')
    .trim()
    .refine((val) => val.length > 0, {
      message: 'El nombre no puede estar vacío',
    })
    .refine((val) => /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ\-&.]+$/.test(val), {
      message: 'El nombre solo puede contener letras, números, espacios y guiones',
    }),
  activo: z.boolean().optional().default(true),
});

export const updateMarcaSchema = createMarcaSchema.partial();

export type CreateMarcaInput = z.infer<typeof createMarcaSchema>;
export type UpdateMarcaInput = z.infer<typeof updateMarcaSchema>;
