import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { FiMenu, FiHome, FiGrid, FiCheckSquare, FiBookOpen, FiBell, FiUser, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const buildLayout = (navItems, rolLabel, color) => {
  return function Layout() {
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();
    const [abierto, setAbierto] = useState(false);

    const handleLogout = () => { logout(); navigate('/login'); };

    const SidebarContent = () => (
      <div className={`flex flex-col h-full bg-${color}-800`}>
        <div className={`p-6 border-b border-${color}-700`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">✝️</span>
            <div>
              <p className="text-white font-bold text-sm">Verbo Mañosca</p>
              <p className={`text-${color}-300 text-xs`}>{rolLabel}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setAbierto(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive ? 'bg-white text-primary-600' : `text-${color}-100 hover:bg-${color}-700`}`
              }
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className={`p-4 border-t border-${color}-700`}>
          <div className="flex items-center gap-3 mb-3">
            {usuario?.foto_url
              ? <img src={usuario.foto_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              : <div className={`w-8 h-8 rounded-full bg-${color}-400 flex items-center justify-center text-white text-xs font-bold`}>{usuario?.nombre_completo?.[0]}</div>
            }
            <div className="overflow-hidden">
              <p className="text-white text-xs font-medium truncate">{usuario?.nombre_completo}</p>
              <p className={`text-${color}-300 text-xs`}>{rolLabel}</p>
            </div>
          </div>
          <button onClick={handleLogout} className={`w-full flex items-center gap-2 text-${color}-200 hover:text-white text-sm py-2 px-3 rounded-lg hover:bg-${color}-700 transition`}>
            <FiLogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </div>
    );

    return (
      <div className="flex h-screen bg-gray-50">
        <aside className="hidden lg:flex flex-col w-64 min-h-screen"><SidebarContent /></aside>
        {abierto && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="w-64 flex flex-col"><SidebarContent /></div>
            <div className="flex-1 bg-black/50" onClick={() => setAbierto(false)} />
          </div>
        )}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:justify-end">
            <button onClick={() => setAbierto(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100"><FiMenu size={22} /></button>
            <div className="text-center ml-auto">
              <p className="text-sm font-medium text-gray-700">Panel {rolLabel}</p>
              <p className="text-xs text-gray-500">{usuario?.nombre_completo}</p>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 lg:p-6"><Outlet /></main>
        </div>
      </div>
    );
  };
};

export const DocenteLayout = buildLayout([
  { to: '/docente/dashboard', icon: FiHome, label: 'Dashboard' },
  { to: '/docente/grupos', icon: FiGrid, label: 'Mis Grupos' },
  { to: '/docente/checklist', icon: FiCheckSquare, label: 'Checklist' },
  { to: '/docente/tareas', icon: FiBookOpen, label: 'Tareas' },
  { to: '/docente/publicaciones', icon: FiBell, label: 'Publicaciones' },
  { to: '/docente/perfil', icon: FiUser, label: 'Mi Perfil' },
], 'Docente / Líder', 'indigo');

export const AyudanteLayout = buildLayout([
  { to: '/ayudante/dashboard', icon: FiHome, label: 'Dashboard' },
  { to: '/ayudante/checklist', icon: FiCheckSquare, label: 'Checklist' },
  { to: '/ayudante/perfil', icon: FiUser, label: 'Mi Perfil' },
], 'Ayudante', 'violet');

export default DocenteLayout;
