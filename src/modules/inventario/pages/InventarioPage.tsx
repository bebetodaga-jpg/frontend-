import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { productoService, categoriaService } from '../../../services/inventario.service';
import type { Producto, Categoria } from '../../../types/inventario';
import { ProductoModal } from '../components/ProductoModal';
import { StockModal } from '../components/StockModal';
import { Can } from '../../../components/auth/ProtectedRoute';
import { useAbility } from '../../../hooks/useAbility';

export function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const { can } = useAbility();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productosData, categoriasData] = await Promise.all([
        productoService.getAll(),
        categoriaService.getAll(),
      ]);
      setProductos(productosData);
      setCategorias(categoriasData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const data = await productoService.getAll(search);
      setProductos(data);
    } catch (error) {
      console.error('Error buscando:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este producto?')) return;
    try {
      await productoService.delete(id);
      setProductos(productos.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error eliminando:', error);
    }
  };

  const handleEdit = (producto: Producto) => {
    setSelectedProducto(producto);
    setShowModal(true);
  };

  const handleStock = (producto: Producto) => {
    setSelectedProducto(producto);
    setShowStockModal(true);
  };

  const handleSave = async () => {
    await loadData();
    setShowModal(false);
    setSelectedProducto(null);
  };

  const handleStockUpdate = async () => {
    await loadData();
    setShowStockModal(false);
    setSelectedProducto(null);
  };

  const filteredProductos = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">Inventario de Productos</h1>
        <Can action="create" subject="Producto">
          <button
            onClick={() => {
              setSelectedProducto(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
          >
            <Plus size={20} />
            Nuevo Producto
          </button>
        </Can>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Vista móvil - Cards */}
      <div className="block lg:hidden space-y-3">
        {filteredProductos.map((producto) => (
          <div key={producto.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{producto.nombre}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{producto.codigo}</p>
              </div>
              <span
                className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                  producto.stockActual <= producto.stockMinimo
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {producto.stockActual <= producto.stockMinimo && <AlertTriangle size={14} />}
                {producto.stockActual}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Categoría:</span>
                <span className="ml-1 text-gray-900 dark:text-gray-100">{producto.categoria?.nombre || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">P. Venta:</span>
                <span className="ml-1 font-semibold text-blue-600">S/{producto.precioVenta.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-2 justify-end border-t pt-3 dark:border-gray-700">
              {can('create', 'MovimientoInventario') && (
                <button
                  onClick={() => handleStock(producto)}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200"
                >
                  Ajustar Stock
                </button>
              )}
              <Can action="update" subject="Producto">
                <button
                  onClick={() => handleEdit(producto)}
                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                >
                  <Edit size={18} />
                </button>
              </Can>
              <Can action="delete" subject="Producto">
                <button
                  onClick={() => handleDelete(producto.id)}
                  className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </Can>
            </div>
          </div>
        ))}
        {filteredProductos.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500 dark:text-gray-400">
            No se encontraron productos
          </div>
        )}
      </div>

      {/* Vista desktop - Tabla */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                P. Compra
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                P. Venta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredProductos.map((producto) => (
              <tr key={producto.id} className="hover:bg-gray-50 dark:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {producto.codigo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {producto.nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {producto.categoria?.nombre || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  S/{producto.precioCompra.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  S/{producto.precioVenta.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {can('create', 'MovimientoInventario') ? (
                    <button
                      onClick={() => handleStock(producto)}
                      className={`flex items-center gap-1 px-2 py-1 rounded ${
                        producto.stockActual <= producto.stockMinimo
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {producto.stockActual <= producto.stockMinimo && (
                        <AlertTriangle size={14} />
                      )}
                      {producto.stockActual} {producto.unidadMedida}
                    </button>
                  ) : (
                    <span
                      className={`flex items-center gap-1 px-2 py-1 rounded ${
                        producto.stockActual <= producto.stockMinimo
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {producto.stockActual <= producto.stockMinimo && (
                        <AlertTriangle size={14} />
                      )}
                      {producto.stockActual} {producto.unidadMedida}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex gap-2">
                    <Can action="update" subject="Producto">
                      <button
                        onClick={() => handleEdit(producto)}
                        className="p-1 text-blue-600 hover:bg-gray-100 dark:bg-gray-700 rounded"
                      >
                        <Edit size={18} />
                      </button>
                    </Can>
                    <Can action="delete" subject="Producto">
                      <button
                        onClick={() => handleDelete(producto.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    </Can>
                  </div>
                </td>
              </tr>
            ))}
            {filteredProductos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No se encontraron productos
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Modales */}
      {showModal && (
        <ProductoModal
          producto={selectedProducto}
          categorias={categorias}
          onClose={() => {
            setShowModal(false);
            setSelectedProducto(null);
          }}
          onSave={handleSave}
        />
      )}

      {showStockModal && selectedProducto && (
        <StockModal
          producto={selectedProducto}
          onClose={() => {
            setShowStockModal(false);
            setSelectedProducto(null);
          }}
          onSave={handleStockUpdate}
        />
      )}
    </div>
  );
}





