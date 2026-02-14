import { useState, useEffect } from 'react';
import { Clock, Search, UserCheck, UserX, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { asistenciaService, empleadoService } from '../../../services/personal.service';
import { getServerUrl } from '../../../services/api';
import type { RegistroAsistencia, ResumenAsistenciaHoy, Empleado } from '../../../types/personal';
import { RegistroManualModal } from '../components/RegistroManualModal';

export function AsistenciaPage() {
  const [registros, setRegistros] = useState<RegistroAsistencia[]>([]);
  const [resumen, setResumen] = useState<ResumenAsistenciaHoy | null>(null);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);

  // Filtros
  const [filtros, setFiltros] = useState({
    empleadoId: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
    tipo: '' as '' | 'entrada' | 'salida',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [registrosHoy, resumenData, empleadosData] = await Promise.all([
        asistenciaService.getHoy(),
        asistenciaService.getResumenHoy(),
        empleadoService.getActivos(),
      ]);
      setRegistros(registrosHoy);
      setResumen(resumenData);
      setEmpleados(empleadosData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const data = await asistenciaService.getAll({
        empleadoId: filtros.empleadoId ? Number(filtros.empleadoId) : undefined,
        fechaInicio: filtros.fechaInicio,
        fechaFin: filtros.fechaFin,
        tipo: filtros.tipo || undefined,
      });
      setRegistros(data);
    } catch (error) {
      console.error('Error buscando:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTodayClick = async () => {
    setFiltros({
      empleadoId: '',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: new Date().toISOString().split('T')[0],
      tipo: '',
    });
    await loadInitialData();
  };

  const handleManualSave = async () => {
    setShowManualModal(false);
    await loadInitialData();
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  };

  const exportToCSV = () => {
    const headers = ['Fecha', 'Hora', 'Empleado', 'DNI', 'Tipo', 'Método', 'Confianza', 'Tardanza'];
    const rows = registros.map((r) => [
      formatDate(r.horaRegistro),
      formatTime(r.horaRegistro),
      r.empleado ? `${r.empleado.nombre} ${r.empleado.apellido}` : '',
      r.empleado?.dni || '',
      r.tipo,
      r.metodo,
      r.confianza ? `${(r.confianza * 100).toFixed(0)}%` : '',
      r.tardanza ? `${r.tardanza} min` : '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `asistencia_${filtros.fechaInicio}_${filtros.fechaFin}.csv`;
    link.click();
  };

  if (loading && registros.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Control de Asistencia</h1>
        <div className="flex gap-2">
          <button
            onClick={handleTodayClick}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw size={18} />
            Hoy
          </button>
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Clock size={20} />
            Registro Manual
          </button>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Empleados</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{resumen.totalEmpleados}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Presentes</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{resumen.presentes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <UserX className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ausentes</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{resumen.ausentes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tardanzas</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{resumen.tardanzas}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Empleado
              </label>
              <select
                value={filtros.empleadoId}
                onChange={(e) => setFiltros({ ...filtros, empleadoId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              >
                <option value="">Todos</option>
                {empleados.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} {emp.apellido}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Tipo
              </label>
              <select
                value={filtros.tipo}
                onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value as '' | 'entrada' | 'salida' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              >
                <option value="">Todos</option>
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Search size={18} />
              Buscar
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Exportar a CSV"
            >
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de registros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fecha/Hora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Empleado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Método
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Confianza
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {registros.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No hay registros de asistencia para el período seleccionado
                </td>
              </tr>
            ) : (
              registros.map((registro) => (
                <tr key={registro.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {formatTime(registro.horaRegistro)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(registro.horaRegistro)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {registro.empleado && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                          {registro.empleado.fotoUrl ? (
                            <img
                              src={`${getServerUrl()}${registro.empleado.fotoUrl}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium text-gray-500">
                              {registro.empleado.nombre[0]}{registro.empleado.apellido[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-100">
                            {registro.empleado.nombre} {registro.empleado.apellido}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {registro.empleado.cargo}
                          </p>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        registro.tipo === 'entrada'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}
                    >
                      {registro.tipo === 'entrada' ? '↓ Entrada' : '↑ Salida'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        registro.metodo === 'facial'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {registro.metodo === 'facial' ? '📷 Facial' : '✍️ Manual'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {registro.confianza ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              registro.confianza >= 0.8
                                ? 'bg-green-500'
                                : registro.confianza >= 0.6
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${registro.confianza * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {(registro.confianza * 100).toFixed(0)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {registro.tardanza && registro.tardanza > 0 ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        ⚠️ Tarde {registro.tardanza} min
                      </span>
                    ) : registro.tipo === 'entrada' ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        ✓ A tiempo
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de registro manual */}
      {showManualModal && (
        <RegistroManualModal
          empleados={empleados}
          onClose={() => setShowManualModal(false)}
          onSave={handleManualSave}
        />
      )}
    </div>
  );
}
