import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const OlvidePasswordPage = () => {
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ email }) => {
    setCargando(true);
    try {
      await api.post('/auth/olvide-password', { email });
      setEnviado(true);
      toast.success('Revisa tu correo electrónico');
    } catch {
      toast.error('Error al procesar la solicitud');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <Link to="/login" className="flex items-center gap-2 text-gray-500 hover:text-primary-600 mb-6 text-sm transition">
          <FiArrowLeft /> Volver al login
        </Link>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Recuperar contraseña</h2>
        <p className="text-gray-500 text-sm mb-6">Te enviaremos un enlace a tu correo registrado.</p>

        {enviado ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm text-center">
            ✅ Si el email existe en el sistema, recibirás un enlace en los próximos minutos.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('email', { required: 'El email es requerido', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' } })}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <button type="submit" disabled={cargando} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60">
              {cargando ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default OlvidePasswordPage;
