// AyudanteDashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FiCheckSquare, FiUser } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

export const AyudanteDashboard = () => {
  const { usuario } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">¡Hola, {usuario?.nombre_completo?.split(' ')[0]}! 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Panel Ayudante / Colaborador</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Link to="/ayudante/checklist" className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-3"><FiCheckSquare size={20} /></div>
          <p className="font-semibold text-gray-800">Checklist</p>
          <p className="text-xs text-gray-500 mt-0.5">Registrar asistencia</p>
        </Link>
        <Link to="/ayudante/perfil" className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-3"><FiUser size={20} /></div>
          <p className="font-semibold text-gray-800">Mi Perfil</p>
          <p className="text-xs text-gray-500 mt-0.5">Actualizar datos</p>
        </Link>
      </div>
    </div>
  );
};

export default AyudanteDashboard;
