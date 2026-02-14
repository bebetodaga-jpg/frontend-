import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { categoriaService } from '../../../services/inventario.service';
import type { Categoria } from '../../../types/inventario';
import { CategoriaModal } from '../components/CategoriaModal';
import { Can } from '../../../components/auth/ProtectedRoute';

export function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      setLoading(true);
      const data = await categoriaService.getAll();
      setCategorias(data);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta categoría?')) return;
    try {
      await categoriaService.delete(id);
      setCategorias(categorias.filter((c) => c.id !== id));
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar categoría');
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setSelectedCategoria(categoria);
    setShowModal(true);
  };

  const handleSave = async () => {
    await loadCategorias();
    setShowModal(false);
    setSelectedCategoria(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Categorías</h1>
        <Can action="create" subject="Categoria">
          <button
            onClick={() => {
              setSelectedCategoria(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Nueva Categoría
          </button>
        </Can>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categorias.map((categoria) => (
          <div key={categoria.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{categoria.nombre}</h3>
              <div className="flex gap-1">
                <Can action="update" subject="Categoria">
                  <button
                    onClick={() => handleEdit(categoria)}
                    className="p-1 text-blue-600 hover:bg-gray-100 dark:bg-gray-700 rounded"
                  >
                    <Edit size={18} />
                  </button>
                </Can>
                <Can action="delete" subject="Categoria">
                  <button
                    onClick={() => handleDelete(categoria.id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </Can>
              </div>
            </div>
            {categoria.descripcion && (
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{categoria.descripcion}</p>
            )}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {categoria._count?.productos || 0} productos
            </div>
          </div>
        ))}
        {categorias.length === 0 && (
          <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
            No hay categorías registradas
          </div>
        )}
      </div>

      {showModal && (
        <CategoriaModal
          categoria={selectedCategoria}
          onClose={() => {
            setShowModal(false);
            setSelectedCategoria(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}





