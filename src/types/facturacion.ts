// Tipos para el módulo de facturación

export interface Cliente {
  id: number;
  nombre: string;
  documento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    facturas: number;
  };
}

export interface CreateClienteDTO {
  nombre: string;
  documento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export type UpdateClienteDTO = Partial<CreateClienteDTO>;

export interface DetalleFactura {
  id: number;
  facturaId: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
  producto?: {
    id: number;
    codigo: string;
    nombre: string;
    unidadMedida: string;
  };
}

export interface Factura {
  id: number;
  numeroFactura: string;
  clienteId?: number;
  fechaEmision: string;
  subtotal: number;
  descuento: number;
  impuestos: number;
  total: number;
  metodoPago: string;
  estado: 'pendiente' | 'pagada' | 'anulada';
  // Campos SUNAT
  tipoComprobante?: 'factura' | 'boleta' | 'ticket' | 'nota_credito';
  serieSunat?: string;
  correlativoSunat?: number;
  estadoSunat?: 'pendiente' | 'aceptada' | 'rechazada' | 'no_enviada';
  codigoHash?: string;
  enlacePdf?: string;
  enlaceXml?: string;
  enlaceCdr?: string;
  sunatDescription?: string;
  enviadoSunat?: boolean;
  fechaEnvioSunat?: string;
  createdAt: string;
  updatedAt: string;
  cliente?: Cliente;
  detalles?: DetalleFactura[];
}

export interface DetalleFacturaDTO {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
}

export interface CreateFacturaDTO {
  clienteId?: number;
  metodoPago?: string;
  descuento?: number;
  detalles: DetalleFacturaDTO[];
  tipoComprobante?: 'factura' | 'boleta' | 'ticket';
  enviarSunat?: boolean;
}

export interface ItemCarrito {
  productoId: number;
  codigo: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  descuento: number;
  subtotal: number;
  stockDisponible: number;
}

export interface EstadisticasVentas {
  totalVentas: number;
  cantidadFacturas: number;
  promedioVenta: number;
  ventasHoy: number;
  facturasHoy: number;
  ventasMes: number;
}

export interface VentaDiaria {
  fecha: string;
  total: number;
  cantidad: number;
}

// Tipos para devoluciones

export interface DetalleDevolucion {
  id: number;
  devolucionId: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  producto?: {
    id: number;
    codigo: string;
    nombre: string;
    unidadMedida: string;
  };
}

export interface Devolucion {
  id: number;
  numeroDevolucion: string;
  facturaId: number;
  motivo?: string;
  montoDevuelto: number;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  fechaDevolucion: string;
  createdAt: string;
  updatedAt: string;
  factura?: Factura & { cliente?: Cliente };
  detalles?: DetalleDevolucion[];
}

export interface DetalleFacturaParaDevolucion extends DetalleFactura {
  cantidadDevuelta: number;
  cantidadDisponible: number;
}

export interface FacturaParaDevolucion extends Factura {
  detalles: DetalleFacturaParaDevolucion[];
}

export interface DetalleDevolucionDTO {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
}

export interface CreateDevolucionDTO {
  facturaId: number;
  motivo?: string;
  detalles: DetalleDevolucionDTO[];
}

export interface EstadisticasDevoluciones {
  total: number;
  aprobadas: number;
  pendientes: number;
  rechazadas: number;
  montoTotalAprobado: number;
}
