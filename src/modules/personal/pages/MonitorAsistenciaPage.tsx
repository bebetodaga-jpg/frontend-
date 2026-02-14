import { useState, useEffect, useRef, useCallback } from 'react';
import { Video, VideoOff, Play, Square, RefreshCw, Wifi, WifiOff, User, Clock, Camera, Webcam, Radio } from 'lucide-react';
import { asistenciaService } from '../../../services/personal.service';
import { getServerUrl } from '../../../services/api';
import { camaraIPService, type ConfiguracionCamara } from '../../../services/camara-ip.service';
import type { RegistroAsistencia, ResumenAsistenciaHoy } from '../../../types/personal';

type CameraSource = 'webcam' | 'ip-camera';

interface DetectionEvent {
  id: string;
  type: 'detection' | 'error' | 'status';
  empleado?: {
    id: number;
    nombre: string;
    apellido: string;
    cargo: string;
    fotoUrl?: string;
  };
  confidence?: number;
  tipo?: 'entrada' | 'salida';
  tardanza?: number;
  message?: string;
  timestamp: Date;
}

export function MonitorAsistenciaPage() {
  const [resumen, setResumen] = useState<ResumenAsistenciaHoy | null>(null);
  const [ultimosRegistros, setUltimosRegistros] = useState<RegistroAsistencia[]>([]);
  const [events, setEvents] = useState<DetectionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para webcam del navegador
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Estado para cámara IP
  const [cameraSource, setCameraSource] = useState<CameraSource>('webcam');
  const [ipCameraConfig, setIpCameraConfig] = useState<ConfiguracionCamara | null>(null);
  const [ipCameraStreaming, setIpCameraStreaming] = useState(false);
  const [ipRecognizing, setIpRecognizing] = useState(false);
  
  const ipRecognitionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadInitialData();
    loadIpCameraConfig();
    return () => {
      stopWebcam();
      if (ipRecognitionIntervalRef.current) {
        clearInterval(ipRecognitionIntervalRef.current);
      }
    };
  }, []);

  const loadIpCameraConfig = async () => {
    try {
      const config = await camaraIPService.getConfig();
      if (config) {
        setIpCameraConfig(config);
        if (config.usarParaAsistencia) {
          setCameraSource('ip-camera');
        }
      }
    } catch (error) {
      console.error('Error cargando config cámara IP:', error);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [resumenData, registrosData] = await Promise.all([
        asistenciaService.getResumenHoy(),
        asistenciaService.getHoy(),
      ]);
      setResumen(resumenData);
      setUltimosRegistros(registrosData.slice(0, 10));
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===== FUNCIONES PARA WEBCAM DEL NAVEGADOR =====
  const startWebcam = async () => {
    try {
      setWebcamError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Esperar a que el video esté listo para reproducir
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setWebcamActive(true);
            // Iniciar reconocimiento automático cada 3 segundos
            startRecognitionLoop();
          }).catch((err) => {
            console.error('Error reproduciendo video:', err);
            setWebcamError('Error al reproducir el video de la cámara');
          });
        };
      } else {
        setWebcamError('Error interno: elemento de video no encontrado');
      }
    } catch (error: any) {
      console.error('Error accediendo a webcam:', error);
      if (error.name === 'NotAllowedError') {
        setWebcamError('Permiso denegado. Por favor permite el acceso a la cámara.');
      } else if (error.name === 'NotFoundError') {
        setWebcamError('No se encontró ninguna webcam conectada.');
      } else {
        setWebcamError('Error al acceder a la webcam: ' + error.message);
      }
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (recognitionIntervalRef.current) {
      clearInterval(recognitionIntervalRef.current);
      recognitionIntervalRef.current = null;
    }
    setWebcamActive(false);
    setIsRecognizing(false);
  };

  const captureFrame = useCallback((): File | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    // Convertir a blob
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const byteString = atob(dataUrl.split(',')[1]);
    const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: mimeString });
    return new File([blob], 'webcam-capture.jpg', { type: 'image/jpeg' });
  }, []);

  const startRecognitionLoop = () => {
    if (recognitionIntervalRef.current) {
      clearInterval(recognitionIntervalRef.current);
    }

    // Reconocer cada 3 segundos
    recognitionIntervalRef.current = setInterval(async () => {
      if (isRecognizing || !streamRef.current) return;
      
      const file = captureFrame();
      if (!file) return;
      
      setIsRecognizing(true);
      try {
        const result = await asistenciaService.marcarAsistencia(file);
        
        if (result && result.empleado) {
          addEvent({
            type: 'detection',
            empleado: {
              id: result.empleado.id,
              nombre: result.empleado.nombre,
              apellido: result.empleado.apellido,
              cargo: result.empleado.cargo,
              fotoUrl: result.empleado.fotoUrl,
            },
            tipo: result.tipo,
            tardanza: result.tardanza,
          });
          loadInitialData();
        }
      } catch (error: any) {
        // Solo mostrar errores importantes, no "no se detectó rostro"
        if (error.response?.status !== 400) {
          console.error('Error en reconocimiento:', error);
        }
      } finally {
        setIsRecognizing(false);
      }
    }, 3000);
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Funciones para cámara IP
  const handleStartIpCamera = async () => {
    if (!ipCameraConfig) return;
    
    try {
      await camaraIPService.startStream();
      setIpCameraStreaming(true);
      
      // Iniciar reconocimiento continuo cada 3 segundos
      startIpRecognitionLoop();
    } catch (error) {
      console.error('Error iniciando cámara IP:', error);
      addEvent({
        type: 'error',
        message: 'Error conectando con cámara IP',
      });
    }
  };

  const handleStopIpCamera = async () => {
    try {
      await camaraIPService.stopStream();
      setIpCameraStreaming(false);
      
      if (ipRecognitionIntervalRef.current) {
        clearInterval(ipRecognitionIntervalRef.current);
        ipRecognitionIntervalRef.current = null;
      }
    } catch (error) {
      console.error('Error deteniendo cámara IP:', error);
    }
  };

  const startIpRecognitionLoop = () => {
    if (ipRecognitionIntervalRef.current) {
      clearInterval(ipRecognitionIntervalRef.current);
    }

    // Reconocer cada 3 segundos
    ipRecognitionIntervalRef.current = setInterval(async () => {
      if (ipRecognizing) return;
      
      setIpRecognizing(true);
      try {
        const result = await camaraIPService.reconocer();
        
        if (result.success && result.empleado) {
          addEvent({
            type: 'detection',
            empleado: result.empleado,
            confidence: result.confidence,
            tipo: result.tipo,
            tardanza: result.tardanza,
          });
          loadInitialData();
        }
      } catch (error) {
        // Silenciar errores de reconocimiento (no hay rostro visible, etc.)
      } finally {
        setIpRecognizing(false);
      }
    }, 3000);
  };

  const addEvent = (data: Partial<DetectionEvent>) => {
    const newEvent: DetectionEvent = {
      id: Date.now().toString(),
      type: data.type || 'detection',
      empleado: data.empleado,
      confidence: data.confidence,
      tipo: data.tipo,
      tardanza: data.tardanza,
      message: data.message,
      timestamp: new Date(),
    };
    setEvents((prev) => [newEvent, ...prev].slice(0, 20));
  };

  const handleCameraSourceChange = (source: CameraSource) => {
    // Detener la cámara actual si está activa
    if (cameraSource === 'webcam' && webcamActive) {
      stopWebcam();
    } else if (cameraSource === 'ip-camera' && ipCameraStreaming) {
      handleStopIpCamera();
    }
    setCameraSource(source);
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
          <Video size={28} />
          Monitor de Asistencia
        </h1>
        <div className="flex items-center gap-4">
          {/* Selector de fuente de cámara */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => handleCameraSourceChange('webcam')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                cameraSource === 'webcam'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Webcam size={16} />
              Webcam
            </button>
            <button
              onClick={() => handleCameraSourceChange('ip-camera')}
              disabled={!ipCameraConfig}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                cameraSource === 'ip-camera'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={!ipCameraConfig ? 'Configure una cámara IP primero' : ''}
            >
              <Radio size={16} />
              Cámara IP
            </button>
          </div>

          {/* Estado de conexión */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
            (cameraSource === 'webcam' && webcamActive) || (cameraSource === 'ip-camera' && ipCameraStreaming)
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }`}>
            {((cameraSource === 'webcam' && webcamActive) || (cameraSource === 'ip-camera' && ipCameraStreaming)) 
              ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span className="text-sm font-medium">
              {(cameraSource === 'webcam' && webcamActive) || (cameraSource === 'ip-camera' && ipCameraStreaming) 
                ? 'Detectando' : 'Detenido'}
            </span>
          </div>
          
          {/* Botones de control - Webcam */}
          {cameraSource === 'webcam' && (
            webcamActive ? (
              <button
                onClick={stopWebcam}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Square size={18} />
                Detener
              </button>
            ) : (
              <button
                onClick={startWebcam}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play size={18} />
                Iniciar Detección
              </button>
            )
          )}

          {/* Botones de control - Cámara IP */}
          {cameraSource === 'ip-camera' && (
            ipCameraStreaming ? (
              <button
                onClick={handleStopIpCamera}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Square size={18} />
                Detener
              </button>
            ) : (
              <button
                onClick={handleStartIpCamera}
                disabled={!ipCameraConfig}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play size={18} />
                Iniciar Cámara IP
              </button>
            )
          )}
        </div>
      </div>

      {/* Mensaje de error de webcam */}
      {cameraSource === 'webcam' && webcamError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300">
            ❌ {webcamError}
          </p>
        </div>
      )}

      {/* Mensaje si no hay cámara IP configurada */}
      {cameraSource === 'ip-camera' && !ipCameraConfig && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-700 dark:text-yellow-300">
            ⚠️ No hay una cámara IP configurada. Vaya a <strong>Administración → Configuración Cámara IP</strong> para configurar su cámara EZVIZ u otra compatible.
          </p>
        </div>
      )}

      {/* Canvas oculto para captura de frames */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo - Vista de cámara */}
        <div className="lg:col-span-2">
          {/* Área de video/snapshot */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                {cameraSource === 'webcam' ? <Webcam size={18} /> : <Radio size={18} />}
                {cameraSource === 'webcam' ? 'Vista Webcam' : `Cámara IP: ${ipCameraConfig?.nombre || 'EZVIZ'}`}
              </h2>
              {cameraSource === 'webcam' && isRecognizing && (
                <span className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <RefreshCw size={14} className="animate-spin" />
                  Analizando...
                </span>
              )}
              {cameraSource === 'ip-camera' && ipRecognizing && (
                <span className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                  <RefreshCw size={14} className="animate-spin" />
                  Analizando...
                </span>
              )}
            </div>
            <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
              {/* Vista Webcam - Video siempre presente pero oculto cuando no activo */}
              {cameraSource === 'webcam' && (
                <>
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted
                    className={`w-full h-full object-contain ${webcamActive ? 'block' : 'hidden'}`}
                  />
                  {webcamActive ? (
                    /* Indicador de reconocimiento activo */
                    <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      Reconocimiento Activo
                    </div>
                  ) : (
                    <div className="text-center text-gray-400">
                      <Camera size={48} className="mx-auto mb-2" />
                      <p>Webcam no iniciada</p>
                      <p className="text-sm">Presione "Iniciar Detección" para comenzar</p>
                    </div>
                  )}
                </>
              )}
              
              {/* Vista Cámara IP - Stream MJPEG */}
              {cameraSource === 'ip-camera' && (
                ipCameraStreaming ? (
                  <>
                    <img 
                      src={camaraIPService.getStreamUrl()}
                      alt="Stream Cámara IP" 
                      className="w-full h-full object-contain"
                    />
                    {/* Indicador de reconocimiento activo */}
                    <div className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      Reconocimiento Activo
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-400">
                    <Radio size={48} className="mx-auto mb-2" />
                    <p>Cámara IP desconectada</p>
                    <p className="text-sm">Presione "Iniciar Cámara IP" para comenzar</p>
                    {ipCameraConfig && (
                      <p className="text-xs mt-2 text-gray-500">
                        {ipCameraConfig.tipo.toUpperCase()} @ {ipCameraConfig.ip}:{ipCameraConfig.puerto}
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
            
            {/* Estado de detección - Webcam */}
            {cameraSource === 'webcam' && webcamActive && (
              <div className="p-3 bg-green-50 dark:bg-green-900/30 border-t dark:border-gray-700">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm">Detección activa - Intervalo: 3 segundos</span>
                </div>
              </div>
            )}
            
            {/* Estado de detección - Cámara IP */}
            {cameraSource === 'ip-camera' && ipCameraStreaming && (
              <div className="p-3 bg-purple-50 dark:bg-purple-900/30 border-t dark:border-gray-700">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  <span className="text-sm">Reconocimiento facial activo - Intervalo: 3 segundos</span>
                </div>
              </div>
            )}
          </div>

          {/* Resumen del día */}
          {resumen && (
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{resumen.totalEmpleados}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{resumen.presentes}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Presentes</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{resumen.ausentes}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ausentes</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{resumen.tardanzas}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tardanzas</p>
              </div>
            </div>
          )}
        </div>

        {/* Panel derecho - Eventos y registros */}
        <div className="space-y-6">
          {/* Eventos en tiempo real */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">Eventos en Tiempo Real</h2>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {events.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <Clock size={24} className="mx-auto mb-2" />
                  <p className="text-sm">Esperando detecciones...</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {events.map((event) => (
                    <div key={event.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                      {event.type === 'detection' && event.empleado ? (
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            event.tipo === 'entrada' ? 'bg-green-100 dark:bg-green-900' : 'bg-blue-100 dark:bg-blue-900'
                          }`}>
                            {event.empleado.fotoUrl ? (
                              <img
                                src={`${getServerUrl()}${event.empleado.fotoUrl}`}
                                alt=""
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <User size={20} className={event.tipo === 'entrada' ? 'text-green-600' : 'text-blue-600'} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 dark:text-gray-100 truncate">
                              {event.empleado.nombre} {event.empleado.apellido}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {event.tipo === 'entrada' ? '↓ Entrada' : '↑ Salida'} • {formatTime(event.timestamp)}
                              {event.tardanza && event.tardanza > 0 && (
                                <span className="ml-1 text-yellow-600"> (tarde {event.tardanza}min)</span>
                              )}
                            </p>
                          </div>
                          {event.confidence && (
                            <span className="text-xs text-gray-400">{(event.confidence * 100).toFixed(0)}%</span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{event.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Últimos registros del día */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">Registros de Hoy</h2>
              <button
                onClick={loadInitialData}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {ultimosRegistros.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <p className="text-sm">No hay registros hoy</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {ultimosRegistros.map((registro) => (
                    <div key={registro.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                          {registro.empleado?.fotoUrl ? (
                            <img
                              src={`${getServerUrl()}${registro.empleado.fotoUrl}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium text-gray-500">
                              {registro.empleado?.nombre[0]}{registro.empleado?.apellido[0]}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 dark:text-gray-100 text-sm truncate">
                            {registro.empleado?.nombre} {registro.empleado?.apellido}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className={registro.tipo === 'entrada' ? 'text-green-600' : 'text-blue-600'}>
                              {registro.tipo === 'entrada' ? '↓' : '↑'}
                            </span>
                            <span>{formatTime(registro.horaRegistro)}</span>
                            <span className={`px-1 rounded ${
                              registro.metodo === 'facial' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : ''
                            }`}>
                              {registro.metodo === 'facial' ? '📷' : '✍️'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
