import type { RequerimientoStatus, UserRole } from '@/types';

export interface PermissionConfig {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canReject: boolean;
  canAddItems: boolean;
  canEditItems: boolean;
  canDeleteItems: boolean;
  canMarkStock: boolean;
  canValidatePurchase: boolean;
  canCreateLote: boolean;
  canDispatch: boolean;
  canConfirmDelivery: boolean;
  canConfirmPurchaseReceived: boolean;
}

const DEFAULT_PERMISSIONS: PermissionConfig = {
  canView: true,
  canEdit: false,
  canDelete: false,
  canApprove: false,
  canReject: false,
  canAddItems: false,
  canEditItems: false,
  canDeleteItems: false,
  canMarkStock: false,
  canValidatePurchase: false,
  canCreateLote: false,
  canDispatch: false,
  canConfirmDelivery: false,
  canConfirmPurchaseReceived: false,
};

export function getPermissions(
  status: RequerimientoStatus,
  userRole: UserRole,
  isOwner: boolean
): PermissionConfig {
  const permissions = { ...DEFAULT_PERMISSIONS };

  // Admin has most permissions
  if (userRole === 'ADMIN') {
    return {
      ...permissions,
      canView: true,
      canEdit: status === 'BORRADOR',
      canDelete: status === 'BORRADOR',
      canApprove: ['VALIDACION_SEGURIDAD', 'VALIDACION_GERENCIA', 'EN_COMPRA'].includes(status),
      canReject: ['VALIDACION_SEGURIDAD', 'VALIDACION_GERENCIA', 'EN_COMPRA'].includes(status),
      canAddItems: status === 'BORRADOR',
      canEditItems: status === 'BORRADOR' || status === 'REVISION_LOGISTICA',
      canDeleteItems: status === 'BORRADOR',
      canMarkStock: status === 'REVISION_LOGISTICA',
      canValidatePurchase: status === 'EN_COMPRA',
      // Permitir crear lotes y despachar en más estados - el control real es a nivel de item
      canCreateLote: ['REVISION_LOGISTICA', 'LISTO_DESPACHO', 'EN_COMPRA', 'APROBADO_ADM', 'ENVIADO', 'ENTREGADO_PARCIAL'].includes(status),
      canDispatch: ['REVISION_LOGISTICA', 'LISTO_DESPACHO', 'EN_COMPRA', 'APROBADO_ADM', 'ENVIADO', 'ENTREGADO_PARCIAL'].includes(status),
      canConfirmDelivery: ['ENVIADO', 'ENTREGADO_PARCIAL'].includes(status),
      canConfirmPurchaseReceived: ['REVISION_LOGISTICA', 'LISTO_DESPACHO', 'EN_COMPRA', 'APROBADO_ADM'].includes(status),
    };
  }

  // Owner (TECNICO) permissions
  if (isOwner && status === 'BORRADOR') {
    permissions.canEdit = true;
    permissions.canDelete = true;
    permissions.canAddItems = true;
    permissions.canEditItems = true;
    permissions.canDeleteItems = true;
  }

  // Role-specific permissions
  switch (userRole) {
    case 'SEGURIDAD':
    case 'OPERACIONES':
      if (status === 'VALIDACION_SEGURIDAD') {
        permissions.canApprove = true;
        permissions.canReject = true;
        permissions.canEditItems = true;
        permissions.canDeleteItems = true;
      }
      break;

    case 'GERENCIA':
      if (status === 'VALIDACION_GERENCIA') {
        permissions.canApprove = true;
        permissions.canReject = true;
        permissions.canEditItems = true;
        permissions.canDeleteItems = true;
      }
      break;

    case 'LOGISTICA':
      if (status === 'REVISION_LOGISTICA') {
        permissions.canMarkStock = true;
        permissions.canEditItems = true;
      }
      // IMPORTANTE: Permitir crear lotes y despachar en más estados
      // El control real se hace a nivel de ITEM (estadoItem), no del requerimiento
      // Esto permite despachar items en stock mientras otros están en proceso de compra
      if (['REVISION_LOGISTICA', 'LISTO_DESPACHO', 'EN_COMPRA', 'APROBADO_ADM', 'ENVIADO', 'ENTREGADO_PARCIAL'].includes(status)) {
        permissions.canCreateLote = true;
        permissions.canDispatch = true;
      }
      // LOGISTICA puede confirmar recepción de compras en almacén
      // Debe poder hacerlo en cualquier estado donde haya items con compra aprobada
      if (['REVISION_LOGISTICA', 'LISTO_DESPACHO', 'EN_COMPRA', 'APROBADO_ADM', 'ENVIADO', 'ENTREGADO_PARCIAL'].includes(status)) {
        permissions.canConfirmPurchaseReceived = true;
      }
      break;

    case 'ADMINISTRACION':
      // ADMINISTRACION puede validar compras incluso si algunos items ya fueron despachados
      // El estado del requerimiento puede ser EN_COMPRA, LISTO_DESPACHO, ENVIADO, etc.
      if (['EN_COMPRA', 'LISTO_DESPACHO', 'ENVIADO', 'ENTREGADO_PARCIAL'].includes(status)) {
        permissions.canApprove = true;
        permissions.canReject = true;
        permissions.canValidatePurchase = true;
      }
      break;

    case 'RECEPTOR':
      // IMPORTANTE: El Receptor debe poder confirmar entregas en cualquier requerimiento
      // que tenga lotes despachados, sin importar el estado global del requerimiento.
      // Esto permite confirmar despachos parciales mientras otros items están en compra.
      if (['REVISION_LOGISTICA', 'LISTO_DESPACHO', 'EN_COMPRA', 'APROBADO_ADM', 'ENVIADO', 'ENTREGADO_PARCIAL'].includes(status)) {
        permissions.canConfirmDelivery = true;
      }
      break;
  }

  return permissions;
}

export function canViewRequerimiento(
  userRole: UserRole,
  isOwner: boolean,
  status: RequerimientoStatus
): boolean {
  // Admins can view all
  if (userRole === 'ADMIN' || userRole === 'ADMINISTRACION') return true;

  // Owners can always view their own
  if (isOwner) return true;

  // Role-based visibility
  const visibilityMap: Record<UserRole, RequerimientoStatus[]> = {
    TECNICO: [], // Only own (handled by isOwner)
    SEGURIDAD: [
      'VALIDACION_SEGURIDAD',
      'APROBADO_SEGURIDAD',
      'RECHAZADO_SEGURIDAD',
      'VALIDACION_GERENCIA',
      'APROBADO_GERENCIA',
      'RECHAZADO_GERENCIA',
      'REVISION_LOGISTICA',
      'EN_COMPRA',
      'APROBADO_ADM',
      'RECHAZADO_ADM',
      'LISTO_DESPACHO',
      'ENVIADO',
      'ENTREGADO_PARCIAL',
      'ENTREGADO',
    ],
    OPERACIONES: [
      'VALIDACION_SEGURIDAD',
      'APROBADO_SEGURIDAD',
      'RECHAZADO_SEGURIDAD',
      'VALIDACION_GERENCIA',
      'APROBADO_GERENCIA',
      'RECHAZADO_GERENCIA',
      'REVISION_LOGISTICA',
      'EN_COMPRA',
      'APROBADO_ADM',
      'RECHAZADO_ADM',
      'LISTO_DESPACHO',
      'ENVIADO',
      'ENTREGADO_PARCIAL',
      'ENTREGADO',
    ],
    GERENCIA: [
      'VALIDACION_GERENCIA',
      'APROBADO_GERENCIA',
      'RECHAZADO_GERENCIA',
      'REVISION_LOGISTICA',
      'EN_COMPRA',
      'APROBADO_ADM',
      'RECHAZADO_ADM',
      'LISTO_DESPACHO',
      'ENVIADO',
      'ENTREGADO_PARCIAL',
      'ENTREGADO',
    ],
    LOGISTICA: [
      'APROBADO_GERENCIA',
      'REVISION_LOGISTICA',
      'EN_COMPRA',
      'APROBADO_ADM',
      'RECHAZADO_ADM',
      'LISTO_DESPACHO',
      'ENVIADO',
      'ENTREGADO_PARCIAL',
      'ENTREGADO',
    ],
    ADMINISTRACION: [], // Handled by first check
    // RECEPTOR puede ver requerimientos con despachos, incluso si son parciales
    // mientras otros items están en proceso de compra
    RECEPTOR: [
      'LISTO_DESPACHO',
      'EN_COMPRA',
      'APROBADO_ADM',
      'ENVIADO',
      'ENTREGADO_PARCIAL',
      'ENTREGADO',
    ],
    ADMIN: [], // Handled by first check
  };

  return visibilityMap[userRole]?.includes(status) || false;
}

export function getPendingApprovalStatuses(userRole: UserRole): RequerimientoStatus[] {
  const statusMap: Partial<Record<UserRole, RequerimientoStatus[]>> = {
    SEGURIDAD: ['VALIDACION_SEGURIDAD'],
    OPERACIONES: ['VALIDACION_SEGURIDAD'],
    GERENCIA: ['VALIDACION_GERENCIA'],
    ADMINISTRACION: ['EN_COMPRA'],
    ADMIN: ['VALIDACION_SEGURIDAD', 'VALIDACION_GERENCIA', 'EN_COMPRA'],
    LOGISTICA: ['REVISION_LOGISTICA'],
    RECEPTOR: ['ENVIADO'],
  };

  return statusMap[userRole] || [];
}
