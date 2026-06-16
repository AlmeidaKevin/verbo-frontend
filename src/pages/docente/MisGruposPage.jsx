import React, { useState, useEffect } from 'react';
import { FiGrid, FiClock, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MisGruposPage = () => {
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/grupos')
      .then(r => setGrupos(r.data.grupos || []))
      .catch(() => toast.error('Error al cargar'))
      .finally(() => setCargando(false));
  }, []);

  const toggleChecklist = async (grupo) => {
    const nuevoValor = !grupo.ayudantes_checklist;
    try {
      await api.put(`/grupos/${grupo.id}/checklist`, { ayudantes_checklist: nuevoValor });
      setGrupos(prev => prev.map(g => g.id === grupo.id ? { ...g, ayudantes_checklist: nuevoValor } : g));
      toast.success(`Checklist para ayudantes ${nuevoValor ? 'activado' : 'desactivado'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cambiar permiso');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner indigo */}
      <div className="relative rounded-2xl overflow-hidden p-6 flex items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, #3730a3 0%, #312e81 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white" style={{ transform: 'translate(30%,-30%)' }} />
        </div>
        <div className="relative">
          <h1 className="text-xl font-bold text-white">Mis Grupos</h1>
          <p className="text-sm mt-0.5 text-indigo-300">
            {grupos.length} grupo{grupos.length !== 1 ? 's' : ''} asignado{grupos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="relative w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <FiGrid size={24} className="text-white" />
        </div>
      </div>

      {cargando ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      ) : grupos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-indigo-50">
            <FiGrid size={28} className="text-indigo-400" />
          </div>
          <p className="text-gray-600 font-semibold">No tienes grupos asignados</p>
          <p className="text-gray-400 text-sm mt-1">El administrador te asignará grupos próximamente</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {grupos.map(g => (
            <div key={g.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-indigo-50">
                  <FiGrid size={20} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 truncate">{g.nombre}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <FiClock size={11} className="text-indigo-400 shrink-0" />
                    <p className="text-xs text-indigo-600 font-medium truncate">
                      {g.reunion?.nombre} · {g.reunion?.hora_inicio}–{g.reunion?.hora_fin}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 space-y-2 mb-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium shrink-0">Edad</span>
                  <span className="text-gray-600 font-medium">{g.edad_min}–{g.edad_max} años</span>
                </div>
                {g.docente && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium shrink-0">Líder</span>
                    <span className="text-gray-600 truncate">{g.docente.nombre_completo}</span>
                  </div>
                )}
                {g.ayudante1 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium shrink-0">Ayud. 1</span>
                    <span className="text-gray-600 truncate">{g.ayudante1.nombre_completo}</span>
                  </div>
                )}
                {g.ayudante2 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium shrink-0">Ayud. 2</span>
                    <span className="text-gray-600 truncate">{g.ayudante2.nombre_completo}</span>
                  </div>
                )}
                {g.ayudantes_extra?.map((ae, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium shrink-0">Ayud. {idx + 3}</span>
                    <span className="text-gray-600 truncate">{ae.ayudante?.nombre_completo}</span>
                  </div>
                ))}
              </div>

              {/* Toggle checklist — solo si es docente del grupo */}
              <button
                onClick={() => toggleChecklist(g)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition
                  ${g.ayudantes_checklist
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
              >
                <div>
                  <p className="font-semibold">Checklist para ayudantes</p>
                  <p className="text-xs opacity-70 mt-0.5">
                    {g.ayudantes_checklist ? 'Los ayudantes pueden marcar asistencia' : 'Solo tú puedes marcar asistencia'}
                  </p>
                </div>
                {g.ayudantes_checklist
                  ? <FiToggleRight size={22} className="text-emerald-600 shrink-0" />
                  : <FiToggleLeft size={22} className="text-gray-400 shrink-0" />
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MisGruposPage;
