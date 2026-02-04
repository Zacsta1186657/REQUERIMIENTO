import { create } from 'zustand';
import type { RequerimientoStatus } from '@/types';

export interface RequerimientoItem {
  id: string;
  numeroParte: string | null;
  descripcion: string;
  marca: string | null;
  modelo: string | null;
  cantidadSolicitada: number;
  cantidadAprobada: number | null;
  serial: string | null;
  enStock: boolean | null;
  requiereCompra: boolean | null;
  motivoStock: string | null;
  fechaEstimadaCompra: string | null;
  validadoCompra: boolean | null;
  observacionCompra: string | null;
  compraRecibida: boolean | null;
  fechaRecepcionCompra: string | null;
  validadoPor: { id: string; nombre: string } | null;
  categoriaId: string;
  unidadMedidaId: string;
  categoria: { id: string; nombre: string };
  unidadMedida: { id: string; nombre: string; abreviatura: string };
}

export interface RequerimientoPermissions {
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

export interface LoteItem {
  id: string;
  cantidadEnviada: number;
  cantidadRecibida: number | null;
  requerimientoItem: RequerimientoItem | null;
}

export interface Lote {
  id: string;
  numero: number;
  estado: string;
  fechaDespacho: string | null;
  fechaEntrega: string | null;
  transportista: string | null;
  destino: string | null;
  observaciones: string | null;
  confirmadoRecepcion: boolean;
  items: LoteItem[];
}

export interface Requerimiento {
  id: string;
  numero: string;
  fecha: string;
  motivo: string;
  comentarios: string | null;
  estado: RequerimientoStatus;
  solicitante: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
  };
  operacion: {
    id: string;
    nombre: string;
    codigo: string;
  };
  centroCosto: {
    id: string;
    nombre: string;
    codigo: string;
  };
  items: RequerimientoItem[];
  lotes?: Lote[];
  _count?: {
    items: number;
    lotes: number;
  };
  permissions?: RequerimientoPermissions;
}

export interface RequerimientoListItem {
  id: string;
  numero: string;
  fecha: string;
  motivo: string;
  estado: RequerimientoStatus;
  solicitante: {
    id: string;
    nombre: string;
  };
  operacion: {
    nombre: string;
  };
  centroCosto: {
    nombre: string;
  };
  _count: {
    items: number;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Filters {
  estado?: string;
  operacionId?: string;
  centroCostoId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  search?: string;
}

interface RequerimientosState {
  requerimientos: RequerimientoListItem[];
  currentRequerimiento: Requerimiento | null;
  pagination: Pagination | null;
  filters: Filters;
  isLoading: boolean;
  error: string | null;

  setFilters: (filters: Filters) => void;
  clearFilters: () => void;
  fetchRequerimientos: (page?: number) => Promise<void>;
  fetchRequerimiento: (id: string) => Promise<Requerimiento | null>;
  createRequerimiento: (data: {
    operacionId: string;
    centroCostoId: string;
    motivo: string;
    comentarios?: string;
  }) => Promise<Requerimiento | null>;
  updateRequerimiento: (
    id: string,
    data: Partial<{
      operacionId: string;
      centroCostoId: string;
      motivo: string;
      comentarios: string;
    }>
  ) => Promise<boolean>;
  deleteRequerimiento: (id: string) => Promise<boolean>;
  submitRequerimiento: (id: string) => Promise<boolean>;
  approveRequerimiento: (id: string, comentario?: string) => Promise<boolean>;
  rejectRequerimiento: (id: string, comentario: string) => Promise<boolean>;
  clearCurrentRequerimiento: () => void;
}

export const useRequerimientosStore = create<RequerimientosState>((set, get) => ({
  requerimientos: [],
  currentRequerimiento: null,
  pagination: null,
  filters: {},
  isLoading: false,
  error: null,

  setFilters: (filters) => {
    set({ filters });
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  fetchRequerimientos: async (page = 1) => {
    set({ isLoading: true, error: null });

    try {
      const { filters } = get();
      const params = new URLSearchParams({ page: page.toString(), limit: '10' });

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const response = await fetch(`/api/requerimientos?${params}`);

      if (!response.ok) {
        throw new Error('Error al cargar requerimientos');
      }

      const data = await response.json();
      set({
        requerimientos: data.data,
        pagination: data.pagination,
        isLoading: false,
      });
    } catch (error) {
      console.error('Fetch requerimientos error:', error);
      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        isLoading: false,
      });
    }
  },

  fetchRequerimiento: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/requerimientos/${id}`);

      if (!response.ok) {
        throw new Error('Error al cargar requerimiento');
      }

      const data = await response.json();
      set({ currentRequerimiento: data, isLoading: false });
      return data;
    } catch (error) {
      console.error('Fetch requerimiento error:', error);
      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        isLoading: false,
        currentRequerimiento: null,
      });
      return null;
    }
  },

  createRequerimiento: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/requerimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear requerimiento');
      }

      const newRequerimiento = await response.json();
      set({ isLoading: false });
      return newRequerimiento;
    } catch (error) {
      console.error('Create requerimiento error:', error);
      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        isLoading: false,
      });
      return null;
    }
  },

  updateRequerimiento: async (id, data) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/requerimientos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar requerimiento');
      }

      const updated = await response.json();
      set({ currentRequerimiento: updated, isLoading: false });
      return true;
    } catch (error) {
      console.error('Update requerimiento error:', error);
      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        isLoading: false,
      });
      return false;
    }
  },

  deleteRequerimiento: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/requerimientos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar requerimiento');
      }

      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error('Delete requerimiento error:', error);
      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        isLoading: false,
      });
      return false;
    }
  },

  submitRequerimiento: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/requerimientos/${id}/submit`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar requerimiento');
      }

      const updated = await response.json();
      set({ currentRequerimiento: updated, isLoading: false });
      return true;
    } catch (error) {
      console.error('Submit requerimiento error:', error);
      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        isLoading: false,
      });
      return false;
    }
  },

  approveRequerimiento: async (id, comentario) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/requerimientos/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comentario }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al aprobar requerimiento');
      }

      const updated = await response.json();
      set({ currentRequerimiento: updated, isLoading: false });
      return true;
    } catch (error) {
      console.error('Approve requerimiento error:', error);
      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        isLoading: false,
      });
      return false;
    }
  },

  rejectRequerimiento: async (id, comentario) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/requerimientos/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comentario }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al rechazar requerimiento');
      }

      const updated = await response.json();
      set({ currentRequerimiento: updated, isLoading: false });
      return true;
    } catch (error) {
      console.error('Reject requerimiento error:', error);
      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        isLoading: false,
      });
      return false;
    }
  },

  clearCurrentRequerimiento: () => {
    set({ currentRequerimiento: null });
  },
}));
