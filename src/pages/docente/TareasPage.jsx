import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiTrash2, FiEdit2, FiCpu, FiChevronRight, FiPaperclip, FiX, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TareasPage = () => {
  const [tareas, setTareas] = useState([]);
  const [reuniones, setReuniones] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [archivos, setArchivos] = useState([]);
  const [cargando, setCargando] = useState(false);

  // IA
  const [descIA, setDescIA] = useState('');
  const [iaActiva, setIaActiva] = useState(false);
  const [iaCargando, setIaCargando] = useState(false);
  const [iaIndice, setIaIndice] = useState(0);
  const [iaResultado, setIaResultado] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [tRes, rRes, gRes] = await Promise.all([
        api.get('/tareas'),
        api.get('/reuniones'),
        api.get('/grupos'),
      ]);
      setTareas(tRes.data.tareas || []);
      setReuniones(rRes.data.reuniones || []);
      setGrupos(gRes.data.grupos || []);
    } catch { toast.error('Error al cargar datos'); }
    finally { setCargando(false); }
  };

  const abrirModal = (tarea = null) => {
    setEditando(tarea);
    setArchivos([]);
    setIaActiva(false);
    setIaResultado(null);
    setDescIA('');
    if (tarea) {
      setValue('titulo', tarea.titulo);
      setValue('descripcion', tarea.descripcion);
      setValue('reunion_id', tarea.reunion_id || '');
      setValue('grupo_id', tarea.grupo_id || '');
    } else {
      reset();
    }
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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar tarea');
    } finally { setCargando(false); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    try {
      await api.delete(`/tareas/${id}`);
      setTareas(prev => prev.filter(t => t.id !== id));
      toast.success('Tarea eliminada');
    } catch { toast.error('Error al eliminar'); }
  };

  const generarConIA = async () => {
    if (!descIA.trim()) return toast.error('Describe qué tipo de tarea quieres');
    setIaCargando(true);
    try {
      const { data } = await api.post('/tareas/generar-ia', { descripcion: descIA, indice: iaIndice });
      setIaResultado(data);
      setValue('titulo', data.titulo);
      setValue('descripcion', data.descripcion);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al generar con IA');
    } finally { setIaCargando(false); }
  };

  const siguienteOpcionIA = async () => {
    const nuevoIndice = iaIndice + 1;
    setIaIndice(nuevoIndice);
    setIaCargando(true);
    try {
      const { data } = await api.post('/tareas/generar-ia', { descripcion: descIA, indice: nuevoIndice });
      setIaResultado(data);
      setValue('titulo', data.titulo);
      setValue('descripcion', data.descripcion);
    } catch (err) {
      toast.error('Error al generar siguiente opción');
    } finally { setIaCargando(false); }
  };

  const handleArchivos = (e) => {
    const files = Array.from(e.target.files);
    const total = archivos.length + files.length;
    if (total > 3) return toast.error('Máximo 3 archivos');
    const grandes = files.filter(f => f.size > 5 * 1024 * 1024);
    if (grandes.length > 0) return toast.error('Cada archivo debe ser menor a 5MB');
    setArchivos(prev => [...prev, ...files]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Tareas / Deberes</h1>
        <button onClick={() => abrirModal()}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
          <FiPlus size={18} /> Nueva Tarea
        </button>
      </div>

      {/* Lista de tareas */}
      {cargando && !modal ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>
      ) : tareas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <FiBookOpen className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-500">No hay tareas publicadas aún</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tareas.map(tarea => (
            <div key={tarea.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800 text-sm">{tarea.titulo}</h3>
                    {tarea.generado_por_ia && (
                      <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <FiCpu size={10} /> IA
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {tarea.reunion && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{tarea.reunion.nombre}</span>}
                    {tarea.grupo && <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{tarea.grupo.nombre}</span>}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{tarea.descripcion}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => abrirModal(tarea)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"><FiEdit2 size={15} /></button>
                  <button onClick={() => eliminar(tarea.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><FiTrash2 size={15} /></button>
                </div>
              </div>
              {tarea.archivos?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><FiPaperclip size={11} /> {tarea.archivos.length} archivo(s)</p>
                  <div className="flex flex-wrap gap-1">
                    {tarea.archivos.map((a, i) => (
                      <a key={i} href={a.url} target="_blank" rel="noreferrer"
                        className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-lg hover:bg-primary-100 transition truncate max-w-[140px]">
                        {a.nombre}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-3">{new Date(tarea.created_at).toLocaleDateString('es-EC')}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
            {/* Header modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">{editando ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
              <button onClick={cerrarModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"><FiX /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Sección IA */}
              {!editando && (
                <div className="border border-purple-200 bg-purple-50 rounded-xl p-4">
                  <button onClick={() => setIaActiva(!iaActiva)}
                    className="flex items-center gap-2 text-purple-700 font-medium text-sm w-full">
                    <FiCpu size={16} />
                    Generar tarea con IA (HuggingFace)
                    <FiChevronRight size={14} className={`ml-auto transition-transform ${iaActiva ? 'rotate-90' : ''}`} />
                  </button>
                  {iaActiva && (
                    <div className="mt-3 space-y-3">
                      <p className="text-xs text-purple-600">Describe brevemente qué tipo de tarea o deber quieres y la IA generará el título y descripción.</p>
                      <textarea
                        value={descIA}
                        onChange={e => setDescIA(e.target.value)}
                        placeholder="Ej: Una tarea sobre la historia de David y Goliat para niños de 6 años..."
                        rows={2}
                        className="w-full border border-purple-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
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
                      {iaResultado && (
                        <p className="text-xs text-purple-500">✨ Tarea generada por IA — puedes editarla antes de publicar</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                  <input
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.titulo ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="Título de la tarea"
                    {...register('titulo', { required: 'El título es requerido' })}
                  />
                  {errors.titulo && <p className="text-red-500 text-xs mt-1">{errors.titulo.message}</p>}
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                  <textarea
                    rows={4}
                    className={`w-full border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.descripcion ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="Descripción detallada de la tarea..."
                    {...register('descripcion', { required: 'La descripción es requerida' })}
                  />
                  {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion.message}</p>}
                </div>

                {/* Reunión y Grupo */}
                {!editando && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reunión</label>
                      <select className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        {...register('reunion_id')}>
                        <option value="">Todas las reuniones</option>
                        {reuniones.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                      <select className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        {...register('grupo_id')}>
                        <option value="">Todos los grupos</option>
                        {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* Archivos */}
                {!editando && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Archivos / Imágenes <span className="text-gray-400 font-normal">(máx. 3 archivos de 5MB)</span>
                    </label>
                    <label className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 cursor-pointer hover:border-primary-400 transition">
                      <FiPaperclip className="text-gray-400" />
                      <span className="text-sm text-gray-500">Seleccionar archivos...</span>
                      <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleArchivos} />
                    </label>
                    {archivos.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {archivos.map((f, i) => (
                          <div key={i} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-lg">
                            <FiPaperclip size={11} />
                            <span className="truncate max-w-[120px]">{f.name}</span>
                            <button type="button" onClick={() => setArchivos(prev => prev.filter((_, idx) => idx !== i))} className="ml-1 text-gray-400 hover:text-red-500">
                              <FiX size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={cerrarModal} className="flex-1 py-3 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                    Cancelar
                  </button>
                  <button type="submit" disabled={cargando}
                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-60">
                    {cargando ? 'Guardando...' : editando ? 'Actualizar' : 'Publicar Tarea'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Fix: missing import for FiBookOpen
import { FiBookOpen } from 'react-icons/fi';
export default TareasPage;
