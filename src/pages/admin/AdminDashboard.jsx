// AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { FiUsers, FiClock, FiGrid, FiUser, FiCheckSquare } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { usuario } = useAuth();
  const [stats, setStats] = useState({ usuarios: 0, reuniones: 0, grupos: 0, ninos: 0 });

  useEffect(() => {
    const cargar = async () => {
      try {
        const [uRes, rRes, gRes, nRes] = await Promise.all([
          api.get('/usuarios'), api.get('/reuniones'), api.get('/grupos'), api.get('/ninos'),
        ]);
        setStats({
          usuarios: uRes.data.usuarios?.length || 0,
          reuniones: rRes.data.reuniones?.length || 0,
          grupos: gRes.data.grupos?.length || 0,
          ninos: nRes.data.ninos?.length || 0,
        });
      } catch {}
    };
    cargar();
  }, []);

  const cards = [
    { label: 'Usuarios', value: stats.usuarios, icon: FiUsers, color: 'bg-blue-50 text-blue-600', to: '/admin/usuarios' },
    { label: 'Reuniones', value: stats.reuniones, icon: FiClock, color: 'bg-purple-50 text-purple-600', to: '/admin/reuniones' },
    { label: 'Grupos', value: stats.grupos, icon: FiGrid, color: 'bg-green-50 text-green-600', to: '/admin/grupos' },
    { label: 'Niños registrados', value: stats.ninos, icon: FiUser, color: 'bg-orange-50 text-orange-600', to: '/admin/ninos' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">¡Bienvenido, {usuario?.nombre_completo?.split(' ')[0]}! 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Panel de administración — Escuela Dominical Verbo Mañosca</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, to }) => (
          <Link key={label} to={to} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>
      <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5">
        <h2 className="font-semibold text-primary-800 mb-2">Acceso rápido</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/checklist" className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition">
            <FiCheckSquare size={16} /> Abrir Checklist
          </Link>
          <Link to="/admin/usuarios" className="flex items-center gap-2 bg-white border border-primary-300 text-primary-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-50 transition">
            <FiUsers size={16} /> Gestionar Usuarios
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
