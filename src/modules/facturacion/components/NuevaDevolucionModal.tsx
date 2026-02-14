import { useState } from 'react';
import { X, Search, RotateCcw, Package, AlertCircle } from 'lucide-react';
import { devolucionService } from '../../../services/devolucion.service';
import { facturaService } from '../../../services/facturacion.service';
import type { Factura, FacturaParaDevolucion, DetalleFacturaParaDevolucion } from '../../../types/facturacion';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

interface ItemDevolucion {
  productoId: number;
  nombre: string;
  codigo: string;
  precioUnitario: number;
  cantidadOriginal: number;
  cantidadDevuelta: number;
  cantidadDisponible: number;
  cantidadADevolver: number;
}

export function NuevaDevolucionModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<'buscar' | 'seleccionar'>('buscar');
  const [busqueda, setBusqueda] = useState('');
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<FacturaParaDevolucion | null>(null);
  const [items, setItems] = useState<ItemDevolucion[]>([]);
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');

  const buscarFacturas = async () => {
    if (!busqueda.trim()) return;
    
    setBuscando(true);
    try {
      const data = await facturaService.getAll();
      const filtered = data.filter(f => 
        f.numeroFactura.toLowerCase().includes(busqueda.toLowerCase()) ||
        f.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        f.cliente?.documento?.includes(busqueda)
      );
      setFacturas(filtered.filter(f => f.estado !== 'anulada').slice(0, 10));
    } catch (err) {
      console.error('Error buscando facturas:', err);
    } finally {
      setBuscando(false);
    }
  };

  const seleccionarFactura = async (factura: Factura) => {
    setLoading(true);
    try {
      const facturaConDisponible = await devolucionService.getFacturaParaDevolucion(factura.id);
      setFacturaSeleccionada(facturaConDisponible);
      
      const itemsDevolucion = facturaConDisponible.detalles
        .filter((d: DetalleFacturaParaDevolucion) => d.cantidadDisponible > 0)
        .map((d: DetalleFacturaParaDevolucion) => ({
          productoId: d.productoId,
          nombre: d.producto?.nombre || '',
          codigo: d.producto?.codigo || '',
          precioUnitario: d.precioUnitario,
          cantidadOriginal: d.cantidad,
          cantidadDevuelta: d.cantidadDevuelta,
          cantidadDisponible: d.cantidadDisponible,
          cantidadADevolver: 0,
        }));
      
      setItems(itemsDevolucion);
      setStep('seleccionar');
    } catch {
      setError('Error cargando factura');
    } finally {
      setLoading(false);
    }
  };

  const actualizarCantidad = (productoId: number, cantidad: number) => {
    setItems(items.map(item => {
      if (item.productoId === productoId) {
        return {
          ...item,
          cantidadADevolver: Math.min(Math.max(0, cantidad), item.cantidadDisponible),
        };
      }
      return item;
    }));
  };

  const itemsADevolver = items.filter(i => i.cantidadADevolver > 0);

  const calcularTotal = () => {
    return itemsADevolver.reduce((acc, item) => acc + (item.cantidadADevolver * item.precioUnitario), 0);
  };

  const procesarDevolucion = async () => {
    if (!facturaSeleccionada || itemsADevolver.length === 0) {
      setError('Seleccione al menos un producto para devolver');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await devolucionService.create({
        facturaId: facturaSeleccionada.id,
        motivo: motivo || undefined,
        detalles: itemsADevolver.map(item => ({
          productoId: item.productoId,
          cantidad: item.cantidadADevolver,
          precioUnitario: item.precioUnitario,
        })),
      });

      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Error al procesar devolución');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <RotateCcw className="text-orange-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Nueva Devolución
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {step === 'buscar' && (
            <div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Busque la factura o boleta de la venta original
              </p>
              
              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && buscarFacturas()}
                    placeholder="Número de factura, nombre o documento del cliente..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <button
                  onClick={buscarFacturas}
                  disabled={buscando}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {buscando ? 'Buscando...' : 'Buscar'}
                </button>
              </div>

              {facturas.length > 0 && (
                <div className="space-y-2">
                  {facturas.map(factura => (
                    <button
                      key={factura.id}
                      onClick={() => seleccionarFactura(factura)}
                      disabled={loading}
                      className="w-full p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-mono font-medium text-gray-800 dark:text-gray-100">
                            {factura.numeroFactura}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {factura.cliente?.nombre || 'Cliente general'} • {new Date(factura.fechaEmision).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="font-medium text-gray-800 dark:text-gray-100">
                          {formatCurrency(factura.total)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {facturas.length === 0 && busqueda && !buscando && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No se encontraron facturas
                </p>
              )}
            </div>
          )}

          {step === 'seleccionar' && facturaSeleccionada && (
            <div>
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Factura seleccionada:</p>
                <p className="font-mono font-medium text-gray-800 dark:text-gray-100">
                  {facturaSeleccionada.numeroFactura}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {facturaSeleccionada.cliente?.nombre || 'Cliente general'}
                </p>
              </div>

              {items.length === 0 ? (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <Package size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Todos los productos de esta factura ya han sido devueltos</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Seleccione los productos a devolver:
                  </p>

                  <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                    {items.map(item => (
                      <div
                        key={item.productoId}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Package size={20} className="text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-100">{item.nombre}</p>
                            <p className="text-xs text-gray-500">
                              Disponible: {item.cantidadDisponible} de {item.cantidadOriginal}
                              {item.cantidadDevuelta > 0 && ` (${item.cantidadDevuelta} ya devueltos)`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => actualizarCantidad(item.productoId, item.cantidadADevolver - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={item.cantidadADevolver}
                            onChange={(e) => actualizarCantidad(item.productoId, parseInt(e.target.value) || 0)}
                            min={0}
                            max={item.cantidadDisponible}
                            className="w-16 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                          />
                          <button
                            onClick={() => actualizarCantidad(item.productoId, item.cantidadADevolver + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Motivo de devolución (opcional)
                    </label>
                    <textarea
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                      placeholder="Ej: Producto defectuoso, cliente cambió de opinión..."
                    />
                  </div>

                  {itemsADevolver.length > 0 && (
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-orange-700 dark:text-orange-300">
                          {itemsADevolver.length} producto(s) a devolver
                        </span>
                        <span className="font-bold text-orange-700 dark:text-orange-300">
                          {formatCurrency(calcularTotal())}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-gray-700 flex justify-between">
          {step === 'seleccionar' && (
            <button
              onClick={() => {
                setStep('buscar');
                setFacturaSeleccionada(null);
                setItems([]);
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              ← Volver
            </button>
          )}
          {step === 'buscar' && <div />}
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancelar
            </button>
            {step === 'seleccionar' && items.length > 0 && (
              <button
                onClick={procesarDevolucion}
                disabled={loading || itemsADevolver.length === 0}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RotateCcw size={18} />
                )}
                Procesar Devolución
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
