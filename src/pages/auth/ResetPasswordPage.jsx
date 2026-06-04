import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirm, setVerConfirm] = useState(false);
  const [cargando, setCargando] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async ({ password }) => {
    setCargando(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      toast.success('Contraseña actualizada correctamente');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Token inválido o expirado');
    } finally {
      setCargando(false);
    }
  };

  const reglasPassword = {
    required: 'La contraseña es requerida',
    minLength: { value: 8, message: 'Mínimo 8 caracteres' },
    validate: {
      mayuscula: v => /[A-Z]/.test(v) || 'Debe tener al menos una mayúscula',
      minuscula: v => /[a-z]/.test(v) || 'Debe tener al menos una minúscula',
      numero: v => /\d/.test(v) || 'Debe tener al menos un número',
      especial: v => /[!@#$%^&*(),.?":{}|<>]/.test(v) || 'Debe tener al menos un carácter especial',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Nueva contraseña</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {[
            { name: 'password', label: 'Nueva contraseña', ver: verPassword, setVer: setVerPassword, rules: reglasPassword },
            {
              name: 'confirmar', label: 'Confirmar contraseña', ver: verConfirm, setVer: setVerConfirm,
              rules: { required: 'Confirma tu contraseña', validate: v => v === watch('password') || 'Las contraseñas no coinciden' }
            },
          ].map(({ name, label, ver, setVer, rules }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={ver ? 'text' : 'password'}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors[name] ? 'border-red-500' : 'border-gray-300'}`}
                  {...register(name, rules)}
                />
                <button type="button" onClick={() => setVer(!ver)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {ver ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>}
            </div>
          ))}

          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 space-y-1">
            <p className="font-medium">La contraseña debe tener:</p>
            <p>• Mínimo 8 caracteres • Una mayúscula • Una minúscula</p>
            <p>• Un número • Un carácter especial (!@#$%...)</p>
          </div>

          <button type="submit" disabled={cargando} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60">
            {cargando ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
