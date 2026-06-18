import React, { useState, useEffect } from 'react';
import { FiPaperclip, FiBell } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PublicacionesDocentePage = () => {
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/publicaciones')
      .then(r => setPublicaciones(r.data.publicaciones || []))
      .catch(() => toast.error('Error al cargar publicaciones'))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Banner indigo */}
      <div className="relative rounded-2xl overflow-hidden p-6 flex items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, #3730a3 0%, #312e81 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white" style={{ transform: 'translate(30%,-30%)' }} />
        </div>
        <div className="relative">
          <h1 className="text-xl font-bold text-white">Publicaciones</h1>
          <p className="text-sm mt-0.5 text-indigo-300">
            Avisos y comunicados del administrador
          </p>
        </div>
        <div className="relative w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <FiBell size={24} className="text-white" />
        </div>
      </div>

      {cargando ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /></div>
      ) : publicaciones.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-indigo-50">
            <FiBell size={28} className="text-indigo-400" />
          </div>
          <p className="text-gray-600 font-semibold">No hay publicaciones</p>
          <p className="text-gray-400 text-sm mt-1">El administrador publicará avisos aquí</p>
        </div>
      ) : (
        <div className="space-y-4">
          {publicaciones.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-start gap-3">
                {p.publicado_por?.foto_url
                  ? <img src={p.publicado_por.foto_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  : <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {p.publicado_por?.nombre_completo?.[0]}
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800">{p.publicado_por?.nombre_completo}</p>
                    <span className="text-xs text-gray-400 mt-2">{new Date(p.created_at).toLocaleDateString('es-EC')}</span>
                  </div>
                  <h3 className="font-bold text-gray-800 mt-1">{p.titulo}</h3>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-line leading-relaxed">{p.contenido}</p>
                  {p.archivos?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.archivos.map((a, i) => (
                        <a key={i} href={a.url} target="_blank" rel="noreferrer"
                          className="text-xs flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg hover:bg-indigo-100 transition">
                          <FiPaperclip size={11} /> {a.nombre}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicacionesDocentePage;
