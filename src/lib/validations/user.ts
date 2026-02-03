import { z } from 'zod';

const userRoles = [
  'TECNICO',
  'SEGURIDAD',
  'OPERACIONES',
  'GERENCIA',
  'LOGISTICA',
  'ADMINISTRACION',
  'RECEPTOR',
  'ADMIN',
] as const;

export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Correo electrónico inválido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres'),
  rol: z.enum(userRoles, { message: 'Rol inválido' }),
  operacionId: z.string().nullable().optional(),
  activo: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
  email: z
    .string()
    .email('Correo electrónico inválido')
    .optional(),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .optional(),
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .optional(),
  rol: z.enum(userRoles, { message: 'Rol inválido' }).optional(),
  operacionId: z.string().nullable().optional(),
  activo: z.boolean().optional(),
  avatar: z.string().nullable().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
