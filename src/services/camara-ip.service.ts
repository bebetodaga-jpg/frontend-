import api from './api';

export interface ConfiguracionCamara {
  id?: number;
  nombre: string;
  tipo: string;
  ip: string | null;
  puerto: number;
  usuario: string | null;
  password: string | null;
  rtspPath: string;
  activo: boolean;
  usarParaAsistencia: boolean;
}

export interface CamaraStatus {
  streaming: boolean;
  configurado: boolean;
  activo: boolean;
}

export const camaraIPService = {
  // Obtener configuración
  async getConfig(): Promise<ConfiguracionCamara> {
    const response = await api.get('/camara-ip/config');
    return response.data;
  },

  // Guardar configuración
  async saveConfig(data: Partial<ConfiguracionCamara>): Promise<ConfiguracionCamara> {
    const response = await api.put('/camara-ip/config', data);
    return response.data;
  },

  // Probar conexión
  async testConnection(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/camara-ip/test');
    return response.data;
  },

  // Iniciar stream
  async startStream(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/camara-ip/start');
    return response.data;
  },

  // Detener stream
  async stopStream(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/camara-ip/stop');
    return response.data;
  },

  // Obtener estado
  async getStatus(): Promise<CamaraStatus> {
    const response = await api.get('/camara-ip/status');
    return response.data;
  },

  // Reconocer desde cámara IP
  async reconocer(): Promise<any> {
    const response = await api.post('/camara-ip/reconocer');
    return response.data;
  },

  // URL del stream MJPEG
  getStreamUrl(): string {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const token = localStorage.getItem('token');
    return `${baseUrl}/camara-ip/stream.mjpeg?token=${token}`;
  },

  // URL de captura
  getCaptureUrl(): string {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const token = localStorage.getItem('token');
    return `${baseUrl}/camara-ip/capture?token=${token}`;
  },
};
