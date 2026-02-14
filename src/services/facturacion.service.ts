import api from './api';
import type {
  Cliente,
  CreateClienteDTO,
  UpdateClienteDTO,
  Factura,
  CreateFacturaDTO,
  EstadisticasVentas,
  VentaDiaria,
} from '../types/facturacion';

// ===== CLIENTES =====

export const clienteService = {
  getAll: async (search?: string): Promise<Cliente[]> => {
    const params = search ? { search } : {};
    const response = await api.get('/clientes', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Cliente> => {
    const response = await api.get(`/clientes/${id}`);
    return response.data;
  },

  getByDocumento: async (documento: string): Promise<Cliente> => {
    const response = await api.get(`/clientes/documento/${documento}`);
    return response.data;
  },

  create: async (data: CreateClienteDTO): Promise<Cliente> => {
    const response = await api.post('/clientes', data);
    return response.data;
  },

  update: async (id: number, data: UpdateClienteDTO): Promise<Cliente> => {
    const response = await api.put(`/clientes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/clientes/${id}`);
  },

  getEstadisticas: async (id: number) => {
    const response = await api.get(`/clientes/${id}/estadisticas`);
    return response.data;
  },
};

// ===== FACTURAS =====

export const facturaService = {
  getAll: async (filters?: {
    clienteId?: number;
    estado?: string;
    fechaInicio?: string;
    fechaFin?: string;
  }): Promise<Factura[]> => {
    const response = await api.get('/facturas', { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<Factura> => {
    const response = await api.get(`/facturas/${id}`);
    return response.data;
  },

  getByNumero: async (numero: string): Promise<Factura> => {
    const response = await api.get(`/facturas/numero/${numero}`);
    return response.data;
  },

  create: async (data: CreateFacturaDTO): Promise<Factura> => {
    const response = await api.post('/facturas', data);
    return response.data;
  },

  anular: async (id: number): Promise<Factura> => {
    const response = await api.post(`/facturas/${id}/anular`);
    return response.data;
  },

  getEstadisticas: async (fechaInicio?: string, fechaFin?: string): Promise<EstadisticasVentas> => {
    const response = await api.get('/facturas/estadisticas', {
      params: { fechaInicio, fechaFin },
    });
    return response.data;
  },

  getVentasPorDia: async (): Promise<VentaDiaria[]> => {
    const response = await api.get('/facturas/ventas-por-dia');
    return response.data;
  },

  descargarPDF: async (id: number): Promise<void> => {
    const response = await api.get(`/facturas/${id}/pdf`, {
      responseType: 'blob',
    });
    
    // Crear link de descarga
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `factura-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  procesarDevolucion: async (
    id: number,
    data: { detalles: { productoId: number; cantidad: number }[]; motivo?: string }
  ): Promise<Factura> => {
    const response = await api.post(`/facturas/${id}/devolucion`, data);
    return response.data;
  },

  // Enviar factura a SUNAT
  enviarSunat: async (id: number): Promise<{
    success: boolean;
    message: string;
    hash?: string;
    enlacePdf?: string;
    enlaceXml?: string;
    serie?: string;
    numero?: number;
  }> => {
    const response = await api.post(`/facturas/${id}/enviar-sunat`);
    return response.data;
  },

  // Descargar PDF de SUNAT
  descargarPdfSunat: async (enlacePdf: string): Promise<void> => {
    window.open(enlacePdf, '_blank');
  },
};

// ===== RENIEC/SUNAT =====

export interface DatosPersonaDNI {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
}

export interface DatosEmpresaRUC {
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  direccion: string;
  estado: string;
  condicion: string;
  departamento: string;
  provincia: string;
  distrito: string;
  ubigeo: string;
  tipo: string;
}

export type ConsultaDocumentoResponse =
  | { tipo: 'DNI'; datos: DatosPersonaDNI }
  | { tipo: 'RUC'; datos: DatosEmpresaRUC };

export const reniecService = {
  // Consultar documento (auto-detecta DNI o RUC)
  consultarDocumento: async (documento: string): Promise<ConsultaDocumentoResponse> => {
    const response = await api.get(`/reniec/consulta/${documento}`);
    return response.data;
  },

  // Consultar DNI específicamente
  consultarDNI: async (dni: string): Promise<{ tipo: 'DNI'; datos: DatosPersonaDNI }> => {
    const response = await api.get(`/reniec/dni/${dni}`);
    return response.data;
  },

  // Consultar RUC específicamente
  consultarRUC: async (ruc: string): Promise<{ tipo: 'RUC'; datos: DatosEmpresaRUC }> => {
    const response = await api.get(`/reniec/ruc/${ruc}`);
    return response.data;
  },
};
