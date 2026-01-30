import { z } from 'zod';

export const createProductoSchema = z.object({
  numeroParte: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true; // Opcional
        return /^[a-zA-Z0-9\-]+$/.test(val);
      },
      {
        message: 'El número de parte solo puede contener letras, números y guiones',
      }
    )
    .transform((val) => (val === '' ? null : val)),
  descripcion: z
    .string()
    .min(3, 'La descripción debe tener al menos 3 caracteres')
    .max(500, 'La descripción no puede tener más de 500 caracteres')
    .trim()
    .refine((val) => val.length > 0, {
      message: 'La descripción no puede estar vacía',
    }),
  categoriaId: z
    .string()
    .min(1, 'Debe seleccionar una categoría'),
  marcaId: z
    .string()
    .min(1, 'Debe seleccionar una marca'),
  modeloId: z
    .string()
    .min(1, 'Debe seleccionar un modelo'),
  activo: z.boolean().optional().default(true),
});

export const updateProductoSchema = createProductoSchema.partial();

export type CreateProductoInput = z.infer<typeof createProductoSchema>;
export type UpdateProductoInput = z.infer<typeof updateProductoSchema>;
