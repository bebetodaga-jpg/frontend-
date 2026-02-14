import { useState, useEffect, useCallback } from 'react';
import { X, Search, Loader2, CheckCircle } from 'lucide-react';
import { clienteService, reniecService } from '../../../services/facturacion.service';
import type { Cliente, CreateClienteDTO } from '../../../types/facturacion';

interface Props {
  cliente: Cliente | null;
  onClose: () => void;
  onSave: () => void;
}

export function ClienteModal({ cliente, onClose, onSave }: Props) {
  const [formData, setFormData] = useState<CreateClienteDTO>({
    nombre: '',
    documento: '',
    telefono: '',
    email: '',
    direccion: '',
  });
  const [loading, setLoading] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const [consultaExitosa, setConsultaExitosa] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre: cliente.nombre,
        documento: cliente.documento || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        direccion: cliente.direccion || '',
      });
    }
  }, [cliente]);

  // Función para consultar documento
  const consultarDocumento = useCallback(async (documento: string) => {
    const docLimpio = documento.replace(/\D/g, '');
    
    // Solo consultar si es DNI (8 dígitos) o RUC (11 dígitos)
    if (docLimpio.length !== 8 && docLimpio.length !== 11) {
      return;
    }

    setConsultando(true);
    setConsultaExitosa(false);
    setError('');

    try {
      const resultado = await reniecService.consultarDocumento(docLimpio);

      if (resultado.tipo === 'DNI') {
        setFormData((prev) => ({
          ...prev,
          documento: docLimpio,
          nombre: resultado.datos.nombreCompleto,
        }));
        setConsultaExitosa(true);
      } else if (resultado.tipo === 'RUC') {
        setFormData((prev) => ({
          ...prev,
          documento: docLimpio,
          nombre: resultado.datos.razonSocial,
          direccion: resultado.datos.direccion || prev.direccion,
        }));
        setConsultaExitosa(true);
      }
    } catch (err) {
      // No mostrar error, solo dejar que el usuario ingrese los datos manualmente
      console.log('No se encontró información para el documento');
    } finally {
      setConsultando(false);
    }
  }, []);

  // Auto-consultar cuando el documento tiene la longitud correcta
  useEffect(() => {
    const docLimpio = formData.documento.replace(/\D/g, '');
    
    if ((docLimpio.length === 8 || docLimpio.length === 11) && !cliente) {
      const timer = setTimeout(() => {
        consultarDocumento(docLimpio);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.documento, consultarDocumento, cliente]);

  const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setFormData({ ...formData, documento: valor });
    setConsultaExitosa(false);
  };

  const handleConsultarClick = () => {
    consultarDocumento(formData.documento);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (cliente) {
        await clienteService.update(cliente.id, formData);
      } else {
        await clienteService.create(formData);
      }
      onSave();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Error al guardar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-blue-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Documento (RUC/DNI)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={formData.documento}
                  onChange={handleDocumentoChange}
                  placeholder="Ingrese 8 dígitos (DNI) u 11 (RUC)"
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    consultaExitosa ? 'border-green-500 bg-green-50' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {consultando && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="animate-spin text-blue-500" size={18} />
                  </div>
                )}
                {consultaExitosa && !consultando && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="text-green-500" size={18} />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleConsultarClick}
                disabled={consultando || formData.documento.replace(/\D/g, '').length < 8}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-blue-600 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Buscar en RENIEC/SUNAT"
              >
                <Search size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Ingrese el documento y se autocompletarán los datos
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Teléfono
            </label>
            <input
              type="text"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Dirección
            </label>
            <textarea
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}






