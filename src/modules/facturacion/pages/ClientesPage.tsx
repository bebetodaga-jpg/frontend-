import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { clienteService } from '../../../services/facturacion.service';
import type { Cliente } from '../../../types/facturacion';
import { ClienteModal } from '../components/ClienteModal';

export function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [search, setSearch] = useState('');

  const loadClientes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await clienteService.getAll(search || undefined);
      setClientes(data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadClientes();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadClientes]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este cliente?')) return;
    try {
      await clienteService.delete(id);
      setClientes(clientes.filter((c) => c.id !== id));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || 'Error al eliminar cliente');
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowModal(true);
  };

  const handleSave = async () => {
    await loadClientes();
    setShowModal(false);
    setSelectedCliente(null);
  };

  if (loading && clientes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Clientes</h1>
        <button
          onClick={() => {
            setSelectedCliente(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      {/* Búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar clientes por nombre, documento, teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientes.map((cliente) => (
          <div key={cliente.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{cliente.nombre}</h3>
                {cliente.documento && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Doc: {cliente.documento}</p>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(cliente)}
                  className="p-1 text-blue-600 hover:bg-gray-100 dark:bg-gray-700 rounded"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(cliente.id)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              {cliente.telefono && (
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  <span>{cliente.telefono}</span>
                </div>
              )}
              {cliente.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} />
                  <span>{cliente.email}</span>
                </div>
              )}
              {cliente.direccion && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  <span>{cliente.direccion}</span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <FileText size={14} />
              <span>{cliente._count?.facturas || 0} facturas</span>
            </div>
          </div>
        ))}
      </div>

      {clientes.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No hay clientes registrados
        </div>
      )}

      {showModal && (
        <ClienteModal
          cliente={selectedCliente}
          onClose={() => {
            setShowModal(false);
            setSelectedCliente(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}





