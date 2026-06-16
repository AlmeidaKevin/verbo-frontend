import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiGrid, FiCheckSquare, FiBookOpen, FiBell, FiBarChart2, FiUser, FiBook, FiCalendar } from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DocenteDashboard = () => {
  const { usuario } = useAuth();
  const [grupos, setGrupos] = useState([]);
  const [publicaciones, setPublicaciones] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [gRes, pRes, tRes] = await Promise.all([
          api.get('/grupos'),
          api.get('/publicaciones'),
          api.get('/tareas'),
        ]);
        setGrupos(gRes.data.grupos || []);
        setPublicaciones((pRes.data.publicaciones || []).slice(0, 3));
        setTareas((tRes.data.tareas || []).slice(0, 3));
      } catch {}
      finally { setCargando(false); }
    };
    cargar();
  }, []);

  const diaSemana = new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">

      {/* Banner bienvenida indigo */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #3730a3 0%, #312e81 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white" style={{ transform: 'translate(25%, -25%)' }} />
        </div>
        <div className="relative p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-indigo-300 text-sm mb-1 capitalize">{diaSemana}</p>
            <h1 className="text-2xl font-bold text-white">¡Hola, {usuario?.nombre_completo?.split(' ')[0]}!</h1>
            <p className="text-indigo-300 text-sm mt-1">Panel Docente / Líder · Escuela Dominical</p>
          </div>
          <img src="/favicon_verbo.png" alt="Logo" className="w-14 h-14 rounded-full object-cover opacity-90 hidden sm:block shrink-0" />
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Mis Grupos', value: grupos.length, icon: FiGrid, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100', to: '/docente/grupos', sub: 'Grupos asignados' },
          { label: 'Publicaciones', value: publicaciones.length, icon: FiBell, color: 'bg-purple-50 text-purple-600', border: 'border-purple-100', to: '/docente/publicaciones', sub: 'Avisos recibidos' },
          { label: 'Tareas', value: tareas.length, icon: FiBookOpen, color: 'bg-amber-50 text-amber-600', border: 'border-amber-100', to: '/docente/tareas', sub: 'Publicadas' },
        ].map(({ label, value, icon: Icon, color, border, to, sub }) => (
          <Link key={label} to={to} className={`bg-white rounded-2xl border ${border} p-5 shadow-sm hover:shadow-md transition group`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color} group-hover:scale-110 transition-transform`}>
              <Icon size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </Link>
        ))}
      </div>

      {/* Acceso rápido */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4">Acceso rápido</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/docente/checklist', icon: FiCheckSquare, label: 'Checklist', bg: 'bg-indigo-700 hover:bg-indigo-800 text-white' },
            { to: '/docente/tareas', icon: FiBookOpen, label: 'Nueva tarea', bg: 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200' },
            { to: '/docente/reportes', icon: FiBarChart2, label: 'Mis reportes', bg: 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200' },
            { to: '/docente/perfil', icon: FiUser, label: 'Mi perfil', bg: 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200' },
          ].map(({ to, icon: Icon, label, bg }) => (
            <Link key={to} to={to} className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition text-center ${bg}`}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Mis grupos */}
      {grupos.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiGrid size={16} className="text-indigo-600" /> Mis grupos
          </h2>
          <div className="space-y-2">
            {grupos.slice(0, 4).map(g => (
              <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 transition">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 text-xs font-bold">
                  {g.edad_min}–{g.edad_max}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{g.nombre}</p>
                  <p className="text-xs text-gray-500">{g.reunion?.nombre} · {g.reunion?.hora_inicio}–{g.reunion?.hora_fin}</p>
                </div>
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{g.edad_min}–{g.edad_max} años</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimas publicaciones */}
      {publicaciones.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiBell size={16} className="text-indigo-600" /> Últimas publicaciones
          </h2>
          <div className="space-y-3">
            {publicaciones.map(p => (
              <div key={p.id} className="p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 transition">
                <p className="text-sm font-medium text-gray-800">{p.titulo}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{p.contenido}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(p.created_at).toLocaleDateString('es-EC')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Versículo */}
      <div className="rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg, #3730a3, #312e81)' }}>
        <FiBook size={20} className="mx-auto mb-2 text-yellow-300 opacity-80" />
        <p className="text-white text-sm italic">"Instruye al niño en el camino correcto, y aun en su vejez no lo abandonará."</p>
        <p className="text-indigo-300 text-xs mt-2">— Proverbios 22:6</p>
      </div>
    </div>
  );
};

export default DocenteDashboard;
