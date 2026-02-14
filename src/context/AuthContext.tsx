import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AppAbility, User, AuthResponse } from '../config/ability';
import { createAbility, defaultAbility } from '../config/ability';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  ability: AppAbility;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'ferreteria_token';
const USER_KEY = 'ferreteria_user';
const ABILITIES_KEY = 'ferreteria_abilities';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ability, setAbility] = useState<AppAbility>(defaultAbility);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ABILITIES_KEY);
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setAbility(defaultAbility);
  }, []);

  // Cargar token del localStorage al iniciar
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const savedUser = localStorage.getItem(USER_KEY);
        const savedAbilities = localStorage.getItem(ABILITIES_KEY);

        if (token && savedUser) {
          // Configurar token en axios
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Cargar usuario y abilities guardados
          const userData = JSON.parse(savedUser);
          const abilitiesData = savedAbilities ? JSON.parse(savedAbilities) : [];
          
          setUser(userData);
          setAbility(createAbility(abilitiesData));

          // Verificar token con el servidor
          try {
            const response = await api.post('/auth/verify');
            if (response.data.valid) {
              setUser(response.data.user);
              setAbility(createAbility(response.data.abilities));
              localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
              localStorage.setItem(ABILITIES_KEY, JSON.stringify(response.data.abilities));
            }
          } catch {
            // Token inválido, limpiar
            logout();
          }
        }
      } catch (err) {
        console.error('Error loading auth:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    loadAuth();
  }, [logout]);

  const login = async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    const { user: userData, token, abilities } = response.data;

    // Guardar en localStorage
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    localStorage.setItem(ABILITIES_KEY, JSON.stringify(abilities));

    // Configurar axios
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Actualizar estado
    setUser(userData);
    setAbility(createAbility(abilities));
  };

  const refreshAuth = async () => {
    try {
      const response = await api.get<AuthResponse>('/auth/me');
      const { user: userData, abilities } = response.data;
      
      setUser(userData);
      setAbility(createAbility(abilities));
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      localStorage.setItem(ABILITIES_KEY, JSON.stringify(abilities));
    } catch {
      logout();
    }
  };

  // Interceptor para manejar errores 401
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        ability,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
