import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiHome, FiUsers, FiClock, FiGrid, FiUser, FiCheckSquare, FiBell, FiBarChart2, FiLogOut, FiBookOpen } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const nav = [
  { to: '/admin/dashboard', icon: FiHome, label: 'Dashboard' },
  { to: '/admin/reuniones', icon: FiClock, label: 'Reuniones' },
  { to: '/admin/grupos', icon: FiGrid, label: 'Grupos' },
  { to: '/admin/usuarios', icon: FiUsers, label: 'Usuarios' },
  { to: '/admin/ninos', icon: FiUser, label: 'Niños' },
  { to: '/admin/checklist', icon: FiCheckSquare, label: 'Checklist' },
  { to: '/admin/publicaciones', icon: FiBell, label: 'Publicaciones' },
  { to: '/admin/reportes', icon: FiBarChart2, label: 'Reportes' },
  { to: '/admin/perfil', icon: FiUser, label: 'Mi Perfil' },
];

const AdminLayout = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-primary-700">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✝️</span>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Verbo Mañosca</p>
            <p className="text-primary-300 text-xs">Escuela Dominical</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setAbierto(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive ? 'bg-white text-primary-600' : 'text-primary-100 hover:bg-primary-700'}`
            }
          >
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-primary-700">
        <div className="flex items-center gap-3 mb-3">
          {usuario?.foto_url
            ? <img src={usuario.foto_url} alt="" className="w-8 h-8 rounded-full object-cover" />
            : <div className="w-8 h-8 rounded-full bg-primary-400 flex items-center justify-center text-white text-xs font-bold">{usuario?.nombre_completo?.[0]}</div>
          }
          <div className="overflow-hidden">
            <p className="text-white text-xs font-medium truncate">{usuario?.nombre_completo}</p>
            <p className="text-primary-300 text-xs capitalize">{usuario?.rol}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-2 text-primary-200 hover:text-white text-sm py-2 px-3 rounded-lg hover:bg-primary-700 transition">
          <FiLogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-primary-800 min-h-screen">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile overlay */}
      {abierto && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-primary-800 flex flex-col"><SidebarContent /></div>
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
