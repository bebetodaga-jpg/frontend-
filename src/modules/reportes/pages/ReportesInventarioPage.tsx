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
} from 'recharts';
import { Download, Package, AlertTriangle, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { reportesService } from '../../../services/reportes.service';
import type { ReporteInventario, MovimientoInventario } from '../../../services/reportes.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Colores para gráficas
const _COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
void _COLORS; // Suppress unused warning - disponible para uso futuro

export function ReportesInventarioPage() {
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 30);
    return fecha.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  const [reporteInventario, setReporteInventario] = useState<ReporteInventario | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoInventario | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [inventario, movs] = await Promise.all([
        reportesService.getReporteInventario(),
        reportesService.getMovimientosInventario(fechaInicio, fechaFin),
      ]);

      setReporteInventario(inventario);
      setMovimientos(movs);
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

  // Datos para gráfico de stock
  const stockData = reporteInventario
    ? [
        { name: 'Stock Bajo', value: reporteInventario.resumen.productosStockBajo, color: '#EF4444' },
        { name: 'Sin Stock', value: reporteInventario.resumen.productosSinStock, color: '#F59E0B' },
        {
          name: 'Normal',
          value:
            reporteInventario.resumen.totalProductos -
            reporteInventario.resumen.productosStockBajo -
            reporteInventario.resumen.productosSinStock,
          color: '#10B981',
        },
      ]
    : [];

  // Datos para gráfico de movimientos
  const movimientosData = movimientos
    ? [
        { name: 'Entradas', value: movimientos.resumen.totalEntradas, color: '#10B981' },
        { name: 'Salidas', value: movimientos.resumen.totalSalidas, color: '#EF4444' },
      ]
    : [];

  // Productos por categoría
  const productosPorCategoria = reporteInventario
    ? Object.entries(
        reporteInventario.productos.reduce((acc: Record<string, number>, p: any) => {
          const cat = p.categoria?.nombre || 'Sin categoría';
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {})
      ).map(([nombre, cantidad]) => ({ nombre, cantidad }))
    : [];

  // Top productos stock bajo
  const productosStockBajo = reporteInventario
    ? reporteInventario.productos
        .filter((p: any) => p.stockActual <= p.stockMinimo)
        .slice(0, 10)
    : [];

  const exportarExcel = () => {
    if (!reporteInventario) return;

    const wb = XLSX.utils.book_new();

    // Hoja de resumen
    const resumenData = [
      ['Reporte de Inventario'],
      ['Fecha', new Date().toISOString().split('T')[0]],
      [''],
      ['Total Productos', reporteInventario.resumen.totalProductos],
      ['Productos Stock Bajo', reporteInventario.resumen.productosStockBajo],
      ['Productos Sin Stock', reporteInventario.resumen.productosSinStock],
      ['Valor Inventario (Venta)', reporteInventario.resumen.valorInventario],
      ['Costo Inventario', reporteInventario.resumen.costoInventario],
      ['Ganancia Potencial', reporteInventario.resumen.gananciaPotencial],
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    // Hoja de productos
    const productosData = [
      ['Código', 'Producto', 'Categoría', 'Stock Actual', 'Stock Mínimo', 'Precio Compra', 'Precio Venta', 'Valor Stock'],
      ...reporteInventario.productos.map((p: any) => [
        p.codigo,
        p.nombre,
        p.categoria?.nombre || 'Sin categoría',
        p.stockActual,
        p.stockMinimo,
        p.precioCompra,
        p.precioVenta,
        p.precioVenta * p.stockActual,
      ]),
    ];
    const wsProductos = XLSX.utils.aoa_to_sheet(productosData);
    XLSX.utils.book_append_sheet(wb, wsProductos, 'Productos');

    // Hoja de movimientos
    if (movimientos) {
      const movimientosData = [
        ['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Motivo'],
        ...movimientos.movimientos.map((m: any) => [
          new Date(m.createdAt).toLocaleString(),
          m.producto?.nombre || '',
          m.tipo,
          m.cantidad,
          m.motivo || '',
        ]),
      ];
      const wsMovimientos = XLSX.utils.aoa_to_sheet(movimientosData);
      XLSX.utils.book_append_sheet(wb, wsMovimientos, 'Movimientos');
    }

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `reporte_inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Reportes de Inventario</h1>
        <button
          onClick={exportarExcel}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Download size={20} />
          Exportar Excel
        </button>
      </div>

      {/* Filtros de fecha para movimientos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-500 dark:text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300">Movimientos del período:</span>
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
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <Package className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Productos</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {reporteInventario?.resumen.totalProductos || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Stock Bajo</p>
                  <p className="text-2xl font-bold text-red-600">
                    {reporteInventario?.resumen.productosStockBajo || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Valor Inventario</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(reporteInventario?.resumen.valorInventario || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <TrendingUp className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ganancia Potencial</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(reporteInventario?.resumen.gananciaPotencial || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Estado del stock */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Estado del Stock</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stockData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stockData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Movimientos del período */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Movimientos del Período ({movimientos?.resumen.totalMovimientos || 0} total)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={movimientosData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Cantidad">
                    {movimientosData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Productos por categoría */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Productos por Categoría</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productosPorCategoria} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="nombre" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill="#3B82F6" name="Productos" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Productos con stock bajo */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Productos con Stock Bajo</h2>
              <div className="overflow-y-auto max-h-[300px]">
                {productosStockBajo.length > 0 ? (
                  <div className="space-y-2">
                    {productosStockBajo.map((p: any) => (
                      <div
                        key={p.id}
                        className="flex justify-between items-center p-3 bg-red-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{p.nombre}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{p.codigo}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-red-600 font-bold">{p.stockActual} uds</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Mín: {p.stockMinimo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">No hay productos con stock bajo</p>
                )}
              </div>
            </div>
          </div>

          {/* Tabla de movimientos recientes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Movimientos Recientes</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Motivo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {movimientos?.movimientos.slice(0, 20).map((m: any) => (
                    <tr key={m.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <p className="font-medium">{m.producto?.nombre}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{m.producto?.codigo}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            m.tipo === 'entrada'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {m.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-medium">
                        {m.tipo === 'entrada' ? '+' : '-'}
                        {m.cantidad}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {m.motivo || '-'}
                      </td>
                    </tr>
                  ))}
                  {(!movimientos || movimientos.movimientos.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        No hay movimientos en el período seleccionado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}





