import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBookOpen, FiUsers, FiClock, FiCalendar,
  FiFilter, FiX, FiChevronRight, FiBell, FiArrowRight,
  FiFile, FiDownload, FiImage
} from 'react-icons/fi';
import api from '../../services/api';

const PaginaPublica = () => {
  const [contenidos, setContenidos] = useState([]);
  const [publicaciones, setPublicaciones] = useState([]);
  const [reuniones, setReuniones] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [gruposFiltrados, setGruposFiltrados] = useState([]);
  const [reunionSel, setReunionSel] = useState('');
  const [grupoSel, setGrupoSel] = useState('');
  const [cargando, setCargando] = useState(true);
  const [modalArchivo, setModalArchivo] = useState(null); // { tipo, url, nombre }

  useEffect(() => {
    api.get('/reuniones/publico').then(r => setReuniones(r.data.reuniones || [])).catch(() => {});
    api.get('/grupos/publico').then(r => setGrupos(r.data.grupos || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (reunionSel) {
      setGruposFiltrados(grupos.filter(g => g.reunion_id === reunionSel));
      setGrupoSel('');
    } else {
      setGruposFiltrados(grupos);
    }
  }, [reunionSel, grupos]);

  useEffect(() => { cargar(); }, [reunionSel, grupoSel]);

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
  const hayFiltros = reunionSel || grupoSel;

  // Filtrar publicaciones de admin
  const publicacionesFiltradas = publicaciones.filter(p => {
    if (p.tipo_destinatario === 'grupos_con_ninos') return true;
    if (p.tipo_destinatario === 'grupo_especifico_con_ninos') {
      if (!grupoSel) return true;
      return Array.isArray(p.grupos_ids) && p.grupos_ids.includes(grupoSel);
    }
    return true;
  });

  // Filtrar tareas en el frontend también (para tareas con reunion_id/grupo_id null = todas)
  const contenidosFiltrados = contenidos.filter(c => {
    const matchReunion = !reunionSel || !c.reunion_id || c.reunion?.id === reunionSel || c.reunion_id === reunionSel;
    const matchGrupo = !grupoSel || !c.grupo_id || c.grupo?.id === grupoSel || c.grupo_id === grupoSel;
    return matchReunion && matchGrupo;
  });

  // Combinar y ordenar por fecha descendente (más reciente primero)
  const todosOrdenados = [
    ...publicacionesFiltradas.map(p => ({ ...p, _tipo: 'aviso' })),
    ...contenidosFiltrados.map(c => ({ ...c, _tipo: 'tarea' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const esImagen = (tipo) => tipo?.startsWith('image/');

  // Componente para mostrar archivos
  const ArchivoItem = ({ archivo }) => {
    const img = esImagen(archivo.tipo);
    return (
      <button
        onClick={() => setModalArchivo(archivo)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
        {img ? <FiImage size={11} /> : <FiFile size={11} />}
        {archivo.nombre}
      </button>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: '#F5F3EE' }}>

      {/* Modal de archivo/imagen */}
      {modalArchivo && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setModalArchivo(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="font-semibold text-sm text-gray-800 truncate">{modalArchivo.nombre}</p>
              <div className="flex items-center gap-2 shrink-0">
                <a href={modalArchivo.url} target="_blank" rel="noreferrer" download
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: '#1F4E5F', color: 'white' }}>
                  <FiDownload size={12} /> Descargar
                </a>
                <button onClick={() => setModalArchivo(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <FiX size={16} />
                </button>
              </div>
            </div>
            <div className="p-5">
              {esImagen(modalArchivo.tipo) ? (
                <img
                  src={modalArchivo.url}
                  alt={modalArchivo.nombre}
                  className="w-full rounded-xl object-contain"
                  style={{ maxHeight: '60vh', minHeight: 120 }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: '#EEF4F6' }}>
                    <FiFile size={28} style={{ color: '#1F4E5F' }} />
                  </div>
                  <p className="text-sm text-gray-600 text-center">{modalArchivo.nombre}</p>
                  <a href={modalArchivo.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl"
                    style={{ background: '#1F4E5F', color: 'white' }}>
                    <FiDownload size={15} /> Abrir archivo
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon_verbo.png" alt="Verbo Mañosca"
              className="w-9 h-9 rounded-full object-cover shadow-sm" />
            <div className="leading-tight">
              <p className="text-sm font-bold" style={{ color: '#1F4E5F' }}>
                Iglesia Cristiana Verbo Mañosca
              </p>
              <p className="text-xs text-gray-400">Escuela Dominical</p>
            </div>
          </div>
          <Link to="/login"
            className="hidden sm:flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-90"
            style={{ background: '#1F4E5F', color: 'white' }}>
            Iniciar sesión <FiChevronRight size={14} />
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1F4E5F 0%, #14303C 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5 bg-white"
            style={{ transform: 'translate(25%, -40%)' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-5 bg-white"
            style={{ transform: 'translate(-30%, 40%)' }} />
          <div className="absolute left-0 top-0 bottom-0 w-1"
            style={{ background: 'linear-gradient(to bottom, transparent, #C8A96B, transparent)' }} />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid sm:grid-cols-2 gap-10 items-center">
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px flex-1" style={{ background: '#C8A96B' }} />
                <span className="text-xs font-semibold tracking-widest uppercase whitespace-nowrap"
                  style={{ color: '#C8A96B' }}>
                  Sistema de Gestión
                </span>
                <div className="h-px flex-1" style={{ background: '#C8A96B' }} />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
                Escuela Dominical<br />
                <span style={{ color: '#C8A96B' }}>Verbo Mañosca</span>
              </h1>
              <p className="text-sm leading-relaxed mb-8 mx-auto sm:mx-0"
                style={{ color: '#9EC5D0', maxWidth: 380 }}>
                Plataforma de gestión para docentes y administradores.
                Consulta reuniones, grupos y comunicados de la semana.
              </p>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                <a href="#contenido"
                  className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
                  style={{ background: '#C8A96B', color: '#112C36' }}>
                  Ver contenido <FiArrowRight size={14} />
                </a>
                <Link to="/login"
                  className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl border transition-all hover:bg-white/10"
                  style={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>
                  Acceso
                </Link>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="rounded-2xl border p-6 backdrop-blur-sm"
                style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-5"
                  style={{ color: '#C8A96B' }}>
                  Resumen del sistema
                </p>
                <div className="space-y-4">
                  {[
                    { icon: FiCalendar, label: 'Reuniones activas', value: reuniones.length },
                    { icon: FiUsers, label: 'Grupos de estudio', value: grupos.length },
                    { icon: FiBookOpen, label: 'Publicaciones', value: todosOrdenados.length },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between py-3 border-b"
                      style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(200,169,107,0.15)' }}>
                          <Icon size={14} style={{ color: '#C8A96B' }} />
                        </div>
                        <span className="text-sm" style={{ color: '#9EC5D0' }}>{label}</span>
                      </div>
                      <span className="text-lg font-bold text-white">{value || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none" style={{ display: 'block', height: 48 }}>
            <path d="M0 48 C480 0 960 0 1440 48 L1440 48 L0 48Z" fill="#F5F3EE" />
          </svg>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">

        {/* ── REUNIONES ── */}
        {reuniones.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1F4E5F' }}>
                <FiClock size={15} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">Horarios de reunión</h2>
                <p className="text-xs text-gray-400">Sesiones semanales disponibles</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reuniones.map(r => (
                <div key={r.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-semibold text-sm text-gray-800 leading-tight">{r.nombre}</h3>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap"
                      style={{ background: '#EEF4F6', color: '#1F4E5F' }}>
                      {r.hora_inicio} – {r.hora_fin}
                    </span>
                  </div>
                  {r.descripcion && <p className="text-xs text-gray-400 leading-relaxed">{r.descripcion}</p>}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5">
                    <FiUsers size={11} className="text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {grupos.filter(g => g.reunion_id === r.id).length} grupos
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── GRUPOS ── */}
        {grupos.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1F4E5F' }}>
                <FiUsers size={15} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">Grupos de estudio</h2>
                <p className="text-xs text-gray-400">Organizados por reunión y rango de edad</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {grupos.map(g => {
                const reunion = reuniones.find(r => r.id === g.reunion_id);
                return (
                  <div key={g.id}
                    className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm text-gray-800">{g.nombre}</h3>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0"
                        style={{ background: '#EEF4F6', color: '#1F4E5F' }}>
                        {g.edad_min}–{g.edad_max} años
                      </span>
                    </div>
                    {reunion && (
                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                        <FiClock size={11} className="text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {reunion.nombre} · {reunion.hora_inicio}–{reunion.hora_fin}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── CONTENIDO SEMANAL ── */}
        <section id="contenido">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1F4E5F' }}>
                <FiBookOpen size={15} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">Contenido de la semana</h2>
                <p className="text-xs text-gray-400">Publicaciones y materiales por grupo</p>
              </div>
            </div>
            {hayFiltros && (
              <button onClick={limpiarFiltros}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition">
                <FiX size={11} /> Limpiar filtros
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FiFilter size={13} className="text-gray-400" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filtrar contenido</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Reunión</label>
                <select value={reunionSel} onChange={e => setReunionSel(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition">
                  <option value="">Todas las reuniones</option>
                  {reuniones.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre} ({r.hora_inicio}–{r.hora_fin})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Grupo</label>
                <select value={grupoSel} onChange={e => setGrupoSel(e.target.value)}
                  disabled={!reunionSel && gruposFiltrados.length === 0}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition disabled:bg-gray-50 disabled:text-gray-400">
                  <option value="">Todos los grupos</option>
                  {gruposFiltrados.map(g => (
                    <option key={g.id} value={g.id}>{g.nombre} ({g.edad_min}–{g.edad_max} años)</option>
                  ))}
                </select>
              </div>
            </div>
            {hayFiltros && (
              <div className="mt-4 flex flex-wrap gap-2">
                {reunionSel && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                    style={{ background: '#EEF4F6', color: '#1F4E5F' }}>
                    <FiCalendar size={10} />
                    {reuniones.find(r => r.id === reunionSel)?.nombre}
                    <button onClick={() => setReunionSel('')} className="ml-0.5 hover:opacity-60"><FiX size={10} /></button>
                  </span>
                )}
                {grupoSel && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium bg-emerald-50 text-emerald-700">
                    <FiUsers size={10} />
                    {grupos.find(g => g.id === grupoSel)?.nombre}
                    <button onClick={() => setGrupoSel('')} className="ml-0.5 hover:opacity-60"><FiX size={10} /></button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Lista combinada y ordenada */}
          {cargando ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#1F4E5F' }} />
            </div>
          ) : todosOrdenados.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-14 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: '#EEF4F6' }}>
                <FiBookOpen size={20} style={{ color: '#1F4E5F' }} />
              </div>
              <p className="text-sm font-semibold text-gray-600">
                {hayFiltros ? 'No hay contenido para este filtro' : 'No hay contenido publicado esta semana'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {hayFiltros ? 'Prueba seleccionando otra reunión o grupo' : 'El contenido aparecerá aquí cuando sea publicado'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todosOrdenados.map((item, i) => {
                const esAviso = item._tipo === 'aviso';
                return (
                  <div key={i}
                    className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: '#EEF4F6' }}>
                        {esAviso
                          ? <FiBell size={16} style={{ color: '#1F4E5F' }} />
                          : <FiBookOpen size={16} style={{ color: '#1F4E5F' }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                          <h3 className="font-semibold text-sm text-gray-800">{item.titulo}</h3>
                          <div className="flex gap-1.5 flex-wrap shrink-0">
                            <span className="text-xs px-2.5 py-0.5 rounded-lg font-medium"
                              style={{ background: '#EEF4F6', color: '#1F4E5F' }}>
                              {esAviso ? 'Aviso' : 'Tarea'}
                            </span>
                            {!esAviso && item.reunion && (
                              <span className="text-xs px-2.5 py-0.5 rounded-lg font-medium"
                                style={{ background: '#EEF4F6', color: '#1F4E5F' }}>
                                {item.reunion.nombre}
                              </span>
                            )}
                            {!esAviso && item.grupo && (
                              <span className="text-xs px-2.5 py-0.5 rounded-lg font-medium bg-emerald-50 text-emerald-700">
                                {item.grupo.nombre}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                          {esAviso ? item.contenido : item.descripcion}
                        </p>

                        {/* Archivos con preview */}
                        {item.archivos?.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {/* Imágenes en grid */}
                            {item.archivos.filter(a => esImagen(a.tipo)).length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {item.archivos.filter(a => esImagen(a.tipo)).map((a, j) => (
                                  <button key={j} onClick={() => setModalArchivo(a)}
                                    className="rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition aspect-video bg-gray-100">
                                    <img
                                      src={a.url}
                                      alt={a.nombre}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                            {/* Documentos */}
                            {item.archivos.filter(a => !esImagen(a.tipo)).length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {item.archivos.filter(a => !esImagen(a.tipo)).map((a, j) => (
                                  <ArchivoItem key={j} archivo={a} />
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {!esAviso && item.publicado_por && (
                          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                            <FiUsers size={11} /> {item.publicado_por.nombre_completo}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1.5">
                          {new Date(item.created_at).toLocaleString('es-EC')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── VERSÍCULO ── */}
        <section>
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ background: '#C8A96B' }} />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Versículo de la semana</p>
            </div>
            <div className="px-8 py-10 text-center relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1F4E5F 0%, #14303C 100%)' }}>
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-5 bg-white"
                style={{ transform: 'translate(30%, -30%)' }} />
              <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full opacity-5 bg-white"
                style={{ transform: 'translate(-20%, 30%)' }} />
              <div className="relative">
                <p className="text-2xl font-bold mb-1" style={{ color: '#C8A96B' }}>"</p>
                <p className="text-base sm:text-lg font-semibold text-white leading-relaxed mb-3">
                  Dejen que los niños vengan a mí,<br />y no se lo impidan.
                </p>
                <div className="w-10 h-px mx-auto mb-3" style={{ background: '#C8A96B' }} />
                <p className="text-sm font-medium" style={{ color: '#C8A96B' }}>Marcos 10:14</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-gray-200 pt-8 pb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <img src="/favicon_verbo.png" alt="Logo" className="w-8 h-8 rounded-full object-cover shadow-sm" />
              <div>
                <p className="text-sm font-bold" style={{ color: '#1F4E5F' }}>Iglesia Cristiana Verbo Mañosca</p>
                <p className="text-xs text-gray-400">Sistema de Gestión · Escuela Dominical</p>
              </div>
            </div>
            <Link to="/login"
              className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl border transition hover:bg-gray-50"
              style={{ color: '#1F4E5F', borderColor: '#1F4E5F' }}>
              Acceso para docentes y administradores <FiChevronRight size={14} />
            </Link>
          </div>
          <p className="text-xs text-gray-300 text-center mt-6">
            © {new Date().getFullYear()} Iglesia Cristiana Verbo Mañosca
          </p>
        </footer>
      </div>
    </div>
  );
};
export default PaginaPublica;
