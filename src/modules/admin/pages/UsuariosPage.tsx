import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Key, ToggleLeft, ToggleRight, Shield, ShoppingCart } from 'lucide-react';
import api from '../../../services/api';
import { useNotification } from '../../../context/NotificationContext';
import { useConfirm } from '../../../context/ConfirmContext';

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: 'ADMIN' | 'VENDEDOR';
  activo: boolean;
  createdAt: string;
}

type ApiError = { response?: { data?: { error?: string } } };

export function UsuariosPage() {
  const { success, error: notifyError } = useNotification();
  const confirmar = useConfirm();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    rol: 'VENDEDOR' as 'ADMIN' | 'VENDEDOR'
  });
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      const response = await api.get('/usuarios');
      setUsuarios(response.data);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (editingUser) {
        await api.put(`/usuarios/${editingUser.id}`, {
          email: formData.email,
          nombre: formData.nombre,
          rol: formData.rol
        });
      } else {
        await api.post('/usuarios', formData);
      }
      setShowModal(false);
      resetForm();
      loadUsuarios();
      success(editingUser ? 'Usuario actualizado' : 'Usuario creado');
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.error || 'Error al guardar usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedUserId) return;
    setSaving(true);

    try {
      await api.post(`/usuarios/${selectedUserId}/reset-password`, { newPassword });
      setShowPasswordModal(false);
      setNewPassword('');
      setSelectedUserId(null);
      success('Contraseña actualizada');
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.error || 'Error al cambiar contraseña');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivo = async (usuario: Usuario) => {
    try {
      await api.post(`/usuarios/${usuario.id}/toggle-activo`);
      loadUsuarios();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      notifyError(apiError.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirmar({
      title: '¿Eliminar este usuario?',
      message: 'El usuario perderá el acceso al sistema.',
      confirmText: 'Eliminar',
      danger: true,
    });
    if (!ok) return;

    try {
      await api.delete(`/usuarios/${id}`);
      loadUsuarios();
      success('Usuario eliminado');
    } catch (err: unknown) {
      const apiError = err as ApiError;
      notifyError(apiError.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  const openEditModal = (usuario: Usuario) => {
    setEditingUser(usuario);
    setFormData({
      email: usuario.email,
      password: '',
      nombre: usuario.nombre,
      rol: usuario.rol
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({ email: '', password: '', nombre: '', rol: 'VENDEDOR' });
    setError('');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Gestión de Usuarios</h1>
          <p className="text-gray-500 dark:text-gray-400">Administra los usuarios del sistema</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Usuario</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Email</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Rol</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Estado</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">Cargando...</td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">No hay usuarios registrados</td>
              </tr>
            ) : (
              usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-b border-gray-100 hover:bg-gray-50 dark:bg-gray-700">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        usuario.rol === 'ADMIN' ? 'bg-purple-100' : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        {usuario.rol === 'ADMIN' ? (
                          <Shield className="w-5 h-5 text-purple-600" />
                        ) : (
                          <ShoppingCart className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-100">{usuario.nombre}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{usuario.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      usuario.rol === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-gray-100 dark:bg-gray-700 text-blue-700'
                    }`}>
                      {usuario.rol === 'ADMIN' ? 'Administrador' : 'Vendedor'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleActivo(usuario)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        usuario.activo
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {usuario.activo ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          Activo
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          Inactivo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(usuario)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setSelectedUserId(usuario.id); setShowPasswordModal(true); }}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Cambiar contraseña"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(usuario.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    minLength={6}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Rol</label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value as 'ADMIN' | 'VENDEDOR' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="VENDEDOR">Vendedor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : editingUser ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Cambiar Contraseña</h2>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nueva Contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowPasswordModal(false); setNewPassword(''); }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Cambiar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}





