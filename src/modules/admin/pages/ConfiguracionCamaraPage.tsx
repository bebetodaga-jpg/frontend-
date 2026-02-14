import { useState, useEffect } from 'react';
import { Camera, Save, TestTube, Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';
import { camaraIPService, type ConfiguracionCamara } from '../../../services/camara-ip.service';

type CameraType = 'ezviz' | 'hikvision' | 'dahua' | 'generic';

const cameraTypes: { value: CameraType; label: string; description: string; defaultPath: string }[] = [
  { value: 'ezviz', label: 'EZVIZ', description: 'Cámaras EZVIZ C6N, C3W, etc.', defaultPath: '/h264_stream' },
  { value: 'hikvision', label: 'Hikvision', description: 'Cámaras Hikvision DS-xxxx', defaultPath: '/Streaming/Channels/101' },
  { value: 'dahua', label: 'Dahua', description: 'Cámaras Dahua', defaultPath: '/cam/realmonitor?channel=1&subtype=0' },
  { value: 'generic', label: 'Genérica', description: 'Otra cámara RTSP', defaultPath: '/stream1' },
];

export function ConfiguracionCamaraPage() {
  const [config, setConfig] = useState<Partial<ConfiguracionCamara>>({
    nombre: 'Cámara Principal',
    tipo: 'ezviz',
    ip: '',
    puerto: 554,
    usuario: 'admin',
    password: '',
    rtspPath: '/h264_stream',
    activo: true,
    usarParaAsistencia: true,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await camaraIPService.getConfig();
      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    
    try {
      await camaraIPService.saveConfig(config);
      setSaveMessage({ type: 'success', text: 'Configuración guardada correctamente' });
    } catch (error) {
      console.error('Error guardando configuración:', error);
      setSaveMessage({ type: 'error', text: 'Error al guardar la configuración' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      // Primero guardar la configuración
      await camaraIPService.saveConfig(config);
      // Luego probar conexión
      const result = await camaraIPService.testConnection();
      setTestResult(result);
    } catch (error: any) {
      setTestResult({ 
        success: false, 
        message: error.response?.data?.message || 'Error al conectar con la cámara' 
      });
    } finally {
      setTesting(false);
    }
  };

  const handleTypeChange = (tipo: CameraType) => {
    const selectedType = cameraTypes.find(t => t.value === tipo);
    setConfig(prev => ({
      ...prev,
      tipo,
      rtspPath: selectedType?.defaultPath || prev.rtspPath,
    }));
  };

  const getRtspUrl = () => {
    if (!config.ip) return 'rtsp://...';
    const user = config.usuario || 'admin';
    const pass = config.password ? '****' : '';
    return `rtsp://${user}:${pass}@${config.ip}:${config.puerto}${config.rtspPath}`;
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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Camera size={28} />
          Configuración Cámara IP
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleTest}
            disabled={testing || !config.ip}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            {testing ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <TestTube size={18} />
            )}
            Probar Conexión
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Guardar
          </button>
        </div>
      </div>

      {/* Mensajes de estado */}
      {testResult && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
          testResult.success 
            ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
        }`}>
          {testResult.success ? (
            <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
          ) : (
            <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
          )}
          <span className={testResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
            {testResult.message}
          </span>
        </div>
      )}

      {saveMessage && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
          saveMessage.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
        }`}>
          {saveMessage.type === 'success' ? (
            <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
          ) : (
            <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
          )}
          <span className={saveMessage.type === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
            {saveMessage.text}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuración principal */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Datos de la Cámara
          </h2>

          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={config.nombre || ''}
                onChange={(e) => setConfig({ ...config, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Cámara Entrada"
              />
            </div>

            {/* Tipo de cámara */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Cámara
              </label>
              <div className="grid grid-cols-2 gap-2">
                {cameraTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleTypeChange(type.value)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      config.tipo === type.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <p className={`font-medium ${
                      config.tipo === type.value 
                        ? 'text-blue-700 dark:text-blue-300' 
                        : 'text-gray-800 dark:text-gray-100'
                    }`}>
                      {type.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* IP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dirección IP
              </label>
              <input
                type="text"
                value={config.ip || ''}
                onChange={(e) => setConfig({ ...config, ip: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 192.168.1.100"
              />
            </div>

            {/* Puerto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Puerto RTSP
              </label>
              <input
                type="number"
                value={config.puerto || 554}
                onChange={(e) => setConfig({ ...config, puerto: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="554"
              />
            </div>

            {/* Usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Usuario
              </label>
              <input
                type="text"
                value={config.usuario || ''}
                onChange={(e) => setConfig({ ...config, usuario: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={config.password || ''}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Contraseña de la cámara"
              />
            </div>

            {/* Ruta RTSP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ruta RTSP
              </label>
              <input
                type="text"
                value={config.rtspPath || ''}
                onChange={(e) => setConfig({ ...config, rtspPath: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="/h264_stream"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ruta específica del stream RTSP de tu cámara
              </p>
            </div>
          </div>
        </div>

        {/* Vista previa y opciones */}
        <div className="space-y-6">
          {/* URL generada */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              URL RTSP
            </h2>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-sm text-gray-700 dark:text-gray-300 break-all">
              {getRtspUrl()}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Esta es la URL que se usará para conectar con la cámara
            </p>
          </div>

          {/* Opciones */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Opciones
            </h2>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.activo || false}
                  onChange={(e) => setConfig({ ...config, activo: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100">Cámara Activa</p>
                  <p className="text-sm text-gray-500">Habilitar esta cámara para uso</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.usarParaAsistencia || false}
                  onChange={(e) => setConfig({ ...config, usarParaAsistencia: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100">Usar para Asistencia</p>
                  <p className="text-sm text-gray-500">Usarla como cámara principal para registro de asistencia</p>
                </div>
              </label>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
              Instrucciones para EZVIZ C6N
            </h3>
            <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-2 list-decimal list-inside">
              <li>Abre la app EZVIZ en tu celular</li>
              <li>Ve a la configuración de tu cámara</li>
              <li>Habilita "RTSP" en la sección de redes</li>
              <li>Anota la contraseña de verificación (es diferente a la de la app)</li>
              <li>Obtén la IP de tu cámara desde tu router o la app EZVIZ</li>
              <li>El usuario normalmente es "admin"</li>
            </ol>
          </div>

          {/* Estado actual */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              Estado
              {config.activo ? (
                <Wifi className="text-green-500" size={20} />
              ) : (
                <WifiOff className="text-gray-400" size={20} />
              )}
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Tipo:</span>
                <span className="text-gray-800 dark:text-gray-100 font-medium">
                  {cameraTypes.find(t => t.value === config.tipo)?.label || 'Desconocido'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">IP:</span>
                <span className="text-gray-800 dark:text-gray-100 font-medium">
                  {config.ip || 'No configurada'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Estado:</span>
                <span className={`font-medium ${config.activo ? 'text-green-600' : 'text-gray-500'}`}>
                  {config.activo ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
