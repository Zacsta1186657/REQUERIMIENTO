// ============================================================================
// UI TYPES (safe for client components)
// ============================================================================

// User roles
export type UserRole =
  | 'TECNICO'
  | 'SEGURIDAD'
  | 'OPERACIONES'
  | 'GERENCIA'
  | 'LOGISTICA'
  | 'ADMINISTRACION'
  | 'RECEPTOR'
  | 'ADMIN';

// Requerimiento status
export type RequerimientoStatus =
  | 'BORRADOR'
  | 'CREADO'
  | 'VALIDACION_SEGURIDAD'
  | 'APROBADO_SEGURIDAD'
  | 'RECHAZADO_SEGURIDAD'
  | 'VALIDACION_GERENCIA'
  | 'APROBADO_GERENCIA'
  | 'RECHAZADO_GERENCIA'
  | 'REVISION_LOGISTICA'
  | 'EN_COMPRA'
  | 'APROBADO_ADM'
  | 'RECHAZADO_ADM'
  | 'LISTO_DESPACHO'
  | 'ENVIADO'
  | 'ENTREGADO_PARCIAL'
  | 'ENTREGADO';

// Lote status
export type LoteStatus =
  | 'PENDIENTE'
  | 'PREPARANDO'
  | 'DESPACHADO'
  | 'EN_TRANSITO'
  | 'ENTREGADO';

// Item status (estado individual de cada ítem)
export type ItemStatus =
  | 'PENDIENTE_CLASIFICACION'
  | 'EN_STOCK'
  | 'REQUIERE_COMPRA'
  | 'PENDIENTE_VALIDACION_ADMIN'
  | 'APROBADO_COMPRA'
  | 'RECHAZADO_COMPRA'
  | 'LISTO_PARA_DESPACHO'
  | 'DESPACHO_PARCIAL'
  | 'DESPACHADO';

// Notification type
export type NotificationType =
  | 'REQUERIMIENTO_CREADO'
  | 'APROBACION_PENDIENTE'
  | 'ESTADO_CAMBIO'
  | 'RECHAZADO'
  | 'LISTO_DESPACHO'
  | 'ENTREGADO';

// Item category
export type ItemCategoria = 'EPP' | 'EQUIPO' | 'MATERIAL' | 'HERRAMIENTA' | 'ACCESORIO';

// Unit of measure
export type UnidadMedidaCode = 'UND' | 'PAR' | 'JGO' | 'CJ' | 'KG' | 'M' | 'LT' | 'GL' | 'RLL' | 'BLS';

// ============================================================================
// DISPLAY CONFIGURATION
// ============================================================================

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const STATUS_CONFIG: Record<RequerimientoStatus, StatusConfig> = {
  BORRADOR: {
    label: 'Borrador',
    color: 'text-slate-700 dark:text-slate-300',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    borderColor: 'border-slate-300 dark:border-slate-600',
  },
  CREADO: {
    label: 'Creado',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-300 dark:border-gray-600',
  },
  VALIDACION_SEGURIDAD: {
    label: 'En Validación Seguridad',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-300 dark:border-amber-600',
  },
  APROBADO_SEGURIDAD: {
    label: 'Aprobado Seguridad',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-300 dark:border-green-600',
  },
  RECHAZADO_SEGURIDAD: {
    label: 'Rechazado Seguridad',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-300 dark:border-red-600',
  },
  VALIDACION_GERENCIA: {
    label: 'En Validación Gerencia',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-300 dark:border-orange-600',
  },
  APROBADO_GERENCIA: {
    label: 'Aprobado Gerencia',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-300 dark:border-green-600',
  },
  RECHAZADO_GERENCIA: {
    label: 'Rechazado Gerencia',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-300 dark:border-red-600',
  },
  REVISION_LOGISTICA: {
    label: 'En Revisión Logística',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-300 dark:border-blue-600',
  },
  EN_COMPRA: {
    label: 'En Proceso de Compra',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-300 dark:border-purple-600',
  },
  APROBADO_ADM: {
    label: 'Aprobado Administración',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-300 dark:border-green-600',
  },
  RECHAZADO_ADM: {
    label: 'Rechazado Administración',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-300 dark:border-red-600',
  },
  LISTO_DESPACHO: {
    label: 'Listo para Despacho',
    color: 'text-cyan-700 dark:text-cyan-300',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    borderColor: 'border-cyan-300 dark:border-cyan-600',
  },
  ENVIADO: {
    label: 'Enviado',
    color: 'text-indigo-700 dark:text-indigo-300',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    borderColor: 'border-indigo-300 dark:border-indigo-600',
  },
  ENTREGADO_PARCIAL: {
    label: 'Entregado Parcial',
    color: 'text-teal-700 dark:text-teal-300',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    borderColor: 'border-teal-300 dark:border-teal-600',
  },
  ENTREGADO: {
    label: 'Entregado',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    borderColor: 'border-emerald-300 dark:border-emerald-600',
  },
};

// Role display names
export const ROLE_LABELS: Record<UserRole, string> = {
  TECNICO: 'Técnico',
  SEGURIDAD: 'Seguridad',
  OPERACIONES: 'Operaciones',
  GERENCIA: 'Gerencia',
  LOGISTICA: 'Logística',
  ADMINISTRACION: 'Administración',
  RECEPTOR: 'Receptor',
  ADMIN: 'Administrador',
};

// Roles that can manage users
export const ADMIN_ROLES: UserRole[] = ['ADMIN', 'ADMINISTRACION'];

// Item category labels
export const CATEGORIA_LABELS: Record<ItemCategoria, string> = {
  EPP: 'EPP',
  EQUIPO: 'Equipo',
  MATERIAL: 'Material',
  HERRAMIENTA: 'Herramienta',
  ACCESORIO: 'Accesorio',
};

// Unit of measure labels
export const UNIDAD_LABELS: Record<UnidadMedidaCode, string> = {
  UND: 'Unidad',
  PAR: 'Par',
  JGO: 'Juego',
  CJ: 'Caja',
  KG: 'Kilogramo',
  M: 'Metro',
  LT: 'Litro',
  GL: 'Galón',
  RLL: 'Rollo',
  BLS: 'Bolsa',
};
