import { useAuth } from '../context/AuthContext';
import type { Actions, Subjects } from '../config/ability';

/**
 * Hook para verificar permisos CASL
 */
export function useAbility() {
  const { ability } = useAuth();

  /**
   * Verificar si el usuario puede realizar una acción sobre un recurso
   */
  const can = (action: Actions, subject: Subjects): boolean => {
    return ability.can(action, subject);
  };

  /**
   * Verificar si el usuario NO puede realizar una acción sobre un recurso
   */
  const cannot = (action: Actions, subject: Subjects): boolean => {
    return ability.cannot(action, subject);
  };

  return { can, cannot, ability };
}
