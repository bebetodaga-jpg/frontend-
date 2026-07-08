import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';

// Code splitting por ruta: cada página se descarga solo cuando se visita,
// lo que reduce el tamaño de la carga inicial de la aplicación.
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const InventarioPage = lazy(() => import('./modules/inventario/pages/InventarioPage').then((m) => ({ default: m.InventarioPage })));
const CategoriasPage = lazy(() => import('./modules/inventario/pages/CategoriasPage').then((m) => ({ default: m.CategoriasPage })));
const ProveedoresPage = lazy(() => import('./modules/inventario/pages/ProveedoresPage').then((m) => ({ default: m.ProveedoresPage })));
const MovimientosPage = lazy(() => import('./modules/inventario/pages/MovimientosPage').then((m) => ({ default: m.MovimientosPage })));
const PuntoVentaPage = lazy(() => import('./modules/facturacion/pages/PuntoVentaPage').then((m) => ({ default: m.PuntoVentaPage })));
const ClientesPage = lazy(() => import('./modules/facturacion/pages/ClientesPage').then((m) => ({ default: m.ClientesPage })));
const HistorialVentasPage = lazy(() => import('./modules/facturacion/pages/HistorialVentasPage').then((m) => ({ default: m.HistorialVentasPage })));
const DevolucionesPage = lazy(() => import('./modules/facturacion/pages/DevolucionesPage').then((m) => ({ default: m.DevolucionesPage })));
const ReportesVentasPage = lazy(() => import('./modules/reportes/pages/ReportesVentasPage').then((m) => ({ default: m.ReportesVentasPage })));
const ReportesInventarioPage = lazy(() => import('./modules/reportes/pages/ReportesInventarioPage').then((m) => ({ default: m.ReportesInventarioPage })));
const UsuariosPage = lazy(() => import('./modules/admin/pages/UsuariosPage').then((m) => ({ default: m.UsuariosPage })));
const ConfiguracionSMSPage = lazy(() => import('./modules/admin/pages/ConfiguracionSMSPage').then((m) => ({ default: m.ConfiguracionSMSPage })));
const ConfiguracionCamaraPage = lazy(() => import('./modules/admin/pages/ConfiguracionCamaraPage').then((m) => ({ default: m.ConfiguracionCamaraPage })));
const EmpleadosPage = lazy(() => import('./modules/personal/pages/EmpleadosPage').then((m) => ({ default: m.EmpleadosPage })));
const AsistenciaPage = lazy(() => import('./modules/personal/pages/AsistenciaPage').then((m) => ({ default: m.AsistenciaPage })));
const MonitorAsistenciaPage = lazy(() => import('./modules/personal/pages/MonitorAsistenciaPage').then((m) => ({ default: m.MonitorAsistenciaPage })));
const ReportesAsistenciaPage = lazy(() => import('./modules/personal/pages/ReportesAsistenciaPage').then((m) => ({ default: m.ReportesAsistenciaPage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
      <Loader2 className="animate-spin mr-2" size={24} />
      Cargando...
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Ruta pública */}
            <Route path="/login" element={<LoginPage />} />

            {/* Rutas protegidas */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardPage />} />
              <Route path="inventario" element={<InventarioPage />} />
              <Route path="categorias" element={<CategoriasPage />} />
              <Route path="proveedores" element={<ProveedoresPage />} />
              <Route path="movimientos" element={<MovimientosPage />} />
              <Route path="facturacion" element={<PuntoVentaPage />} />
              <Route path="clientes" element={<ClientesPage />} />
              <Route path="ventas" element={<HistorialVentasPage />} />
              <Route path="devoluciones" element={<DevolucionesPage />} />
              <Route path="reportes/ventas" element={<ReportesVentasPage />} />
              <Route path="reportes/inventario" element={<ReportesInventarioPage />} />
              {/* Rutas de Personal */}
              <Route path="empleados" element={<EmpleadosPage />} />
              <Route path="asistencia" element={<AsistenciaPage />} />
              <Route path="monitor" element={<MonitorAsistenciaPage />} />
              <Route path="reportes/asistencia" element={<ReportesAsistenciaPage />} />
              {/* Ruta de administración (solo admin) */}
              <Route path="usuarios" element={
                <ProtectedRoute requiredAction="manage" requiredSubject="Usuario">
                  <UsuariosPage />
                </ProtectedRoute>
              } />
              <Route path="configuracion/sms" element={
                <ProtectedRoute requiredAction="manage" requiredSubject="Usuario">
                  <ConfiguracionSMSPage />
                </ProtectedRoute>
              } />
              <Route path="configuracion/camara" element={
                <ProtectedRoute requiredAction="manage" requiredSubject="Usuario">
                  <ConfiguracionCamaraPage />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
