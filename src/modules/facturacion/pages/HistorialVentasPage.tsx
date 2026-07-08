import { useState, useEffect, useCallback } from 'react';
import { Filter, Eye, XCircle, Calendar, DollarSign, FileText, RotateCcw } from 'lucide-react';
import { facturaService } from '../../../services/facturacion.service';
import type { Factura } from '../../../types/facturacion';
import { FacturaDetalleModal } from '../components/FacturaDetalleModal';
import { DevolucionModal } from '../components/DevolucionModal';

export function HistorialVentasPage() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [facturaDevolucion, setFacturaDevolucion] = useState<Factura | null>(null);
  const [filtros, setFiltros] = useState({
    estado: '',
    fechaInicio: '',
    fechaFin: '',
  });

  const loadFacturas = useCallback(async () => {
    try {
      setLoading(true);
      const filters: Record<string, string> = {};
      if (filtros.estado) filters.estado = filtros.estado;
      if (filtros.fechaInicio) filters.fechaInicio = filtros.fechaInicio;
      if (filtros.fechaFin) filters.fechaFin = filtros.fechaFin;

      const data = await facturaService.getAll(filters);
      setFacturas(data);
    } catch (error) {
      console.error('Error cargando facturas:', error);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    loadFacturas();
  }, [loadFacturas]);

  const handleAnular = async (id: number) => {
    if (!confirm('¿Está seguro de anular esta factura? El stock será devuelto.')) return;
    try {
      await facturaService.anular(id);
      loadFacturas();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || 'Error al anular factura');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value);
  };

  const getEstadoStyle = (estado: string) => {
    switch (estado) {
      case 'pagada':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'anulada':
        return 'bg-red-100 text-red-800';
      case 'nota_credito':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100';
    }
  };

  const totalVentas = facturas
    .filter((f) => f.estado === 'pagada')
    .reduce((sum, f) => sum + f.total, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">Historial de Ventas</h1>
        <div className="flex items-center gap-4">
          <div className="bg-green-100 px-3 sm:px-4 py-2 rounded-lg">
            <span className="text-xs sm:text-sm text-green-600">Total:</span>
            <span className="ml-1 sm:ml-2 font-bold text-green-800 text-sm sm:text-base">{formatCurrency(totalVentas)}</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-500 dark:text-gray-400" />
          <span className="font-medium text-gray-700 dark:text-gray-200">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="pagada">Pagadas</option>
              <option value="pendiente">Pendientes</option>
              <option value="anulada">Anuladas</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Desde</label>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Hasta</label>
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Vista móvil - Cards */}
      <div className="block lg:hidden space-y-3">
        {facturas.map((factura) => (
          <div key={factura.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{factura.numeroFactura}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(factura.fechaEmision)}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getEstadoStyle(factura.estado)}`}>
                {factura.estado}
              </span>
            </div>
            <div className="text-sm mb-2">
              <span className="text-gray-500 dark:text-gray-400">Cliente:</span>
              <span className="ml-1 text-gray-900 dark:text-gray-100">{factura.cliente?.nombre || 'General'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-green-600 text-lg">{formatCurrency(factura.total)}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFacturaSeleccionada(factura)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                >
                  <Eye size={18} />
                </button>
                {factura.estado === 'pagada' && (
                  <button
                    onClick={() => setFacturaDevolucion(factura)}
                    className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg"
                  >
                    <RotateCcw size={18} />
                  </button>
                )}
                {factura.estado !== 'anulada' && factura.tipoComprobante !== 'nota_credito' && (
                  <button
                    onClick={() => handleAnular(factura.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                  >
                    <XCircle size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {facturas.length === 0 && !loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500 dark:text-gray-400">
            No hay facturas registradas
          </div>
        )}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500 dark:text-gray-400">
            Cargando...
          </div>
        )}
      </div>

      {/* Vista desktop - Tabla */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Factura
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Método
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {facturas.map((factura) => (
              <tr key={factura.id} className="hover:bg-gray-50 dark:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-gray-400" />
                    <span className="font-medium text-gray-900">{factura.numeroFactura}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    {formatDate(factura.fechaEmision)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  {factura.cliente?.nombre || 'Cliente general'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 capitalize">
                  {factura.metodoPago}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <DollarSign size={14} className="text-green-600" />
                    <span className="font-semibold text-gray-900">{formatCurrency(factura.total)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getEstadoStyle(
                      factura.estado
                    )}`}
                  >
                    {factura.estado}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFacturaSeleccionada(factura)}
                      className="p-1 text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Ver detalle"
                    >
                      <Eye size={18} />
                    </button>
                    {factura.estado === 'pagada' && (
                      <button
                        onClick={() => setFacturaDevolucion(factura)}
                        className="p-1 text-orange-600 hover:bg-orange-100 rounded"
                        title="Procesar devolución"
                      >
                        <RotateCcw size={18} />
                      </button>
                    )}
                    {factura.estado !== 'anulada' && factura.tipoComprobante !== 'nota_credito' && (
                      <button
                        onClick={() => handleAnular(factura.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Anular factura"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {facturas.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No hay facturas registradas
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Cargando...
          </div>
        )}
        </div>
      </div>

      {facturaSeleccionada && (
        <FacturaDetalleModal
          factura={facturaSeleccionada}
          onClose={() => setFacturaSeleccionada(null)}
        />
      )}

      {facturaDevolucion && (
        <DevolucionModal
          factura={facturaDevolucion}
          onClose={() => setFacturaDevolucion(null)}
          onDevolucionProcesada={() => {
            loadFacturas();
            setFacturaDevolucion(null);
          }}
        />
      )}
    </div>
  );
}





