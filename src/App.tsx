import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import { InventarioPage } from './modules/inventario/pages/InventarioPage';
import { CategoriasPage } from './modules/inventario/pages/CategoriasPage';
import { ProveedoresPage } from './modules/inventario/pages/ProveedoresPage';
import { MovimientosPage } from './modules/inventario/pages/MovimientosPage';
import { PuntoVentaPage } from './modules/facturacion/pages/PuntoVentaPage';
import { ClientesPage } from './modules/facturacion/pages/ClientesPage';
import { HistorialVentasPage } from './modules/facturacion/pages/HistorialVentasPage';
import { DevolucionesPage } from './modules/facturacion/pages/DevolucionesPage';
import { ReportesVentasPage } from './modules/reportes/pages/ReportesVentasPage';
import { ReportesInventarioPage } from './modules/reportes/pages/ReportesInventarioPage';
import { UsuariosPage } from './modules/admin/pages/UsuariosPage';
import { ConfiguracionSMSPage } from './modules/admin/pages/ConfiguracionSMSPage';
import { ConfiguracionCamaraPage } from './modules/admin/pages/ConfiguracionCamaraPage';
import { EmpleadosPage } from './modules/personal/pages/EmpleadosPage';
import { AsistenciaPage } from './modules/personal/pages/AsistenciaPage';
import { MonitorAsistenciaPage } from './modules/personal/pages/MonitorAsistenciaPage';
import { ReportesAsistenciaPage } from './modules/personal/pages/ReportesAsistenciaPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
