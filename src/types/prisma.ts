// ============================================================================
// PRISMA TYPES (only use in server components and API routes)
// ============================================================================

export type {
  User,
  Operacion,
  CentroCosto,
  Categoria,
  UnidadMedida,
  Producto,
  Requerimiento,
  RequerimientoItem,
  Lote,
  LoteItem,
  HistorialEstado,
  ModificacionItem,
  Notificacion,
} from '@prisma/client'

export {
  UserRole,
  RequerimientoStatus,
  LoteStatus,
  NotificationType,
} from '@prisma/client'
