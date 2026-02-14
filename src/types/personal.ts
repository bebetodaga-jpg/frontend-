// Tipos para el módulo de control de personal

export interface Empleado {
  id: number;
  codigo: string;
  nombre: string;
  apellido: string;
  dni: string;
  cargo: string;
  horaEntrada: string;
  horaSalida: string;
  activo: boolean;
  fotoUrl?: string;
  createdAt: string;
  updatedAt: string;
  datosFaciales?: DatosFaciales;
  _count?: {
    asistencias: number;
  };
}

export interface DatosFaciales {
  id: number;
  empleadoId: number;
  createdAt: string;
  updatedAt: string;
}

export interface RegistroAsistencia {
  id: number;
  empleadoId: number;
  tipo: 'entrada' | 'salida';
  horaRegistro: string;
  metodo: 'facial' | 'manual';
  confianza?: number;
  fotoCaptura?: string;
  observacion?: string;
  tardanza?: number;
  empleado?: Empleado;
}

export interface CreateEmpleadoDTO {
  codigo: string;
  nombre: string;
  apellido: string;
  dni: string;
  cargo: string;
  horaEntrada?: string;
  horaSalida?: string;
}

export interface UpdateEmpleadoDTO extends Partial<CreateEmpleadoDTO> {
  activo?: boolean;
}

export interface EstadisticasEmpleados {
  total: number;
  activos: number;
  inactivos: number;
  conRostroRegistrado: number;
}

export interface ResumenAsistenciaHoy {
  totalEmpleados: number;
  presentes: number;
  ausentes: number;
  tardanzas: number;
}

export interface FiltrosAsistencia {
  empleadoId?: number;
  fechaInicio?: string;
  fechaFin?: string;
  tipo?: 'entrada' | 'salida';
}

export interface CamaraStatus {
  enabled: boolean;
  running: boolean;
  type: string;
  url: string;
  detectionInterval: number;
  minConfidence: number;
  isProcessing: boolean;
  lastDetectionTime?: string;
  consecutiveErrors: number;
}

export interface CamaraConfig {
  url?: string;
  username?: string;
  password?: string;
  detectionInterval?: number;
  minConfidence?: number;
  saveCaptures?: boolean;
}

// Tipos para Reportes de Asistencia
export interface ResumenAsistenciaReporte {
  totalDias: number;
  diasTrabajados: number;
  diasAusencia: number;
  totalTardanzas: number;
  minutosRetardoTotal: number;
  promedioHoraEntrada: string;
  promedioHoraSalida: string;
}

export interface AsistenciaPorDia {
  fecha: string;
  presentes: number;
  ausentes: number;
  tardanzas: number;
}

export interface AsistenciaPorEmpleado {
  empleadoId: number;
  nombre: string;
  apellido: string;
  cargo: string;
  diasTrabajados: number;
  diasAusencia: number;
  tardanzas: number;
  minutosRetardo: number;
  puntualidad: number;
}

export interface HorasTrabajadas {
  empleadoId: number;
  nombre: string;
  apellido: string;
  horasEsperadas: number;
  horasTrabajadas: number;
  diferencia: number;
  porcentaje: number;
}

export interface DistribucionMetodo {
  metodo: string;
  cantidad: number;
  porcentaje: number;
}

// Cargos predefinidos
export const CARGOS = [
  'Vendedor',
  'Cajero',
  'Almacenero',
  'Gerente',
  'Supervisor',
  'Repartidor',
  'Limpieza',
  'Seguridad',
] as const;
