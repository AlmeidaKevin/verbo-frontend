import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import api from '../../services/api';

const VerificarCuentaPage = () => {
  const { token } = useParams();
  const [estado, setEstado] = useState('cargando'); // cargando | ok | error
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    api.get(`/auth/verificar/${token}`)
      .then(({ data }) => { setEstado('ok'); setMensaje(data.message); })
      .catch(err => { setEstado('error'); setMensaje(err.response?.data?.message || 'Token inválido o ya utilizado'); });
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
        <img src="/favicon_verbo.png" alt="Logo" className="w-14 h-14 rounded-full object-cover mx-auto mb-4" />
        <h1 className="text-lg font-bold text-gray-800 mb-6">Verificación de cuenta</h1>

        {estado === 'cargando' && (
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            <p className="text-gray-500 text-sm">Verificando tu cuenta...</p>
          </div>
        )}

        {estado === 'ok' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <FiCheckCircle size={32} className="text-green-600" />
            </div>
            <p className="font-semibold text-gray-800">¡Cuenta verificada!</p>
            <p className="text-sm text-gray-500">{mensaje}</p>
            <Link to="/login"
              className="inline-block mt-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-xl transition text-sm">
              Iniciar Sesión
            </Link>
          </div>
        )}

        {estado === 'error' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <FiAlertCircle size={32} className="text-red-500" />
            </div>
            <p className="font-semibold text-gray-800">No se pudo verificar</p>
            <p className="text-sm text-gray-500">{mensaje}</p>
            <Link to="/login"
              className="inline-block mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-8 rounded-xl transition text-sm">
              Ir al login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificarCuentaPage;
