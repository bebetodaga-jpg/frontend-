import { useEscapeKey } from '../../../hooks/useEscapeKey';
import { X, RotateCcw, Package, Calendar, User, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { Devolucion } from '../../../types/facturacion';

interface Props {
  devolucion: Devolucion;
  onClose: () => void;
}

export function DetalleDevolucionModal({ devolucion, onClose }: Props) {
  useEscapeKey(onClose);
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
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      pendiente: { 
        bg: 'bg-yellow-100 dark:bg-yellow-900/30', 
        text: 'text-yellow-700 dark:text-yellow-300',
        icon: <Clock size={16} />
      },
      aprobada: { 
        bg: 'bg-green-100 dark:bg-green-900/30', 
        text: 'text-green-700 dark:text-green-300',
        icon: <CheckCircle size={16} />
      },
      rechazada: { 
        bg: 'bg-red-100 dark:bg-red-900/30', 
        text: 'text-red-700 dark:text-red-300',
        icon: <XCircle size={16} />
      },
    };
    return badges[estado] || badges.pendiente;
  };

  const badge = getEstadoBadge(devolucion.estado);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <RotateCcw className="text-orange-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Detalle de Devolución
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
          {/* Info principal */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Número</p>
              <p className="font-mono font-bold text-lg text-gray-800 dark:text-gray-100">
                {devolucion.numeroDevolucion}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
                {badge.icon}
                {devolucion.estado.charAt(0).toUpperCase() + devolucion.estado.slice(1)}
              </span>
            </div>
          </div>

          {/* Datos de la factura */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-2">
              <FileText size={18} />
              <span className="font-medium">Factura Original</span>
            </div>
            <p className="font-mono text-gray-800 dark:text-gray-100">
              {devolucion.factura?.numeroFactura}
            </p>
            {devolucion.factura?.cliente && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-300">
                <User size={14} />
                {devolucion.factura.cliente.nombre}
              </div>
            )}
          </div>

          {/* Fecha */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-4">
            <Calendar size={18} />
            <span>{formatDate(devolucion.fechaDevolucion)}</span>
          </div>

          {/* Motivo */}
          {devolucion.motivo && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Motivo:</p>
              <p className="text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                {devolucion.motivo}
              </p>
            </div>
          )}

          {/* Productos devueltos */}
          <div className="mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Productos devueltos:</p>
            <div className="space-y-2">
              {devolucion.detalles?.map((detalle, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Package size={18} className="text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {detalle.producto?.nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        {detalle.cantidad} x {formatCurrency(detalle.precioUnitario)}
                      </p>
                    </div>
                  </div>
                  <span className="font-medium text-gray-800 dark:text-gray-100">
                    {formatCurrency(detalle.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-orange-700 dark:text-orange-300 font-medium">
                Monto Devuelto
              </span>
              <span className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {formatCurrency(devolucion.montoDevuelto)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
