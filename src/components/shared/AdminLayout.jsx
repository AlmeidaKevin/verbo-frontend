import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  FiMenu, FiHome, FiUsers, FiGrid, FiCheckSquare, FiBarChart2,
  FiBell, FiUser, FiLogOut, FiChevronLeft, FiChevronRight,
  FiBook, FiUserCheck, FiMessageSquare
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const NAV_ITEMS = [
  { to: '/admin/dashboard',     icon: FiHome,        label: 'Dashboard' },
  { to: '/admin/usuarios',      icon: FiUsers,       label: 'Usuarios' },
  { to: '/admin/ninos',         icon: FiUserCheck,   label: 'Niños' },
  { to: '/admin/reuniones',     icon: FiBook,        label: 'Reuniones' },
  { to: '/admin/grupos',        icon: FiGrid,        label: 'Grupos' },
  { to: '/admin/checklist',     icon: FiCheckSquare, label: 'Checklist' },
  { to: '/admin/reportes',      icon: FiBarChart2,   label: 'Reportes' },
  { to: '/admin/publicaciones', icon: FiBell,        label: 'Publicaciones' },
  { to: '/admin/chat',          icon: FiMessageSquare, label: 'Chat' },
  { to: '/admin/perfil',        icon: FiUser,        label: 'Mi Perfil' },
];

const AdminLayout = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [abierto, setAbierto] = useState(false);
  const [colapsado, setColapsado] = useState(false);
  const [noLeidosPub, setNoLeidosPub] = useState(0);
  const [noLeidosChat, setNoLeidosChat] = useState(0);

  // Badge publicaciones
  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await api.get('/publicaciones/no-vistas');
        setNoLeidosPub(data.no_vistas || 0);
      } catch {}
    };
    cargar();
  
    // Realtime — cuando se inserta una publicación nueva
    const canal = supabase
      .channel('badge-publicaciones')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'publicaciones'
      }, () => cargar())
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'publicaciones_vistas'
      }, () => cargar())
      .subscribe();
  
    return () => supabase.removeChannel(canal);
  }, []);

  useEffect(() => {
    if (location.pathname.includes('publicaciones')) setNoLeidosPub(0);
  }, [location.pathname]);

  // Badge chat
  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await api.get('/chat/no-leidos');
        setNoLeidosChat(data.total || 0);
      } catch {}
    };
    cargar();
    const interval = setInterval(cargar, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (location.pathname.includes('chat')) setNoLeidosChat(0);
  }, [location.pathname]);

  const getBadge = (to) => {
    if (to.includes('publicaciones') && noLeidosPub > 0) return noLeidosPub;
    if (to.includes('chat') && noLeidosChat > 0) return noLeidosChat;
    return 0;
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const Avatar = () => (
    usuario?.foto_url
      ? <img src={usuario.foto_url} alt="" className="w-8 h-8 rounded-full object-cover" />
      : <div className="w-8 h-8 rounded-full bg-primary-400 flex items-center justify-center text-white text-xs font-bold">
          {usuario?.nombre_completo?.[0]}
        </div>
  );

  const LogoHeader = () => (
    <div className="flex items-center gap-3">
      <img src="/favicon_verbo.png" alt="Verbo Mañosca" className="w-9 h-9 rounded-full object-cover" />
      <div>
        <p className="text-white font-bold text-sm">Verbo Mañosca</p>
        <p className="text-primary-300 text-xs">Administrador</p>
      </div>
    </div>
  );

  const NavItemDesktop = ({ to, icon: Icon, label }) => {
    const badge = getBadge(to);
    return (
      <NavLink to={to} title={colapsado ? label : undefined}
        className={({ isActive }) =>
          `flex items-center rounded-xl text-sm font-medium transition relative
          ${colapsado ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'}
          ${isActive ? 'bg-white text-primary-600' : 'text-primary-100 hover:bg-primary-700'}`
        }>
        <span className="relative shrink-0">
          <Icon size={18} />
          {badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center font-bold leading-none"
              style={{ fontSize: 9, minWidth: 16 }}>
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </span>
        {!colapsado && <span className="flex-1">{label}</span>}
      </NavLink>
    );
  };

  const NavItemMobile = ({ to, icon: Icon, label }) => {
    const badge = getBadge(to);
    return (
      <NavLink to={to} onClick={() => setAbierto(false)}
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition
          ${isActive ? 'bg-white text-primary-600' : 'text-primary-100 hover:bg-primary-700'}`
        }>
        <span className="relative shrink-0">
          <Icon size={18} />
          {badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center font-bold"
              style={{ fontSize: 9, minWidth: 16 }}>
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </span>
        <span className="flex-1">{label}</span>
      </NavLink>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 rol-admin">

      {/* ── Sidebar DESKTOP ── */}
      <aside className={`hidden lg:flex flex-col bg-primary-800 min-h-screen transition-all duration-300 ${colapsado ? 'w-16' : 'w-64'}`}>

        <div className={`border-b border-primary-700 flex items-center ${colapsado ? 'justify-center py-5 px-2 gap-2' : 'justify-between p-5'}`}>
          {!colapsado && <LogoHeader />}
          {colapsado && <img src="/favicon_verbo.png" alt="Logo" className="w-9 h-9 rounded-full object-cover" />}
          <button onClick={() => setColapsado(p => !p)}
            className="text-primary-300 hover:text-white hover:bg-primary-700 rounded-lg p-1.5 transition"
            title={colapsado ? 'Expandir menú' : 'Colapsar menú'}>
            {colapsado ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden px-2">
          {NAV_ITEMS.map(item => <NavItemDesktop key={item.to} {...item} />)}
        </nav>

        <div className={`border-t border-primary-700 ${colapsado ? 'py-4 px-2' : 'p-4'}`}>
          {colapsado ? (
            <div className="flex flex-col items-center gap-3">
              <Avatar />
              <button onClick={handleLogout} title="Cerrar sesión"
                className="text-primary-200 hover:text-white hover:bg-primary-700 rounded-lg p-1.5 transition">
                <FiLogOut size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3">
                <Avatar />
                <div className="overflow-hidden">
                  <p className="text-white text-xs font-medium truncate">{usuario?.nombre_completo}</p>
                  <p className="text-primary-300 text-xs">Administrador</p>
                </div>
              </div>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 text-primary-200 hover:text-white text-sm py-2 px-3 rounded-lg hover:bg-primary-700 transition">
                <FiLogOut size={16} /> Cerrar sesión
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ── Sidebar MOBILE overlay ── */}
      {abierto && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 flex flex-col bg-primary-800">
            <div className="p-5 border-b border-primary-700"><LogoHeader /></div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map(item => <NavItemMobile key={item.to} {...item} />)}
            </nav>
            <div className="p-4 border-t border-primary-700">
              <div className="flex items-center gap-3 mb-3">
                <Avatar />
                <div className="overflow-hidden">
                  <p className="text-white text-xs font-medium truncate">{usuario?.nombre_completo}</p>
                  <p className="text-primary-300 text-xs">Administrador</p>
                </div>
              </div>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 text-primary-200 hover:text-white text-sm py-2 px-3 rounded-lg hover:bg-primary-700 transition">
                <FiLogOut size={16} /> Cerrar sesión
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setAbierto(false)} />
        </div>
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:justify-end">
          <button onClick={() => setAbierto(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            <FiMenu size={22} />
          </button>
          <div className="text-center ml-auto">
            <p className="text-sm font-medium text-gray-700">Panel Administrador</p>
            <p className="text-xs text-gray-500">{usuario?.nombre_completo}</p>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
