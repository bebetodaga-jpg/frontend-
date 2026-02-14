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
} from 'recharts';
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign, Receipt, ShoppingCart } from 'lucide-react';
import { reportesService } from '../../../services/reportes.service';
import type {
  ProductoMasVendido,
  VentaMetodoPago,
  ClienteTop,
  VentaCategoria,
  VentaPorHora,
  ComparativaPeriodos,
} from '../../../services/reportes.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export function ReportesVentasPage() {
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 30);
    return fecha.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  // Datos
  const [productosMasVendidos, setProductosMasVendidos] = useState<ProductoMasVendido[]>([]);
  const [ventasMetodoPago, setVentasMetodoPago] = useState<VentaMetodoPago[]>([]);
  const [clientesTop, setClientesTop] = useState<ClienteTop[]>([]);
  const [ventasCategoria, setVentasCategoria] = useState<VentaCategoria[]>([]);
  const [ventasPorHora, setVentasPorHora] = useState<VentaPorHora[]>([]);
  const [comparativa, setComparativa] = useState<ComparativaPeriodos | null>(null);
  const [resumen, setResumen] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [productos, metodos, clientes, categorias, horas, comp, ventas] = await Promise.all([
        reportesService.getProductosMasVendidos(10, fechaInicio, fechaFin),
        reportesService.getVentasPorMetodoPago(fechaInicio, fechaFin),
        reportesService.getClientesTop(10, fechaInicio, fechaFin),
        reportesService.getVentasPorCategoria(fechaInicio, fechaFin),
        reportesService.getVentasPorHora(),
        reportesService.getComparativaPeriodos(fechaInicio, fechaFin),
        reportesService.getVentasPorPeriodo(fechaInicio, fechaFin),
      ]);

      setProductosMasVendidos(productos);
      setVentasMetodoPago(metodos);
      setClientesTop(clientes);
      setVentasCategoria(categorias);
      setVentasPorHora(horas.filter((h) => h.cantidad > 0));
      setComparativa(comp);
      setResumen(ventas.resumen);
    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);

  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();

    // Hoja de resumen
    const resumenData = [
      ['Reporte de Ventas'],
      ['Período', `${fechaInicio} a ${fechaFin}`],
      [''],
      ['Total Ventas', resumen?.totalVentas || 0],
      ['Cantidad Facturas', resumen?.cantidadFacturas || 0],
      ['Promedio por Venta', resumen?.promedioVenta || 0],
      ['Total Descuentos', resumen?.totalDescuentos || 0],
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    // Hoja de productos más vendidos
    const productosData = [
      ['Código', 'Producto', 'Categoría', 'Cantidad Vendida', 'Total Ventas'],
      ...productosMasVendidos.map((p) => [
        p.producto?.codigo || '',
        p.producto?.nombre || '',
        p.producto?.categoria?.nombre || 'Sin categoría',
        p.cantidadVendida,
        p.totalVentas,
      ]),
    ];
    const wsProductos = XLSX.utils.aoa_to_sheet(productosData);
    XLSX.utils.book_append_sheet(wb, wsProductos, 'Productos Más Vendidos');

    // Hoja de clientes top
    const clientesData = [
      ['Cliente', 'Documento', 'Total Compras', 'Cantidad Compras'],
      ...clientesTop.map((c) => [
        c.cliente?.nombre || 'Sin nombre',
        c.cliente?.documento || '',
        c.totalCompras,
        c.cantidadCompras,
      ]),
    ];
    const wsClientes = XLSX.utils.aoa_to_sheet(clientesData);
    XLSX.utils.book_append_sheet(wb, wsClientes, 'Clientes Top');

    // Hoja de métodos de pago
    const metodosData = [
      ['Método de Pago', 'Total', 'Cantidad'],
      ...ventasMetodoPago.map((m) => [m.metodoPago, m.total, m.cantidad]),
    ];
    const wsMetodos = XLSX.utils.aoa_to_sheet(metodosData);
    XLSX.utils.book_append_sheet(wb, wsMetodos, 'Métodos de Pago');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `reporte_ventas_${fechaInicio}_${fechaFin}.xlsx`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Reportes de Ventas</h1>
        <button
          onClick={exportarExcel}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Download size={20} />
          Exportar Excel
        </button>
      </div>

      {/* Filtros de fecha */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-500 dark:text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300">Período:</span>
          </div>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
          <span className="text-gray-500 dark:text-gray-400">a</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
          <button
            onClick={loadData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Aplicar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Ventas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(resumen?.totalVentas || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <Receipt className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Facturas</p>
                  <p className="text-2xl font-bold text-blue-600">{resumen?.cantidadFacturas || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <ShoppingCart className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Promedio/Venta</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(resumen?.promedioVenta || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-full ${
                    (comparativa?.variacionPorcentaje || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  {(comparativa?.variacionPorcentaje || 0) >= 0 ? (
                    <TrendingUp className="text-green-600" size={24} />
                  ) : (
                    <TrendingDown className="text-red-600" size={24} />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">vs Período Anterior</p>
                  <p
                    className={`text-2xl font-bold ${
                      (comparativa?.variacionPorcentaje || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {(comparativa?.variacionPorcentaje || 0) >= 0 ? '+' : ''}
                    {(comparativa?.variacionPorcentaje || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Productos más vendidos */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Productos Más Vendidos</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productosMasVendidos.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="producto.nombre"
                    type="category"
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="totalVentas" fill="#3B82F6" name="Ventas" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Ventas por método de pago */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Ventas por Método de Pago</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ventasMetodoPago}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ metodoPago, percent }) =>
                      `${metodoPago}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="total"
                    nameKey="metodoPago"
                  >
                    {ventasMetodoPago.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Ventas por categoría */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Ventas por Categoría</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ventasCategoria}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="total" fill="#10B981" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Ventas por hora */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Ventas por Hora (Hoy)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ventasPorHora}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hora" tickFormatter={(h) => `${h}:00`} />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(h) => `${h}:00`}
                  />
                  <Line type="monotone" dataKey="total" stroke="#8B5CF6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tablas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Clientes Top */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Clientes Top</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Compras
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {clientesTop.map((c, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {c.cliente?.nombre || 'Sin nombre'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">{c.cantidadCompras}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right font-medium">
                          {formatCurrency(c.totalCompras)}
                        </td>
                      </tr>
                    ))}
                    {clientesTop.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                          No hay datos de clientes
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top productos vendidos */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Detalle Productos</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Producto
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Cantidad
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {productosMasVendidos.map((p, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <p className="font-medium">{p.producto?.nombre || 'Sin nombre'}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{p.producto?.codigo}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">{p.cantidadVendida}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right font-medium">
                          {formatCurrency(p.totalVentas)}
                        </td>
                      </tr>
                    ))}
                    {productosMasVendidos.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                          No hay datos de productos
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}





