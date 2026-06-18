import React, { useState, useEffect, useRef } from 'react';
import { FiPaperclip, FiBell } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AvisosAyudantePage = () => {
  const [publicaciones, setPublicaciones] = useState([]);
  const [nuevas, setNuevas] = useState(new Set());
  const [animando, setAnimando] = useState(new Set());
  const [cargando, setCargando] = useState(true);
  const marcadoRef = useRef(false);

  useEffect(() => {
    cargar();
    return () => { marcadoRef.current = false; };
  }, []);

  const cargar = async () => {
    try {
      const { data } = await api.get('/publicaciones');
      const pubs = data.publicaciones || [];
      setPublicaciones(pubs);

      const noVistas = new Set(pubs.filter(p => !p.vista).map(p => p.id));
      setNuevas(noVistas);

      if (noVistas.size > 0) {
        setAnimando(new Set(noVistas));
        setTimeout(() => setAnimando(new Set()), 4000);

        if (!marcadoRef.current) {
          marcadoRef.current = true;
          await api.post('/publicaciones/marcar-vistas', {
            publicacion_ids: Array.from(noVistas),
          });
        }
      }
    } catch { toast.error('Error al cargar avisos'); }
    finally { setCargando(false); }
  };

  return (
    <div className="space-y-6">
      {/* Banner violeta */}
      <div className="relative rounded-2xl overflow-hidden p-6 flex items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white" style={{ transform: 'translate(30%,-30%)' }} />
        </div>
        <div className="relative">
          <h1 className="text-xl font-bold text-white">Avisos</h1>
          <p className="text-sm mt-0.5 text-violet-300">Avisos y comunicados del administrador</p>
        </div>
        <div className="relative w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <FiBell size={24} className="text-white" />
        </div>
      </div>

      {cargando ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
        </div>
      ) : publicaciones.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-violet-50">
            <FiBell size={28} className="text-violet-400" />
          </div>
          <p className="text-gray-600 font-semibold">No hay avisos aún</p>
          <p className="text-gray-400 text-sm mt-1">El administrador publicará avisos aquí</p>
        </div>
      ) : (
        <div className="space-y-4">
          {publicaciones.map(p => {
            const esNueva = nuevas.has(p.id);
            const estaAnimando = animando.has(p.id);
            return (
              <div key={p.id} className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition ${esNueva ? 'border-red-200' : 'border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  {p.publicado_por?.foto_url
                    ? <img src={p.publicado_por.foto_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    : <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {p.publicado_por?.nombre_completo?.[0]}
                      </div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-gray-800">{p.publicado_por?.nombre_completo}</p>
                      <span className="text-xs text-gray-400">{new Date(p.created_at).toLocaleString('es-EC')}</span>
                      {esNueva && (
                        <span className={`text-xs bg-red-500 text-white px-2.5 py-0.5 rounded-full font-semibold ${estaAnimando ? 'animate-pulse' : ''}`}>
                          Nuevo
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-800 mt-1">{p.titulo}</h3>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-line leading-relaxed">{p.contenido}</p>
                    {p.archivos?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {p.archivos.map((a, i) => (
                          <a key={i} href={a.url} target="_blank" rel="noreferrer"
                            className="text-xs flex items-center gap-1 bg-violet-50 text-violet-600 px-3 py-1 rounded-lg hover:bg-violet-100 transition">
                            <FiPaperclip size={11} /> {a.nombre}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AvisosAyudantePage;
