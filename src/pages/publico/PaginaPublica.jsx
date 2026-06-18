import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiHeart, FiAward, FiSmile, FiFilter, FiBell, FiX } from 'react-icons/fi';
import api from '../../services/api';

const EMOCIONES = [
  { emoji: '😊', label: 'Feliz', color: 'bg-yellow-50 ring-yellow-400', msg: '¡Tu sonrisa ilumina todo! 🌟' },
  { emoji: '🙏', label: 'Agradecido', color: 'bg-blue-50 ring-blue-400', msg: '¡Dar gracias es hermoso! 💙' },
  { emoji: '😮', label: 'Sorprendido', color: 'bg-purple-50 ring-purple-400', msg: '¡Dios siempre nos sorprende! 🎉' },
  { emoji: '💪', label: 'Animado', color: 'bg-green-50 ring-green-400', msg: '¡Tienes una energía increíble! 🚀' },
  { emoji: '❤️', label: 'Con amor', color: 'bg-red-50 ring-red-400', msg: '¡Dios te ama y nosotros también! ❤️' },
];

const LOGROS = [
  { emoji: '⭐', label: 'Primera asistencia', color: 'bg-yellow-100 text-yellow-700' },
  { emoji: '📖', label: 'Aprendí un versículo', color: 'bg-blue-100 text-blue-700' },
  { emoji: '🤝', label: 'Hice un amigo', color: 'bg-green-100 text-green-700' },
  { emoji: '🎵', label: 'Canté con alegría', color: 'bg-purple-100 text-purple-700' },
  { emoji: '🙌', label: 'Ayudé a alguien', color: 'bg-pink-100 text-pink-700' },
  { emoji: '🌈', label: '5 asistencias seguidas', color: 'bg-orange-100 text-orange-700' },
];

const PaginaPublica = () => {
  const [contenidos, setContenidos] = useState([]);
  const [publicaciones, setPublicaciones] = useState([]);
  const [reuniones, setReuniones] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [gruposFiltrados, setGruposFiltrados] = useState([]);
  const [reunionSel, setReunionSel] = useState('');
  const [grupoSel, setGrupoSel] = useState('');
  const [emocionSel, setEmocionSel] = useState(null);
  const [logroSel, setLogroSel] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Cargar reuniones y grupos para el filtro
  useEffect(() => {
    api.get('/reuniones').then(r => setReuniones(r.data.reuniones || [])).catch(() => {});
    api.get('/grupos').then(r => setGrupos(r.data.grupos || [])).catch(() => {});
  }, []);

  // Filtrar grupos según reunión seleccionada
  useEffect(() => {
    if (reunionSel) {
      setGruposFiltrados(grupos.filter(g => g.reunion_id === reunionSel));
      setGrupoSel('');
    } else {
      setGruposFiltrados(grupos);
    }
  }, [reunionSel, grupos]);

  // Cargar contenido con filtros
  useEffect(() => {
    cargar();
  }, [reunionSel, grupoSel]);

  const cargar = async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (reunionSel) params.append('reunion_id', reunionSel);
      if (grupoSel) params.append('grupo_id', grupoSel);
      const { data } = await api.get(`/publicaciones/publico?${params}`);
      setContenidos(data.contenidos || []);
      setPublicaciones(data.publicaciones || []);
    } catch {}
    finally { setCargando(false); }
  };

  const limpiarFiltros = () => { setReunionSel(''); setGrupoSel(''); };
  const limpiarFiltros = () => { setReunionSel(''); setGrupoSel(''); };
  const hayFiltros = reunionSel || grupoSel;

  // Filtrar publicaciones según grupo seleccionado:
  // - grupos_con_ninos → siempre visibles (es para todos los niños)
  // - grupo_especifico_con_ninos → solo si grupoSel está en grupos_ids
  const publicacionesFiltradas = publicaciones.filter(p => {
    if (p.tipo_destinatario === 'grupos_con_ninos') return true;
    if (p.tipo_destinatario === 'grupo_especifico_con_ninos') {
      if (!grupoSel) return true; // sin filtro → mostrar todas
      return Array.isArray(p.grupos_ids) && p.grupos_ids.includes(grupoSel);
    }
    return true;
  });

  return (
    <div className="min-h-screen" style={{ background: '#FAF8F3' }}>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon_verbo.png" alt="Verbo Mañosca" className="w-10 h-10 rounded-full object-cover shadow-sm" />
            <div>
              <h1 className="font-bold leading-tight text-sm" style={{ color: '#1F4E5F' }}>Escuela Dominical</h1>
              <p className="text-xs text-gray-500">Iglesia Cristiana Verbo Mañosca</p>
            </div>
          </div>
          <Link to="/login" className="text-xs font-semibold px-4 py-2 rounded-xl text-white transition" style={{ background: '#1F4E5F' }}>
            Ingresar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1F4E5F 0%, #183D4A 60%, #112C36 100%)', minHeight: 280 }}>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 bg-white" style={{ transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 bg-white" style={{ transform: 'translate(-20%, 30%)' }} />
        <div className="relative max-w-4xl mx-auto px-4 py-12 flex flex-col sm:flex-row items-center gap-8">
          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
              style={{ background: 'rgba(200,169,107,0.2)', color: '#C8A96B', border: '1px solid rgba(200,169,107,0.3)' }}>
              ✝️ Bienvenido a la Escuela Dominical
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3">
              ¡Un lugar especial<br />para los niños! 🌟
            </h2>
            <p className="text-sm mb-6" style={{ color: '#9EC5D0' }}>
              Aprendemos, cantamos y crecemos juntos en la fe.<br />Cada domingo es una aventura con Dios.
            </p>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              <a href="#contenido" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition" style={{ background: '#C8A96B' }}>
                Ver contenido de hoy
              </a>
              <Link to="/login" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
                Soy docente / admin
              </Link>
            </div>
          </div>
          <div className="shrink-0">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56">
              <div className="w-full h-full rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(200,169,107,0.4)' }}>
                <img src="/favicon_verbo.png" alt="Logo" className="w-36 h-36 sm:w-44 sm:h-44 rounded-full object-cover shadow-xl" />
              </div>
              <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg text-xl">⭐</div>
              <div className="absolute -bottom-2 -left-2 w-10 h-10 rounded-full bg-pink-400 flex items-center justify-center shadow-lg text-lg">❤️</div>
              <div className="absolute top-1/2 -right-4 w-9 h-9 rounded-full bg-green-400 flex items-center justify-center shadow-lg text-base">🙏</div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block', height: 40 }}>
            <path d="M0 40 C360 0 1080 0 1440 40 L1440 40 L0 40Z" fill="#FAF8F3"/>
          </svg>
        </div>
      </section>

      {/* Tarjetas informativas */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { emoji: '📖', label: 'Aprendemos la Biblia', color: 'bg-blue-50', text: 'text-blue-700' },
            { emoji: '🎵', label: 'Cantamos con alegría', color: 'bg-yellow-50', text: 'text-yellow-700' },
            { emoji: '🤝', label: 'Hacemos amigos', color: 'bg-green-50', text: 'text-green-700' },
            { emoji: '🙏', label: 'Oramos juntos', color: 'bg-purple-50', text: 'text-purple-700' },
          ].map(({ emoji, label, color, text }) => (
            <div key={label} className={`${color} rounded-2xl p-4 text-center`}>
              <div className="text-3xl mb-2">{emoji}</div>
              <p className={`text-xs font-semibold ${text}`}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 space-y-8 pb-12">

        {/* ¿Cómo te sientes? */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100">
          <h3 className="font-bold text-gray-800 text-center text-lg mb-1 flex items-center justify-center gap-2">
            <FiHeart className="text-red-400" /> ¿Cómo te sientes hoy?
          </h3>
          <p className="text-center text-gray-400 text-xs mb-5">Toca la carita que más te representa</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {EMOCIONES.map(({ emoji, label, color, msg }) => (
              <button key={label} onClick={() => setEmocionSel(emocionSel === label ? null : label)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-200 ${emocionSel === label ? `${color} ring-2 scale-110 shadow-md` : 'bg-gray-50 hover:bg-yellow-50 hover:scale-105'}`}>
                <span className="text-3xl">{emoji}</span>
                <span className="text-xs text-gray-600 font-medium">{label}</span>
              </button>
            ))}
          </div>
          {emocionSel && (
            <div className="mt-4 text-center bg-yellow-50 rounded-2xl py-3 px-4">
              <p className="text-sm text-yellow-700 font-semibold">{EMOCIONES.find(e => e.label === emocionSel)?.msg}</p>
            </div>
          )}
        </div>

        {/* Mis logros */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-yellow-100">
          <h3 className="font-bold text-gray-800 text-lg mb-1 flex items-center gap-2">
            <FiAward className="text-yellow-500" /> Mis logros especiales
          </h3>
          <p className="text-gray-400 text-xs mb-5">¡Toca los que ya conseguiste esta semana!</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {LOGROS.map(({ emoji, label, color }) => (
              <button key={label} onClick={() => setLogroSel(logroSel === label ? null : label)}
                className={`flex items-center gap-2 p-3 rounded-2xl text-left transition-all duration-200 border-2 ${logroSel === label ? `${color} border-current shadow-md scale-105` : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>
                <span className="text-2xl shrink-0">{emoji}</span>
                <span className="text-xs font-semibold text-gray-700 leading-tight">{label}</span>
              </button>
            ))}
          </div>
          {logroSel && (
            <div className="mt-4 text-center bg-green-50 rounded-2xl py-3 px-4">
              <p className="text-sm text-green-700 font-semibold">🎉 ¡Felicitaciones! Conseguiste el logro: <strong>{logroSel}</strong></p>
            </div>
          )}
        </div>

        {/* Contenido de la semana con filtros */}
        <div id="contenido">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="font-bold text-gray-800 text-xl flex items-center gap-2">
              <FiBookOpen style={{ color: '#1F4E5F' }} /> Contenido de esta semana
            </h3>
            {hayFiltros && (
              <button onClick={limpiarFiltros} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition">
                <FiX size={12} /> Limpiar filtros
              </button>
            )}
          </div>

          {/* Filtros de reunión y grupo */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FiFilter size={14} style={{ color: '#1F4E5F' }} />
              <p className="text-sm font-semibold text-gray-700">Filtrar por reunión y grupo</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Reunión</label>
                <select value={reunionSel} onChange={e => setReunionSel(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white"
                  style={{ '--tw-ring-color': '#1F4E5F' }}>
                  <option value="">Todas las reuniones</option>
                  {reuniones.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre} ({r.hora_inicio}–{r.hora_fin})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Grupo</label>
                <select value={grupoSel} onChange={e => setGrupoSel(e.target.value)}
                  disabled={!reunionSel && gruposFiltrados.length === 0}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white disabled:bg-gray-50 disabled:text-gray-400">
                  <option value="">Todos los grupos</option>
                  {gruposFiltrados.map(g => (
                    <option key={g.id} value={g.id}>{g.nombre} ({g.edad_min}–{g.edad_max} años)</option>
                  ))}
                </select>
              </div>
            </div>
            {hayFiltros && (
              <div className="mt-3 flex flex-wrap gap-2">
                {reunionSel && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: '#EEF4F6', color: '#1F4E5F' }}>
                    📅 {reuniones.find(r => r.id === reunionSel)?.nombre}
                    <button onClick={() => setReunionSel('')} className="hover:opacity-70"><FiX size={10} /></button>
                  </span>
                )}
                {grupoSel && (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">
                    👥 {grupos.find(g => g.id === grupoSel)?.nombre}
                    <button onClick={() => setGrupoSel('')} className="hover:opacity-70"><FiX size={10} /></button>
                  </span>
                )}
              </div>
            )}
          </div>

          {cargando ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#1F4E5F' }} />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Publicaciones por grupo */}
              {publicacionesFiltradas.length > 0 && (
                <div className="space-y-3">
                  {publicacionesFiltradas.map((p, i) => (
                    <div key={i} className="bg-white rounded-3xl p-5 shadow-sm border border-blue-100 hover:shadow-md transition">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-blue-50">
                          <FiBell size={18} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-bold text-gray-800 text-sm">{p.titulo}</h4>
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Aviso del grupo</span>
                          </div>
                          <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{p.contenido}</p>
                          {p.archivos?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {p.archivos.map((a, j) => (
                                <a key={j} href={a.url} target="_blank" rel="noreferrer"
                                  className="text-xs px-3 py-1 rounded-lg font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition">
                                  📎 {a.nombre}
                                </a>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-2">{new Date(p.created_at).toLocaleDateString('es-EC')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tareas */}
              {contenidos.length === 0 && publicacionesFiltradas.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-gray-200 shadow-sm">
                  <div className="text-6xl mb-4">📖</div>
                  <p className="text-gray-600 font-semibold text-lg">
                    {hayFiltros ? 'No hay contenido para este filtro' : '¡Pronto habrá contenido!'}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {hayFiltros ? 'Prueba seleccionando otra reunión o grupo' : 'Tu maestra está preparando algo especial para esta semana.'}
                  </p>
                </div>
              ) : (
                contenidos.map((c, i) => (
                  <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl" style={{ background: '#EEF4F6' }}>📝</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 text-base">{c.titulo}</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {c.reunion && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#EEF4F6', color: '#1F4E5F' }}>
                              {c.reunion.nombre}
                            </span>
                          )}
                          {c.grupo && (
                            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                              {c.grupo.nombre}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm whitespace-pre-line leading-relaxed">{c.descripcion}</p>
                    {c.publicado_por && (
                      <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                        <FiSmile size={12} /> Por: {c.publicado_por.nombre_completo}
                      </p>
                    )}
                    {c.archivos?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {c.archivos.map((a, j) => (
                          <a key={j} href={a.url} target="_blank" rel="noreferrer"
                            className="text-xs px-3 py-1.5 rounded-xl hover:opacity-80 transition font-medium"
                            style={{ background: '#EEF4F6', color: '#1F4E5F' }}>
                            📎 {a.nombre}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Versículo */}
        <div className="rounded-3xl p-8 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1F4E5F 0%, #183D4A 100%)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 bg-white" style={{ transform: 'translate(30%, -30%)' }} />
          <div className="relative">
            <div className="text-4xl mb-3">✨</div>
            <p className="font-bold text-white text-lg mb-1">"Dejen que los niños vengan a mí"</p>
            <p className="text-sm" style={{ color: '#9EC5D0' }}>— Marcos 10:14</p>
            <div className="mt-4 flex justify-center gap-2">
              <span className="text-xl">⭐</span><span className="text-xl">❤️</span><span className="text-xl">🙏</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pt-4 pb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/favicon_verbo.png" alt="Logo" className="w-6 h-6 rounded-full object-cover" />
            <span className="font-medium text-gray-500">Iglesia Cristiana Verbo Mañosca</span>
          </div>
          <p>Sistema de Gestión Escuela Dominical</p>
          <Link to="/login" className="text-primary-600 hover:underline mt-1 inline-block font-medium">
            Acceso para docentes y administradores
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaginaPublica;
