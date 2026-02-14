// Tipos para el módulo de inventario

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    productos: number;
  };
}

export interface Proveedor {
  id: number;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    productos: number;
  };
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  precioCompra: number;
  precioVenta: number;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: string;
  categoriaId?: number;
  proveedorId?: number;
  createdAt: string;
  updatedAt: string;
  categoria?: Categoria;
  proveedor?: Proveedor;
}

export interface MovimientoInventario {
  id: number;
  productoId: number;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  motivo?: string;
  createdAt: string;
  producto?: {
    id: number;
    codigo: string;
    nombre: string;
  };
}

export interface CreateProductoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  precioCompra: number;
  precioVenta: number;
  stockActual?: number;
  stockMinimo?: number;
  unidadMedida?: string;
  categoriaId?: number;
  proveedorId?: number;
}

export interface UpdateProductoDTO extends Partial<CreateProductoDTO> {}

export interface CreateCategoriaDTO {
  nombre: string;
  descripcion?: string;
}

export interface UpdateCategoriaDTO extends Partial<CreateCategoriaDTO> {}

export interface CreateProveedorDTO {
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export interface UpdateProveedorDTO extends Partial<CreateProveedorDTO> {}

export interface MovimientoStock {
  cantidad: number;
  tipo: 'entrada' | 'salida';
  motivo?: string;
}

export interface FiltrosProducto {
  search?: string;
  categoriaId?: number;
  proveedorId?: number;
  precioMin?: number;
  precioMax?: number;
  stockBajo?: boolean;
  orderBy?: 'nombre' | 'precio' | 'stock' | 'fecha';
  orderDir?: 'asc' | 'desc';
}

export interface EstadisticasInventario {
  totalProductos: number;
  totalCategorias: number;
  productosStockBajo: number;
  valorInventario: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
