import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2, FiClock, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import api from '../../services/api';

const DescripcionTexto = ({ texto }) => {
  const [expandido, setExpandido] = useState(false);
  const LIMITE = 120;
  const esCortable = texto.length > LIMITE || texto.includes('\n');
  const primerSalto = texto.indexOf('\n');
  const debeCortar = !expandido && esCortable && (texto.length > LIMITE || (primerSalto !== -1 && primerSalto < LIMITE));
  const textoVisible = debeCortar ? texto.slice(0, Math.min(LIMITE, primerSalto !== -1 ? primerSalto : LIMITE)) : texto;
  return (
    <div className="mt-2">
      <p className="text-gray-500 text-xs whitespace-pre-wrap leading-relaxed">{textoVisible}{debeCortar && '...'}</p>
      {esCortable && (
        <button onClick={() => setExpandido(p => !p)} className="text-primary-600 text-xs font-medium mt-1 hover:underline">
          {expandido ? 'Ver menos' : 'Ver más'}
        </button>
      )}
    </div>
  );
};

const ReunionesPage = () => {
  const [reuniones, setReuniones] = useState([]);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [cargando, setCargando] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/reuniones');
      setReuniones(data.reuniones || []);
    } catch { toast.error('Error al cargar reuniones'); }
    finally { setCargando(false); }
  };

  const abrirModal = (reunion = null) => {
    setEditando(reunion);
    reset(reunion
      ? { nombre: reunion.nombre, hora_inicio: reunion.hora_inicio, hora_fin: reunion.hora_fin, descripcion: reunion.descripcion || '' }
      : { nombre: '', hora_inicio: '', hora_fin: '', descripcion: '' });
    setModal(true);
  };

  const cerrar = () => { setModal(false); setEditando(null); };

  const onSubmit = async (datos) => {
    if (datos.hora_inicio >= datos.hora_fin) return toast.error('La hora de inicio debe ser menor a la hora de fin');
    setCargando(true);
    try {
      if (editando) {
        const { data } = await api.put(`/reuniones/${editando.id}`, datos);
        setReuniones(prev => prev.map(r => r.id === editando.id ? data.reunion : r));
        toast.success('Reunión actualizada');
      } else {
        const { data } = await api.post('/reuniones', datos);
        setReuniones(prev => [...prev, data.reunion]);
        toast.success('Reunión creada');
      }
      cerrar();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar'); }
    finally { setCargando(false); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta reunión y todos sus grupos?')) return;
    try {
      await api.delete(`/reuniones/${id}`);
      setReuniones(prev => prev.filter(r => r.id !== id));
      toast.success('Reunión eliminada');
    } catch { toast.error('Error al eliminar'); }
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
          <h1 className="text-xl font-bold text-white">Reuniones</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9EC5D0' }}>
            {reuniones.length} reunión{reuniones.length !== 1 ? 'es' : ''} configurada{reuniones.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => abrirModal()}
          className="relative flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition shrink-0"
          style={{ background: '#C8A96B', color: '#112C36' }}>
          <FiPlus size={18} /> Nueva Reunión
        </button>
      </div>

      {cargando && reuniones.length === 0 ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reuniones.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: '#EEF4F6' }}>
                  <FiClock className="text-primary-600" size={22} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => abrirModal(r)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"><FiEdit2 size={15} /></button>
                  <button onClick={() => eliminar(r.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><FiTrash2 size={15} /></button>
                </div>
              </div>
              <h3 className="font-bold text-gray-800 mb-1">{r.nombre}</h3>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: '#EEF4F6', color: '#1F4E5F' }}>
                <FiClock size={11} /> {r.hora_inicio} – {r.hora_fin}
              </div>
              {r.descripcion && <DescripcionTexto texto={r.descripcion} />}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                {r.grupos?.length > 0
                  ? <span className="text-xs text-gray-500">{r.grupos.length} grupo(s) asignado(s)</span>
                  : <span className="text-xs text-gray-400">Sin grupos asignados</span>}
                <div className="flex gap-1">
                  <button onClick={() => abrirModal(r)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"><FiEdit2 size={13} /></button>
                  <button onClick={() => eliminar(r.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><FiTrash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
          {reuniones.length === 0 && (
            <div className="col-span-3 bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#EEF4F6' }}>
                <FiClock size={28} className="text-primary-400" />
              </div>
              <p className="text-gray-600 font-semibold">No hay reuniones creadas aún</p>
              <p className="text-gray-400 text-sm mt-1">Crea la primera reunión para comenzar</p>
              <button onClick={() => abrirModal()}
                className="mt-4 flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl text-white mx-auto"
                style={{ background: '#1F4E5F' }}>
                <FiPlus size={16} /> Crear primera reunión
              </button>
            </div>
          )}
        </div>
      )}

      {modal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-800">{editando ? 'Editar Reunión' : 'Nueva Reunión'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Configura el horario de la reunión</p>
              </div>
              <button onClick={cerrar} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"><FiX /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la reunión *</label>
                <input className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.nombre ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Ej: Reunión 1"
                  {...register('nombre', { required: 'El nombre es requerido' })} />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio *</label>
                  <input type="time" className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.hora_inicio ? 'border-red-400' : 'border-gray-300'}`}
                    {...register('hora_inicio', { required: 'Requerido' })} />
                  {errors.hora_inicio && <p className="text-red-500 text-xs mt-1">{errors.hora_inicio.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin *</label>
                  <input type="time" className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.hora_fin ? 'border-red-400' : 'border-gray-300'}`}
                    {...register('hora_fin', { required: 'Requerido' })} />
                  {errors.hora_fin && <p className="text-red-500 text-xs mt-1">{errors.hora_fin.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea rows={3} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Descripción opcional..."
                  {...register('descripcion')} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrar} className="flex-1 py-3 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" disabled={cargando} className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-60">
                  {cargando ? 'Guardando...' : editando ? 'Actualizar' : 'Crear'}
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

export default ReunionesPage;
