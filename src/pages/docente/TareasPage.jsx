import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { FiPlus, FiTrash2, FiEdit2, FiCpu, FiChevronRight, FiPaperclip, FiX, FiLoader, FiBookOpen, FiFilter, FiClock, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TareasPage = () => {
  const [tareas, setTareas] = useState([]);
  const [tareasFiltradas, setTareasFiltradas] = useState([]);
  const [reuniones, setReuniones] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [archivos, setArchivos] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Filtros
  const [filtroReunion, setFiltroReunion] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');

  // IA
  const [descIA, setDescIA] = useState('');
  const [iaActiva, setIaActiva] = useState(false);
  const [iaCargando, setIaCargando] = useState(false);
  const [iaIndice, setIaIndice] = useState(0);
  const [iaResultado, setIaResultado] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  useEffect(() => { cargarDatos(); }, []);

  // Aplicar filtros cuando cambian
  useEffect(() => {
    let resultado = [...tareas];
    if (filtroReunion) resultado = resultado.filter(t => t.reunion_id === filtroReunion || t.reunion?.id === filtroReunion);
    if (filtroGrupo) resultado = resultado.filter(t => t.grupo_id === filtroGrupo || t.grupo?.id === filtroGrupo);
    if (filtroFecha) resultado = resultado.filter(t => t.created_at?.slice(0, 10) === filtroFecha);
    setTareasFiltradas(resultado);
  }, [tareas, filtroReunion, filtroGrupo, filtroFecha]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [tRes, rRes, gRes] = await Promise.all([api.get('/tareas'), api.get('/reuniones'), api.get('/grupos')]);
      setTareas(tRes.data.tareas || []);
      setReuniones(rRes.data.reuniones || []);
      setGrupos(gRes.data.grupos || []);
    } catch { toast.error('Error al cargar datos'); }
    finally { setCargando(false); }
  };

  const limpiarFiltros = () => { setFiltroReunion(''); setFiltroGrupo(''); setFiltroFecha(''); };
  const hayFiltros = filtroReunion || filtroGrupo || filtroFecha;

  const abrirModal = (tarea = null) => {
    setEditando(tarea); setArchivos([]); setIaActiva(false); setIaResultado(null); setDescIA('');
    if (tarea) {
      setValue('titulo', tarea.titulo); setValue('descripcion', tarea.descripcion);
      setValue('reunion_id', tarea.reunion_id || ''); setValue('grupo_id', tarea.grupo_id || '');
    } else { reset(); }
    setModal(true);
  };

  const cerrarModal = () => { setModal(false); setEditando(null); setArchivos([]); setIaResultado(null); };

  const onSubmit = async (datos) => {
    setCargando(true);
    try {
      const formData = new FormData();
      formData.append('titulo', datos.titulo);
      formData.append('descripcion', datos.descripcion);
      if (datos.reunion_id) formData.append('reunion_id', datos.reunion_id);
      if (datos.grupo_id) formData.append('grupo_id', datos.grupo_id);
      if (iaResultado) formData.append('generado_por_ia', 'true');
      archivos.forEach(f => formData.append('archivos', f));
      if (editando) {
        const { data } = await api.put(`/tareas/${editando.id}`, { titulo: datos.titulo, descripcion: datos.descripcion });
        setTareas(prev => prev.map(t => t.id === editando.id ? data.tarea : t));
        toast.success('Tarea actualizada');
      } else {
        const { data } = await api.post('/tareas', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setTareas(prev => [data.tarea, ...prev]);
        toast.success('Tarea publicada');
      }
      cerrarModal();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar tarea'); }
    finally { setCargando(false); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    try { await api.delete(`/tareas/${id}`); setTareas(prev => prev.filter(t => t.id !== id)); toast.success('Tarea eliminada'); }
    catch { toast.error('Error al eliminar'); }
  };

  const generarConIA = async () => {
    if (!descIA.trim()) return toast.error('Describe qué tipo de tarea quieres');
    setIaCargando(true);
    try {
      const { data } = await api.post('/tareas/generar-ia', { descripcion: descIA, indice: iaIndice });
      setIaResultado(data); setValue('titulo', data.titulo); setValue('descripcion', data.descripcion);
    } catch (err) { toast.error(err.response?.data?.message || 'Error al generar con IA'); }
    finally { setIaCargando(false); }
  };

  const siguienteOpcionIA = async () => {
    const nuevoIndice = iaIndice + 1; setIaIndice(nuevoIndice); setIaCargando(true);
    try {
      const { data } = await api.post('/tareas/generar-ia', { descripcion: descIA, indice: nuevoIndice });
      setIaResultado(data); setValue('titulo', data.titulo); setValue('descripcion', data.descripcion);
    } catch { toast.error('Error al generar siguiente opción'); }
    finally { setIaCargando(false); }
  };

  const handleArchivos = (e) => {
    const files = Array.from(e.target.files);
    if (archivos.length + files.length > 3) return toast.error('Máximo 3 archivos');
    if (files.some(f => f.size > 5 * 1024 * 1024)) return toast.error('Cada archivo debe ser menor a 5MB');
    setArchivos(prev => [...prev, ...files]);
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
          <h1 className="text-xl font-bold text-white">Tareas / Deberes</h1>
          <p className="text-sm mt-0.5 text-indigo-300">
            {tareasFiltradas.length} de {tareas.length} tarea{tareas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => abrirModal()}
          className="relative flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition shrink-0 bg-white/20 hover:bg-white/30 text-white">
          <FiPlus size={18} /> Nueva Tarea
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FiFilter size={14} className="text-indigo-600" /> Filtrar tareas
          </h2>
          {hayFiltros && (
            <button onClick={limpiarFiltros} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <FiX size={12} /> Limpiar
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Reunión</label>
            <select value={filtroReunion} onChange={e => setFiltroReunion(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Todas</option>
              {reuniones.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Grupo</label>
            <select value={filtroGrupo} onChange={e => setFiltroGrupo(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Todos</option>
              {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
            <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </div>

      {cargando && !modal ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /></div>
      ) : tareasFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-indigo-50">
            <FiBookOpen size={28} className="text-indigo-400" />
          </div>
          <p className="text-gray-600 font-semibold">
            {hayFiltros ? 'No hay tareas con ese filtro' : 'No hay tareas publicadas aún'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {hayFiltros ? 'Prueba cambiando los filtros' : 'Crea la primera tarea para tus alumnos'}
          </p>
          {!hayFiltros && (
            <button onClick={() => abrirModal()}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl text-white bg-indigo-700 hover:bg-indigo-800 transition">
              <FiPlus size={16} /> Nueva tarea
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tareasFiltradas.map(tarea => (
            <div key={tarea.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition group">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <FiBookOpen size={18} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-bold text-gray-800 text-sm truncate">{tarea.titulo}</h3>
                    {tarea.generado_por_ia && (
                      <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <FiCpu size={10} /> IA
                      </span>
                    )}
                  </div>
                  {/* Reunión y grupo — siempre visibles */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tarea.reunion ? (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <FiClock size={9} /> {tarea.reunion.nombre}
                        {tarea.reunion.hora_inicio && (
                          <span className="opacity-70">· {tarea.reunion.hora_inicio}–{tarea.reunion.hora_fin}</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Todas las reuniones</span>
                    )}
                    {tarea.grupo ? (
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        👥 {tarea.grupo.nombre.hora_inicio.hora_fin}
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Todos los grupos</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{tarea.descripcion}</p>
                </div>
                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => abrirModal(tarea)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><FiEdit2 size={14} /></button>
                  <button onClick={() => eliminar(tarea.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><FiTrash2 size={14} /></button>
                </div>
              </div>

              {tarea.archivos?.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><FiPaperclip size={11} /> {tarea.archivos.length} archivo(s)</p>
                  <div className="flex flex-wrap gap-1">
                    {tarea.archivos.map((a, i) => (
                      <a key={i} href={a.url} target="_blank" rel="noreferrer"
                        className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg hover:bg-indigo-100 transition truncate max-w-[140px]">
                        {a.nombre}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <FiCalendar size={10} /> {new Date(tarea.created_at).toLocaleDateString('es-EC')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="font-bold text-gray-800">{editando ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Crea o edita una tarea para tus alumnos</p>
              </div>
              <button onClick={cerrarModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"><FiX /></button>
            </div>
            <div className="p-6 space-y-5">
              {!editando && (
                <div className="border border-purple-200 bg-purple-50 rounded-xl p-4">
                  <button onClick={() => setIaActiva(!iaActiva)}
                    className="flex items-center gap-2 text-purple-700 font-medium text-sm w-full">
                    <FiCpu size={16} /> Generar tarea con IA (HuggingFace)
                    <FiChevronRight size={14} className={`ml-auto transition-transform ${iaActiva ? 'rotate-90' : ''}`} />
                  </button>
                  {iaActiva && (
                    <div className="mt-3 space-y-3">
                      <p className="text-xs text-purple-600">Describe qué tipo de tarea quieres y la IA generará el título y descripción.</p>
                      <textarea value={descIA} onChange={e => setDescIA(e.target.value)}
                        placeholder="Ej: Una tarea sobre David y Goliat para niños de 6 años..."
                        rows={2} className="w-full border border-purple-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400" />
                      <div className="flex gap-2">
                        <button onClick={generarConIA} disabled={iaCargando}
                          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-60">
                          {iaCargando ? <FiLoader size={14} className="animate-spin" /> : <FiCpu size={14} />}
                          {iaCargando ? 'Generando...' : 'Generar'}
                        </button>
                        {iaResultado && (
                          <button onClick={siguienteOpcionIA} disabled={iaCargando}
                            className="flex items-center gap-2 bg-white border border-purple-300 text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-60">
                            <FiChevronRight size={14} /> Siguiente opción
                          </button>
                        )}
                      </div>
                      {iaResultado && <p className="text-xs text-purple-500">✨ Tarea generada — puedes editarla antes de publicar</p>}
                    </div>
                  )}
                </div>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                  <input className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.titulo ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="Título de la tarea" {...register('titulo', { required: 'El título es requerido' })} />
                  {errors.titulo && <p className="text-red-500 text-xs mt-1">{errors.titulo.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                  <textarea rows={4} className={`w-full border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.descripcion ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="Descripción detallada..." {...register('descripcion', { required: 'La descripción es requerida' })} />
                  {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion.message}</p>}
                </div>
                {!editando && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reunión</label>
                      <select className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" {...register('reunion_id')}>
                        <option value="">Todas las reuniones</option>
                        {reuniones.map(r => <option key={r.id} value={r.id}>{r.nombre} ({r.hora_inicio}–{r.hora_fin})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                      <select className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" {...register('grupo_id')}>
                        <option value="">Todos los grupos</option>
                        {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre} ({g.edad_min}–{g.edad_max} años)</option>)}
                      </select>
                    </div>
                  </div>
                )}
                {!editando && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Archivos <span className="text-gray-400 font-normal">(máx. 3 de 5MB)</span></label>
                    <label className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 cursor-pointer hover:border-indigo-400 transition">
                      <FiPaperclip className="text-gray-400" />
                      <span className="text-sm text-gray-500">Seleccionar archivos...</span>
                      <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleArchivos} />
                    </label>
                    {archivos.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {archivos.map((f, i) => (
                          <div key={i} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-lg">
                            <FiPaperclip size={11} /><span className="truncate max-w-[120px]">{f.name}</span>
                            <button type="button" onClick={() => setArchivos(prev => prev.filter((_, idx) => idx !== i))} className="ml-1 text-gray-400 hover:text-red-500"><FiX size={12} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={cerrarModal} className="flex-1 py-3 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                  <button type="submit" disabled={cargando} className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-60">
                    {cargando ? 'Guardando...' : editando ? 'Actualizar' : 'Publicar Tarea'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TareasPage;
