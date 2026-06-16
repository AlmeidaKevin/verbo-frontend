import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { FiPlus, FiTrash2, FiX, FiPaperclip, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TIPOS = [
  { value: 'todos', label: '📢 Todos (docentes y ayudantes)' },
  { value: 'solo_docentes', label: '👨‍🏫 Solo docentes / líderes' },
  { value: 'solo_ayudantes', label: '🤝 Solo ayudantes / colaboradores' },
  { value: 'por_grupo', label: '👥 Docentes y ayudantes de grupos seleccionados' },
  { value: 'individual', label: '👤 Usuarios individuales' },
];

const PublicacionesAdminPage = () => {
  const [publicaciones, setPublicaciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [modal, setModal] = useState(false);
  const [archivos, setArchivos] = useState([]);
  const [tipoSel, setTipoSel] = useState('todos');
  const [destinatariosSeleccionados, setDestinatariosSeleccionados] = useState([]);
  const [cargando, setCargando] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      const [pRes, uRes, gRes] = await Promise.all([api.get('/publicaciones'), api.get('/usuarios'), api.get('/grupos')]);
      setPublicaciones(pRes.data.publicaciones || []);
      setUsuarios(uRes.data.usuarios?.filter(u => u.activo && u.rol !== 'admin') || []);
      setGrupos(gRes.data.grupos || []);
    } catch { toast.error('Error al cargar'); }
    finally { setCargando(false); }
  };

  const cerrar = () => { setModal(false); setArchivos([]); setTipoSel('todos'); setDestinatariosSeleccionados([]); reset(); };

  const toggleDestinatario = (id) => {
    setDestinatariosSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const obtenerDestinatariosDeGrupos = async (grupoIds) => {
    const ids = new Set();
    for (const gId of grupoIds) {
      const { data } = await api.get(`/grupos/${gId}`);
      const g = data.grupo;
      if (g.docente_id) ids.add(g.docente_id);
      if (g.ayudante1_id) ids.add(g.ayudante1_id);
      if (g.ayudante2_id) ids.add(g.ayudante2_id);
    }
    return Array.from(ids);
  };

  const onSubmit = async (datos) => {
    setCargando(true);
    try {
      let destIds = destinatariosSeleccionados;
      if (tipoSel === 'por_grupo') destIds = await obtenerDestinatariosDeGrupos(destinatariosSeleccionados);
      const formData = new FormData();
      formData.append('titulo', datos.titulo);
      formData.append('contenido', datos.contenido);
      formData.append('tipo_destinatario', tipoSel);
      formData.append('destinatarios_ids', JSON.stringify(destIds));
      archivos.forEach(f => formData.append('archivos', f));
      const { data } = await api.post('/publicaciones', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPublicaciones(prev => [data.publicacion, ...prev]);
      toast.success('Publicación enviada y notificaciones enviadas por email');
      cerrar();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al publicar');
    } finally { setCargando(false); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta publicación?')) return;
    try {
      await api.delete(`/publicaciones/${id}`);
      setPublicaciones(prev => prev.filter(p => p.id !== id));
      toast.success('Eliminada');
    } catch { toast.error('Error al eliminar'); }
  };

  const tipoLabel = (tipo) => TIPOS.find(t => t.value === tipo)?.label || tipo;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Publicaciones</h1>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
          <FiPlus size={18} /> Nueva Publicación
        </button>
      </div>

      <div className="space-y-4">
        {publicaciones.length === 0 && !cargando && <div className="text-center py-12 text-gray-400">No hay publicaciones</div>}
        {publicaciones.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-800">{p.titulo}</h3>
                  <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">{tipoLabel(p.tipo_destinatario)}</span>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-line">{p.contenido}</p>
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
                <p className="text-xs text-gray-400 mt-2">{new Date(p.created_at).toLocaleString('es-EC')}</p>
              </div>
              <button onClick={() => eliminar(p.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"><FiTrash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>

      {modal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="font-bold text-gray-800">Nueva Publicación</h2>
              <button onClick={cerrar} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"><FiX /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.titulo ? 'border-red-400' : 'border-gray-300'}`}
                  {...register('titulo', { required: 'Requerido' })} />
                {errors.titulo && <p className="text-red-500 text-xs mt-1">{errors.titulo.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenido *</label>
                <textarea rows={4} className={`w-full border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.contenido ? 'border-red-400' : 'border-gray-300'}`}
                  {...register('contenido', { required: 'Requerido' })} />
                {errors.contenido && <p className="text-red-500 text-xs mt-1">{errors.contenido.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enviar a</label>
                <select value={tipoSel} onChange={e => { setTipoSel(e.target.value); setDestinatariosSeleccionados([]); }}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {tipoSel === 'individual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar usuarios</label>
                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    {usuarios.map(u => (
                      <label key={u.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                        <input type="checkbox" checked={destinatariosSeleccionados.includes(u.id)} onChange={() => toggleDestinatario(u.id)} className="w-4 h-4 rounded text-primary-600" />
                        <div>
                          <p className="text-sm text-gray-800">{u.nombre_completo}</p>
                          <p className="text-xs text-gray-400">{u.email} · {u.rol}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {destinatariosSeleccionados.length > 0 && <p className="text-xs text-primary-600 mt-1">{destinatariosSeleccionados.length} seleccionado(s)</p>}
                </div>
              )}
              {tipoSel === 'por_grupo' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar grupos</label>
                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    {grupos.map(g => (
                      <label key={g.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                        <input type="checkbox" checked={destinatariosSeleccionados.includes(g.id)} onChange={() => toggleDestinatario(g.id)} className="w-4 h-4 rounded text-primary-600" />
                        <div>
                          <p className="text-sm text-gray-800">{g.nombre}</p>
                          <p className="text-xs text-gray-400">{g.reunion?.nombre}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Archivos adjuntos (máx. 3 de 5MB)</label>
                <label className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 cursor-pointer hover:border-primary-400 transition">
                  <FiPaperclip className="text-gray-400" />
                  <span className="text-sm text-gray-500">Adjuntar archivos...</span>
                  <input type="file" multiple className="hidden" onChange={e => {
                    const files = Array.from(e.target.files);
                    if (archivos.length + files.length > 3) return toast.error('Máximo 3 archivos');
                    setArchivos(prev => [...prev, ...files]);
                  }} />
                </label>
                {archivos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {archivos.map((f, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg">
                        {f.name}
                        <button type="button" onClick={() => setArchivos(prev => prev.filter((_, idx) => idx !== i))} className="ml-1 text-gray-400 hover:text-red-500"><FiX size={11} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrar} className="flex-1 py-3 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" disabled={cargando}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-60">
                  <FiSend size={15} /> {cargando ? 'Enviando...' : 'Publicar y Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PublicacionesAdminPage;
