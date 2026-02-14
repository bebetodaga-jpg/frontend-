import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Camera, User, UserCheck, UserX, Clock } from 'lucide-react';
import { empleadoService } from '../../../services/personal.service';
import { getServerUrl } from '../../../services/api';
import type { Empleado, EstadisticasEmpleados } from '../../../types/personal';
import { EmpleadoModal } from '../components/EmpleadoModal';
import { RegistroFacialModal } from '../components/RegistroFacialModal';
import { Can } from '../../../components/auth/ProtectedRoute';

export function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasEmpleados | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showFacialModal, setShowFacialModal] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'activos' | 'inactivos'>('todos');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empleadosData, estadisticasData] = await Promise.all([
        empleadoService.getAll(),
        empleadoService.getEstadisticas(),
      ]);
      setEmpleados(empleadosData);
      setEstadisticas(estadisticasData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este empleado? Esta acción no se puede deshacer.')) return;
    try {
      await empleadoService.delete(id);
      setEmpleados(empleados.filter((e) => e.id !== id));
      loadData(); // Recargar estadísticas
    } catch (error) {
      alert((error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al eliminar empleado');
    }
  };

  const handleToggleActivo = async (empleado: Empleado) => {
    try {
      await empleadoService.toggleActivo(empleado.id);
      loadData();
    } catch (error) {
      console.error('Error actualizando estado:', error);
    }
  };

  const handleEdit = (empleado: Empleado) => {
    setSelectedEmpleado(empleado);
    setShowModal(true);
  };

  const handleRegistrarRostro = (empleado: Empleado) => {
    setSelectedEmpleado(empleado);
    setShowFacialModal(true);
  };

  const handleSave = async () => {
    await loadData();
    setShowModal(false);
    setSelectedEmpleado(null);
  };

  const handleFacialSave = async () => {
    await loadData();
    setShowFacialModal(false);
    setSelectedEmpleado(null);
  };

  const filteredEmpleados = empleados.filter((e) => {
    // Filtro por búsqueda
    const matchesSearch =
      e.nombre.toLowerCase().includes(search.toLowerCase()) ||
      e.apellido.toLowerCase().includes(search.toLowerCase()) ||
      e.codigo.toLowerCase().includes(search.toLowerCase()) ||
      e.dni.includes(search);

    // Filtro por estado
    if (filtroActivo === 'activos') return matchesSearch && e.activo;
    if (filtroActivo === 'inactivos') return matchesSearch && !e.activo;
    return matchesSearch;
  });

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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Gestión de Empleados</h1>
        <Can action="create" subject="Empleado">
          <button
            onClick={() => {
              setSelectedEmpleado(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Nuevo Empleado
          </button>
        </Can>
      </div>

      {/* Tarjetas de estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{estadisticas.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Activos</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{estadisticas.activos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <UserX className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Inactivos</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{estadisticas.inactivos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Camera className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Con Rostro</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{estadisticas.conRostroRegistrado}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, código o DNI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroActivo('todos')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filtroActivo === 'todos'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroActivo('activos')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filtroActivo === 'activos'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200'
              }`}
            >
              Activos
            </button>
            <button
              onClick={() => setFiltroActivo('inactivos')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filtroActivo === 'inactivos'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200'
              }`}
            >
              Inactivos
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de empleados */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Empleado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                DNI
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cargo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Horario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Rostro
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredEmpleados.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No se encontraron empleados
                </td>
              </tr>
            ) : (
              filteredEmpleados.map((empleado) => (
                <tr key={empleado.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                        {empleado.fotoUrl ? (
                          <img
                            src={`${getServerUrl()}${empleado.fotoUrl}`}
                            alt={empleado.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          {empleado.nombre} {empleado.apellido}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{empleado.codigo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{empleado.dni}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{empleado.cargo}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                      <Clock size={14} />
                      <span>{empleado.horaEntrada} - {empleado.horaSalida}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActivo(empleado)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        empleado.activo
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {empleado.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        empleado.datosFaciales
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {empleado.datosFaciales ? 'Registrado' : 'Sin registro'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleRegistrarRostro(empleado)}
                        className="p-2 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-lg transition-colors"
                        title="Registrar rostro"
                      >
                        <Camera size={18} />
                      </button>
                      <Can action="update" subject="Empleado">
                        <button
                          onClick={() => handleEdit(empleado)}
                          className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                      </Can>
                      <Can action="delete" subject="Empleado">
                        <button
                          onClick={() => handleDelete(empleado.id)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </Can>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modales */}
      {showModal && (
        <EmpleadoModal
          empleado={selectedEmpleado}
          onClose={() => {
            setShowModal(false);
            setSelectedEmpleado(null);
          }}
          onSave={handleSave}
        />
      )}

      {showFacialModal && selectedEmpleado && (
        <RegistroFacialModal
          empleado={selectedEmpleado}
          onClose={() => {
            setShowFacialModal(false);
            setSelectedEmpleado(null);
          }}
          onSave={handleFacialSave}
        />
      )}
    </div>
  );
}
