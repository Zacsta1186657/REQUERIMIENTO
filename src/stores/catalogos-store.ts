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
  activo?: boolean;
}

export interface UnidadMedida {
  id: string;
  nombre: string;
  abreviatura: string;
}

export interface Marca {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface Modelo {
  id: string;
  nombre: string;
  marcaId: string;
  marca: Marca;
  activo: boolean;
}

export interface Producto {
  id: string;
  numeroParte: string | null;
  descripcion: string;
  categoriaId: string;
  marcaId: string;
  modeloId: string;
  categoria: Categoria;
  marca: Marca;
  modelo: Modelo;
  activo?: boolean;
}

interface CatalogosState {
  operaciones: Operacion[];
  centrosCosto: CentroCosto[];
  categorias: Categoria[];
  unidadesMedida: UnidadMedida[];
  marcas: Marca[];
  modelos: Modelo[];
  productos: Producto[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  fetchCatalogos: () => Promise<void>;
  fetchOperaciones: () => Promise<void>;
  fetchCentrosCosto: () => Promise<void>;
  fetchCategorias: () => Promise<void>;
  fetchUnidadesMedida: () => Promise<void>;
  fetchMarcas: () => Promise<void>;
  fetchModelos: (marcaId?: string) => Promise<void>;
  fetchProductos: () => Promise<void>;
}

export const useCatalogosStore = create<CatalogosState>((set, get) => ({
  operaciones: [],
  centrosCosto: [],
  categorias: [],
  unidadesMedida: [],
  marcas: [],
  modelos: [],
  productos: [],
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

  fetchMarcas: async () => {
    try {
      const response = await fetch('/api/catalogos/marcas?limit=1000&activo=true');
      const data = await response.json();
      set({ marcas: data.data || [] });
    } catch (error) {
      console.error('Fetch marcas error:', error);
    }
  },

  fetchModelos: async (marcaId?: string) => {
    try {
      const url = marcaId
        ? `/api/catalogos/modelos?marcaId=${marcaId}&limit=1000&activo=true`
        : '/api/catalogos/modelos?limit=1000&activo=true';
      const response = await fetch(url);
      const data = await response.json();
      set({ modelos: data.data || [] });
    } catch (error) {
      console.error('Fetch modelos error:', error);
    }
  },

  fetchProductos: async () => {
    try {
      const response = await fetch('/api/catalogos/productos?limit=1000&activo=true');
      const data = await response.json();
      set({ productos: data.data || [] });
    } catch (error) {
      console.error('Fetch productos error:', error);
    }
  },
}));

// Selector hooks
export const useOperaciones = () => useCatalogosStore((state) => state.operaciones);
export const useCentrosCosto = () => useCatalogosStore((state) => state.centrosCosto);
export const useCategorias = () => useCatalogosStore((state) => state.categorias);
export const useUnidadesMedida = () => useCatalogosStore((state) => state.unidadesMedida);
export const useMarcas = () => useCatalogosStore((state) => state.marcas);
export const useModelos = () => useCatalogosStore((state) => state.modelos);
export const useProductos = () => useCatalogosStore((state) => state.productos);
