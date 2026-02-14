import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Package, LayoutDashboard, Tags, Truck, History, ShoppingCart, Users, Receipt, BarChart3, PieChart, LogOut, Shield, UserCircle, UserCog, ClipboardList, Video, FileBarChart, MessageSquare, Camera, RotateCcw, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Can } from '../auth/ProtectedRoute';

interface SidebarProps {
  onClose?: () => void;
}

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inventario', label: 'Inventario', icon: Package },
  { path: '/categorias', label: 'Categorías', icon: Tags },
  { path: '/proveedores', label: 'Proveedores', icon: Truck },
  { path: '/movimientos', label: 'Movimientos', icon: History },
  { path: '/facturacion', label: 'Punto de Venta', icon: ShoppingCart },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/ventas', label: 'Historial Ventas', icon: Receipt },
  { path: '/devoluciones', label: 'Devoluciones', icon: RotateCcw },
  { path: '/reportes/ventas', label: 'Reportes Ventas', icon: BarChart3 },
  { path: '/reportes/inventario', label: 'Reportes Inventario', icon: PieChart },
  { path: '/empleados', label: 'Empleados', icon: UserCog },
  { path: '/asistencia', label: 'Asistencia', icon: ClipboardList },
  { path: '/monitor', label: 'Monitor Cámara', icon: Video },
  { path: '/reportes/asistencia', label: 'Reportes Asistencia', icon: FileBarChart },
];

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    // Cerrar sidebar en móvil al hacer clic en un enlace
    if (onClose) onClose();
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 text-gray-800 dark:text-white h-screen flex flex-col border-r border-gray-200 dark:border-gray-700 transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h1 className="text-xl font-bold">🔧 Ferretería Gabi</h1>
        {/* Botón cerrar en móvil */}
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Cerrar menú"
        >
          <X size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            user?.rol === 'ADMIN' ? 'bg-purple-600' : 'bg-blue-600'
          }`}>
            {user?.rol === 'ADMIN' ? (
              <Shield className="w-5 h-5 text-white" />
            ) : (
              <UserCircle className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.nombre}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.rol === 'ADMIN' ? 'Administrador' : 'Vendedor'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              </li>
            );
          })}
          
          {/* Menu de Usuarios - Solo Admin */}
          <Can action="manage" subject="Usuario">
            <li>
              <Link
                to="/usuarios"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  location.pathname === '/usuarios'
                    ? 'bg-purple-600 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                <Shield size={18} />
                <span className="text-sm">Usuarios</span>
              </Link>
            </li>
            <li>
              <Link
                to="/configuracion/sms"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  location.pathname === '/configuracion/sms'
                    ? 'bg-purple-600 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                <MessageSquare size={18} />
                <span className="text-sm">SMS</span>
              </Link>
            </li>
            <li>
              <Link
                to="/configuracion/camara"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  location.pathname === '/configuracion/camara'
                    ? 'bg-purple-600 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                <Camera size={18} />
                <span className="text-sm">Cámara IP</span>
              </Link>
            </li>
          </Can>
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-gray-600 dark:text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

