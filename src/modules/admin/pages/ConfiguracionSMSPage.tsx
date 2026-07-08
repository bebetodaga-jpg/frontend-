import { useState, useEffect } from 'react';
import { MessageSquare, Send, Settings, History, Phone, Bell, Save, TestTube, CheckCircle, XCircle, Clock } from 'lucide-react';
import { smsService, type ConfiguracionSMS, type NotificacionSMS } from '../../../services/sms.service';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';

export function ConfiguracionSMSPage() {
  const { user } = useAuth();
  const { success, error: notifyError, warning } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'preferencias' | 'historial'>('config');
  
  // Configuración global
  const [config, setConfig] = useState<ConfiguracionSMS>({
    twilioAccountSid: null,
    twilioAuthToken: null,
    twilioPhoneNumber: null,
    stockMinimoAlerta: 5,
    ventaMinimaAlerta: 500,
    horaInicioEnvio: '08:00',
    horaFinEnvio: '20:00',
    activo: false,
  });

  // Preferencias del usuario
  const [celular, setCelular] = useState('');
  const [preferencias, setPreferencias] = useState({
    smsStockBajo: false,
    smsVentasGrandes: false,
    smsTardanzas: false,
    smsAusencias: false,
  });

  // Historial
  const [historial, setHistorial] = useState<NotificacionSMS[]>([]);

  // Prueba
  const [numeroPrueba, setNumeroPrueba] = useState('');
  const [enviandoPrueba, setEnviandoPrueba] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configData, historialData] = await Promise.all([
        smsService.getConfig(),
        smsService.getHistorial({ limit: 50 }),
      ]);
      setConfig(configData);
      setHistorial(historialData);
    } catch (error) {
      console.error('Error cargando datos SMS:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await smsService.saveConfig(config);
      success('Configuración guardada correctamente');
    } catch (error: any) {
      notifyError('Error al guardar', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferencias = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await smsService.updatePreferencias(user.id, {
        celular: celular || null,
        ...preferencias,
      });
      success('Preferencias guardadas');
    } catch (error: any) {
      notifyError('Error al guardar', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEnviarPrueba = async () => {
    if (!numeroPrueba) {
      warning('Ingrese un número de teléfono');
      return;
    }
    setEnviandoPrueba(true);
    setResultadoPrueba(null);
    try {
      const result = await smsService.enviarPrueba(numeroPrueba);
      setResultadoPrueba({ success: true, message: result.message });
      loadData(); // Recargar historial
    } catch (error: any) {
      setResultadoPrueba({ success: false, message: error.response?.data?.error || error.message });
    } finally {
      setEnviandoPrueba(false);
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      stock_bajo: 'Stock Bajo',
      venta_grande: 'Venta Grande',
      tardanza: 'Tardanza',
      ausencia: 'Ausencia',
      prueba: 'Prueba',
    };
    return labels[tipo] || tipo;
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'enviado': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <MessageSquare className="w-8 h-8" />
          Notificaciones SMS
        </h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Settings size={16} className="inline mr-1" />
            Configuración Twilio
          </button>
          <button
            onClick={() => setActiveTab('preferencias')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'preferencias'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Bell size={16} className="inline mr-1" />
            Mis Preferencias
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'historial'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <History size={16} className="inline mr-1" />
            Historial
          </button>
        </nav>
      </div>

      {/* Tab: Configuración Twilio */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Credenciales Twilio */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Credenciales de Twilio
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Obtén tus credenciales en{' '}
              <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                console.twilio.com
              </a>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Account SID
                </label>
                <input
                  type="text"
                  value={config.twilioAccountSid || ''}
                  onChange={(e) => setConfig({ ...config, twilioAccountSid: e.target.value })}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Auth Token
                </label>
                <input
                  type="password"
                  value={config.twilioAuthToken || ''}
                  onChange={(e) => setConfig({ ...config, twilioAuthToken: e.target.value })}
                  placeholder="************************"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Número de Twilio
                </label>
                <input
                  type="text"
                  value={config.twilioPhoneNumber || ''}
                  onChange={(e) => setConfig({ ...config, twilioPhoneNumber: e.target.value })}
                  placeholder="+1234567890"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={config.activo}
                  onChange={(e) => setConfig({ ...config, activo: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor="activo" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Activar notificaciones SMS
                </label>
              </div>
            </div>
          </div>

          {/* Configuración de alertas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Configuración de Alertas
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Alertar stock bajo cuando sea menor o igual a:
                </label>
                <input
                  type="number"
                  value={config.stockMinimoAlerta}
                  onChange={(e) => setConfig({ ...config, stockMinimoAlerta: parseInt(e.target.value) || 0 })}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Alertar ventas mayores a: (S/)
                </label>
                <input
                  type="number"
                  value={config.ventaMinimaAlerta}
                  onChange={(e) => setConfig({ ...config, ventaMinimaAlerta: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="50"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Hora inicio envío
                  </label>
                  <input
                    type="time"
                    value={config.horaInicioEnvio}
                    onChange={(e) => setConfig({ ...config, horaInicioEnvio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Hora fin envío
                  </label>
                  <input
                    type="time"
                    value={config.horaFinEnvio}
                    onChange={(e) => setConfig({ ...config, horaFinEnvio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Los SMS solo se enviarán dentro de este horario
              </p>
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              <Save size={18} />
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>

          {/* Prueba de SMS */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <TestTube size={20} />
              Enviar SMS de Prueba
            </h3>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={numeroPrueba}
                  onChange={(e) => setNumeroPrueba(e.target.value)}
                  placeholder="+51999999999"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                />
              </div>
              <button
                onClick={handleEnviarPrueba}
                disabled={enviandoPrueba || !config.activo}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                <Send size={18} />
                {enviandoPrueba ? 'Enviando...' : 'Enviar Prueba'}
              </button>
            </div>
            
            {!config.activo && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                ⚠️ Active las notificaciones SMS para poder enviar pruebas
              </p>
            )}
            
            {resultadoPrueba && (
              <div className={`mt-4 p-3 rounded-lg ${
                resultadoPrueba.success 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {resultadoPrueba.success ? <CheckCircle className="inline mr-2" size={16} /> : <XCircle className="inline mr-2" size={16} />}
                {resultadoPrueba.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Preferencias */}
      {activeTab === 'preferencias' && (
        <div className="max-w-xl">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Mis Preferencias de Notificación
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  <Phone size={14} className="inline mr-1" />
                  Mi número de celular
                </label>
                <input
                  type="text"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                  placeholder="+51999999999"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Incluir código de país (+51 para Perú)
                </p>
              </div>

              <div className="border-t dark:border-gray-700 pt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                  Recibir notificaciones de:
                </p>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={preferencias.smsStockBajo}
                      onChange={(e) => setPreferencias({ ...preferencias, smsStockBajo: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="text-gray-700 dark:text-gray-200">
                      📦 Stock bajo de productos
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={preferencias.smsVentasGrandes}
                      onChange={(e) => setPreferencias({ ...preferencias, smsVentasGrandes: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="text-gray-700 dark:text-gray-200">
                      💰 Ventas grandes
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={preferencias.smsTardanzas}
                      onChange={(e) => setPreferencias({ ...preferencias, smsTardanzas: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="text-gray-700 dark:text-gray-200">
                      ⏰ Tardanzas de empleados
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={preferencias.smsAusencias}
                      onChange={(e) => setPreferencias({ ...preferencias, smsAusencias: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="text-gray-700 dark:text-gray-200">
                      ❌ Ausencias de empleados
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <button
              onClick={handleSavePreferencias}
              disabled={saving}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              <Save size={18} />
              {saving ? 'Guardando...' : 'Guardar Preferencias'}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Historial */}
      {activeTab === 'historial' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Fecha/Hora
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Destinatario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Mensaje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {historial.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No hay SMS enviados aún
                    </td>
                  </tr>
                ) : (
                  historial.map((sms) => (
                    <tr key={sms.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                        <Clock size={14} className="inline mr-1 text-gray-400" />
                        {new Date(sms.createdAt).toLocaleString('es-PE')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {getTipoLabel(sms.tipo)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                        {sms.destinatario}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(sms.estado)}`}>
                          {sms.estado === 'enviado' && <CheckCircle size={12} className="inline mr-1" />}
                          {sms.estado === 'error' && <XCircle size={12} className="inline mr-1" />}
                          {sms.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                        {sms.error || sms.mensaje}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
