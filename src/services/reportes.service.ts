import api from './api';

export interface VentasPorPeriodo {
  facturas: any[];
  resumen: {
    totalVentas: number;
    totalDescuentos: number;
    cantidadFacturas: number;
    promedioVenta: number;
  };
}

export interface ProductoMasVendido {
  producto: {
    id: number;
    codigo: string;
    nombre: string;
    categoria: { nombre: string } | null;
  };
  cantidadVendida: number;
  totalVentas: number;
}

export interface VentaMetodoPago {
  metodoPago: string;
  total: number;
  cantidad: number;
}

export interface ClienteTop {
  cliente: {
    id: number;
    nombre: string;
    documento: string;
  };
  totalCompras: number;
  cantidadCompras: number;
}

export interface VentaCategoria {
  nombre: string;
  total: number;
  cantidad: number;
}

export interface ReporteInventario {
  productos: any[];
  resumen: {
    totalProductos: number;
    productosStockBajo: number;
    productosSinStock: number;
    valorInventario: number;
    costoInventario: number;
    gananciaPotencial: number;
  };
}

export interface MovimientoInventario {
  movimientos: any[];
  resumen: {
    totalEntradas: number;
    totalSalidas: number;
    totalMovimientos: number;
  };
}

export interface VentaPorHora {
  hora: number;
  total: number;
  cantidad: number;
}

export interface ComparativaPeriodos {
  periodoActual: {
    fechaInicio: string;
    fechaFin: string;
    totalVentas: number;
    cantidadFacturas: number;
  };
  periodoAnterior: {
    fechaInicio: string;
    fechaFin: string;
    totalVentas: number;
    cantidadFacturas: number;
  };
  variacionPorcentaje: number;
}

export const reportesService = {
  // Ventas por período
  async getVentasPorPeriodo(fechaInicio: string, fechaFin: string): Promise<VentasPorPeriodo> {
    const response = await api.get('/reportes/ventas/periodo', {
      params: { fechaInicio, fechaFin },
    });
    return response.data;
  },

  // Productos más vendidos
  async getProductosMasVendidos(
    limite?: number,
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<ProductoMasVendido[]> {
    const response = await api.get('/reportes/productos/mas-vendidos', {
      params: { limite, fechaInicio, fechaFin },
    });
    return response.data;
  },

  // Ventas por método de pago
  async getVentasPorMetodoPago(fechaInicio?: string, fechaFin?: string): Promise<VentaMetodoPago[]> {
    const response = await api.get('/reportes/ventas/metodo-pago', {
      params: { fechaInicio, fechaFin },
    });
    return response.data;
  },

  // Clientes top
  async getClientesTop(
    limite?: number,
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<ClienteTop[]> {
    const response = await api.get('/reportes/clientes/top', {
      params: { limite, fechaInicio, fechaFin },
    });
    return response.data;
  },

  // Ventas por categoría
  async getVentasPorCategoria(fechaInicio?: string, fechaFin?: string): Promise<VentaCategoria[]> {
    const response = await api.get('/reportes/ventas/por-categoria', {
      params: { fechaInicio, fechaFin },
    });
    return response.data;
  },

  // Reporte de inventario
  async getReporteInventario(): Promise<ReporteInventario> {
    const response = await api.get('/reportes/inventario');
    return response.data;
  },

  // Movimientos de inventario
  async getMovimientosInventario(
    fechaInicio?: string,
    fechaFin?: string,
    productoId?: number
  ): Promise<MovimientoInventario> {
    const response = await api.get('/reportes/inventario/movimientos', {
      params: { fechaInicio, fechaFin, productoId },
    });
    return response.data;
  },

  // Ventas por hora
  async getVentasPorHora(fecha?: string): Promise<VentaPorHora[]> {
    const response = await api.get('/reportes/ventas/por-hora', {
      params: { fecha },
    });
    return response.data;
  },

  // Comparativa de períodos
  async getComparativaPeriodos(fechaInicio: string, fechaFin: string): Promise<ComparativaPeriodos> {
    const response = await api.get('/reportes/ventas/comparativa', {
      params: { fechaInicio, fechaFin },
    });
    return response.data;
  },
};
