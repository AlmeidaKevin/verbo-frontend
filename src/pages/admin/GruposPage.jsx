import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiToggleLeft, FiToggleRight, FiUserPlus, FiGrid } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const GruposPage = () => {
  const [grupos, setGrupos] = useState([]);
  const [reuniones, setReuniones] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [ayudantes, setAyudantes] = useState([]);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [ayudantesExtra, setAyudantesExtra] = useState([]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      const [gRes, rRes, uRes] = await Promise.all([api.get('/grupos'), api.get('/reuniones'), api.get('/usuarios')]);
      setGrupos(gRes.data.grupos || []);
      setReuniones(rRes.data.reuniones || []);
      const usuarios = uRes.data.usuarios || [];
      setDocentes(usuarios.filter(u => u.rol === 'docente' && u.activo));
      setAyudantes(usuarios.filter(u => u.rol === 'ayudante' && u.activo));
    } catch { toast.error('Error al cargar datos'); }
    finally { setCargando(false); }
  };

  const abrirModal = (grupo = null) => {
    setEditando(grupo);
    reset(grupo ? {
      nombre: grupo.nombre, reunion_id: grupo.reunion_id,
      docente_id: grupo.docente_id || '', ayudante1_id: grupo.ayudante1_id || '',
      ayudante2_id: grupo.ayudante2_id || '', edad_min: grupo.edad_min,
      edad_max: grupo.edad_max, ayudantes_checklist: grupo.ayudantes_checklist || false,
    } : { nombre: '', reunion_id: '', docente_id: '', ayudante1_id: '', ayudante2_id: '', edad_min: 0, edad_max: '', ayudantes_checklist: false });
    setAyudantesExtra(grupo?.ayudantes_extra?.length > 0 ? grupo.ayudantes_extra.map(a => a.ayudante?.id || '') : []);
    setModal(true);
  };

  const cerrar = () => { setModal(false); setEditando(null); setAyudantesExtra([]); };

  const onSubmit = async (datos) => {
    if (parseInt(datos.edad_max) <= parseInt(datos.edad_min)) return toast.error('La edad máxima debe ser mayor a la mínima');
    setCargando(true);
    try {
      const payload = {
        ...datos,
        edad_min: parseInt(datos.edad_min), edad_max: parseInt(datos.edad_max),
        docente_id: datos.docente_id || null, ayudante1_id: datos.ayudante1_id || null,
        ayudante2_id: datos.ayudante2_id || null, ayudantes_extra: ayudantesExtra.filter(id => id),
      };
      if (editando) {
        const { data } = await api.put(`/grupos/${editando.id}`, payload);
        setGrupos(prev => prev.map(g => g.id === editando.id ? data.grupo : g));
        toast.success('Grupo actualizado');
      } else {
        const { data } = await api.post('/grupos', payload);
        setGrupos(prev => [...prev, data.grupo]);
        toast.success('Grupo creado');
      }
      cerrar(); cargar();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar'); }
    finally { setCargando(false); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este grupo?')) return;
    try {
      await api.delete(`/grupos/${id}`);
      setGrupos(prev => prev.filter(g => g.id !== id));
      toast.success('Grupo eliminado');
    } catch { toast.error('Error al eliminar'); }
  };

  const toggleChecklist = async (grupo) => {
    try {
      await api.put(`/grupos/${grupo.id}`, { ayudantes_checklist: !grupo.ayudantes_checklist });
      setGrupos(prev => prev.map(g => g.id === grupo.id ? { ...g, ayudantes_checklist: !g.ayudantes_checklist } : g));
      toast.success(`Checklist para ayudantes ${!grupo.ayudantes_checklist ? 'activado' : 'desactivado'}`);
    } catch { toast.error('Error al cambiar permiso'); }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 flex items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, #1F4E5F 0%, #183D4A 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white" style={{ transform: 'translate(30%,-30%)' }} />
        </div>
        <div className="relative">
          <h1 className="text-xl font-bold text-white">Grupos</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9EC5D0' }}>
            {grupos.length} grupo{grupos.length !== 1 ? 's' : ''} registrado{grupos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => abrirModal()}
          className="relative flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition shrink-0"
          style={{ background: '#C8A96B', color: '#112C36' }}>
          <FiPlus size={18} /> Nuevo Grupo
        </button>
      </div>

      {cargando && grupos.length === 0 ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {grupos.map(g => (
            <div key={g.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 truncate">{g.nombre}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#EEF4F6', color: '#1F4E5F' }}>
                      {g.edad_min}–{g.edad_max} años
                    </span>
                    <span className="text-xs text-gray-400">{g.reunion?.nombre}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => abrirModal(g)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"><FiEdit2 size={14} /></button>
                  <button onClick={() => eliminar(g.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><FiTrash2 size={14} /></button>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                {[
                  { label: 'Docente', value: g.docente?.nombre_completo, color: 'bg-emerald-100 text-emerald-700' },
                  { label: 'Ayud. 1', value: g.ayudante1?.nombre_completo, color: 'bg-violet-100 text-violet-700' },
                  { label: 'Ayud. 2', value: g.ayudante2?.nombre_completo, color: 'bg-violet-100 text-violet-700' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    <span className={`${color} px-2 py-0.5 rounded-full font-medium shrink-0`}>{label}</span>
                    <span className="text-gray-600 truncate">{value || <em className="text-gray-400 not-italic">Sin asignar</em>}</span>
                  </div>
                ))}
                {g.ayudantes_extra?.map((ae, idx) => (
                  <div key={ae.id || idx} className="flex items-center gap-2 text-xs">
                    <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium shrink-0">Ayud. {idx + 3}</span>
                    <span className="text-gray-600 truncate">{ae.ayudante?.nombre_completo || <em className="text-gray-400 not-italic">Sin asignar</em>}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <button onClick={() => toggleChecklist(g)}
                  className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${g.ayudantes_checklist ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
                  <span>Checklist ayudantes</span>
                  {g.ayudantes_checklist ? <FiToggleRight size={18} className="text-emerald-600" /> : <FiToggleLeft size={18} />}
                </button>
                <div className="flex gap-1">
                  <button onClick={() => abrirModal(g)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"><FiEdit2 size={13} /></button>
                  <button onClick={() => eliminar(g.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><FiTrash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
          {grupos.length === 0 && (
            <div className="col-span-3 bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#EEF4F6' }}>
                <FiGrid size={28} className="text-primary-400" />
              </div>
              <p className="text-gray-600 font-semibold">No hay grupos creados aún</p>
              <button onClick={() => abrirModal()} className="mt-4 flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl text-white mx-auto" style={{ background: '#1F4E5F' }}>
                <FiPlus size={16} /> Crear primer grupo
              </button>
            </div>
          )}
        </div>
      )}

      {modal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="font-bold text-gray-800">{editando ? 'Editar Grupo' : 'Nuevo Grupo'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Asigna docentes y rango de edad</p>
              </div>
              <button onClick={cerrar} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"><FiX /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del grupo *</label>
                <input className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.nombre ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Ej: Semillitas"
                  {...register('nombre', { required: 'El nombre es requerido' })} />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reunión *</label>
                <select className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.reunion_id ? 'border-red-400' : 'border-gray-300'}`}
                  {...register('reunion_id', { required: 'La reunión es requerida' })}>
                  <option value="">-- Selecciona --</option>
                  {reuniones.map(r => <option key={r.id} value={r.id}>{r.nombre} ({r.hora_inicio}–{r.hora_fin})</option>)}
                </select>
                {errors.reunion_id && <p className="text-red-500 text-xs mt-1">{errors.reunion_id.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[{ name: 'edad_min', label: 'Edad mínima *' }, { name: 'edad_max', label: 'Edad máxima *' }].map(({ name, label }) => (
                  <div key={name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input type="number" min={0}
                      className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors[name] ? 'border-red-400' : 'border-gray-300'}`}
                      {...register(name, { required: 'Requerido', valueAsNumber: true, min: { value: 0, message: 'Mínimo 0' }, validate: v => Number.isInteger(v) || 'Debe ser entero' })} />
                    {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>}
                  </div>
                ))}
              </div>
              {[
                { field: 'docente_id', label: 'Docente / Líder', list: docentes },
                { field: 'ayudante1_id', label: 'Ayudante / Colaborador 1', list: ayudantes },
                { field: 'ayudante2_id', label: 'Ayudante / Colaborador 2', list: ayudantes },
              ].map(({ field, label, list }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <select className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" {...register(field)}>
                    <option value="">Sin asignar</option>
                    {list.map(u => <option key={u.id} value={u.id}>{u.nombre_completo}</option>)}
                  </select>
                </div>
              ))}
              {ayudantesExtra.map((val, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Ayudante / Colaborador {idx + 3}</label>
                    <button type="button" onClick={() => setAyudantesExtra(prev => prev.filter((_, i) => i !== idx))}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><FiX size={12} /> Quitar</button>
                  </div>
                  <select value={val} onChange={e => setAyudantesExtra(prev => prev.map((v, i) => i === idx ? e.target.value : v))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">Sin asignar</option>
                    {ayudantes.map(a => <option key={a.id} value={a.id}>{a.nombre_completo}</option>)}
                  </select>
                </div>
              ))}
              <button type="button" onClick={() => setAyudantesExtra(prev => [...prev, ''])}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition">
                <FiUserPlus size={15} /> Agregar otro ayudante / colaborador
              </button>
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl">
                <input type="checkbox" className="w-4 h-4 rounded text-primary-600" {...register('ayudantes_checklist')} />
                <div>
                  <p className="text-sm font-medium text-gray-700">Permitir checklist a ayudantes</p>
                  <p className="text-xs text-gray-400">Los ayudantes podrán marcar asistencia en este grupo</p>
                </div>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrar} className="flex-1 py-3 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" disabled={cargando} className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-60">
                  {cargando ? 'Guardando...' : editando ? 'Actualizar' : 'Crear Grupo'}
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

export default GruposPage;
