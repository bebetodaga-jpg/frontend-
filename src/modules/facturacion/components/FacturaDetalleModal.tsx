import { useEscapeKey } from '../../../hooks/useEscapeKey';
import { useState } from 'react';
import { X, Calendar, User, CreditCard, FileText, Download, Loader2 } from 'lucide-react';
import type { Factura } from '../../../types/facturacion';
import { facturaService } from '../../../services/facturacion.service';

interface Props {
  factura: Factura;
  onClose: () => void;
}

export function FacturaDetalleModal({ factura, onClose }: Props) {
  useEscapeKey(onClose);
  const [descargando, setDescargando] = useState(false);

  const descargarPDF = async () => {
    try {
      setDescargando(true);
      await facturaService.descargarPDF(factura.id);
    } catch (error) {
      console.error('Error descargando PDF:', error);
      alert('Error al descargar el PDF');
    } finally {
      setDescargando(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
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
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">{factura.numeroFactura}</h2>
              <span
                className={`text-xs px-2 py-1 rounded-full capitalize ${getEstadoStyle(
                  factura.estado
                )}`}
              >
                {factura.estado}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          {/* Info general */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Calendar size={16} />
              <span>{formatDate(factura.fechaEmision)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <CreditCard size={16} />
              <span className="capitalize">{factura.metodoPago}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 col-span-2">
              <User size={16} />
              <span>{factura.cliente?.nombre || 'Cliente general'}</span>
              {factura.cliente?.documento && (
                <span className="text-gray-400">({factura.cliente.documento})</span>
              )}
            </div>
          </div>

          {/* Detalle de productos */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Detalle de Productos</h3>
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Producto
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Precio
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Cant.
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {factura.detalles?.map((detalle) => (
                  <tr key={detalle.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 dark:text-gray-100">{detalle.producto?.nombre}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{detalle.producto?.codigo}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                      {formatCurrency(detalle.precioUnitario)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                      {detalle.cantidad}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800 dark:text-gray-100">
                      {formatCurrency(detalle.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Subtotal</span>
              <span>{formatCurrency(factura.subtotal)}</span>
            </div>
            {factura.descuento > 0 && (
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Descuento</span>
                <span className="text-red-600">-{formatCurrency(factura.descuento)}</span>
              </div>
            )}
            {factura.impuestos > 0 && (
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Impuestos</span>
                <span>{formatCurrency(factura.impuestos)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-gray-800 dark:text-gray-100 pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(factura.total)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-gray-700"
          >
            Cerrar
          </button>
          <button
            onClick={descargarPDF}
            disabled={descargando}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {descargando ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Descargando...
              </>
            ) : (
              <>
                <Download size={18} />
                Descargar PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}




