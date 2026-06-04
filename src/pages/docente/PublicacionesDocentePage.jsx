import React, { useState, useEffect } from 'react';
import { FiPaperclip } from 'react-icons/fi';
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
      <h1 className="text-2xl font-bold text-gray-800">Publicaciones</h1>
      {cargando ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>
      ) : publicaciones.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">No hay publicaciones</div>
      ) : (
        <div className="space-y-4">
          {publicaciones.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                {p.publicado_por?.foto_url
                  ? <img src={p.publicado_por.foto_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                  : <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm shrink-0">{p.publicado_por?.nombre_completo?.[0]}</div>
                }
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800">{p.publicado_por?.nombre_completo}</p>
                    <span className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString('es-EC')}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mt-1">{p.titulo}</h3>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{p.contenido}</p>
                  {p.archivos?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.archivos.map((a, i) => (
                        <a key={i} href={a.url} target="_blank" rel="noreferrer"
                          className="text-xs flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200 transition">
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
