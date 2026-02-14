import { useState, useEffect, useCallback } from 'react';
import { 
  RotateCcw, Search, Plus, CheckCircle, XCircle, Clock, 
  DollarSign, Calendar, FileText, Eye 
} from 'lucide-react';
import { devolucionService } from '../../../services/devolucion.service';
import type { Devolucion, EstadisticasDevoluciones } from '../../../types/facturacion';
import { NuevaDevolucionModal } from '../components/NuevaDevolucionModal';
import { DetalleDevolucionModal } from '../components/DetalleDevolucionModal';

export function DevolucionesPage() {
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasDevoluciones | null>(null);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [showNuevaModal, setShowNuevaModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [devolucionSeleccionada, setDevolucionSeleccionada] = useState<Devolucion | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [devolucionesData, estadisticasData] = await Promise.all([
        devolucionService.findAll({ estado: filtroEstado || undefined }),
        devolucionService.getEstadisticas(),
      ]);
      setDevoluciones(devolucionesData);
      setEstadisticas(estadisticasData);
    } catch (error) {
      console.error('Error cargando devoluciones:', error);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVerDetalle = (devolucion: Devolucion) => {
    setDevolucionSeleccionada(devolucion);
    setShowDetalleModal(true);
  };

  const handleNuevaDevolucion = () => {
    setShowNuevaModal(true);
  };

  const handleDevolucionCreada = () => {
    setShowNuevaModal(false);
    loadData();
  };

  const handleCambiarEstado = async (id: number, nuevoEstado: 'aprobada' | 'rechazada') => {
    try {
      await devolucionService.updateEstado(id, nuevoEstado);
      loadData();
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  const devolucionesFiltradas = devoluciones.filter(devolucion => {
    if (!busqueda) return true;
    const searchLower = busqueda.toLowerCase();
    return (
      devolucion.numeroDevolucion.toLowerCase().includes(searchLower) ||
      devolucion.factura?.numeroFactura?.toLowerCase().includes(searchLower) ||
      devolucion.factura?.cliente?.nombre?.toLowerCase().includes(searchLower)
    );
  });

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      pendiente: { 
        bg: 'bg-yellow-100 dark:bg-yellow-900/30', 
        text: 'text-yellow-700 dark:text-yellow-300',
        icon: <Clock size={14} />
      },
      aprobada: { 
        bg: 'bg-green-100 dark:bg-green-900/30', 
        text: 'text-green-700 dark:text-green-300',
        icon: <CheckCircle size={14} />
      },
      rechazada: { 
        bg: 'bg-red-100 dark:bg-red-900/30', 
        text: 'text-red-700 dark:text-red-300',
        icon: <XCircle size={14} />
      },
    };
    return badges[estado] || badges.pendiente;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <RotateCcw size={28} />
          Devoluciones
        </h1>
        <button
          onClick={handleNuevaDevolucion}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Nueva Devolución
        </button>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{estadisticas.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Aprobadas</p>
                <p className="text-xl font-bold text-green-600">{estadisticas.aprobadas}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Clock className="text-yellow-600 dark:text-yellow-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pendientes</p>
                <p className="text-xl font-bold text-yellow-600">{estadisticas.pendientes}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <XCircle className="text-red-600 dark:text-red-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Rechazadas</p>
                <p className="text-xl font-bold text-red-600">{estadisticas.rechazadas}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <DollarSign className="text-purple-600 dark:text-purple-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Monto Devuelto</p>
                <p className="text-xl font-bold text-purple-600">{formatCurrency(estadisticas.montoTotalAprobado)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por número, factura o cliente..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
          </select>
        </div>
      </div>

      {/* Tabla de devoluciones */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Nº Devolución
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Factura
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Monto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {devolucionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <RotateCcw size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No hay devoluciones registradas</p>
                  </td>
                </tr>
              ) : (
                devolucionesFiltradas.map((devolucion) => {
                  const badge = getEstadoBadge(devolucion.estado);
                  return (
                    <tr key={devolucion.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3">
                        <span className="font-mono font-medium text-gray-800 dark:text-gray-100">
                          {devolucion.numeroDevolucion}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
                          {devolucion.factura?.numeroFactura}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-800 dark:text-gray-100">
                          {devolucion.factura?.cliente?.nombre || 'Cliente general'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                          <Calendar size={14} />
                          {formatDate(devolucion.fechaDevolucion)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-800 dark:text-gray-100">
                          {formatCurrency(devolucion.montoDevuelto)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                          {badge.icon}
                          {devolucion.estado.charAt(0).toUpperCase() + devolucion.estado.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleVerDetalle(devolucion)}
                            className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                            title="Ver detalle"
                          >
                            <Eye size={18} />
                          </button>
                          {devolucion.estado === 'pendiente' && (
                            <>
                              <button
                                onClick={() => handleCambiarEstado(devolucion.id, 'aprobada')}
                                className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                                title="Aprobar"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleCambiarEstado(devolucion.id, 'rechazada')}
                                className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                title="Rechazar"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nueva devolución */}
      {showNuevaModal && (
        <NuevaDevolucionModal
          onClose={() => setShowNuevaModal(false)}
          onSuccess={handleDevolucionCreada}
        />
      )}

      {/* Modal detalle */}
      {showDetalleModal && devolucionSeleccionada && (
        <DetalleDevolucionModal
          devolucion={devolucionSeleccionada}
          onClose={() => {
            setShowDetalleModal(false);
            setDevolucionSeleccionada(null);
          }}
        />
      )}
    </div>
  );
}
