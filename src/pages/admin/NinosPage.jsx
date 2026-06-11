import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const NinosPage = () => {
  const [ninos, setNinos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [cargando, setCargando] = useState(false);

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
    reset(nino ? {
      nombre_completo: nino.nombre_completo,
      edad: nino.edad || '',
      grupo_id: nino.grupo_id || '',
      numero_contacto: nino.numero_contacto || '',
      observacion: nino.observacion || '',
    } : { nombre_completo: '', edad: '', grupo_id: '', numero_contacto: '', observacion: '' });
    setModal(true);
  };

  const cerrar = () => { setModal(false); setEditando(null); };

  
  const onSubmit = async (datos) => {
    setCargando(true);
    try {
      const payload = {
        nombre_completo: datos.nombre_completo.trim(),
        edad: datos.edad ? parseInt(datos.edad) : null,
        grupo_id: datos.grupo_id || null,
        numero_contacto: datos.numero_contacto?.trim() || null,
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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally { setCargando(false); }
  };

  

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este niño del sistema?')) return;
    try {
      await api.delete(`/ninos/${id}`);
      setNinos(prev => prev.filter(n => n.id !== id));
      toast.success('Eliminado');
    } catch { toast.error('Error al eliminar'); }
  };

  const filtrados = ninos.filter(n =>
    n.nombre_completo.toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Niños</h1>
  
        <button
          onClick={() => abrirModal()}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition w-fit"
        >
          <FiPlus size={18} />
          Registrar Niño
        </button>
      </div>
  
      <div className="relative">
        <FiSearch
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={16}
        />
  
        <input
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder="Buscar niño por nombre..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
  
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">
            Total: {filtrados.length} niños
          </span>
        </div>
  
        {cargando ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          </div>
        ) : filtrados.length === 0 ? (
          <p className="text-center text-gray-400 py-10">
            No se encontraron niños
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtrados.map((n, i) => (
              <div
                key={n.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
  
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {n.nombre_completo}
                    </p>
  
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {n.edad && (
                        <span className="text-xs text-gray-400">
                          {n.edad} años
                        </span>
                      )}
  
                      {n.grupo && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          {n.grupo.nombre}
                        </span>
                      )}
  
                      {n.numero_contacto && (
                        <span className="text-xs text-gray-400">
                          📞 {n.numero_contacto}
                        </span>
                      )}
  
                      {n.observacion && (
                        <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full">
                          Nota
                        </span>
                      )}
                    </div>
                  </div>
                </div>
  
                <div className="flex gap-1">
                  <button
                    onClick={() => abrirModal(n)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                  >
                    <FiEdit2 size={14} />
                  </button>
  
                  <button
                    onClick={() => eliminar(n.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">
                {editando ? 'Editar Niño' : 'Registrar Niño'}
              </h2>
  
              <button
                onClick={cerrar}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"
              >
                <FiX />
              </button>
            </div>
  
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="p-6 space-y-4"
              noValidate
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
  
                <input
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.nombre_completo
                      ? 'border-red-400'
                      : 'border-gray-300'
                  }`}
                  placeholder="Nombre y apellido del niño"
                  {...register('nombre_completo', {
                    required: 'El nombre es requerido',
                    validate: (v) =>
                      /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(v) ||
                      'Solo se permiten letras en el nombre',
                  })}
                />
  
                {errors.nombre_completo && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.nombre_completo.message}
                  </p>
                )}
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Edad
                </label>
  
                <input
                  type="number"
                  min={0}
                  max={17}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.edad ? 'border-red-400' : 'border-gray-300'
                  }`}
                  placeholder="Ej: 7"
                  {...register('edad', {
                    validate: (v) =>
                      !v ||
                      (Number.isInteger(Number(v)) &&
                        Number(v) >= 0 &&
                        Number(v) <= 17) ||
                      'Edad inválida (0-17)',
                  })}
                />
  
                {errors.edad && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.edad.message}
                  </p>
                )}
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grupo asignado
                </label>
  
                <select
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  {...register('grupo_id')}
                >
                  <option value="">Sin grupo asignado</option>
  
                  {grupos.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nombre} ({g.edad_min}–{g.edad_max} años)
                    </option>
                  ))}
                </select>
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de contacto *
                </label>
  
                <input
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.numero_contacto
                      ? 'border-red-400'
                      : 'border-gray-300'
                  }`}
                  placeholder="Ej: 0991234567"
                  {...register('numero_contacto', {
                    required: 'El número de contacto es requerido',
                    pattern: {
                      value: /^\d+$/,
                      message: 'Solo se permiten números',
                    },
                    minLength: {
                      value: 7,
                      message: 'Mínimo 7 dígitos',
                    },
                  })}
                />
  
                {errors.numero_contacto && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.numero_contacto.message}
                  </p>
                )}
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observación{' '}
                  <span className="text-gray-400 font-normal">
                    (opcional)
                  </span>
                </label>
  
                <textarea
                  rows={2}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Alergias, condiciones especiales, etc."
                  {...register('observacion')}
                />
              </div>
  
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={cerrar}
                  className="flex-1 py-3 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
  
                <button
                  type="submit"
                  disabled={cargando}
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-60"
                >
                  {cargando
                    ? 'Guardando...'
                    : editando
                    ? 'Actualizar'
                    : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NinosPage;
