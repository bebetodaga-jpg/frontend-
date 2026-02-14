import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Package, AlertTriangle, Tags, DollarSign, Truck, TrendingUp, ShoppingCart, Receipt, BarChart3 } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { productoService, proveedorService } from '../services/inventario.service';
import { facturaService } from '../services/facturacion.service';
import type { EstadisticasInventario, Producto } from '../types/inventario';
import type { EstadisticasVentas, VentaDiaria } from '../types/facturacion';

export function DashboardPage() {
  const [estadisticas, setEstadisticas] = useState<EstadisticasInventario | null>(null);
  const [estadisticasVentas, setEstadisticasVentas] = useState<EstadisticasVentas | null>(null);
  const [productosStockBajo, setProductosStockBajo] = useState<Producto[]>([]);
  const [ventasPorDia, setVentasPorDia] = useState<VentaDiaria[]>([]);
  const [_totalProveedores, setTotalProveedores] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      const [stats, lowStock, proveedores, ventasStats, ventas7dias] = await Promise.all([
        productoService.getEstadisticas(),
        productoService.getLowStock(),
        proveedorService.getAll(),
        facturaService.getEstadisticas().catch(() => null),
        facturaService.getVentasPorDia().catch(() => []),
      ]);
      setEstadisticas(stats);
      setProductosStockBajo(lowStock);
      setTotalProveedores(proveedores.length);
      setEstadisticasVentas(ventasStats);
      setVentasPorDia(ventas7dias);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatCurrency = (value: number | undefined) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value ?? 0);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
              <Package className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Productos</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {loading ? '...' : estadisticas?.totalProductos || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${(estadisticas?.productosStockBajo || 0) > 0 ? 'bg-red-100' : 'bg-yellow-100'}`}>
              <AlertTriangle className={`${(estadisticas?.productosStockBajo || 0) > 0 ? 'text-red-600' : 'text-yellow-600'}`} size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Stock Bajo</p>
              <p className={`text-2xl font-bold ${(estadisticas?.productosStockBajo || 0) > 0 ? 'text-red-600' : 'text-gray-800 dark:text-gray-100'}`}>
                {loading ? '...' : estadisticas?.productosStockBajo || 0}
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Ventas Hoy</p>
              <p className="text-2xl font-bold text-green-600">
                {loading ? '...' : formatCurrency(estadisticasVentas?.ventasHoy || 0)}
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Valor Inventario</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {loading ? '...' : formatCurrency(estadisticas?.valorInventario || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Segunda fila de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-full">
              <Receipt className="text-indigo-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Facturas Hoy</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {loading ? '...' : estadisticasVentas?.facturasHoy || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-100 rounded-full">
              <ShoppingCart className="text-cyan-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ventas Mes</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {loading ? '...' : formatCurrency(estadisticasVentas?.ventasMes || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <Tags className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Categorías</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {loading ? '...' : estadisticas?.totalCategorias || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de ventas últimos 7 días */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Ventas Últimos 7 Días</h2>
            <Link to="/reportes/ventas" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
              <BarChart3 size={16} />
              Ver reportes
            </Link>
          </div>
          {ventasPorDia.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={ventasPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="fecha" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('es-MX', { weekday: 'short' });
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `S/${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value as number), 'Ventas']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('es-MX')}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3B82F6" 
                  fill="#93C5FD" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              No hay datos de ventas
            </div>
          )}
        </div>

        {/* Productos con stock bajo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Alertas de Stock Bajo</h2>
            <Link to="/inventario" className="text-blue-600 text-sm hover:underline">
              Ver todos
            </Link>
          </div>
          {productosStockBajo.length > 0 ? (
            <div className="space-y-3">
              {productosStockBajo.slice(0, 5).map((producto) => (
                <div key={producto.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">{producto.nombre}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{producto.codigo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-600 font-bold">{producto.stockActual} unidades</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Mínimo: {producto.stockMinimo}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No hay productos con stock bajo
            </p>
          )}
        </div>

        {/* Accesos rápidos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Accesos Rápidos</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/facturacion"
              className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <ShoppingCart className="text-green-600" size={24} />
              <span className="font-medium text-gray-800 dark:text-gray-100">Punto de Venta</span>
            </Link>
            <Link
              to="/ventas"
              className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Receipt className="text-indigo-600" size={24} />
              <span className="font-medium text-gray-800 dark:text-gray-100">Historial Ventas</span>
            </Link>
            <Link
              to="/inventario"
              className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-gray-100 dark:bg-gray-700 transition-colors"
            >
              <Package className="text-blue-600" size={24} />
              <span className="font-medium text-gray-800 dark:text-gray-100">Productos</span>
            </Link>
            <Link
              to="/clientes"
              className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <DollarSign className="text-purple-600" size={24} />
              <span className="font-medium text-gray-800 dark:text-gray-100">Clientes</span>
            </Link>
            <Link
              to="/categorias"
              className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <Tags className="text-orange-600" size={24} />
              <span className="font-medium text-gray-800 dark:text-gray-100">Categorías</span>
            </Link>
            <Link
              to="/proveedores"
              className="flex items-center gap-3 p-4 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors"
            >
              <Truck className="text-cyan-600" size={24} />
              <span className="font-medium text-gray-800 dark:text-gray-100">Proveedores</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}





