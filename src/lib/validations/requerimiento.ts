import { z } from 'zod';

export const createRequerimientoSchema = z.object({
  operacionId: z.string().min(1, 'La operación es requerida'),
  centroCostoId: z.string().min(1, 'El centro de costo es requerido'),
  motivo: z.string().min(10, 'El motivo debe tener al menos 10 caracteres'),
  comentarios: z.string().optional(),
});

export const updateRequerimientoSchema = z.object({
  operacionId: z.string().min(1, 'La operación es requerida').optional(),
  centroCostoId: z.string().min(1, 'El centro de costo es requerido').optional(),
  motivo: z.string().min(10, 'El motivo debe tener al menos 10 caracteres').optional(),
  comentarios: z.string().optional(),
});

export const requerimientoFiltersSchema = z.object({
  estado: z.string().optional(),
  solicitanteId: z.string().optional(),
  operacionId: z.string().optional(),
  centroCostoId: z.string().optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  search: z.string().optional(),
});

export type CreateRequerimientoInput = z.infer<typeof createRequerimientoSchema>;
export type UpdateRequerimientoInput = z.infer<typeof updateRequerimientoSchema>;
export type RequerimientoFilters = z.infer<typeof requerimientoFiltersSchema>;
