import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth
import LoginPage from './pages/auth/LoginPage';
import OlvidePasswordPage from './pages/auth/OlvidePasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Admin
import AdminLayout from './components/shared/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsuariosPage from './pages/admin/UsuariosPage';
import ReunionesPage from './pages/admin/ReunionesPage';
import GruposPage from './pages/admin/GruposPage';
import NinosPage from './pages/admin/NinosPage';
import ChecklistPage from './pages/admin/ChecklistPage';
import PublicacionesAdminPage from './pages/admin/PublicacionesAdminPage';
import ReportesPage from './pages/admin/ReportesPage';
import PerfilPage from './pages/shared/PerfilPage';

// Docente
import DocenteLayout from './components/shared/DocenteLayout';
import DocenteDashboard from './pages/docente/DocenteDashboard';
import MisGruposPage from './pages/docente/MisGruposPage';
import ChecklistDocentePage from './pages/docente/ChecklistDocentePage';
import TareasPage from './pages/docente/TareasPage';
import PublicacionesDocentePage from './pages/docente/PublicacionesDocentePage';

// Ayudante
import AyudanteLayout from './components/shared/AyudanteLayout';
import AyudanteDashboard from './pages/ayudante/AyudanteDashboard';
import ChecklistAyudantePage from './pages/ayudante/ChecklistAyudantePage';

// Público (niños)
import PaginaPublica from './pages/publico/PaginaPublica';

// Rutas protegidas
const RutaProtegida = ({ children, roles }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"/></div>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/dashboard" replace />;
  return children;
};

const RutaPublica = ({ children }) => {
  const { usuario } = useAuth();
  if (usuario) return <Navigate to="/dashboard" replace />;
  return children;
};

const DashboardRedirect = () => {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.rol === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (usuario.rol === 'docente') return <Navigate to="/docente/dashboard" replace />;
  if (usuario.rol === 'ayudante') return <Navigate to="/ayudante/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Routes>
          {/* Público */}
          <Route path="/" element={<PaginaPublica />} />
          <Route path="/login" element={<RutaPublica><LoginPage /></RutaPublica>} />
          <Route path="/olvide-password" element={<OlvidePasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          {/* Redirect por rol */}
          <Route path="/dashboard" element={<RutaProtegida><DashboardRedirect /></RutaProtegida>} />

          {/* Admin */}
          <Route path="/admin" element={<RutaProtegida roles={['admin']}><AdminLayout /></RutaProtegida>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="reuniones" element={<ReunionesPage />} />
            <Route path="grupos" element={<GruposPage />} />
            <Route path="ninos" element={<NinosPage />} />
            <Route path="checklist" element={<ChecklistPage />} />
            <Route path="publicaciones" element={<PublicacionesAdminPage />} />
            <Route path="reportes" element={<ReportesPage />} />
            <Route path="perfil" element={<PerfilPage />} />
          </Route>

          {/* Docente */}
          <Route path="/docente" element={<RutaProtegida roles={['docente']}><DocenteLayout /></RutaProtegida>}>
            <Route path="dashboard" element={<DocenteDashboard />} />
            <Route path="grupos" element={<MisGruposPage />} />
            <Route path="checklist" element={<ChecklistDocentePage />} />
            <Route path="tareas" element={<TareasPage />} />
            <Route path="publicaciones" element={<PublicacionesDocentePage />} />
            <Route path="perfil" element={<PerfilPage />} />
          </Route>

          {/* Ayudante */}
          <Route path="/ayudante" element={<RutaProtegida roles={['ayudante']}><AyudanteLayout /></RutaProtegida>}>
            <Route path="dashboard" element={<AyudanteDashboard />} />
            <Route path="checklist" element={<ChecklistAyudantePage />} />
            <Route path="perfil" element={<PerfilPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
