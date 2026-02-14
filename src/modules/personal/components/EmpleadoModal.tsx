import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import type { Empleado, CreateEmpleadoDTO } from '../../../types/personal';
import { CARGOS } from '../../../types/personal';
import { empleadoService } from '../../../services/personal.service';
import { getServerUrl } from '../../../services/api';

interface Props {
  empleado: Empleado | null;
  onClose: () => void;
  onSave: () => void;
}

export function EmpleadoModal({ empleado, onClose, onSave }: Props) {
  const [formData, setFormData] = useState<CreateEmpleadoDTO>({
    codigo: '',
    nombre: '',
    apellido: '',
    dni: '',
    cargo: 'Vendedor',
    horaEntrada: '08:00',
    horaSalida: '18:00',
  });
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cargosDisponibles, setCargosDisponibles] = useState<string[]>([...CARGOS]);

  useEffect(() => {
    if (empleado) {
      setFormData({
        codigo: empleado.codigo,
        nombre: empleado.nombre,
        apellido: empleado.apellido,
        dni: empleado.dni,
        cargo: empleado.cargo,
        horaEntrada: empleado.horaEntrada,
        horaSalida: empleado.horaSalida,
      });
      if (empleado.fotoUrl) {
        setFotoPreview(`${getServerUrl()}${empleado.fotoUrl}`);
      }
    }
    // Cargar cargos del backend
    empleadoService.getCargos().then((cargos) => {
      if (cargos.length > 0) {
        setCargosDisponibles([...new Set([...CARGOS, ...cargos])]);
      }
    }).catch(() => {
      // Usar cargos por defecto si falla
    });
  }, [empleado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validar DNI (8 dígitos)
      if (!/^\d{8}$/.test(formData.dni)) {
        throw new Error('El DNI debe tener exactamente 8 dígitos');
      }

      // Validar formato de hora
      const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!horaRegex.test(formData.horaEntrada || '08:00')) {
        throw new Error('Formato de hora de entrada inválido (HH:MM)');
      }
      if (!horaRegex.test(formData.horaSalida || '18:00')) {
        throw new Error('Formato de hora de salida inválido (HH:MM)');
      }

      let savedEmpleado: Empleado;
      if (empleado) {
        savedEmpleado = await empleadoService.update(empleado.id, formData);
      } else {
        savedEmpleado = await empleadoService.create(formData);
      }

      // Subir foto si se seleccionó una nueva
      if (foto) {
        await empleadoService.uploadFoto(savedEmpleado.id, foto);
      }

      onSave();
    } catch (err) {
      const error = err as { message?: string; response?: { data?: { error?: string } } };
      setError(error.message || error.response?.data?.error || 'Error al guardar empleado');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {empleado ? 'Editar Empleado' : 'Nuevo Empleado'}
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

          {/* Foto de empleado */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden border-4 border-gray-300 dark:border-gray-500">
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                <Upload size={16} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Código *
              </label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                required
                placeholder="EMP001"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                DNI *
              </label>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                required
                maxLength={8}
                placeholder="12345678"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Apellido *
              </label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Cargo *
              </label>
              <select
                name="cargo"
                value={formData.cargo}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              >
                {cargosDisponibles.map((cargo) => (
                  <option key={cargo} value={cargo}>
                    {cargo}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Hora Entrada
                </label>
                <input
                  type="time"
                  name="horaEntrada"
                  value={formData.horaEntrada}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Hora Salida
                </label>
                <input
                  type="time"
                  name="horaSalida"
                  value={formData.horaSalida}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : empleado ? 'Guardar Cambios' : 'Crear Empleado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
