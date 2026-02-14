import api from './api';
import type {
  Empleado,
  CreateEmpleadoDTO,
  UpdateEmpleadoDTO,
  EstadisticasEmpleados,
  RegistroAsistencia,
  ResumenAsistenciaHoy,
  FiltrosAsistencia,
  CamaraStatus,
  CamaraConfig,
  ResumenAsistenciaReporte,
  AsistenciaPorDia,
  AsistenciaPorEmpleado,
  HorasTrabajadas,
  DistribucionMetodo,
} from '../types/personal';

// ===== EMPLEADOS =====

export const empleadoService = {
  getAll: async (search?: string): Promise<Empleado[]> => {
    const params = search ? { search } : {};
    const response = await api.get('/empleados', { params });
    return response.data;
  },

  getActivos: async (): Promise<Empleado[]> => {
    const response = await api.get('/empleados/activos');
    return response.data;
  },

  getById: async (id: number): Promise<Empleado> => {
    const response = await api.get(`/empleados/${id}`);
    return response.data;
  },

  getByCodigo: async (codigo: string): Promise<Empleado> => {
    const response = await api.get(`/empleados/codigo/${codigo}`);
    return response.data;
  },

  create: async (data: CreateEmpleadoDTO): Promise<Empleado> => {
    const response = await api.post('/empleados', data);
    return response.data;
  },

  update: async (id: number, data: UpdateEmpleadoDTO): Promise<Empleado> => {
    const response = await api.put(`/empleados/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/empleados/${id}`);
  },

  toggleActivo: async (id: number): Promise<Empleado> => {
    const response = await api.patch(`/empleados/${id}/toggle`);
    return response.data;
  },

  uploadFoto: async (id: number, file: File): Promise<Empleado> => {
    const formData = new FormData();
    formData.append('foto', file);
    const response = await api.post(`/empleados/${id}/foto`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getEstadisticas: async (): Promise<EstadisticasEmpleados> => {
    const response = await api.get('/empleados/estadisticas');
    return response.data;
  },

  getCargos: async (): Promise<string[]> => {
    const response = await api.get('/empleados/cargos');
    return response.data;
  },
};

// ===== RECONOCIMIENTO FACIAL =====

export const facialService = {
  registrarRostro: async (empleadoId: number, file: File): Promise<{ message: string }> => {
    const formData = new FormData();
    formData.append('imagen', file);
    const response = await api.post(`/facial/registrar/${empleadoId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  verificarRostro: async (empleadoId: number, file: File): Promise<{ match: boolean; confidence: number }> => {
    const formData = new FormData();
    formData.append('imagen', file);
    const response = await api.post(`/facial/verificar/${empleadoId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  identificarEmpleado: async (file: File): Promise<{ empleado: Empleado; confidence: number } | null> => {
    const formData = new FormData();
    formData.append('imagen', file);
    const response = await api.post('/facial/identificar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  eliminarRostro: async (empleadoId: number): Promise<void> => {
    await api.delete(`/facial/${empleadoId}`);
  },

  getEstadoModelos: async (): Promise<{ loaded: boolean; models: string[] }> => {
    const response = await api.get('/facial/modelos');
    return response.data;
  },
};

// ===== ASISTENCIA =====

export const asistenciaService = {
  getAll: async (filtros?: FiltrosAsistencia): Promise<RegistroAsistencia[]> => {
    const response = await api.get('/asistencia', { params: filtros });
    return response.data;
  },

  getHoy: async (): Promise<RegistroAsistencia[]> => {
    const response = await api.get('/asistencia/hoy');
    return response.data;
  },

  getResumenHoy: async (): Promise<ResumenAsistenciaHoy> => {
    const response = await api.get('/asistencia/resumen');
    return response.data;
  },

  registrarManual: async (
    empleadoId: number,
    tipo: 'entrada' | 'salida',
    observacion?: string
  ): Promise<RegistroAsistencia> => {
    const response = await api.post('/asistencia/manual', {
      empleadoId,
      tipo,
      observacion,
    });
    return response.data;
  },

  marcarAsistencia: async (file: File): Promise<RegistroAsistencia> => {
    const formData = new FormData();
    formData.append('imagen', file);
    const response = await api.post('/asistencia/marcar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getAsistenciaEmpleado: async (
    empleadoId: number,
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<RegistroAsistencia[]> => {
    const response = await api.get(`/asistencia/empleado/${empleadoId}`, {
      params: { fechaInicio, fechaFin },
    });
    return response.data;
  },
};

// ===== CÁMARA =====

export const camaraService = {
  getStatus: async (): Promise<CamaraStatus> => {
    const response = await api.get('/camara/status');
    return response.data;
  },

  getConfig: async (): Promise<CamaraConfig> => {
    const response = await api.get('/camara/config');
    return response.data;
  },

  updateConfig: async (config: CamaraConfig): Promise<CamaraConfig> => {
    const response = await api.put('/camara/config', config);
    return response.data;
  },

  testConnection: async (url: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/camara/test', { url });
    return response.data;
  },

  start: async (): Promise<{ message: string }> => {
    const response = await api.post('/camara/start');
    return response.data;
  },

  stop: async (): Promise<{ message: string }> => {
    const response = await api.post('/camara/stop');
    return response.data;
  },

  getSnapshot: async (): Promise<Blob> => {
    const response = await api.get('/camara/snapshot', {
      responseType: 'blob',
    });
    return response.data;
  },
};

// ===== REPORTES DE ASISTENCIA =====

export const reportesAsistenciaService = {
  getResumen: async (fechaInicio?: string, fechaFin?: string, empleadoId?: number): Promise<ResumenAsistenciaReporte> => {
    const response = await api.get('/reportes/asistencia/resumen', {
      params: { fechaInicio, fechaFin, empleadoId },
    });
    return response.data;
  },

  getAsistenciaPorDia: async (fechaInicio?: string, fechaFin?: string): Promise<AsistenciaPorDia[]> => {
    const response = await api.get('/reportes/asistencia/por-dia', {
      params: { fechaInicio, fechaFin },
    });
    return response.data;
  },

  getAsistenciaPorEmpleado: async (fechaInicio?: string, fechaFin?: string): Promise<AsistenciaPorEmpleado[]> => {
    const response = await api.get('/reportes/asistencia/por-empleado', {
      params: { fechaInicio, fechaFin },
    });
    return response.data;
  },

  getHorasTrabajadas: async (fechaInicio?: string, fechaFin?: string): Promise<HorasTrabajadas[]> => {
    const response = await api.get('/reportes/asistencia/horas-trabajadas', {
      params: { fechaInicio, fechaFin },
    });
    return response.data;
  },

  getRankingPuntualidad: async (fechaInicio?: string, fechaFin?: string, limite?: number): Promise<AsistenciaPorEmpleado[]> => {
    const response = await api.get('/reportes/asistencia/ranking-puntualidad', {
      params: { fechaInicio, fechaFin, limite },
    });
    return response.data;
  },

  getDistribucionMetodos: async (fechaInicio?: string, fechaFin?: string): Promise<DistribucionMetodo[]> => {
    const response = await api.get('/reportes/asistencia/metodos', {
      params: { fechaInicio, fechaFin },
    });
    return response.data;
  },
};
