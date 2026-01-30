import { z } from 'zod';

export const createCategoriaSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede tener más de 50 caracteres')
    .trim()
    .refine((val) => val.length > 0, {
      message: 'El nombre no puede estar vacío',
    })
    .refine((val) => /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ\-&]+$/.test(val), {
      message: 'El nombre solo puede contener letras, números, espacios y guiones',
    })
    .transform((val) => val.toUpperCase()),
  activo: z.boolean().optional().default(true),
});

export const updateCategoriaSchema = createCategoriaSchema.partial();

export type CreateCategoriaInput = z.infer<typeof createCategoriaSchema>;
export type UpdateCategoriaInput = z.infer<typeof updateCategoriaSchema>;
