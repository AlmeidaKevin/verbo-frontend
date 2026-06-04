import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { FiCamera, FiEye, FiEyeOff, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PerfilPage = () => {
  const { usuario, actualizarUsuario } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [verPass, setVerPass] = useState({ actual: false, nuevo: false, confirmar: false });
  const fotoRef = useRef();

  const { register: regPerfil, handleSubmit: handlePerfil, formState: { errors: errPerfil } } = useForm({
    defaultValues: { nombre_completo: usuario?.nombre_completo || '', telefono: usuario?.telefono || '' },
  });

  const { register: regPass, handleSubmit: handlePass, watch, reset: resetPass, formState: { errors: errPass } } = useForm();

  const onGuardarPerfil = async (datos) => {
    setCargando(true);
    try {
      const { data } = await api.put('/auth/perfil', datos);
      actualizarUsuario(data.usuario);
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar');
    } finally { setCargando(false); }
  };

  const onCambiarPassword = async (datos) => {
    if (datos.password_nuevo !== datos.confirmar) {
      return toast.error('Las contraseñas no coinciden');
    }
    setCargando(true);
    try {
      await api.put('/auth/cambiar-password', {
        password_actual: datos.password_actual,
        password_nuevo: datos.password_nuevo,
      });
      toast.success('Contraseña actualizada');
      resetPass();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cambiar contraseña');
    } finally { setCargando(false); }
  };

  const onFotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Solo se permiten imágenes');
    if (file.size > 2 * 1024 * 1024) return toast.error('La imagen no debe superar 2MB');

    const formData = new FormData();
    formData.append('foto', file);
    setSubiendoFoto(true);
    try {
      const { data } = await api.post('/auth/perfil/foto', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      actualizarUsuario({ foto_url: data.foto_url });
      toast.success('Foto actualizada');
    } catch (err) {
      toast.error('Error al subir la foto');
    } finally { setSubiendoFoto(false); }
  };

  const rolLabel = { admin: 'Administrador', docente: 'Docente / Líder', ayudante: 'Ayudante / Colaborador' };

  const reglasPasswordNuevo = {
    required: 'Requerida',
    minLength: { value: 8, message: 'Mínimo 8 caracteres' },
    validate: {
      mayus: v => /[A-Z]/.test(v) || 'Debe tener una mayúscula',
      minus: v => /[a-z]/.test(v) || 'Debe tener una minúscula',
      num: v => /\d/.test(v) || 'Debe tener un número',
      especial: v => /[!@#$%^&*(),.?":{}|<>]/.test(v) || 'Debe tener un carácter especial',
    },
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>

      {/* Foto y datos básicos */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
          {/* Avatar con botón de cámara */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center">
              {usuario?.foto_url
                ? <img src={usuario.foto_url} alt="Foto perfil" className="w-full h-full object-cover" />
                : <span className="text-4xl font-bold text-primary-600">{usuario?.nombre_completo?.[0]}</span>
              }
            </div>
            <button
              onClick={() => fotoRef.current?.click()}
              disabled={subiendoFoto}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-lg transition disabled:opacity-60"
            >
              {subiendoFoto
                ? <span className="animate-spin rounded-full w-4 h-4 border-b-2 border-white" />
                : <FiCamera size={14} />
              }
            </button>
            <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={onFotoChange} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800">{usuario?.nombre_completo}</h2>
            <span className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded-full mt-1 inline-block">
              {rolLabel[usuario?.rol] || usuario?.rol}
            </span>
            <p className="text-sm text-gray-500 mt-1">{usuario?.email}</p>
          </div>
        </div>

        {/* Campos de solo lectura */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Cédula</p>
            <p className="text-sm font-medium text-gray-700">{usuario?.cedula || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Email</p>
            <p className="text-sm font-medium text-gray-700 truncate">{usuario?.email}</p>
          </div>
        </div>

        <form onSubmit={handlePerfil(onGuardarPerfil)} className="space-y-4" noValidate>
          <h3 className="font-semibold text-gray-700 text-sm">Editar información</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errPerfil.nombre_completo ? 'border-red-400' : 'border-gray-300'}`}
              {...regPerfil('nombre_completo', {
                required: 'Requerido',
                validate: v => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(v) || 'Solo letras',
              })} />
            {errPerfil.nombre_completo && <p className="text-red-500 text-xs mt-1">{errPerfil.nombre_completo.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errPerfil.telefono ? 'border-red-400' : 'border-gray-300'}`}
              {...regPerfil('telefono', {
                required: 'Requerido',
                validate: v => /^\d+$/.test(v) || 'Solo números',
              })} />
            {errPerfil.telefono && <p className="text-red-500 text-xs mt-1">{errPerfil.telefono.message}</p>}
          </div>
          <button type="submit" disabled={cargando}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition disabled:opacity-60">
            <FiSave size={16} /> {cargando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4">Cambiar contraseña</h3>
        <form onSubmit={handlePass(onCambiarPassword)} className="space-y-4" noValidate>
          {[
            { name: 'password_actual', label: 'Contraseña actual', key: 'actual', rules: { required: 'Requerida' } },
            { name: 'password_nuevo', label: 'Nueva contraseña', key: 'nuevo', rules: reglasPasswordNuevo },
            { name: 'confirmar', label: 'Confirmar nueva contraseña', key: 'confirmar', rules: { required: 'Requerida', validate: v => v === watch('password_nuevo') || 'No coinciden' } },
          ].map(({ name, label, key, rules }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <div className="relative">
                <input type={verPass[key] ? 'text' : 'password'}
                  className={`w-full border rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errPass[name] ? 'border-red-400' : 'border-gray-300'}`}
                  {...regPass(name, rules)} />
                <button type="button" onClick={() => setVerPass(p => ({ ...p, [key]: !p[key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {verPass[key] ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errPass[name] && <p className="text-red-500 text-xs mt-1">{errPass[name].message}</p>}
            </div>
          ))}

          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
            Nueva contraseña: mín. 8 chars · mayúscula · minúscula · número · carácter especial
          </div>

          <button type="submit" disabled={cargando}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-medium transition disabled:opacity-60">
            <FiSave size={16} /> {cargando ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PerfilPage;
