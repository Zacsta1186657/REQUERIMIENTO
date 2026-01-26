import { create } from 'zustand';

export interface Operacion {
  id: string;
  nombre: string;
  codigo: string;
}

export interface CentroCosto {
  id: string;
  nombre: string;
  codigo: string;
}

export interface Categoria {
  id: string;
  nombre: string;
}

export interface UnidadMedida {
  id: string;
  nombre: string;
  abreviatura: string;
}

export interface Producto {
  id: string;
  numeroParte: string | null;
  descripcion: string;
  marca: string | null;
  modelo: string | null;
  categoriaId: string;
  unidadMedidaId: string;
  categoria: Categoria;
  unidadMedida: UnidadMedida;
}

interface CatalogosState {
  operaciones: Operacion[];
  centrosCosto: CentroCosto[];
  categorias: Categoria[];
  unidadesMedida: UnidadMedida[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  fetchCatalogos: () => Promise<void>;
  fetchOperaciones: () => Promise<void>;
  fetchCentrosCosto: () => Promise<void>;
  fetchCategorias: () => Promise<void>;
  fetchUnidadesMedida: () => Promise<void>;
}

export const useCatalogosStore = create<CatalogosState>((set, get) => ({
  operaciones: [],
  centrosCosto: [],
  categorias: [],
  unidadesMedida: [],
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchCatalogos: async () => {
    if (get().isLoaded) return;

    set({ isLoading: true, error: null });

    try {
      const [operaciones, centrosCosto, categorias, unidadesMedida] = await Promise.all([
        fetch('/api/catalogos/operaciones').then((r) => r.json()),
        fetch('/api/catalogos/centros-costo').then((r) => r.json()),
        fetch('/api/catalogos/categorias').then((r) => r.json()),
        fetch('/api/catalogos/unidades-medida').then((r) => r.json()),
      ]);

      set({
        operaciones: operaciones.data || [],
        centrosCosto: centrosCosto.data || [],
        categorias: categorias.data || [],
        unidadesMedida: unidadesMedida.data || [],
        isLoading: false,
        isLoaded: true,
      });
    } catch (error) {
      console.error('Fetch catalogos error:', error);
      set({ error: 'Error al cargar catálogos', isLoading: false });
    }
  },

  fetchOperaciones: async () => {
    try {
      const response = await fetch('/api/catalogos/operaciones');
      const data = await response.json();
      set({ operaciones: data.data || [] });
    } catch (error) {
      console.error('Fetch operaciones error:', error);
    }
  },

  fetchCentrosCosto: async () => {
    try {
      const response = await fetch('/api/catalogos/centros-costo');
      const data = await response.json();
      set({ centrosCosto: data.data || [] });
    } catch (error) {
      console.error('Fetch centros costo error:', error);
    }
  },

  fetchCategorias: async () => {
    try {
      const response = await fetch('/api/catalogos/categorias');
      const data = await response.json();
      set({ categorias: data.data || [] });
    } catch (error) {
      console.error('Fetch categorias error:', error);
    }
  },

  fetchUnidadesMedida: async () => {
    try {
      const response = await fetch('/api/catalogos/unidades-medida');
      const data = await response.json();
      set({ unidadesMedida: data.data || [] });
    } catch (error) {
      console.error('Fetch unidades medida error:', error);
    }
  },
}));

// Selector hooks
export const useOperaciones = () => useCatalogosStore((state) => state.operaciones);
export const useCentrosCosto = () => useCatalogosStore((state) => state.centrosCosto);
export const useCategorias = () => useCatalogosStore((state) => state.categorias);
export const useUnidadesMedida = () => useCatalogosStore((state) => state.unidadesMedida);
