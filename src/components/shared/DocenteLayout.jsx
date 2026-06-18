import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FiMenu, FiHome, FiGrid, FiCheckSquare, FiBookOpen, FiBell, FiUser, FiLogOut, FiBarChart2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
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

// Ruta de publicaciones según rol
const RUTA_PUBS = {
  indigo: '/docente/publicaciones',
  violet: '/ayudante/avisos',
};

const buildLayout = (navItems, rolLabel, color) => {
  const c = COLORES[color] || COLORES.indigo;
  const rutaPubs = RUTA_PUBS[color];

  return function Layout() {
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [abierto, setAbierto] = useState(false);
    const [colapsado, setColapsado] = useState(false);
    const [noVistas, setNoVistas] = useState(0);

    const handleLogout = () => { logout(); navigate('/login'); };

    // Cargar conteo de publicaciones no vistas
    const cargarNoVistas = async () => {
      try {
        const { data } = await api.get('/publicaciones/no-vistas');
        setNoVistas(data.no_vistas || 0);
      } catch {}
    };

    useEffect(() => {
      cargarNoVistas();
    }, []);

    // Cuando el usuario navega a publicaciones, resetear el badge
    useEffect(() => {
      if (location.pathname === rutaPubs) {
        // Esperar un momento para que la página cargue y marque como vistas
        const timer = setTimeout(() => setNoVistas(0), 500);
        return () => clearTimeout(timer);
      }
    }, [location.pathname]);

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

    const NavItem = ({ to, icon: Icon, label }) => {
      const esPubs = to === rutaPubs;
      return (
        <NavLink key={to} to={to} title={colapsado ? label : undefined}
          className={({ isActive }) =>
            `relative flex items-center rounded-xl text-sm font-medium transition
            ${colapsado ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'}
            ${isActive ? 'bg-white text-primary-600' : `${c.text100} ${c.hoverBg}`}`
          }>
          <span className="relative shrink-0">
            <Icon size={18} />
            {esPubs && noVistas > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                {noVistas > 99 ? '99+' : noVistas}
              </span>
            )}
          </span>
          {!colapsado && <span>{label}</span>}
        </NavLink>
      );
    };

    const NavItemMobile = ({ to, icon: Icon, label }) => {
      const esPubs = to === rutaPubs;
      return (
        <NavLink to={to} onClick={() => setAbierto(false)}
          className={({ isActive }) =>
            `relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition
            ${isActive ? 'bg-white text-primary-600' : `${c.text100} ${c.hoverBg}`}`
          }>
          <span className="relative shrink-0">
            <Icon size={18} />
            {esPubs && noVistas > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                {noVistas > 99 ? '99+' : noVistas}
              </span>
            )}
          </span>
          {label}
        </NavLink>
      );
    };

    return (
      <div className={`flex h-screen bg-gray-50 ${c.rolClass}`}>

        {/* Sidebar DESKTOP */}
        <aside className={`hidden lg:flex flex-col ${c.bg800} min-h-screen transition-all duration-300 ${colapsado ? 'w-16' : 'w-64'}`}>
          {colapsado ? (
            <div className={`${c.borderB} flex items-center justify-center py-5 px-2 gap-2`}>
              <img src="/favicon_verbo.png" alt="Logo" className="w-9 h-9 rounded-full object-cover" />
              <button onClick={() => setColapsado(p => !p)}
                className={`${c.text300} hover:text-white ${c.hoverBg} rounded-lg p-1.5 transition`}
                title="Expandir menú">
                <FiChevronRight size={16} />
              </button>
            </div>
          ) : (
            <div className={`${c.borderB} flex items-center justify-between p-5`}>
              <LogoHeader />
              <button onClick={() => setColapsado(p => !p)}
                className={`${c.text300} hover:text-white ${c.hoverBg} rounded-lg p-1.5 transition`}
                title="Colapsar menú">
                <FiChevronLeft size={16} />
              </button>
            </div>
          )}

          <nav className="flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden px-2">
            {navItems.map(item => <NavItem key={item.to} {...item} />)}
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

        {/* Sidebar MOBILE */}
        {abierto && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className={`w-64 flex flex-col ${c.bg800}`}>
              <div className={`p-5 ${c.borderB}`}><LogoHeader /></div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map(item => <NavItemMobile key={item.to} {...item} />)}
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

        {/* Main */}
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
  { to: '/docente/dashboard',     icon: FiHome,        label: 'Dashboard' },
  { to: '/docente/grupos',        icon: FiGrid,        label: 'Mis Grupos' },
  { to: '/docente/checklist',     icon: FiCheckSquare, label: 'Checklist' },
  { to: '/docente/tareas',        icon: FiBookOpen,    label: 'Tareas' },
  { to: '/docente/reportes',      icon: FiBarChart2,   label: 'Reportes' },
  { to: '/docente/publicaciones', icon: FiBell,        label: 'Publicaciones' },
  { to: '/docente/perfil',        icon: FiUser,        label: 'Mi Perfil' },
], 'Docente / Líder', 'indigo');

export const AyudanteLayout = buildLayout([
  { to: '/ayudante/dashboard', icon: FiHome,        label: 'Dashboard' },
  { to: '/ayudante/checklist', icon: FiCheckSquare, label: 'Checklist' },
  { to: '/ayudante/avisos',    icon: FiBell,        label: 'Avisos' },
  { to: '/ayudante/perfil',    icon: FiUser,        label: 'Mi Perfil' },
], 'Ayudante', 'violet');

export default DocenteLayout;
