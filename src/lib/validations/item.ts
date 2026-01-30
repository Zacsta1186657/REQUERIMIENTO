import { z } from 'zod';

export const createItemSchema = z.object({
  categoriaId: z.string().min(1, 'La categoría es requerida'),
  unidadMedidaId: z.string().min(1, 'La unidad de medida es requerida'),
  cantidadSolicitada: z.number().int().positive('La cantidad debe ser mayor a 0'),
  numeroParte: z.string().min(1, 'El número de parte es requerido'),
  marca: z.string().min(1, 'La marca es requerida'),
  modelo: z.string().min(1, 'El modelo es requerido'),
  productoId: z.string().optional().nullable(),
});

export const updateItemSchema = z.object({
  categoriaId: z.string().min(1, 'La categoría es requerida').optional(),
  unidadMedidaId: z.string().min(1, 'La unidad de medida es requerida').optional(),
  cantidadSolicitada: z.number().int().positive('La cantidad debe ser mayor a 0').optional(),
  cantidadAprobada: z.number().int().min(0, 'La cantidad aprobada no puede ser negativa').optional(),
  numeroParte: z.string().optional().nullable(),
  marca: z.string().optional().nullable(),
  modelo: z.string().optional().nullable(),
  enStock: z.boolean().optional(),
  requiereCompra: z.boolean().optional(),
  motivoStock: z.string().optional().nullable(),
  fechaEstimadaCompra: z.string().optional().nullable(),
});

export const stockMarkingSchema = z.object({
  enStock: z.boolean(),
  requiereCompra: z.boolean(),
  motivoStock: z.string().optional(),
  fechaEstimadaCompra: z.string().optional().nullable(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type StockMarkingInput = z.infer<typeof stockMarkingSchema>;
