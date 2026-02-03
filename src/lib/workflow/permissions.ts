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
  canCreateLote: boolean;
  canDispatch: boolean;
  canConfirmDelivery: boolean;
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
  canCreateLote: false,
  canDispatch: false,
  canConfirmDelivery: false,
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
      canCreateLote: status === 'LISTO_DESPACHO',
      canDispatch: status === 'LISTO_DESPACHO',
      canConfirmDelivery: ['ENVIADO', 'ENTREGADO_PARCIAL'].includes(status),
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
      if (['LISTO_DESPACHO', 'ENVIADO', 'ENTREGADO_PARCIAL'].includes(status)) {
        permissions.canCreateLote = true;
        permissions.canDispatch = true;
      }
      // LOGISTICA solo puede despachar, NO confirmar recepción
      break;

    case 'ADMINISTRACION':
      if (status === 'EN_COMPRA') {
        permissions.canApprove = true;
        permissions.canReject = true;
      }
      break;

    case 'RECEPTOR':
      if (['ENVIADO', 'ENTREGADO_PARCIAL'].includes(status)) {
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
    RECEPTOR: ['ENVIADO', 'ENTREGADO_PARCIAL', 'ENTREGADO'],
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
