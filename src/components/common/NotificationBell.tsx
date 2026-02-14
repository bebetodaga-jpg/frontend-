import { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, Package, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { productoService } from '../../services/inventario.service';
import type { Producto } from '../../types/inventario';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [productosStockBajo, setProductosStockBajo] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const lowStock = await productoService.getLowStock();
        setProductosStockBajo(lowStock);
      } catch (error) {
        console.error('Error cargando notificaciones:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Recargar cada 5 minutos
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notificationCount = productosStockBajo.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors"
      >
        <Bell size={24} />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Notificaciones</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-300"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">Cargando...</div>
            ) : productosStockBajo.length > 0 ? (
              <>
                <div className="px-4 py-2 bg-red-50 border-b border-red-100">
                  <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
                    <AlertTriangle size={16} />
                    <span>Alertas de Stock Bajo ({productosStockBajo.length})</span>
                  </div>
                </div>
                {productosStockBajo.slice(0, 5).map((producto) => (
                  <div
                    key={producto.id}
                    className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 dark:bg-gray-700"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Package className="text-red-600" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{producto.nombre}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{producto.codigo}</p>
                        <p className="text-sm text-red-600 font-medium">
                          Stock: {producto.stockActual} / Mín: {producto.stockMinimo}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {productosStockBajo.length > 5 && (
                  <Link
                    to="/inventario?stockBajo=true"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 text-center text-blue-600 hover:bg-blue-50 text-sm font-medium"
                  >
                    Ver todos ({productosStockBajo.length - 5} más)
                  </Link>
                )}
              </>
            ) : (
              <div className="p-8 text-center">
                <div className="p-3 bg-green-100 rounded-full inline-block mb-3">
                  <Bell className="text-green-600" size={24} />
                </div>
                <p className="text-gray-600 dark:text-gray-300">No hay notificaciones</p>
                <p className="text-sm text-gray-400">Todo está en orden</p>
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <Link
              to="/reportes/inventario"
              onClick={() => setIsOpen(false)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Ver reporte de inventario →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}




