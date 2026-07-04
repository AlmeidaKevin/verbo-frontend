import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import { DocenteLayout, AyudanteLayout } from './layouts/DocenteLayout';

// Auth
import LoginPage from './pages/auth/LoginPage';
import OlvidePasswordPage from './pages/auth/OlvidePasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerificarCuentaPage from './pages/auth/VerificarCuentaPage';

// Public
import PaginaPublica from './pages/public/PaginaPublica';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import UsuariosPage from './pages/admin/UsuariosPage';
import NinosPage from './pages/admin/NinosPage';
import ReunionesPage from './pages/admin/ReunionesPage';
import GruposPage from './pages/admin/GruposPage';
import ChecklistPage from './pages/admin/ChecklistPage';
import ReportesPage from './pages/admin/ReportesPage';
import PublicacionesAdminPage from './pages/admin/PublicacionesAdminPage';
import PerfilAdminPage from './pages/admin/PerfilAdminPage';

// Docente
import DocenteDashboard from './pages/docente/DocenteDashboard';
import MisGruposPage from './pages/docente/MisGruposPage';
import ChecklistDocentePage from './pages/docente/ChecklistDocentePage';
import TareasPage from './pages/docente/TareasPage';
import ReportesDocentePage from './pages/docente/ReportesDocentePage';
import PublicacionesDocentePage from './pages/docente/PublicacionesDocentePage';
import PerfilDocentePage from './pages/docente/PerfilDocentePage';

// Ayudante
import AyudanteDashboard from './pages/ayudante/AyudanteDashboard';
import ChecklistAyudantePage from './pages/ayudante/ChecklistAyudantePage';
import AvisosAyudantePage from './pages/ayudante/AvisosAyudantePage';
import PerfilAyudantePage from './pages/ayudante/PerfilAyudantePage';

// Chat
import ChatPage from './pages/chat/ChatPage';

// ── Ruta protegida ────────────────────────────────────────────
const RutaProtegida = ({ children, roles }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  );
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/login" replace />;
  return children;
};

const AppRoutes = () => {
  const { usuario } = useAuth();

  return (
    <Routes>
      {/* ── Públicas ── */}
      <Route path="/" element={<PaginaPublica />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/olvide-password" element={<OlvidePasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/verificar-cuenta/:token" element={<VerificarCuentaPage />} />

      {/* ── Admin ── */}
      <Route path="/admin" element={
        <RutaProtegida roles={['admin']}>
          <AdminLayout />
        </RutaProtegida>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"     element={<AdminDashboard />} />
        <Route path="usuarios"      element={<UsuariosPage />} />
        <Route path="ninos"         element={<NinosPage />} />
        <Route path="reuniones"     element={<ReunionesPage />} />
        <Route path="grupos"        element={<GruposPage />} />
        <Route path="checklist"     element={<ChecklistPage />} />
        <Route path="reportes"      element={<ReportesPage />} />
        <Route path="publicaciones" element={<PublicacionesAdminPage />} />
        <Route path="chat"          element={<ChatPage />} />
        <Route path="perfil"        element={<PerfilAdminPage />} />
      </Route>

      {/* ── Docente ── */}
      <Route path="/docente" element={
        <RutaProtegida roles={['docente']}>
          <DocenteLayout />
        </RutaProtegida>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"     element={<DocenteDashboard />} />
        <Route path="grupos"        element={<MisGruposPage />} />
        <Route path="checklist"     element={<ChecklistDocentePage />} />
        <Route path="tareas"        element={<TareasPage />} />
        <Route path="reportes"      element={<ReportesDocentePage />} />
        <Route path="publicaciones" element={<PublicacionesDocentePage />} />
        <Route path="chat"          element={<ChatPage />} />
        <Route path="perfil"        element={<PerfilDocentePage />} />
      </Route>

      {/* ── Ayudante ── */}
      <Route path="/ayudante" element={
        <RutaProtegida roles={['ayudante']}>
          <AyudanteLayout />
        </RutaProtegida>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AyudanteDashboard />} />
        <Route path="checklist" element={<ChecklistAyudantePage />} />
        <Route path="avisos"    element={<AvisosAyudantePage />} />
        <Route path="chat"      element={<ChatPage />} />
        <Route path="perfil"    element={<PerfilAyudantePage />} />
      </Route>

      {/* ── Catch-all ── */}
      <Route path="*" element={
        usuario
          ? <Navigate to={`/${usuario.rol}/dashboard`} replace />
          : <Navigate to="/login" replace />
      } />
    </Routes>
  );
};

const App = () => (
  <Router>
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', fontSize: '14px' },
        }}
      />
      <AppRoutes />
    </AuthProvider>
  </Router>
);

export default App;
