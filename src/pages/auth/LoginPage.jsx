import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { FiEye, FiEyeOff, FiMail, FiLock, FiAlertCircle, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [verPassword, setVerPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorEstado, setErrorEstado] = useState(null); // 'PENDIENTE' | 'DESACTIVADA'

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setCargando(true);
    setErrorEstado(null);
    try {
      const usuario = await login(data.email.trim(), data.password);
      toast.success(`¡Bienvenido, ${usuario.nombre_completo}!`);
      navigate('/dashboard');
    } catch (err) {
      const codigo = err.response?.data?.codigo;
      const mensaje = err.response?.data?.message;
      if (codigo === 'PENDIENTE' || codigo === 'DESACTIVADA') {
        setErrorEstado({ codigo, mensaje });
      } else {
        toast.error(mensaje || 'Credenciales inválidas');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <img src="/favicon_verbo.png" alt="Verbo Mañosca" className="w-9 h-9 rounded-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Escuela Dominical</h1>
          <p className="text-gray-500 text-sm mt-1">Iglesia Verbo Mañosca</p>
        </div>

        {/* Banner de error de estado */}
        {errorEstado && (
          <div className={`mb-5 p-4 rounded-xl flex items-start gap-3 ${
            errorEstado.codigo === 'PENDIENTE' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'
          }`}>
            {errorEstado.codigo === 'PENDIENTE'
              ? <FiClock size={20} className="text-amber-500 shrink-0 mt-0.5" />
              : <FiAlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
            }
            <div>
              <p className={`text-sm font-semibold ${errorEstado.codigo === 'PENDIENTE' ? 'text-amber-700' : 'text-red-700'}`}>
                {errorEstado.codigo === 'PENDIENTE' ? 'Cuenta pendiente de verificación' : 'Cuenta desactivada'}
              </p>
              <p className={`text-xs mt-0.5 ${errorEstado.codigo === 'PENDIENTE' ? 'text-amber-600' : 'text-red-600'}`}>
                {errorEstado.mensaje}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" autoComplete="email" placeholder="correo@ejemplo.com"
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                {...register('email', {
                  required: 'El email es requerido',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' },
                })} />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={verPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••"
                className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                {...register('password', {
                  required: 'La contraseña es requerida',
                  minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                })} />
              <button type="button" onClick={() => setVerPassword(!verPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition" tabIndex={-1}>
                {verPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div className="text-right">
            <Link to="/olvide-password" className="text-sm text-primary-600 hover:underline">¿Olvidaste tu contraseña?</Link>
          </div>

          <button type="submit" disabled={cargando}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60">
            {cargando ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          ¿Eres niño? <Link to="/" className="text-primary-600 hover:underline">Ver contenido de clase</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
