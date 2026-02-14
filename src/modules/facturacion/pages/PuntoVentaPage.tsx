import { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, User, CreditCard, 
  Banknote, Receipt, X, Check, AlertCircle, Percent, FileText, Send
} from 'lucide-react';
import { productoService } from '../../../services/inventario.service';
import { clienteService, facturaService } from '../../../services/facturacion.service';
import type { Producto } from '../../../types/inventario';
import type { Cliente, ItemCarrito, CreateFacturaDTO } from '../../../types/facturacion';

type TipoComprobante = 'ticket' | 'boleta' | 'factura';

export function PuntoVentaPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [metodoPago, setMetodoPago] = useState<string>('efectivo');
  const [descuentoGeneral, setDescuentoGeneral] = useState<number>(0);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [showClientes, setShowClientes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [descuentoTipo, setDescuentoTipo] = useState<'monto' | 'porcentaje'>('monto');
  // Nuevos estados para SUNAT
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>('ticket');
  const [enviarSunat, setEnviarSunat] = useState(false);
  const inputBusquedaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProductos();
    loadClientes();
    inputBusquedaRef.current?.focus();
  }, []);

  const loadProductos = async () => {
    try {
      const data = await productoService.getAll();
      setProductos(data);
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const loadClientes = async () => {
    try {
      const data = await clienteService.getAll();
      setClientes(data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  const productosFiltrados = productos.filter(
    (p) =>
      p.stockActual > 0 &&
      (p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.codigo.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
      (c.documento && c.documento.includes(busquedaCliente))
  );

  const agregarAlCarrito = (producto: Producto) => {
    const existente = carrito.find((item) => item.productoId === producto.id);

    if (existente) {
      if (existente.cantidad >= producto.stockActual) {
        setMensaje({ tipo: 'error', texto: 'Stock insuficiente' });
        setTimeout(() => setMensaje(null), 2000);
        return;
      }
      setCarrito(
        carrito.map((item) =>
          item.productoId === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.precioUnitario - item.descuento,
              }
            : item
        )
      );
    } else {
      setCarrito([
        ...carrito,
        {
          productoId: producto.id,
          codigo: producto.codigo,
          nombre: producto.nombre,
          precioUnitario: producto.precioVenta,
          cantidad: 1,
          descuento: 0,
          subtotal: producto.precioVenta,
          stockDisponible: producto.stockActual,
        },
      ]);
    }
  };

  const actualizarCantidad = (productoId: number, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;

    setCarrito(
      carrito.map((item) => {
        if (item.productoId === productoId) {
          if (nuevaCantidad > item.stockDisponible) {
            setMensaje({ tipo: 'error', texto: 'Stock insuficiente' });
            setTimeout(() => setMensaje(null), 2000);
            return item;
          }
          return {
            ...item,
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * item.precioUnitario - item.descuento,
          };
        }
        return item;
      })
    );
  };

  const eliminarDelCarrito = (productoId: number) => {
    setCarrito(carrito.filter((item) => item.productoId !== productoId));
  };

  const aplicarDescuentoItem = (productoId: number, descuento: number) => {
    setCarrito(
      carrito.map((item) => {
        if (item.productoId === productoId) {
          const maxDescuento = item.cantidad * item.precioUnitario;
          const descuentoAplicado = Math.min(descuento, maxDescuento);
          return {
            ...item,
            descuento: descuentoAplicado,
            subtotal: item.cantidad * item.precioUnitario - descuentoAplicado,
          };
        }
        return item;
      })
    );
  };

  const limpiarCarrito = () => {
    setCarrito([]);
    setClienteSeleccionado(null);
    setDescuentoGeneral(0);
    setMetodoPago('efectivo');
    setTipoComprobante('ticket');
    setEnviarSunat(false);
  };

  const calcularSubtotal = () => {
    return carrito.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calcularDescuentoTotal = () => {
    if (descuentoTipo === 'porcentaje') {
      return (calcularSubtotal() * descuentoGeneral) / 100;
    }
    return descuentoGeneral;
  };

  const calcularTotal = () => {
    return calcularSubtotal() - calcularDescuentoTotal();
  };

  const procesarVenta = async () => {
    if (carrito.length === 0) {
      setMensaje({ tipo: 'error', texto: 'El carrito está vacío' });
      setTimeout(() => setMensaje(null), 2000);
      return;
    }

    // Validar cliente para factura/boleta con SUNAT
    if ((tipoComprobante === 'factura' || tipoComprobante === 'boleta') && enviarSunat && !clienteSeleccionado) {
      setMensaje({ tipo: 'error', texto: 'Seleccione un cliente para emitir comprobante electrónico' });
      setTimeout(() => setMensaje(null), 3000);
      return;
    }

    // Validar RUC para factura
    if (tipoComprobante === 'factura' && enviarSunat && clienteSeleccionado) {
      const doc = clienteSeleccionado.documento?.replace(/\D/g, '') || '';
      if (doc.length !== 11) {
        setMensaje({ tipo: 'error', texto: 'Para factura el cliente debe tener RUC (11 dígitos)' });
        setTimeout(() => setMensaje(null), 3000);
        return;
      }
    }

    setLoading(true);
    try {
      const facturaData: CreateFacturaDTO = {
        clienteId: clienteSeleccionado?.id,
        metodoPago,
        descuento: calcularDescuentoTotal(),
        detalles: carrito.map((item) => ({
          productoId: item.productoId,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          descuento: item.descuento,
        })),
        tipoComprobante,
        enviarSunat: enviarSunat && tipoComprobante !== 'ticket',
      };

      const factura = await facturaService.create(facturaData);
      
      let mensajeExito = `Venta completada - ${factura.numeroFactura}`;
      if (enviarSunat && tipoComprobante !== 'ticket') {
        mensajeExito += ' (Enviando a SUNAT...)';
      }
      
      setMensaje({ tipo: 'success', texto: mensajeExito });
      limpiarCarrito();
      loadProductos(); // Recargar productos para actualizar stock
      
      setTimeout(() => setMensaje(null), 3000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      setMensaje({ tipo: 'error', texto: err.response?.data?.error || 'Error al procesar venta' });
      setTimeout(() => setMensaje(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value);
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* Panel izquierdo - Productos */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              ref={inputBusquedaRef}
              type="text"
              placeholder="Buscar producto por nombre o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {productosFiltrados.slice(0, 20).map((producto) => (
              <button
                key={producto.id}
                onClick={() => agregarAlCarrito(producto)}
                className="p-3 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 border border-gray-200 dark:border-gray-700 hover:border-blue-300 rounded-lg text-left transition-colors"
              >
                <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{producto.nombre}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{producto.codigo}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-blue-600 font-bold">{formatCurrency(producto.precioVenta)}</span>
                  <span className={`text-xs px-2 py-1 rounded ${producto.stockActual <= producto.stockMinimo ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {producto.stockActual}
                  </span>
                </div>
              </button>
            ))}
          </div>
          {productosFiltrados.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No se encontraron productos
            </div>
          )}
        </div>
      </div>

      {/* Panel derecho - Carrito */}
      <div className="w-96 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* Header carrito */}
        <div className="p-4 border-b bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} className="text-blue-600" />
              <span className="font-semibold text-gray-800 dark:text-gray-100">Carrito</span>
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {carrito.length}
              </span>
            </div>
            {carrito.length > 0 && (
              <button
                onClick={limpiarCarrito}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Selector de cliente */}
          <div className="relative">
            <button
              onClick={() => setShowClientes(!showClientes)}
              className="w-full flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:bg-gray-800"
            >
              <User size={16} className="text-gray-500 dark:text-gray-400" />
              <span className={clienteSeleccionado ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400'}>
                {clienteSeleccionado ? clienteSeleccionado.nombre : 'Seleccionar cliente (opcional)'}
              </span>
              {clienteSeleccionado && (
                <X
                  size={16}
                  className="ml-auto text-gray-400 hover:text-gray-600 dark:text-gray-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    setClienteSeleccionado(null);
                  }}
                />
              )}
            </button>

            {showClientes && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                <div className="p-2 border-b">
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={busquedaCliente}
                    onChange={(e) => setBusquedaCliente(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
                  />
                </div>
                {clientesFiltrados.map((cliente) => (
                  <button
                    key={cliente.id}
                    onClick={() => {
                      setClienteSeleccionado(cliente);
                      setShowClientes(false);
                      setBusquedaCliente('');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:bg-gray-700 text-sm"
                  >
                    <p className="font-medium">{cliente.nombre}</p>
                    {cliente.documento && <p className="text-xs text-gray-500 dark:text-gray-400">{cliente.documento}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Items del carrito */}
        <div className="flex-1 overflow-y-auto p-4">
          {carrito.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ShoppingCart size={48} className="mx-auto mb-2 opacity-50" />
              <p>Carrito vacío</p>
            </div>
          ) : (
            <div className="space-y-3">
              {carrito.map((item) => (
                <div key={item.productoId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{item.nombre}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatCurrency(item.precioUnitario)} c/u</p>
                    </div>
                    <button
                      onClick={() => eliminarDelCarrito(item.productoId)}
                      className="p-1 text-red-500 hover:bg-red-100 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => actualizarCantidad(item.productoId, item.cantidad - 1)}
                        className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => actualizarCantidad(item.productoId, parseInt(e.target.value) || 1)}
                        className="w-12 text-center border border-gray-300 dark:border-gray-600 rounded py-1"
                      />
                      <button
                        onClick={() => actualizarCantidad(item.productoId, item.cantidad + 1)}
                        className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="font-bold text-gray-800 dark:text-gray-100">{formatCurrency(item.subtotal)}</span>
                  </div>
                  {/* Descuento por item */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <Percent size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Desc:</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.descuento || ''}
                      placeholder="0"
                      onChange={(e) => aplicarDescuentoItem(item.productoId, Number(e.target.value) || 0)}
                      className="w-16 text-xs text-center border border-gray-300 dark:border-gray-600 rounded py-1"
                    />
                    <span className="text-xs text-gray-400">PEN</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Totales y pago */}
        <div className="border-t p-4 bg-gray-50 dark:bg-gray-700">
          {/* Tipo de comprobante */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Tipo de comprobante</label>
            <div className="flex gap-2">
              <button
                onClick={() => { setTipoComprobante('ticket'); setEnviarSunat(false); }}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  tipoComprobante === 'ticket'
                    ? 'bg-gray-800 border-gray-800 text-white'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                Ticket
              </button>
              <button
                onClick={() => { setTipoComprobante('boleta'); setEnviarSunat(true); }}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  tipoComprobante === 'boleta'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                Boleta
              </button>
              <button
                onClick={() => { setTipoComprobante('factura'); setEnviarSunat(true); }}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  tipoComprobante === 'factura'
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                Factura
              </button>
            </div>
            {tipoComprobante !== 'ticket' && (
              <div className="mt-2 flex items-center gap-2">
                <Send size={12} className="text-blue-500" />
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  Se enviará a SUNAT automáticamente
                </span>
              </div>
            )}
            {tipoComprobante === 'factura' && !clienteSeleccionado && (
              <div className="mt-2 flex items-center gap-2 text-amber-600">
                <AlertCircle size={12} />
                <span className="text-xs">Requiere cliente con RUC</span>
              </div>
            )}
            {tipoComprobante === 'boleta' && !clienteSeleccionado && (
              <div className="mt-2 flex items-center gap-2 text-amber-600">
                <AlertCircle size={12} />
                <span className="text-xs">Requiere cliente con DNI/RUC</span>
              </div>
            )}
          </div>

          {/* Método de pago */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMetodoPago('efectivo')}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border ${
                metodoPago === 'efectivo'
                  ? 'bg-green-100 border-green-500 text-green-700'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <Banknote size={16} />
              <span className="text-sm">Efectivo</span>
            </button>
            <button
              onClick={() => setMetodoPago('tarjeta')}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border ${
                metodoPago === 'tarjeta'
                  ? 'bg-gray-100 dark:bg-gray-700 border-black text-blue-700'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <CreditCard size={16} />
              <span className="text-sm">Tarjeta</span>
            </button>
            <button
              onClick={() => setMetodoPago('transferencia')}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border ${
                metodoPago === 'transferencia'
                  ? 'bg-purple-100 border-purple-500 text-purple-700'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <Receipt size={16} />
              <span className="text-sm">Transfer</span>
            </button>
          </div>

          {/* Totales */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Subtotal</span>
              <span>{formatCurrency(calcularSubtotal())}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
              <span>Descuento</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max={descuentoTipo === 'porcentaje' ? 100 : undefined}
                  value={descuentoGeneral}
                  onChange={(e) => setDescuentoGeneral(Number(e.target.value) || 0)}
                  className="w-16 text-right border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                />
                <div className="flex border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
                  <button
                    onClick={() => setDescuentoTipo('monto')}
                    className={`px-2 py-1 text-xs ${
                      descuentoTipo === 'monto' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    $
                  </button>
                  <button
                    onClick={() => setDescuentoTipo('porcentaje')}
                    className={`px-2 py-1 text-xs ${
                      descuentoTipo === 'porcentaje' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    %
                  </button>
                </div>
              </div>
            </div>
            {descuentoGeneral > 0 && descuentoTipo === 'porcentaje' && (
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span></span>
                <span>-{formatCurrency(calcularDescuentoTotal())}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-gray-800 dark:text-gray-100 pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(calcularTotal())}</span>
            </div>
          </div>

          {/* Mensaje */}
          {mensaje && (
            <div
              className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                mensaje.tipo === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {mensaje.tipo === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
              <span className="text-sm">{mensaje.texto}</span>
            </div>
          )}

          {/* Botón de venta */}
          <button
            onClick={procesarVenta}
            disabled={loading || carrito.length === 0}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              'Procesando...'
            ) : (
              <>
                <Check size={20} />
                Completar Venta
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}





