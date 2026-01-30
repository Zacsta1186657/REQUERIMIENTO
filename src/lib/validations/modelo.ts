import { z } from 'zod';

export const createModeloSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre debe tener al menos 1 caracter')
    .max(100, 'El nombre no puede tener más de 100 caracteres')
    .trim()
    .refine((val) => val.length > 0, {
      message: 'El nombre no puede estar vacío',
    })
    .refine((val) => /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ\-&.]+$/.test(val), {
      message: 'El nombre solo puede contener letras, números, espacios y guiones',
    }),
  marcaId: z
    .string()
    .min(1, 'Debe seleccionar una marca'),
  activo: z.boolean().optional().default(true),
});

export const updateModeloSchema = createModeloSchema.partial();

export type CreateModeloInput = z.infer<typeof createModeloSchema>;
export type UpdateModeloInput = z.infer<typeof updateModeloSchema>;
