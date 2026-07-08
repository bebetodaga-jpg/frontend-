import { useEscapeKey } from '../../../hooks/useEscapeKey';
import { useState } from 'react';
import { X, ArrowUp, ArrowDown } from 'lucide-react';
import type { Producto, MovimientoStock } from '../../../types/inventario';
import { productoService } from '../../../services/inventario.service';

interface Props {
  producto: Producto;
  onClose: () => void;
  onSave: () => void;
}

export function StockModal({ producto, onClose, onSave }: Props) {
  useEscapeKey(onClose);
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada');
  const [cantidad, setCantidad] = useState(1);
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const movimiento: MovimientoStock = {
        tipo,
        cantidad,
        motivo: motivo || undefined,
      };
      await productoService.updateStock(producto.id, movimiento);
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar stock');
    } finally {
      setLoading(false);
    }
  };

  const nuevoStock = tipo === 'entrada' 
    ? producto.stockActual + cantidad 
    : producto.stockActual - cantidad;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Movimiento de Stock</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Producto</p>
            <p className="font-semibold">{producto.nombre}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Stock actual</p>
            <p className="text-2xl font-bold">{producto.stockActual} {producto.unidadMedida}</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Tipo de movimiento
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTipo('entrada')}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  tipo === 'entrada'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600'
                }`}
              >
                <ArrowUp size={20} />
                Entrada
              </button>
              <button
                type="button"
                onClick={() => setTipo('salida')}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  tipo === 'salida'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600'
                }`}
              >
                <ArrowDown size={20} />
                Salida
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Cantidad
            </label>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              min="1"
              max={tipo === 'salida' ? producto.stockActual : undefined}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Motivo (opcional)
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Compra a proveedor, Venta, Ajuste..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600">Nuevo stock después del movimiento</p>
            <p className={`text-2xl font-bold ${nuevoStock < 0 ? 'text-red-600' : 'text-blue-700'}`}>
              {nuevoStock} {producto.unidadMedida}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || nuevoStock < 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




