// DocenteDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiGrid, FiCheckSquare, FiBookOpen, FiBell } from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const DocenteDashboard = () => {
  const { usuario } = useAuth();
  const [grupos, setGrupos] = useState([]);
  const [publicaciones, setPublicaciones] = useState([]);

  useEffect(() => {
    api.get('/grupos').then(r => setGrupos(r.data.grupos || [])).catch(() => {});
    api.get('/publicaciones').then(r => setPublicaciones((r.data.publicaciones || []).slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">¡Hola, {usuario?.nombre_completo?.split(' ')[0]}! 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Panel Docente / Líder</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Mis Grupos', value: grupos.length, icon: FiGrid, to: '/docente/grupos', color: 'bg-blue-50 text-blue-600' },
          { label: 'Publicaciones', value: publicaciones.length, icon: FiBell, to: '/docente/publicaciones', color: 'bg-purple-50 text-purple-600' },
        ].map(({ label, value, icon: Icon, to, color }) => (
          <Link key={label} to={to} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}><Icon size={20} /></div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </Link>
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        <Link to="/docente/checklist" className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 transition">
          <FiCheckSquare size={16} /> Abrir Checklist
        </Link>
        <Link to="/docente/tareas" className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
          <FiBookOpen size={16} /> Publicar Tarea
        </Link>
      </div>
      {publicaciones.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-700">Últimas publicaciones</h2>
          {publicaciones.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <p className="font-medium text-gray-800 text-sm">{p.titulo}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.contenido}</p>
              <p className="text-xs text-gray-400 mt-2">{new Date(p.created_at).toLocaleDateString('es-EC')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocenteDashboard;
