import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiHeart, FiStar, FiSun } from 'react-icons/fi';
import api from '../../services/api';

const EMOCIONES = [
  { emoji: '😊', label: 'Feliz' },
  { emoji: '🙏', label: 'Agradecido' },
  { emoji: '😮', label: 'Sorprendido' },
  { emoji: '💪', label: 'Animado' },
  { emoji: '❤️', label: 'Con amor' },
];

const PaginaPublica = () => {
  const [contenidos, setContenidos] = useState([]);
  const [emocionSel, setEmocionSel] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/publicaciones/publico')
      .then(r => setContenidos(r.data.contenidos || []))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/favicon_verbo.png" alt="Verbo Mañosca" className="w-9 h-9 rounded-full object-cover" />
          <div>
            <h1 className="font-bold text-gray-800 text-lg leading-tight">Escuela Dominical</h1>
            <p className="text-gray-500 text-xs">Iglesia Verbo Mañosca</p>
          </div>
        </div>
        <Link to="/login" className="text-xs text-primary-600 border border-primary-300 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition">
          Ingresar
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Bienvenida */}
        <div className="text-center">
          <div className="text-6xl mb-4">🌟</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">¡Hola, amiguito!</h2>
          <p className="text-gray-500">Bienvenido a tu espacio especial de Escuela Dominical</p>
        </div>

        {/* Selector de emociones */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100">
          <h3 className="font-bold text-gray-800 text-center mb-4 flex items-center justify-center gap-2">
            <FiHeart className="text-red-400" /> ¿Cómo te sientes hoy?
          </h3>
          <div className="flex justify-center gap-3 flex-wrap">
            {EMOCIONES.map(({ emoji, label }) => (
              <button key={label} onClick={() => setEmocionSel(emocionSel === label ? null : label)}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition ${emocionSel === label ? 'bg-yellow-100 ring-2 ring-yellow-400 scale-110' : 'bg-gray-50 hover:bg-yellow-50'}`}>
                <span className="text-3xl">{emoji}</span>
                <span className="text-xs text-gray-600 font-medium">{label}</span>
              </button>
            ))}
          </div>
          {emocionSel && (
            <p className="text-center text-sm text-yellow-700 font-medium mt-3">
              ¡Qué bueno que te sientes <strong>{emocionSel}</strong>! 🎉
            </p>
          )}
        </div>

        {/* Contenido de la semana */}
        <div>
          <h3 className="font-bold text-gray-800 text-xl mb-4 flex items-center gap-2">
            <FiBookOpen className="text-primary-600" /> Contenido de esta semana
          </h3>

          {cargando ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>
          ) : contenidos.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-gray-200">
              <span className="text-5xl block mb-3">📖</span>
              <p className="text-gray-500">¡Tu maestra publicará el contenido pronto!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contenidos.map((c, i) => (
                <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">📝</span>
                    <div>
                      <h4 className="font-bold text-gray-800">{c.titulo}</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.reunion && <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">{c.reunion.nombre}</span>}
                        {c.grupo && <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{c.grupo.nombre}</span>}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm whitespace-pre-line leading-relaxed">{c.descripcion}</p>
                  {c.publicado_por && (
                    <p className="text-xs text-gray-400 mt-3">Por: {c.publicado_por.nombre_completo}</p>
                  )}
                  {c.archivos?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {c.archivos.map((a, j) => (
                        <a key={j} href={a.url} target="_blank" rel="noreferrer"
                          className="text-xs bg-primary-50 text-primary-700 px-3 py-1.5 rounded-xl hover:bg-primary-100 transition">
                          📎 {a.nombre}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer motivacional */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-3xl p-6 text-white text-center">
          <FiSun className="mx-auto mb-2 text-yellow-300" size={28} />
          <p className="font-bold text-lg">"Deja que los niños vengan a mí"</p>
          <p className="text-primary-200 text-sm mt-1">— Marcos 10:14</p>
        </div>
      </main>
    </div>
  );
};

export default PaginaPublica;
