import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Camera, Upload, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import type { Empleado } from '../../../types/personal';
import { facialService } from '../../../services/personal.service';

interface Props {
  empleado: Empleado;
  onClose: () => void;
  onSave: () => void;
}

export function RegistroFacialModal({ empleado, onClose, onSave }: Props) {
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch {
      setError('No se pudo acceder a la cámara. Verifique los permisos.');
      setMode('upload');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraActive(false);
    }
  }, []);

  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, startCamera, stopCamera]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setError('');
    setSuccess('');
    if (mode === 'camera') {
      startCamera();
    }
  };

  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handleRegister = async () => {
    if (!capturedImage) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const blob = dataURLtoBlob(capturedImage);
      const file = new File([blob], 'rostro.jpg', { type: 'image/jpeg' });
      
      await facialService.registrarRostro(empleado.id, file);
      setSuccess('¡Rostro registrado exitosamente!');
      
      setTimeout(() => {
        onSave();
      }, 1500);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Error al registrar rostro');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!empleado.datosFaciales) return;
    if (!confirm('¿Está seguro de eliminar el registro facial de este empleado?')) return;

    setLoading(true);
    setError('');

    try {
      await facialService.eliminarRostro(empleado.id);
      setSuccess('Registro facial eliminado');
      setTimeout(() => {
        onSave();
      }, 1500);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Error al eliminar registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xl mx-4">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Registro Facial - {empleado.nombre} {empleado.apellido}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle size={20} />
              {success}
            </div>
          )}

          {/* Estado actual */}
          {empleado.datosFaciales && !capturedImage && (
            <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <p className="text-purple-700 dark:text-purple-300 mb-2">
                Este empleado ya tiene un rostro registrado.
              </p>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <Trash2 size={16} />
                Eliminar registro actual
              </button>
            </div>
          )}

          {/* Selector de modo */}
          {!capturedImage && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMode('camera')}
                className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  mode === 'camera'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                }`}
              >
                <Camera size={18} />
                Usar Cámara
              </button>
              <button
                onClick={() => setMode('upload')}
                className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  mode === 'upload'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                }`}
              >
                <Upload size={18} />
                Subir Foto
              </button>
            </div>
          )}

          {/* Área de captura/preview */}
          <div className="relative aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden mb-4">
            {capturedImage ? (
              <img src={capturedImage} alt="Captura" className="w-full h-full object-cover" />
            ) : mode === 'camera' ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!cameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    Iniciando cámara...
                  </div>
                )}
              </>
            ) : (
              <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors">
                <Upload size={48} className="text-gray-400 mb-2" />
                <span className="text-gray-400">Haz clic para subir una foto</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Guía para buena foto */}
          {!capturedImage && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Para mejor precisión:</strong>
              </p>
              <ul className="text-sm text-blue-600 dark:text-blue-400 list-disc list-inside mt-1">
                <li>Rostro centrado y de frente</li>
                <li>Buena iluminación</li>
                <li>Sin lentes oscuros ni gorra</li>
                <li>Expresión neutral</li>
              </ul>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-3">
            {!capturedImage && mode === 'camera' && cameraActive && (
              <button
                onClick={capturePhoto}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Camera size={18} />
                Capturar Foto
              </button>
            )}

            {capturedImage && (
              <>
                <button
                  onClick={retakePhoto}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Tomar otra
                </button>
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Registrando...' : 'Registrar Rostro'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
