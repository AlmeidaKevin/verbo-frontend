import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch, FiEye, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ObservacionTexto = ({ texto }) => {
  const [expandido, setExpandido] = useState(false);
  const LIMITE = 100;
  const esCortable = texto.length > LIMITE || texto.includes('\n');
  const primerSalto = texto.indexOf('\n');
  const debeCortar = !expandido && esCortable && (texto.length > LIMITE || (primerSalto !== -1 && primerSalto < LIMITE));
  const textoVisible = debeCortar ? texto.slice(0, Math.min(LIMITE, primerSalto !== -1 ? primerSalto : LIMITE)) : texto;
  return (
    <div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{textoVisible}{debeCortar && '...'}</p>
      {esCortable && (
        <button onClick={() => setExpandido(p => !p)} className="text-primary-600 text-xs font-medium mt-1 hover:underline">
          {expandido ? 'Ver menos' : 'Ver más'}
        </button>
      )}
    </div>
  );
};

const NinosPage = () => {
  const [ninos, setNinos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [modalObservacion, setModalObservacion] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      const [nRes, gRes] = await Promise.all([api.get('/ninos'), api.get('/grupos')]);
      setNinos(nRes.data.ninos || []);
      setGrupos(gRes.data.grupos || []);
    } catch { toast.error('Error al cargar datos'); }
    finally { setCargando(false); }
  };

  const abrirModal = (nino = null) => {
    setEditando(nino);
    reset(nino
      ? { nombre_completo: nino.nombre_completo, edad: nino.edad || '', grupo_id: nino.grupo_id || '', numero_contacto: nino.numero_contacto || '', observacion: nino.observacion || '' }
      : { nombre_completo: '', edad: '', grupo_id: '', numero_contacto: '', observacion: '' });
    setModal(true);
  };

  const cerrar = () => { setModal(false); setEditando(null); };

  const onSubmit = async (datos) => {
    setCargando(true);
    try {
      const payload = {
        nombre_completo: datos.nombre_completo.trim(), edad: datos.edad ? parseInt(datos.edad) : null,
        grupo_id: datos.grupo_id || null, numero_contacto: datos.numero_contacto?.trim() || null,
        observacion: datos.observacion?.trim() || null,
      };
      if (editando) {
        const { data } = await api.put(`/ninos/${editando.id}`, payload);
        setNinos(prev => prev.map(n => n.id === editando.id ? { ...n, ...data.nino } : n));
        toast.success('Niño actualizado');
      } else {
        const { data } = await api.post('/ninos', payload);
        setNinos(prev => [data.nino, ...prev]);
        toast.success('Niño registrado');
      }
      cerrar();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar'); }
    finally { setCargando(false); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este niño del sistema?')) return;
    try {
      await api.delete(`/ninos/${id}`);
      setNinos(prev => prev.filter(n => n.id !== id));
      toast.success('Eliminado');
    } catch { toast.error('Error al eliminar'); }
  };

  const filtrados = ninos.filter(n => n.nombre_completo.toLowerCase().includes(buscar.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 flex items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, #1F4E5F 0%, #183D4A 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white" style={{ transform: 'translate(30%,-30%)' }} />
        </div>
        <div className="relative">
          <h1 className="text-xl font-bold text-white">Niños</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9EC5D0' }}>
            {ninos.length} niño{ninos.length !== 1 ? 's' : ''} registrado{ninos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => abrirModal()}
          className="relative flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition shrink-0"
          style={{ background: '#C8A96B', color: '#112C36' }}>
          <FiPlus size={18} /> Registrar Niño
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar niño por nombre..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between" style={{ background: '#EEF4F6' }}>
          <span className="text-sm font-semibold text-gray-700">Total: {filtrados.length} niños</span>
          {buscar && <button onClick={() => setBuscar('')} className="text-xs text-gray-400 hover:text-gray-600">Limpiar filtro</button>}
        </div>
        {cargando ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-12">
            <FiUsers size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400">{buscar ? 'No se encontraron niños con ese nombre' : 'No hay niños registrados aún'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtrados.map((n, i) => (
              <div key={n.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition group">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
                    style={{ background: '#1F4E5F' }}>{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{n.nombre_completo}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {n.edad && <span className="text-xs text-gray-400">{n.edad} años</span>}
                      {n.grupo && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#EEF4F6', color: '#1F4E5F' }}>{n.grupo.nombre}</span>}
                      {n.numero_contacto && <span className="text-xs text-gray-400">📞 {n.numero_contacto}</span>}
                      {n.observacion && (
                        <button onClick={() => setModalObservacion({ nombre: n.nombre_completo, observacion: n.observacion })}
                          className="flex items-center gap-1 text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full hover:bg-amber-100 transition">
                          <FiEye size={10} /> Ver nota
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => abrirModal(n)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"><FiEdit2 size={14} /></button>
                  <button onClick={() => eliminar(n.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><FiTrash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal observación */}
      {modalObservacion && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl mx-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-800">Observación</h3>
                <p className="text-xs text-gray-400 mt-0.5">{modalObservacion.nombre}</p>
              </div>
              <button onClick={() => setModalObservacion(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"><FiX /></button>
            </div>
            <div className="p-5"><ObservacionTexto texto={modalObservacion.observacion} /></div>
            <div className="px-5 pb-5">
              <button onClick={() => setModalObservacion(null)} className="w-full py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">Cerrar</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal crear/editar */}
      {modal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="font-bold text-gray-800">{editando ? 'Editar Niño' : 'Registrar Niño'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Completa la información del niño</p>
              </div>
              <button onClick={cerrar} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"><FiX /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                <input className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.nombre_completo ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Nombre y apellido del niño"
                  {...register('nombre_completo', { required: 'El nombre es requerido', validate: v => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(v) || 'Solo se permiten letras' })} />
                {errors.nombre_completo && <p className="text-red-500 text-xs mt-1">{errors.nombre_completo.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
                <input type="number" min={0} max={17}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.edad ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Ej: 7"
                  {...register('edad', { validate: v => !v || (Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 17) || 'Edad inválida (0-17)' })} />
                {errors.edad && <p className="text-red-500 text-xs mt-1">{errors.edad.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo asignado</label>
                <select className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" {...register('grupo_id')}>
                  <option value="">Sin grupo asignado</option>
                  {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre} ({g.edad_min}–{g.edad_max} años)</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de contacto *</label>
                <input className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.numero_contacto ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Ej: 0991234567"
                  {...register('numero_contacto', { required: 'El número de contacto es requerido', pattern: { value: /^\d+$/, message: 'Solo se permiten números' }, minLength: { value: 7, message: 'Mínimo 7 dígitos' } })} />
                {errors.numero_contacto && <p className="text-red-500 text-xs mt-1">{errors.numero_contacto.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observación <span className="text-gray-400 font-normal">(opcional)</span></label>
                <textarea rows={3} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Alergias, condiciones especiales, etc." {...register('observacion')} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrar} className="flex-1 py-3 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" disabled={cargando} className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-60">
                  {cargando ? 'Guardando...' : editando ? 'Actualizar' : 'Registrar'}
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

export default NinosPage;
