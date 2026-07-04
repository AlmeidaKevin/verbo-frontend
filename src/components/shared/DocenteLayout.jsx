import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  FiMenu, FiHome, FiGrid, FiCheckSquare, FiBookOpen, FiBell,
  FiUser, FiLogOut, FiBarChart2, FiChevronLeft, FiChevronRight,
  FiMessageSquare
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const COLORES = {
  indigo: {
    bg800:    'bg-indigo-800',
    bg400:    'bg-indigo-400',
    borderB:  'border-b border-indigo-700',
    borderT:  'border-t border-indigo-700',
    text300:  'text-indigo-300',
    text100:  'text-indigo-100',
    text200:  'text-indigo-200',
    hoverBg:  'hover:bg-indigo-700',
    rolClass: 'rol-docente',
  },
  violet: {
    bg800:    'bg-violet-800',
    bg400:    'bg-violet-400',
    borderB:  'border-b border-violet-700',
    borderT:  'border-t border-violet-700',
    text300:  'text-violet-300',
    text100:  'text-violet-100',
    text200:  'text-violet-200',
    hoverBg:  'hover:bg-violet-700',
    rolClass: 'rol-ayudante',
  },
};

const buildLayout = (navItems, rolLabel, color, pubPath, chatPath) => {
  const c = COLORES[color] || COLORES.indigo;

  return function Layout() {
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
          setNoLeidosPub(data.count || 0);
        } catch {}
      };
      cargar();
      const interval = setInterval(cargar, 30000);
      return () => clearInterval(interval);
    }, []);

    // Resetear badge publicaciones al navegar a la página de publicaciones
    useEffect(() => {
      if (pubPath && location.pathname.includes(pubPath)) {
        setNoLeidosPub(0);
      }
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

    // Resetear badge chat al navegar al chat
    useEffect(() => {
      if (chatPath && location.pathname.includes(chatPath)) {
        setNoLeidosChat(0);
      }
    }, [location.pathname]);

    const handleLogout = () => { logout(); navigate('/login'); };

    const getBadge = (to) => {
      if (pubPath && to.includes(pubPath) && noLeidosPub > 0) return noLeidosPub;
      if (chatPath && to.includes(chatPath) && noLeidosChat > 0) return noLeidosChat;
      return 0;
    };

    const Avatar = () => (
      usuario?.foto_url
        ? <img src={usuario.foto_url} alt="" className="w-8 h-8 rounded-full object-cover" />
        : <div className={`w-8 h-8 rounded-full ${c.bg400} flex items-center justify-center text-white text-xs font-bold`}>
            {usuario?.nombre_completo?.[0]}
          </div>
    );

    const LogoHeader = () => (
      <div className="flex items-center gap-3">
        <img src="/favicon_verbo.png" alt="Verbo Mañosca" className="w-9 h-9 rounded-full object-cover" />
        <div>
          <p className="text-white font-bold text-sm">Verbo Mañosca</p>
          <p className={`${c.text300} text-xs`}>{rolLabel}</p>
        </div>
      </div>
    );

    return (
      <div className={`flex h-screen bg-gray-50 ${c.rolClass}`}>

        {/* ── Sidebar DESKTOP ── */}
        <aside className={`hidden lg:flex flex-col ${c.bg800} min-h-screen transition-all duration-300 ${colapsado ? 'w-16' : 'w-64'}`}>

          <div className={`${c.borderB} flex items-center ${colapsado ? 'justify-center py-5 px-2 gap-2' : 'justify-between p-5'}`}>
            {!colapsado && <LogoHeader />}
            {colapsado && <img src="/favicon_verbo.png" alt="Logo" className="w-9 h-9 rounded-full object-cover" />}
            <button onClick={() => setColapsado(p => !p)}
              className={`${c.text300} hover:text-white ${c.hoverBg} rounded-lg p-1.5 transition`}
              title={colapsado ? 'Expandir menú' : 'Colapsar menú'}>
              {colapsado ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
            </button>
          </div>

          <nav className="flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden px-2">
            {navItems.map(({ to, icon: Icon, label }) => {
              const badge = getBadge(to);
              return (
                <NavLink key={to} to={to} title={colapsado ? label : undefined}
                  className={({ isActive }) =>
                    `flex items-center rounded-xl text-sm font-medium transition relative
                    ${colapsado ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'}
                    ${isActive ? 'bg-white text-primary-600' : `${c.text100} ${c.hoverBg}`}`
                  }>
                  <span className="relative shrink-0">
                    <Icon size={18} />
                    {badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none"
                        style={{ fontSize: 9, minWidth: 16 }}>
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </span>
                  {!colapsado && <span className="flex-1">{label}</span>}
                  {!colapsado && badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none"
                      style={{ fontSize: 10 }}>
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className={`${c.borderT} ${colapsado ? 'py-4 px-2' : 'p-4'}`}>
            {colapsado ? (
              <div className="flex flex-col items-center gap-3">
                <Avatar />
                <button onClick={handleLogout} title="Cerrar sesión"
                  className={`${c.text200} hover:text-white ${c.hoverBg} rounded-lg p-1.5 transition`}>
                  <FiLogOut size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar />
                  <div className="overflow-hidden">
                    <p className="text-white text-xs font-medium truncate">{usuario?.nombre_completo}</p>
                    <p className={`${c.text300} text-xs`}>{rolLabel}</p>
                  </div>
                </div>
                <button onClick={handleLogout}
                  className={`w-full flex items-center gap-2 ${c.text200} hover:text-white text-sm py-2 px-3 rounded-lg ${c.hoverBg} transition`}>
                  <FiLogOut size={16} /> Cerrar sesión
                </button>
              </>
            )}
          </div>
        </aside>

        {/* ── Sidebar MOBILE overlay ── */}
        {abierto && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className={`w-64 flex flex-col ${c.bg800}`}>
              <div className={`p-5 ${c.borderB}`}><LogoHeader /></div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map(({ to, icon: Icon, label }) => {
                  const badge = getBadge(to);
                  return (
                    <NavLink key={to} to={to} onClick={() => setAbierto(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition
                        ${isActive ? 'bg-white text-primary-600' : `${c.text100} ${c.hoverBg}`}`
                      }>
                      <span className="relative shrink-0">
                        <Icon size={18} />
                        {badge > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                            style={{ fontSize: 9, minWidth: 16 }}>
                            {badge > 9 ? '9+' : badge}
                          </span>
                        )}
                      </span>
                      <span className="flex-1">{label}</span>
                      {badge > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold"
                          style={{ fontSize: 10 }}>
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
              <div className={`p-4 ${c.borderT}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar />
                  <div className="overflow-hidden">
                    <p className="text-white text-xs font-medium truncate">{usuario?.nombre_completo}</p>
                    <p className={`${c.text300} text-xs`}>{rolLabel}</p>
                  </div>
                </div>
                <button onClick={handleLogout}
                  className={`w-full flex items-center gap-2 ${c.text200} hover:text-white text-sm py-2 px-3 rounded-lg ${c.hoverBg} transition`}>
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
              <p className="text-sm font-medium text-gray-700">Panel {rolLabel}</p>
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
};

export const DocenteLayout = buildLayout([
  { to: '/docente/dashboard',     icon: FiHome,          label: 'Dashboard' },
  { to: '/docente/grupos',        icon: FiGrid,          label: 'Mis Grupos' },
  { to: '/docente/checklist',     icon: FiCheckSquare,   label: 'Checklist' },
  { to: '/docente/tareas',        icon: FiBookOpen,      label: 'Tareas' },
  { to: '/docente/reportes',      icon: FiBarChart2,     label: 'Reportes' },
  { to: '/docente/publicaciones', icon: FiBell,          label: 'Publicaciones' },
  { to: '/docente/chat',          icon: FiMessageSquare, label: 'Chat' },
  { to: '/docente/perfil',        icon: FiUser,          label: 'Mi Perfil' },
], 'Docente / Líder', 'indigo', 'publicaciones', 'chat');

export const AyudanteLayout = buildLayout([
  { to: '/ayudante/dashboard', icon: FiHome,          label: 'Dashboard' },
  { to: '/ayudante/checklist', icon: FiCheckSquare,   label: 'Checklist' },
  { to: '/ayudante/avisos',    icon: FiBell,          label: 'Avisos' },
  { to: '/ayudante/chat',      icon: FiMessageSquare, label: 'Chat' },
  { to: '/ayudante/perfil',    icon: FiUser,          label: 'Mi Perfil' },
], 'Ayudante', 'violet', 'avisos', 'chat');

export default DocenteLayout;
