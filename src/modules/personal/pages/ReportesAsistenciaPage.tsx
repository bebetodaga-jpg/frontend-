import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Calendar, Download, Clock, UserCheck, AlertTriangle, TrendingUp, Users, Award } from 'lucide-react';
import { reportesAsistenciaService, empleadoService } from '../../../services/personal.service';
import type {
  ResumenAsistenciaReporte,
  AsistenciaPorDia,
  AsistenciaPorEmpleado,
  HorasTrabajadas,
  DistribucionMetodo,
  Empleado,
} from '../../../types/personal';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];

export function ReportesAsistenciaPage() {
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 30);
    return fecha.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [empleadoId, setEmpleadoId] = useState<string>('');

  // Datos
  const [resumen, setResumen] = useState<ResumenAsistenciaReporte | null>(null);
  const [asistenciaPorDia, setAsistenciaPorDia] = useState<AsistenciaPorDia[]>([]);
  const [asistenciaPorEmpleado, setAsistenciaPorEmpleado] = useState<AsistenciaPorEmpleado[]>([]);
  const [horasTrabajadas, setHorasTrabajadas] = useState<HorasTrabajadas[]>([]);
  const [distribucionMetodos, setDistribucionMetodos] = useState<DistribucionMetodo[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resumenData, porDiaData, porEmpleadoData, horasData, metodosData, empleadosData] = await Promise.all([
        reportesAsistenciaService.getResumen(fechaInicio, fechaFin, empleadoId ? Number(empleadoId) : undefined),
        reportesAsistenciaService.getAsistenciaPorDia(fechaInicio, fechaFin),
        reportesAsistenciaService.getAsistenciaPorEmpleado(fechaInicio, fechaFin),
        reportesAsistenciaService.getHorasTrabajadas(fechaInicio, fechaFin),
        reportesAsistenciaService.getDistribucionMetodos(fechaInicio, fechaFin),
        empleadoService.getActivos(),
      ]);

      setResumen(resumenData);
      setAsistenciaPorDia(porDiaData);
      setAsistenciaPorEmpleado(porEmpleadoData);
      setHorasTrabajadas(horasData);
      setDistribucionMetodos(metodosData);
      setEmpleados(empleadosData);
    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin, empleadoId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen
    if (resumen) {
      const resumenData = [
        ['Reporte de Asistencia', ''],
        ['Período', `${fechaInicio} a ${fechaFin}`],
        ['', ''],
        ['Métrica', 'Valor'],
        ['Total Días', resumen.totalDias],
        ['Días Trabajados', resumen.diasTrabajados],
        ['Días Ausencia', resumen.diasAusencia],
        ['Total Tardanzas', resumen.totalTardanzas],
        ['Minutos Retardo Total', resumen.minutosRetardoTotal],
        ['Promedio Hora Entrada', resumen.promedioHoraEntrada],
        ['Promedio Hora Salida', resumen.promedioHoraSalida],
      ];
      const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
    }

    // Hoja 2: Por Empleado
    if (asistenciaPorEmpleado.length > 0) {
      const headers = ['Nombre', 'Apellido', 'Cargo', 'Días Trabajados', 'Ausencias', 'Tardanzas', 'Min. Retardo', 'Puntualidad %'];
      const rows = asistenciaPorEmpleado.map((e) => [
        e.nombre,
        e.apellido,
        e.cargo,
        e.diasTrabajados,
        e.diasAusencia,
        e.tardanzas,
        e.minutosRetardo,
        e.puntualidad,
      ]);
      const wsEmpleados = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, wsEmpleados, 'Por Empleado');
    }

    // Hoja 3: Horas Trabajadas
    if (horasTrabajadas.length > 0) {
      const headers = ['Nombre', 'Apellido', 'Horas Esperadas', 'Horas Trabajadas', 'Diferencia', 'Porcentaje %'];
      const rows = horasTrabajadas.map((h) => [
        h.nombre,
        h.apellido,
        h.horasEsperadas,
        h.horasTrabajadas,
        h.diferencia,
        h.porcentaje,
      ]);
      const wsHoras = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, wsHoras, 'Horas Trabajadas');
    }

    // Hoja 4: Por Día
    if (asistenciaPorDia.length > 0) {
      const headers = ['Fecha', 'Presentes', 'Ausentes', 'Tardanzas'];
      const rows = asistenciaPorDia.map((d) => [d.fecha, d.presentes, d.ausentes, d.tardanzas]);
      const wsDia = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, wsDia, 'Por Día');
    }

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `reporte_asistencia_${fechaInicio}_${fechaFin}.xlsx`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Cargando reportes...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Reportes de Asistencia</h1>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download size={20} />
          Exportar Excel
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              <Calendar size={14} className="inline mr-1" />
              Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              <Calendar size={14} className="inline mr-1" />
              Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              <Users size={14} className="inline mr-1" />
              Empleado
            </label>
            <select
              value={empleadoId}
              onChange={(e) => setEmpleadoId(e.target.value)}
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
          <div className="flex items-end">
            <button
              onClick={loadData}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Promedio Entrada</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{resumen.promedioHoraEntrada}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Días Trabajados</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{resumen.diasTrabajados}</p>
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
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{resumen.totalTardanzas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <TrendingUp className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Min. Retardo Total</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{resumen.minutosRetardoTotal}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Asistencia por Día */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Asistencia por Día</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={asistenciaPorDia.slice(-15)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="fecha" 
                  tickFormatter={formatDate}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis tick={{ fill: '#9CA3AF' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Bar dataKey="presentes" name="Presentes" fill="#10B981" />
                <Bar dataKey="ausentes" name="Ausentes" fill="#EF4444" />
                <Bar dataKey="tardanzas" name="Tardanzas" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Métodos de Registro */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Métodos de Registro</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribucionMetodos}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent! * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="cantidad"
                  nameKey="metodo"
                >
                  {distribucionMetodos.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ranking de Puntualidad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Ranking de Puntualidad</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Empleado</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Puntualidad</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Tardanzas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {asistenciaPorEmpleado.slice(0, 10).map((emp, index) => (
                  <tr key={emp.empleadoId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-2">
                      <span className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-bold ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <p className="font-medium text-gray-800 dark:text-gray-100">{emp.nombre} {emp.apellido}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{emp.cargo}</p>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              emp.puntualidad >= 90 ? 'bg-green-500' :
                              emp.puntualidad >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${emp.puntualidad}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{emp.puntualidad}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{emp.tardanzas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Horas Trabajadas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Horas Trabajadas</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Empleado</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Esperadas</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Trabajadas</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {horasTrabajadas.map((h) => (
                  <tr key={h.empleadoId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-2">
                      <p className="font-medium text-gray-800 dark:text-gray-100">{h.nombre} {h.apellido}</p>
                    </td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{h.horasEsperadas}h</td>
                    <td className="px-4 py-2">
                      <span className={`font-medium ${
                        h.diferencia >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {h.horasTrabajadas}h
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        h.porcentaje >= 100 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        h.porcentaje >= 80 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {h.porcentaje}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Gráfico de tendencia */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Tendencia de Asistencia</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={asistenciaPorDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="fecha" 
                tickFormatter={formatDate}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
              />
              <YAxis tick={{ fill: '#9CA3AF' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              <Line type="monotone" dataKey="presentes" name="Presentes" stroke="#10B981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="tardanzas" name="Tardanzas" stroke="#F59E0B" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
