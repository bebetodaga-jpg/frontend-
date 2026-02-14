import { useState, useEffect } from 'react';
import { Filter, ArrowUp, ArrowDown, Calendar } from 'lucide-react';
import { movimientoService } from '../../../services/inventario.service';
import type { MovimientoInventario } from '../../../types/inventario';

export function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    tipo: '' as '' | 'entrada' | 'salida',
    fechaInicio: '',
    fechaFin: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadMovimientos();
  }, [filtros, pagination.page]);

  // Reset to page 1 when filters change
  const handleFilterChange = (newFiltros: typeof filtros) => {
    setFiltros(newFiltros);
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  };

  const loadMovimientos = async () => {
    try {
      setLoading(true);
      const params: any = { page: pagination.page, limit: pagination.limit };
      if (filtros.tipo) params.tipo = filtros.tipo;
      if (filtros.fechaInicio) params.fechaInicio = filtros.fechaInicio;
      if (filtros.fechaFin) params.fechaFin = filtros.fechaFin;

      const response = await movimientoService.getAll(params);
      setMovimientos(response.data);
      setPagination(prev => ({ ...prev, ...response.pagination }));
    } catch (error) {
      console.error('Error cargando movimientos:', error);
    } finally {
      setLoading(false);
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Historial de Movimientos</h1>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-500 dark:text-gray-400" />
          <span className="font-medium text-gray-700 dark:text-gray-200">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Tipo</label>
            <select
              value={filtros.tipo}
              onChange={(e) => handleFilterChange({ ...filtros, tipo: e.target.value as any })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="entrada">Entradas</option>
              <option value="salida">Salidas</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Desde</label>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => handleFilterChange({ ...filtros, fechaInicio: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Hasta</label>
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => handleFilterChange({ ...filtros, fechaFin: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tabla de movimientos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Cantidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Motivo
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {movimientos.map((mov) => (
              <tr key={mov.id} className="hover:bg-gray-50 dark:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    {formatDate(mov.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {mov.producto?.nombre || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{mov.producto?.codigo}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      mov.tipo === 'entrada'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {mov.tipo === 'entrada' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {mov.tipo === 'entrada' ? '+' : '-'}{mov.cantidad}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {mov.motivo || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {movimientos.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No hay movimientos registrados
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Cargando...
          </div>
        )}
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:bg-gray-700"
          >
            Anterior
          </button>
          <span className="text-gray-600 dark:text-gray-300">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:bg-gray-700"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}




