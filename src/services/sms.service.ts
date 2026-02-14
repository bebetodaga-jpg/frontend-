import api from './api';

export interface ConfiguracionSMS {
  id?: number;
  twilioAccountSid: string | null;
  twilioAuthToken: string | null;
  twilioPhoneNumber: string | null;
  stockMinimoAlerta: number;
  ventaMinimaAlerta: number;
  horaInicioEnvio: string;
  horaFinEnvio: string;
  activo: boolean;
}

export interface NotificacionSMS {
  id: number;
  tipo: string;
  destinatario: string;
  mensaje: string;
  estado: string;
  twilioSid?: string;
  error?: string;
  createdAt: string;
}

export interface PreferenciasSMS {
  celular: string | null;
  smsStockBajo: boolean;
  smsVentasGrandes: boolean;
  smsTardanzas: boolean;
  smsAusencias: boolean;
}

export const smsService = {
  // Obtener configuración
  async getConfig(): Promise<ConfiguracionSMS> {
    const response = await api.get('/sms/config');
    return response.data;
  },

  // Guardar configuración
  async saveConfig(data: Partial<ConfiguracionSMS>): Promise<ConfiguracionSMS> {
    const response = await api.put('/sms/config', data);
    return response.data;
  },

  // Enviar SMS de prueba
  async enviarPrueba(destinatario: string): Promise<{ message: string; sid?: string }> {
    const response = await api.post('/sms/prueba', { destinatario });
    return response.data;
  },

  // Obtener historial
  async getHistorial(filtros?: { tipo?: string; estado?: string; limit?: number }): Promise<NotificacionSMS[]> {
    const params = new URLSearchParams();
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.estado) params.append('estado', filtros.estado);
    if (filtros?.limit) params.append('limit', filtros.limit.toString());
    
    const response = await api.get(`/sms/historial?${params.toString()}`);
    return response.data;
  },

  // Actualizar preferencias de usuario
  async updatePreferencias(usuarioId: number, data: PreferenciasSMS): Promise<any> {
    const response = await api.put(`/sms/preferencias/${usuarioId}`, data);
    return response.data;
  },
};
