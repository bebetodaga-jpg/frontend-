import api from './api';
import type { 
  Producto, 
  CreateProductoDTO, 
  UpdateProductoDTO, 
  Categoria,
  CreateCategoriaDTO,
  UpdateCategoriaDTO,
  Proveedor,
  CreateProveedorDTO,
  UpdateProveedorDTO,
  MovimientoStock,
  MovimientoInventario,
  FiltrosProducto,
  EstadisticasInventario,
  PaginatedResponse,
} from '../types/inventario';

// ===== PRODUCTOS =====

export const productoService = {
  getAll: async (search?: string): Promise<Producto[]> => {
    const params = search ? { search } : {};
    const response = await api.get('/productos', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Producto> => {
    const response = await api.get(`/productos/${id}`);
    return response.data;
  },

  getByCodigo: async (codigo: string): Promise<Producto> => {
    const response = await api.get(`/productos/codigo/${codigo}`);
    return response.data;
  },

  create: async (data: CreateProductoDTO): Promise<Producto> => {
    const response = await api.post('/productos', data);
    return response.data;
  },

  update: async (id: number, data: UpdateProductoDTO): Promise<Producto> => {
    const response = await api.put(`/productos/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/productos/${id}`);
  },

  getLowStock: async (): Promise<Producto[]> => {
    const response = await api.get('/productos/stock/bajo');
    return response.data;
  },

  updateStock: async (id: number, movimiento: MovimientoStock): Promise<Producto> => {
    const response = await api.post(`/productos/${id}/stock`, movimiento);
    return response.data;
  },

  getByCategoria: async (categoriaId: number): Promise<Producto[]> => {
    const response = await api.get(`/productos/categoria/${categoriaId}`);
    return response.data;
  },

  getWithFilters: async (filtros: FiltrosProducto): Promise<Producto[]> => {
    const response = await api.get('/productos/filtros', { params: filtros });
    return response.data;
  },

  getEstadisticas: async (): Promise<EstadisticasInventario> => {
    const response = await api.get('/productos/estadisticas');
    return response.data;
  },

  exportar: async (): Promise<any[]> => {
    const response = await api.get('/productos/exportar');
    return response.data;
  },

  importar: async (productos: any[]): Promise<{ creados: number; actualizados: number; errores: string[] }> => {
    const response = await api.post('/productos/importar', { productos });
    return response.data;
  },
};

// ===== CATEGORÍAS =====

export const categoriaService = {
  getAll: async (): Promise<Categoria[]> => {
    const response = await api.get('/categorias');
    return response.data;
  },

  getById: async (id: number): Promise<Categoria> => {
    const response = await api.get(`/categorias/${id}`);
    return response.data;
  },

  create: async (data: CreateCategoriaDTO): Promise<Categoria> => {
    const response = await api.post('/categorias', data);
    return response.data;
  },

  update: async (id: number, data: UpdateCategoriaDTO): Promise<Categoria> => {
    const response = await api.put(`/categorias/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/categorias/${id}`);
  },
};

// ===== PROVEEDORES =====

export const proveedorService = {
  getAll: async (search?: string): Promise<Proveedor[]> => {
    const params = search ? { search } : {};
    const response = await api.get('/proveedores', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Proveedor> => {
    const response = await api.get(`/proveedores/${id}`);
    return response.data;
  },

  create: async (data: CreateProveedorDTO): Promise<Proveedor> => {
    const response = await api.post('/proveedores', data);
    return response.data;
  },

  update: async (id: number, data: UpdateProveedorDTO): Promise<Proveedor> => {
    const response = await api.put(`/proveedores/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/proveedores/${id}`);
  },
};

// ===== MOVIMIENTOS =====

export const movimientoService = {
  getAll: async (params?: {
    productoId?: number;
    tipo?: 'entrada' | 'salida';
    fechaInicio?: string;
    fechaFin?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<MovimientoInventario>> => {
    const response = await api.get('/movimientos', { params });
    return response.data;
  },

  getByProducto: async (productoId: number): Promise<MovimientoInventario[]> => {
    const response = await api.get(`/movimientos/producto/${productoId}`);
    return response.data;
  },

  getResumen: async (fechaInicio?: string, fechaFin?: string) => {
    const response = await api.get('/movimientos/resumen', { params: { fechaInicio, fechaFin } });
    return response.data;
  },
};
