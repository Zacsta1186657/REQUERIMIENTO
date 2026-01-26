import type { RequerimientoStatus, UserRole } from '@/types';

export interface StateTransition {
  from: RequerimientoStatus;
  to: RequerimientoStatus;
  action: 'submit' | 'approve' | 'reject' | 'process' | 'dispatch' | 'deliver';
  allowedRoles: UserRole[];
  requiresComment?: boolean;
}

export const STATE_TRANSITIONS: StateTransition[] = [
  // Submit draft -> goes directly to Security validation
  {
    from: 'BORRADOR',
    to: 'VALIDACION_SEGURIDAD',
    action: 'submit',
    allowedRoles: ['TECNICO', 'ADMIN', 'ADMINISTRACION'],
  },

  // Security validation -> approve goes to Management validation
  {
    from: 'VALIDACION_SEGURIDAD',
    to: 'VALIDACION_GERENCIA',
    action: 'approve',
    allowedRoles: ['SEGURIDAD', 'ADMIN'],
  },
  {
    from: 'VALIDACION_SEGURIDAD',
    to: 'RECHAZADO_SEGURIDAD',
    action: 'reject',
    allowedRoles: ['SEGURIDAD', 'ADMIN'],
    requiresComment: true,
  },

  // Management validation -> approve goes to Logistics review
  {
    from: 'VALIDACION_GERENCIA',
    to: 'REVISION_LOGISTICA',
    action: 'approve',
    allowedRoles: ['GERENCIA', 'ADMIN'],
  },
  {
    from: 'VALIDACION_GERENCIA',
    to: 'RECHAZADO_GERENCIA',
    action: 'reject',
    allowedRoles: ['GERENCIA', 'ADMIN'],
    requiresComment: true,
  },

  // Logistics review decisions
  {
    from: 'REVISION_LOGISTICA',
    to: 'EN_COMPRA',
    action: 'process',
    allowedRoles: ['LOGISTICA', 'ADMIN'],
  },
  {
    from: 'REVISION_LOGISTICA',
    to: 'LISTO_DESPACHO',
    action: 'process',
    allowedRoles: ['LOGISTICA', 'ADMIN'],
  },

  // Purchase approval
  {
    from: 'EN_COMPRA',
    to: 'LISTO_DESPACHO',
    action: 'approve',
    allowedRoles: ['ADMINISTRACION', 'ADMIN'],
  },
  {
    from: 'EN_COMPRA',
    to: 'RECHAZADO_ADM',
    action: 'reject',
    allowedRoles: ['ADMINISTRACION', 'ADMIN'],
    requiresComment: true,
  },

  // Dispatch
  {
    from: 'LISTO_DESPACHO',
    to: 'ENVIADO',
    action: 'dispatch',
    allowedRoles: ['LOGISTICA', 'ADMIN'],
  },

  // Delivery
  {
    from: 'ENVIADO',
    to: 'ENTREGADO_PARCIAL',
    action: 'deliver',
    allowedRoles: ['RECEPTOR', 'LOGISTICA', 'ADMIN'],
  },
  {
    from: 'ENVIADO',
    to: 'ENTREGADO',
    action: 'deliver',
    allowedRoles: ['RECEPTOR', 'LOGISTICA', 'ADMIN'],
  },
  {
    from: 'ENTREGADO_PARCIAL',
    to: 'ENTREGADO',
    action: 'deliver',
    allowedRoles: ['RECEPTOR', 'LOGISTICA', 'ADMIN'],
  },
];

export function getAvailableTransitions(
  currentStatus: RequerimientoStatus,
  userRole: UserRole
): StateTransition[] {
  return STATE_TRANSITIONS.filter(
    (t) => t.from === currentStatus && t.allowedRoles.includes(userRole)
  );
}

export function canTransition(
  currentStatus: RequerimientoStatus,
  targetStatus: RequerimientoStatus,
  userRole: UserRole
): StateTransition | null {
  return (
    STATE_TRANSITIONS.find(
      (t) =>
        t.from === currentStatus &&
        t.to === targetStatus &&
        t.allowedRoles.includes(userRole)
    ) || null
  );
}

export function getNextStatus(
  currentStatus: RequerimientoStatus,
  action: StateTransition['action'],
  userRole: UserRole
): RequerimientoStatus | null {
  const transition = STATE_TRANSITIONS.find(
    (t) =>
      t.from === currentStatus &&
      t.action === action &&
      t.allowedRoles.includes(userRole)
  );
  return transition?.to || null;
}

export function isTerminalStatus(status: RequerimientoStatus): boolean {
  return [
    'RECHAZADO_SEGURIDAD',
    'RECHAZADO_GERENCIA',
    'RECHAZADO_ADM',
    'ENTREGADO',
  ].includes(status);
}

export function isPendingApproval(status: RequerimientoStatus): boolean {
  return [
    'VALIDACION_SEGURIDAD',
    'VALIDACION_GERENCIA',
    'EN_COMPRA',
  ].includes(status);
}
