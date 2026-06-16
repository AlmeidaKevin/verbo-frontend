import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCheckSquare, FiUser, FiBell, FiGrid, FiBook } from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AyudanteDashboard = () => {
  const { usuario } = useAuth();
  const [publicaciones, setPublicaciones] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [pRes, gRes] = await Promise.all([
          api.get('/publicaciones'),
          api.get('/grupos'),
        ]);
        setPublicaciones((pRes.data.publicaciones || []).slice(0, 3));
        setGrupos(gRes.data.grupos || []);
      } catch {}
      finally { setCargando(false); }
    };
    cargar();
  }, []);

  const diaSemana = new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">

      {/* Banner bienvenida violeta */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white" style={{ transform: 'translate(25%, -25%)' }} />
        </div>
        <div className="relative p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-violet-300 text-sm mb-1 capitalize">{diaSemana}</p>
            <h1 className="text-2xl font-bold text-white">¡Hola, {usuario?.nombre_completo?.split(' ')[0]}!</h1>
            <p className="text-violet-300 text-sm mt-1">Panel Ayudante / Colaborador · Escuela Dominical</p>
          </div>
          <img src="/favicon_verbo.png" alt="Logo" className="w-14 h-14 rounded-full object-cover opacity-90 hidden sm:block shrink-0" />
        </div>
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/ayudante/checklist" className="bg-white rounded-2xl border border-violet-100 p-5 shadow-sm hover:shadow-md transition group">
          <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FiCheckSquare size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-800">Checklist</p>
          <p className="text-sm text-gray-500 mt-0.5">Registrar asistencia</p>
          <p className="text-xs text-violet-600 mt-2 font-medium">Ir al checklist →</p>
        </Link>
        <Link to="/ayudante/perfil" className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition group">
          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FiUser size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-800">Mi Perfil</p>
          <p className="text-sm text-gray-500 mt-0.5">Actualizar datos</p>
          <p className="text-xs text-gray-500 mt-2 font-medium">Ver perfil →</p>
        </Link>
      </div>

      {/* Mis grupos asignados */}
      {grupos.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiGrid size={16} className="text-violet-600" /> Grupos donde colaboro
          </h2>
          <div className="space-y-2">
            {grupos.slice(0, 3).map(g => (
              <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-violet-50 transition">
                <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 text-xs font-bold">
                  {g.edad_min}–{g.edad_max}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{g.nombre}</p>
                  <p className="text-xs text-gray-500">{g.reunion?.nombre} · {g.reunion?.hora_inicio}–{g.reunion?.hora_fin}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acceso rápido */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4">Acceso rápido</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/ayudante/checklist"
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-violet-700 hover:bg-violet-800 text-white transition">
            <FiCheckSquare size={16} /> Iniciar Checklist
          </Link>
          <Link to="/ayudante/perfil"
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition">
            <FiUser size={16} /> Mi Perfil
          </Link>
        </div>
      </div>

      {/* Publicaciones recientes */}
      {publicaciones.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiBell size={16} className="text-violet-600" /> Avisos recientes
          </h2>
          <div className="space-y-3">
            {publicaciones.map(p => (
              <div key={p.id} className="p-3 rounded-xl bg-gray-50 hover:bg-violet-50 transition">
                <p className="text-sm font-medium text-gray-800">{p.titulo}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{p.contenido}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(p.created_at).toLocaleDateString('es-EC')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Versículo */}
      <div className="rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg, #6d28d9, #5b21b6)' }}>
        <FiBook size={20} className="mx-auto mb-2 text-yellow-300 opacity-80" />
        <p className="text-white text-sm italic">"Cada uno ponga al servicio de los demás el don que haya recibido."</p>
        <p className="text-violet-300 text-xs mt-2">— 1 Pedro 4:10</p>
      </div>
    </div>
  );
};

export default AyudanteDashboard;
