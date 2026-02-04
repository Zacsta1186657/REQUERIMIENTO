import type { UserRole, ItemStatus } from '@/types';

export type { ItemStatus };

// Configuración de cada estado
export const ITEM_STATUS_CONFIG: Record<ItemStatus, {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  PENDIENTE_CLASIFICACION: {
    label: 'Pendiente Clasificación',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    description: 'Esperando que Logística clasifique el ítem',
  },
  EN_STOCK: {
    label: 'En Stock',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    description: 'Disponible en almacén',
  },
  REQUIERE_COMPRA: {
    label: 'Requiere Compra',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    description: 'Marcado para compra por Logística',
  },
  PENDIENTE_VALIDACION_ADMIN: {
    label: 'Pendiente Validación',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    description: 'Esperando validación de Administración',
  },
  APROBADO_COMPRA: {
    label: 'Compra Aprobada',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    description: 'Compra aprobada, esperando recepción en almacén',
  },
  RECHAZADO_COMPRA: {
    label: 'Compra Rechazada',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    description: 'Compra rechazada por Administración',
  },
  LISTO_PARA_DESPACHO: {
    label: 'Listo para Despacho',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    description: 'Disponible para ser despachado',
  },
  DESPACHO_PARCIAL: {
    label: 'Despacho Parcial',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    description: 'Parte de la cantidad ha sido despachada',
  },
  DESPACHADO: {
    label: 'Despachado',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    description: 'Completamente despachado',
  },
};

// Definición de transiciones válidas
interface Transition {
  from: ItemStatus;
  to: ItemStatus;
  allowedRoles: UserRole[];
  action: string;
  description: string;
}

export const ITEM_TRANSITIONS: Transition[] = [
  // Clasificación inicial por Logística
  {
    from: 'PENDIENTE_CLASIFICACION',
    to: 'EN_STOCK',
    allowedRoles: ['LOGISTICA', 'ADMIN'],
    action: 'MARCAR_EN_STOCK',
    description: 'Marcar ítem como disponible en stock',
  },
  {
    from: 'PENDIENTE_CLASIFICACION',
    to: 'REQUIERE_COMPRA',
    allowedRoles: ['LOGISTICA', 'ADMIN'],
    action: 'MARCAR_REQUIERE_COMPRA',
    description: 'Marcar ítem como que requiere compra',
  },

  // Flujo de stock directo
  {
    from: 'EN_STOCK',
    to: 'LISTO_PARA_DESPACHO',
    allowedRoles: ['LOGISTICA', 'ADMIN'],
    action: 'CONFIRMAR_LISTO_DESPACHO',
    description: 'Confirmar que el ítem está listo para despacho',
  },

  // Flujo de compra
  {
    from: 'REQUIERE_COMPRA',
    to: 'PENDIENTE_VALIDACION_ADMIN',
    allowedRoles: ['LOGISTICA', 'ADMIN'],
    action: 'ENVIAR_A_VALIDACION',
    description: 'Enviar a validación de Administración',
  },
  {
    from: 'PENDIENTE_VALIDACION_ADMIN',
    to: 'APROBADO_COMPRA',
    allowedRoles: ['ADMINISTRACION', 'ADMIN'],
    action: 'APROBAR_COMPRA',
    description: 'Aprobar la compra del ítem',
  },
  {
    from: 'PENDIENTE_VALIDACION_ADMIN',
    to: 'RECHAZADO_COMPRA',
    allowedRoles: ['ADMINISTRACION', 'ADMIN'],
    action: 'RECHAZAR_COMPRA',
    description: 'Rechazar la compra del ítem',
  },

  // Recepción de compra en almacén
  {
    from: 'APROBADO_COMPRA',
    to: 'EN_STOCK',
    allowedRoles: ['LOGISTICA', 'ADMIN'],
    action: 'CONFIRMAR_RECEPCION_ALMACEN',
    description: 'Confirmar que el ítem comprado llegó al almacén',
  },

  // Despacho
  {
    from: 'LISTO_PARA_DESPACHO',
    to: 'DESPACHO_PARCIAL',
    allowedRoles: ['LOGISTICA', 'ADMIN'],
    action: 'DESPACHAR_PARCIAL',
    description: 'Despachar parte de la cantidad',
  },
  {
    from: 'LISTO_PARA_DESPACHO',
    to: 'DESPACHADO',
    allowedRoles: ['LOGISTICA', 'ADMIN'],
    action: 'DESPACHAR_COMPLETO',
    description: 'Despachar la cantidad completa',
  },
  {
    from: 'DESPACHO_PARCIAL',
    to: 'DESPACHADO',
    allowedRoles: ['LOGISTICA', 'ADMIN'],
    action: 'COMPLETAR_DESPACHO',
    description: 'Completar el despacho pendiente',
  },

  // Correcciones (solo admin o situaciones especiales)
  {
    from: 'EN_STOCK',
    to: 'PENDIENTE_CLASIFICACION',
    allowedRoles: ['ADMIN'],
    action: 'REVERTIR_CLASIFICACION',
    description: 'Revertir clasificación (solo admin)',
  },
  {
    from: 'REQUIERE_COMPRA',
    to: 'PENDIENTE_CLASIFICACION',
    allowedRoles: ['LOGISTICA', 'ADMIN'],
    action: 'REVERTIR_CLASIFICACION',
    description: 'Revertir clasificación antes de enviar a validación',
  },
  {
    from: 'RECHAZADO_COMPRA',
    to: 'PENDIENTE_CLASIFICACION',
    allowedRoles: ['LOGISTICA', 'ADMIN'],
    action: 'RECLASIFICAR_RECHAZADO',
    description: 'Reclasificar ítem rechazado',
  },
];

/**
 * Verifica si una transición de estado es válida
 */
export function canTransition(
  fromStatus: ItemStatus,
  toStatus: ItemStatus,
  userRole: UserRole
): boolean {
  const transition = ITEM_TRANSITIONS.find(
    t => t.from === fromStatus && t.to === toStatus
  );

  if (!transition) return false;

  return transition.allowedRoles.includes(userRole);
}

/**
 * Obtiene las transiciones disponibles para un estado y rol
 */
export function getAvailableTransitions(
  currentStatus: ItemStatus,
  userRole: UserRole
): Transition[] {
  return ITEM_TRANSITIONS.filter(
    t => t.from === currentStatus && t.allowedRoles.includes(userRole)
  );
}

/**
 * Obtiene el mensaje de error si una transición no es válida
 */
export function getTransitionError(
  fromStatus: ItemStatus,
  toStatus: ItemStatus,
  userRole: UserRole
): string | null {
  const transition = ITEM_TRANSITIONS.find(
    t => t.from === fromStatus && t.to === toStatus
  );

  if (!transition) {
    return `No es posible cambiar de "${ITEM_STATUS_CONFIG[fromStatus].label}" a "${ITEM_STATUS_CONFIG[toStatus].label}"`;
  }

  if (!transition.allowedRoles.includes(userRole)) {
    return `El rol ${userRole} no tiene permiso para esta acción`;
  }

  return null;
}

/**
 * Determina si un ítem está en un estado "despachable"
 */
export function isDispatchable(status: ItemStatus): boolean {
  return status === 'LISTO_PARA_DESPACHO' || status === 'DESPACHO_PARCIAL';
}

/**
 * Determina si un ítem necesita validación de administración
 */
export function needsAdminValidation(status: ItemStatus): boolean {
  return status === 'PENDIENTE_VALIDACION_ADMIN';
}

/**
 * Determina si un ítem está pendiente de recepción en almacén
 */
export function needsWarehouseReception(status: ItemStatus): boolean {
  return status === 'APROBADO_COMPRA';
}

/**
 * Determina si un ítem está completamente procesado
 */
export function isCompleted(status: ItemStatus): boolean {
  return status === 'DESPACHADO';
}

/**
 * Determina si un ítem está en un estado de error/rechazo
 */
export function isRejected(status: ItemStatus): boolean {
  return status === 'RECHAZADO_COMPRA';
}

/**
 * Calcula el estado sugerido del requerimiento basado en los estados de sus ítems
 *
 * Prioridades (de mayor a menor):
 * 1. Si todos están despachados → ENTREGADO
 * 2. Si hay alguno despachado → ENVIADO (permite más despachos y recepciones)
 * 3. Si hay items pendientes de validación admin → EN_COMPRA
 * 4. Si hay items con compra aprobada (esperando recepción) → LISTO_DESPACHO (para que Logística pueda confirmar)
 * 5. Si hay items listos para despacho → LISTO_DESPACHO
 * 6. Si hay items pendientes de clasificación → REVISION_LOGISTICA
 */
export function calculateRequerimientoStatus(itemStatuses: ItemStatus[]): string {
  if (itemStatuses.length === 0) return 'BORRADOR';

  // Si todos están despachados → ENTREGADO
  if (itemStatuses.every(s => s === 'DESPACHADO')) {
    return 'ENTREGADO';
  }

  // Si hay despachos pero no todos completos → ENVIADO
  // Esto permite que Receptor confirme entregas y Logística siga trabajando
  const hasDispatched = itemStatuses.some(s => s === 'DESPACHADO' || s === 'DESPACHO_PARCIAL');
  if (hasDispatched) {
    return 'ENVIADO';
  }

  // Si hay ítems en validación admin → EN_COMPRA
  // Prioridad alta porque Admin debe validar antes de que Logística pueda recibir
  if (itemStatuses.some(s => s === 'PENDIENTE_VALIDACION_ADMIN')) {
    return 'EN_COMPRA';
  }

  // Si hay ítems con compra aprobada esperando recepción en almacén
  // O hay ítems listos para despacho → LISTO_DESPACHO
  // Logística puede confirmar recepciones y crear lotes
  if (itemStatuses.some(s => s === 'APROBADO_COMPRA' || s === 'LISTO_PARA_DESPACHO')) {
    return 'LISTO_DESPACHO';
  }

  // Si hay ítems clasificados pero no enviados a validación → REVISION_LOGISTICA
  if (itemStatuses.some(s => s === 'EN_STOCK' || s === 'REQUIERE_COMPRA')) {
    return 'REVISION_LOGISTICA';
  }

  // Si hay ítems pendientes de clasificación → REVISION_LOGISTICA
  if (itemStatuses.some(s => s === 'PENDIENTE_CLASIFICACION')) {
    return 'REVISION_LOGISTICA';
  }

  // Fallback - si todos están rechazados
  if (itemStatuses.every(s => s === 'RECHAZADO_COMPRA')) {
    return 'RECHAZADO_ADM';
  }

  return 'REVISION_LOGISTICA';
}

/**
 * Agrupa ítems por su estado
 */
export function groupItemsByStatus<T extends { estadoItem: ItemStatus }>(
  items: T[]
): Record<ItemStatus, T[]> {
  const groups: Record<ItemStatus, T[]> = {
    PENDIENTE_CLASIFICACION: [],
    EN_STOCK: [],
    REQUIERE_COMPRA: [],
    PENDIENTE_VALIDACION_ADMIN: [],
    APROBADO_COMPRA: [],
    RECHAZADO_COMPRA: [],
    LISTO_PARA_DESPACHO: [],
    DESPACHO_PARCIAL: [],
    DESPACHADO: [],
  };

  items.forEach(item => {
    if (groups[item.estadoItem]) {
      groups[item.estadoItem].push(item);
    }
  });

  return groups;
}
