import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Actions, Subjects } from '../../config/ability';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredAction?: Actions;
  requiredSubject?: Subjects;
}

/**
 * Componente para proteger rutas que requieren autenticación
 */
export function ProtectedRoute({ children, requiredAction, requiredSubject }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, ability } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-700">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar permisos si se especificaron
  if (requiredAction && requiredSubject) {
    if (!ability.can(requiredAction, requiredSubject)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-700">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Acceso Denegado</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              No tienes permiso para acceder a esta sección.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

interface CanProps {
  action: Actions;
  subject: Subjects;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Componente para renderizado condicional basado en permisos
 */
export function Can({ action, subject, children, fallback = null }: CanProps) {
  const { ability } = useAuth();

  if (ability.can(action, subject)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * Componente para renderizado condicional cuando NO tiene permiso
 */
export function Cannot({ action, subject, children, fallback = null }: CanProps) {
  const { ability } = useAuth();

  if (ability.cannot(action, subject)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}




