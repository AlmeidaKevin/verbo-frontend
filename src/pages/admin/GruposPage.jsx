import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUsers, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      const [gRes, rRes, uRes] = await Promise.all([
        api.get('/grupos'),
        api.get('/reuniones'),
        api.get('/usuarios'),
      ]);
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
      nombre: grupo.nombre,
      reunion_id: grupo.reunion_id,
      docente_id: grupo.docente_id || '',
      ayudante1_id: grupo.ayudante1_id || '',
      ayudante2_id: grupo.ayudante2_id || '',
      edad_min: grupo.edad_min,
      edad_max: grupo.edad_max,
      ayudantes_checklist: grupo.ayudantes_checklist || false,
    } : {
      nombre: '', reunion_id: '', docente_id: '', ayudante1_id: '', ayudante2_id: '',
      edad_min: 1, edad_max: 5, ayudantes_checklist: false,
    });
    setModal(true);
  };

  const cerrar = () => { setModal(false); setEditando(null); };

  const onSubmit = async (datos) => {
    if (parseInt(datos.edad_max) <= parseInt(datos.edad_min)) {
      return toast.error('La edad máxima debe ser mayor a la mínima');
    }
    setCargando(true);
    try {
      const payload = {
        ...datos,
        edad_min: parseInt(datos.edad_min),
        edad_max: parseInt(datos.edad_max),
        docente_id: datos.docente_id || null,
        ayudante1_id: datos.ayudante1_id || null,
        ayudante2_id: datos.ayudante2_id || null,
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
      cerrar();
      cargar(); // recargar para traer relaciones
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally { setCargando(false); }
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Grupos</h1>
        <button onClick={() => abrirModal()}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
          <FiPlus size={18} /> Nuevo Grupo
        </button>
      </div>

      {cargando && grupos.length === 0 ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {grupos.map(g => (
            <div key={g.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{g.nombre}</h3>
                  <p className="text-xs text-primary-600 font-medium mt-0.5">{g.reunion?.nombre} · {g.reunion?.hora_inicio}–{g.reunion?.hora_fin}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => abrirModal(g)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"><FiEdit2 size={14} /></button>
                  <button onClick={() => eliminar(g.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><FiTrash2 size={14} /></button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-xs mb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Edad</span>
                  <span className="text-gray-600">{g.edad_min}–{g.edad_max} años</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Docente</span>
                  <span className="text-gray-600">{g.docente?.nombre_completo || <em className="text-gray-400">Sin asignar</em>}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Ayud. 1</span>
                  <span className="text-gray-600">{g.ayudante1?.nombre_completo || <em className="text-gray-400">Sin asignar</em>}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Ayud. 2</span>
                  <span className="text-gray-600">{g.ayudante2?.nombre_completo || <em className="text-gray-400">Sin asignar</em>}</span>
                </div>
              </div>

              {/* Toggle checklist ayudantes */}
              <button onClick={() => toggleChecklist(g)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${g.ayudantes_checklist ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                <span>Checklist para ayudantes</span>
                {g.ayudantes_checklist ? <FiToggleRight size={18} className="text-green-600" /> : <FiToggleLeft size={18} />}
              </button>
            </div>
          ))}
          {grupos.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400">No hay grupos creados aún</div>
          )}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="font-bold text-gray-800">{editando ? 'Editar Grupo' : 'Nuevo Grupo'}</h2>
              <button onClick={cerrar} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"><FiX /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del grupo *</label>
                <input className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.nombre ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Ej: Semillitas"
                  {...register('nombre', { required: 'El nombre es requerido' })} />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
              </div>

              {/* Reunión */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reunión *</label>
                <select className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.reunion_id ? 'border-red-400' : 'border-gray-300'}`}
                  {...register('reunion_id', { required: 'La reunión es requerida' })}>
                  <option value="">-- Selecciona --</option>
                  {reuniones.map(r => <option key={r.id} value={r.id}>{r.nombre} ({r.hora_inicio}–{r.hora_fin})</option>)}
                </select>
                {errors.reunion_id && <p className="text-red-500 text-xs mt-1">{errors.reunion_id.message}</p>}
              </div>

              {/* Rango de edades */}
              <div className="grid grid-cols-2 gap-4">
                {[{ name: 'edad_min', label: 'Edad mínima *' }, { name: 'edad_max', label: 'Edad máxima *' }].map(({ name, label }) => (
                  <div key={name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input type="number" min={0} max={17}
                      className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors[name] ? 'border-red-400' : 'border-gray-300'}`}
                      {...register(name, {
                        required: 'Requerido',
                        valueAsNumber: true,
                        min: { value: 0, message: 'Mínimo 0' },
                        max: { value: 17, message: 'Máximo 17' },
                        validate: v => Number.isInteger(v) || 'Debe ser entero',
                      })} />
                    {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>}
                  </div>
                ))}
              </div>

              {/* Docente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Docente / Líder</label>
                <select className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  {...register('docente_id')}>
                  <option value="">Sin asignar</option>
                  {docentes.map(d => <option key={d.id} value={d.id}>{d.nombre_completo}</option>)}
                </select>
              </div>

              {/* Ayudante 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ayudante / Colaborador 1</label>
                <select className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  {...register('ayudante1_id')}>
                  <option value="">Sin asignar</option>
                  {ayudantes.map(a => <option key={a.id} value={a.id}>{a.nombre_completo}</option>)}
                </select>
              </div>

              {/* Ayudante 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ayudante / Colaborador 2</label>
                <select className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  {...register('ayudante2_id')}>
                  <option value="">Sin asignar</option>
                  {ayudantes.map(a => <option key={a.id} value={a.id}>{a.nombre_completo}</option>)}
                </select>
              </div>

              {/* Checklist ayudantes */}
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl">
                <input type="checkbox" className="w-4 h-4 rounded text-primary-600"
                  {...register('ayudantes_checklist')} />
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
        </div>
      )}
    </div>
  );
};

export default GruposPage;
