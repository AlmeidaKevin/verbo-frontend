import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { FiCamera, FiEye, FiEyeOff, FiSave, FiUser, FiPhone, FiMail, FiCreditCard } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Colores por rol — consistente con los dashboards
const ROL_CONFIG = {
  admin:    { label: 'Administrador',        gradient: 'linear-gradient(135deg, #1F4E5F 0%, #183D4A 100%)', badge: 'bg-teal-100 text-teal-800',    ring: 'ring-teal-400',    btn: 'bg-teal-700 hover:bg-teal-800' },
  docente:  { label: 'Docente / Líder',      gradient: 'linear-gradient(135deg, #3730a3 0%, #312e81 100%)', badge: 'bg-indigo-100 text-indigo-800', ring: 'ring-indigo-400',  btn: 'bg-indigo-700 hover:bg-indigo-800' },
  ayudante: { label: 'Ayudante / Colaborador', gradient: 'linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%)', badge: 'bg-violet-100 text-violet-800', ring: 'ring-violet-400',  btn: 'bg-violet-700 hover:bg-violet-800' },
};

// Mismas reglas de validación que UsuariosPage.jsx
const reglasNombre = {
  required: 'El nombre completo es requerido',
  maxLength: { value: 120, message: 'Máximo 120 caracteres' },
  pattern: {
    value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/,
    message: 'Solo se permiten letras y espacios',
  },
};

const reglasTelefono = {
  required: 'El teléfono es requerido',
  pattern: { value: /^\d+$/, message: 'Solo se permiten números' },
  minLength: { value: 9, message: 'Mínimo 9 dígitos' },
  maxLength: { value: 10, message: 'Máximo 10 dígitos' },
};

const PerfilPage = () => {
  const { usuario, actualizarUsuario } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [verPass, setVerPass] = useState({ actual: false, nuevo: false, confirmar: false });
  const fotoRef = useRef();

  const config = ROL_CONFIG[usuario?.rol] || ROL_CONFIG.admin;

  const { register: regPerfil, handleSubmit: handlePerfil, setValue: setValuePerfil, formState: { errors: errPerfil } } = useForm({
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
    if (datos.password_nuevo !== datos.confirmar) return toast.error('Las contraseñas no coinciden');
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
    } catch { toast.error('Error al subir la foto'); }
    finally { setSubiendoFoto(false); }
  };

  const reglasPasswordNuevo = {
    required: 'Requerida',
    minLength: { value: 8, message: 'Mínimo 8 caracteres' },
    validate: {
      mayus:    v => /[A-Z]/.test(v) || 'Debe tener una mayúscula',
      minus:    v => /[a-z]/.test(v) || 'Debe tener una minúscula',
      num:      v => /\d/.test(v)    || 'Debe tener un número',
      especial: v => /[!@#$%^&*(),.?":{}|<>]/.test(v) || 'Debe tener un carácter especial',
    },
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Banner de perfil ─────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: config.gradient }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white" style={{ transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white" style={{ transform: 'translate(-20%, 20%)' }} />
        </div>
        <div className="relative p-6 flex flex-col sm:flex-row items-center gap-5">
          {/* Avatar grande */}
          <div className="relative shrink-0">
            <div className={`w-24 h-24 rounded-full overflow-hidden border-4 border-white/30 ring-4 ${config.ring} shadow-xl`}>
              {usuario?.foto_url
                ? <img src={usuario.foto_url} alt="Foto perfil" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-white/20 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">{usuario?.nombre_completo?.[0]}</span>
                  </div>
              }
            </div>
            <button
              onClick={() => fotoRef.current?.click()}
              disabled={subiendoFoto}
              className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg transition disabled:opacity-60 hover:scale-110"
              style={{ color: '#1F4E5F' }}
            >
              {subiendoFoto
                ? <span className="animate-spin rounded-full w-4 h-4 border-b-2 border-gray-600" />
                : <FiCamera size={14} />}
            </button>
            <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={onFotoChange} />
          </div>

          {/* Info */}
          <div className="text-center sm:text-left">
            <h1 className="text-xl font-bold text-white">{usuario?.nombre_completo}</h1>
            <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mt-1 ${config.badge}`}>
              {config.label}
            </span>
            <p className="text-white/70 text-sm mt-2">{usuario?.email}</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Toca la cámara para cambiar tu foto de perfil
            </p>
          </div>
        </div>
      </div>

      {/* ── Datos de solo lectura ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-700 text-sm mb-4">Información de la cuenta</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: FiUser, label: 'Nombre completo', value: usuario?.nombre_completo },
            { icon: FiCreditCard, label: 'Cédula', value: usuario?.cedula },
            { icon: FiMail, label: 'Correo electrónico', value: usuario?.email },
            { icon: FiPhone, label: 'Teléfono', value: usuario?.telefono },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                <Icon size={14} className="text-gray-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-700 truncate">{value || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Editar información ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4">Editar información</h2>
        <form onSubmit={handlePerfil(onGuardarPerfil)} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errPerfil.nombre_completo ? 'border-red-400' : 'border-gray-300'}`}
              maxLength={120}
              onInput={e => { e.target.value = e.target.value.toUpperCase(); }}
              {...regPerfil('nombre_completo', reglasNombre)}
              onChange={e => {
                e.target.value = e.target.value.toUpperCase();
                setValuePerfil('nombre_completo', e.target.value, { shouldValidate: false });
              }}
            />
            {errPerfil.nombre_completo && <p className="text-red-500 text-xs mt-1">{errPerfil.nombre_completo.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="text"
              inputMode="numeric"
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errPerfil.telefono ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="0999999999"
              maxLength={10}
              onKeyDown={e => {
                if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key))
                  e.preventDefault();
              }}
              {...regPerfil('telefono', reglasTelefono)}
            />
            {errPerfil.telefono && <p className="text-red-500 text-xs mt-1">{errPerfil.telefono.message}</p>}
          </div>
          <button type="submit" disabled={cargando}
            className={`flex items-center gap-2 text-white px-6 py-3 rounded-xl text-sm font-medium transition disabled:opacity-60 ${config.btn}`}>
            <FiSave size={16} /> {cargando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      {/* ── Cambiar contraseña ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4">Cambiar contraseña</h2>
        <form onSubmit={handlePass(onCambiarPassword)} className="space-y-4" noValidate>
          {[
            { name: 'password_actual',  label: 'Contraseña actual',          key: 'actual',   rules: { required: 'Requerida' } },
            { name: 'password_nuevo',   label: 'Nueva contraseña',           key: 'nuevo',    rules: reglasPasswordNuevo },
            { name: 'confirmar',        label: 'Confirmar nueva contraseña', key: 'confirmar', rules: { required: 'Requerida', validate: v => v === watch('password_nuevo') || 'No coinciden' } },
          ].map(({ name, label, key, rules }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <div className="relative">
                <input
                  type={verPass[key] ? 'text' : 'password'}
                  className={`w-full border rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errPass[name] ? 'border-red-400' : 'border-gray-300'}`}
                  {...regPass(name, rules)}
                />
                <button type="button" onClick={() => setVerPass(p => ({ ...p, [key]: !p[key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {verPass[key] ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errPass[name] && <p className="text-red-500 text-xs mt-1">{errPass[name].message}</p>}
            </div>
          ))}

          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
            La nueva contraseña debe tener: mínimo 8 caracteres · una mayúscula · una minúscula · un número · un carácter especial (!@#$...)
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
