import { useState } from 'react';
import { X, RotateCcw, Package } from 'lucide-react';
import type { Factura } from '../../../types/facturacion';
import { facturaService } from '../../../services/facturacion.service';

interface Props {
  factura: Factura;
  onClose: () => void;
  onDevolucionProcesada: () => void;
}

interface ItemDevolucion {
  productoId: number;
  nombre: string;
  cantidadOriginal: number;
  cantidadDevolver: number;
}

export function DevolucionModal({ factura, onClose, onDevolucionProcesada }: Props) {
  const [items, setItems] = useState<ItemDevolucion[]>(
    factura.detalles?.map((d) => ({
      productoId: d.productoId,
      nombre: d.producto?.nombre || '',
      cantidadOriginal: d.cantidad,
      cantidadDevolver: 0,
    })) || []
  );
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const actualizarCantidad = (productoId: number, cantidad: number) => {
    setItems(
      items.map((item) => {
        if (item.productoId === productoId) {
          return {
            ...item,
            cantidadDevolver: Math.min(Math.max(0, cantidad), item.cantidadOriginal),
          };
        }
        return item;
      })
    );
  };

  const itemsADevolver = items.filter((i) => i.cantidadDevolver > 0);

  const procesarDevolucion = async () => {
    if (itemsADevolver.length === 0) {
      setError('Seleccione al menos un producto para devolver');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await facturaService.procesarDevolucion(factura.id, {
        detalles: itemsADevolver.map((item) => ({
          productoId: item.productoId,
          cantidad: item.cantidadDevolver,
        })),
        motivo: motivo || undefined,
      });

      onDevolucionProcesada();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Error al procesar devolución');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-blue-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <RotateCcw className="text-orange-600" size={24} />
            <h2 className="text-xl font-semibold">Procesar Devolución</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Factura: <span className="font-semibold">{factura.numeroFactura}</span>
          </p>

          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.productoId}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Package size={20} className="text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">{item.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Facturado: {item.cantidadOriginal} unidades
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Devolver:</span>
                  <input
                    type="number"
                    min="0"
                    max={item.cantidadOriginal}
                    value={item.cantidadDevolver}
                    onChange={(e) =>
                      actualizarCantidad(item.productoId, parseInt(e.target.value) || 0)
                    }
                    className="w-16 text-center border border-gray-300 dark:border-gray-600 rounded py-1"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              Motivo de la devolución (opcional)
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Producto defectuoso, error en la compra..."
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {itemsADevolver.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Se devolverán {itemsADevolver.length} producto(s):
              </p>
              <ul className="text-xs text-blue-600 mt-1">
                {itemsADevolver.map((item) => (
                  <li key={item.productoId}>
                    • {item.nombre} x {item.cantidadDevolver}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={procesarDevolucion}
            disabled={loading || itemsADevolver.length === 0}
            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            {loading ? 'Procesando...' : 'Procesar Devolución'}
          </button>
        </div>
      </div>
    </div>
  );
}





