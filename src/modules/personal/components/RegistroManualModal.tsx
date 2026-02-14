import { useState } from 'react';
import { X, Clock, User } from 'lucide-react';
import type { Empleado } from '../../../types/personal';
import { asistenciaService } from '../../../services/personal.service';
import { getServerUrl } from '../../../services/api';

interface Props {
  empleados: Empleado[];
  onClose: () => void;
  onSave: () => void;
}

export function RegistroManualModal({ empleados, onClose, onSave }: Props) {
  const [formData, setFormData] = useState({
    empleadoId: '',
    tipo: 'entrada' as 'entrada' | 'salida',
    observacion: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.empleadoId) {
      setError('Debe seleccionar un empleado');
      return;
    }

    setLoading(true);

    try {
      await asistenciaService.registrarManual(
        Number(formData.empleadoId),
        formData.tipo,
        formData.observacion || undefined
      );
      setSuccess(`${formData.tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada exitosamente`);
      
      setTimeout(() => {
        onSave();
      }, 1000);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Error al registrar asistencia');
    } finally {
      setLoading(false);
    }
  };

  const selectedEmpleado = empleados.find((e) => e.id === Number(formData.empleadoId));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Clock size={24} />
            Registro Manual
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-lg">
              {success}
            </div>
          )}

          {/* Selector de empleado */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Empleado *
            </label>
            <select
              value={formData.empleadoId}
              onChange={(e) => setFormData({ ...formData, empleadoId: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            >
              <option value="">Seleccione un empleado</option>
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.codigo} - {emp.nombre} {emp.apellido}
                </option>
              ))}
            </select>
          </div>

          {/* Info del empleado seleccionado */}
          {selectedEmpleado && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                  {selectedEmpleado.fotoUrl ? (
                    <img
                      src={`${getServerUrl()}${selectedEmpleado.fotoUrl}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100">
                    {selectedEmpleado.nombre} {selectedEmpleado.apellido}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedEmpleado.cargo} • Horario: {selectedEmpleado.horaEntrada} - {selectedEmpleado.horaSalida}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tipo de registro */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Tipo de Registro
            </label>
            <div className="flex gap-4">
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                formData.tipo === 'entrada'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="tipo"
                  value="entrada"
                  checked={formData.tipo === 'entrada'}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'entrada' | 'salida' })}
                  className="hidden"
                />
                <span className="text-xl">↓</span>
                <span className="font-medium">Entrada</span>
              </label>

              <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                formData.tipo === 'salida'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="tipo"
                  value="salida"
                  checked={formData.tipo === 'salida'}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'entrada' | 'salida' })}
                  className="hidden"
                />
                <span className="text-xl">↑</span>
                <span className="font-medium">Salida</span>
              </label>
            </div>
          </div>

          {/* Observación */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Observación (opcional)
            </label>
            <textarea
              value={formData.observacion}
              onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
              rows={2}
              placeholder="Motivo del registro manual..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>

          {/* Hora actual */}
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Se registrará con la hora actual
            </p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.empleadoId}
              className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                formData.tipo === 'entrada'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Registrando...' : `Registrar ${formData.tipo === 'entrada' ? 'Entrada' : 'Salida'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
