// MisGruposPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MisGruposPage = () => {
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/grupos').then(r => setGrupos(r.data.grupos || [])).catch(() => toast.error('Error al cargar')).finally(() => setCargando(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Mis Grupos</h1>
      {cargando ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>
      ) : grupos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">No tienes grupos asignados</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {grupos.map(g => (
            <div key={g.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-1">{g.nombre}</h3>
              <p className="text-sm text-primary-600 font-medium">{g.reunion?.nombre} · {g.reunion?.hora_inicio}–{g.reunion?.hora_fin}</p>
              <div className="mt-3 space-y-1.5 text-xs">
                <p className="text-gray-500">Rango de edad: <span className="font-medium text-gray-700">{g.edad_min}–{g.edad_max} años</span></p>
                {g.ayudante1 && <p className="text-gray-500">Ayudante 1: <span className="font-medium text-gray-700">{g.ayudante1.nombre_completo}</span></p>}
                {g.ayudante2 && <p className="text-gray-500">Ayudante 2: <span className="font-medium text-gray-700">{g.ayudante2.nombre_completo}</span></p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MisGruposPage;
