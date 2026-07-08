import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Phone, Mail, MapPin } from 'lucide-react';
import { proveedorService } from '../../../services/inventario.service';
import type { Proveedor } from '../../../types/inventario';
import { ProveedorModal } from '../components/ProveedorModal';
import { Can } from '../../../components/auth/ProtectedRoute';
import { useNotification } from '../../../context/NotificationContext';
import { useConfirm } from '../../../context/ConfirmContext';

export function ProveedoresPage() {
  const { success, error: notifyError } = useNotification();
  const confirmar = useConfirm();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProveedores();
  }, []);

  const loadProveedores = async () => {
    try {
      setLoading(true);
      const data = await proveedorService.getAll(search || undefined);
      setProveedores(data);
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProveedores();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: number) => {
    const ok = await confirmar({
      title: '¿Eliminar este proveedor?',
      confirmText: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    try {
      await proveedorService.delete(id);
      setProveedores(proveedores.filter((p) => p.id !== id));
      success('Proveedor eliminado');
    } catch (error: any) {
      notifyError(error.response?.data?.error || 'Error al eliminar proveedor');
    }
  };

  const handleEdit = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setShowModal(true);
  };

  const handleSave = async () => {
    await loadProveedores();
    setShowModal(false);
    setSelectedProveedor(null);
  };

  if (loading && proveedores.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Proveedores</h1>
        <Can action="create" subject="Proveedor">
          <button
            onClick={() => {
              setSelectedProveedor(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Nuevo Proveedor
          </button>
        </Can>
      </div>

      {/* Búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar proveedores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Lista de proveedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {proveedores.map((proveedor) => (
          <div key={proveedor.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{proveedor.nombre}</h3>
              <div className="flex gap-1">
                <Can action="update" subject="Proveedor">
                  <button
                    onClick={() => handleEdit(proveedor)}
                    className="p-1 text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Edit size={18} />
                  </button>
                </Can>
                <Can action="delete" subject="Proveedor">
                  <button
                    onClick={() => handleDelete(proveedor.id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </Can>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              {proveedor.telefono && (
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  <span>{proveedor.telefono}</span>
                </div>
              )}
              {proveedor.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} />
                  <span>{proveedor.email}</span>
                </div>
              )}
              {proveedor.direccion && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  <span>{proveedor.direccion}</span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t text-sm text-gray-500 dark:text-gray-400">
              {proveedor._count?.productos || 0} productos
            </div>
          </div>
        ))}
      </div>

      {proveedores.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No hay proveedores registrados
        </div>
      )}

      {showModal && (
        <ProveedorModal
          proveedor={selectedProveedor}
          onClose={() => {
            setShowModal(false);
            setSelectedProveedor(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}





