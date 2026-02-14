import api from './api';
import type { 
  Devolucion, 
  FacturaParaDevolucion, 
  CreateDevolucionDTO,
  EstadisticasDevoluciones 
} from '../types/facturacion';

export const devolucionService = {
  /**
   * Obtener todas las devoluciones
   */
  async findAll(filters?: {
    facturaId?: number;
    estado?: string;
    fechaInicio?: string;
    fechaFin?: string;
  }): Promise<Devolucion[]> {
    const params = new URLSearchParams();
    if (filters?.facturaId) params.append('facturaId', filters.facturaId.toString());
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
    if (filters?.fechaFin) params.append('fechaFin', filters.fechaFin);
    
    const response = await api.get(`/devoluciones?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtener una devolución por ID
   */
  async findById(id: number): Promise<Devolucion> {
    const response = await api.get(`/devoluciones/${id}`);
    return response.data;
  },

  /**
   * Obtener factura para devolución (con cantidades disponibles)
   */
  async getFacturaParaDevolucion(facturaId: number): Promise<FacturaParaDevolucion> {
    const response = await api.get(`/devoluciones/factura/${facturaId}`);
    return response.data;
  },

  /**
   * Crear una nueva devolución
   */
  async create(data: CreateDevolucionDTO): Promise<Devolucion> {
    const response = await api.post('/devoluciones', data);
    return response.data;
  },

  /**
   * Actualizar estado de una devolución
   */
  async updateEstado(id: number, estado: 'pendiente' | 'aprobada' | 'rechazada'): Promise<Devolucion> {
    const response = await api.patch(`/devoluciones/${id}/estado`, { estado });
    return response.data;
  },

  /**
   * Obtener estadísticas de devoluciones
   */
  async getEstadisticas(fechaInicio?: string, fechaFin?: string): Promise<EstadisticasDevoluciones> {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    const response = await api.get(`/devoluciones/estadisticas?${params.toString()}`);
    return response.data;
  },
};
