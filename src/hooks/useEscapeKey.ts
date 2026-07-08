import { useEffect } from 'react';

/**
 * Cierra un modal al presionar la tecla Escape.
 * Uso: useEscapeKey(onClose) dentro del componente del modal.
 */
export function useEscapeKey(onClose: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);
}
