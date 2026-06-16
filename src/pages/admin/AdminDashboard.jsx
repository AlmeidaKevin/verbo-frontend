import React, { useState, useEffect } from 'react';
import { FiUsers, FiClock, FiGrid, FiUser, FiCheckSquare, FiBarChart2, FiCalendar, FiBell, FiTrendingUp, FiBook } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { usuario } = useAuth();
  const [stats, setStats] = useState({ usuarios: 0, reuniones: 0, grupos: 0, ninos: 0, docentes: 0, ayudantes: 0 });
  const [reuniones, setReuniones] = useState([]);
  const [publicaciones, setPublicaciones] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [uRes, rRes, gRes, nRes, pRes, asRes] = await Promise.all([
          api.get('/usuarios'),
          api.get('/reuniones'),
          api.get('/grupos'),
          api.get('/ninos'),
          api.get('/publicaciones'),
          api.get('/asistencias/historial'),
        ]);
        const usuarios = uRes.data.usuarios || [];
        setStats({
          usuarios: usuarios.length,
          reuniones: rRes.data.reuniones?.length || 0,
          grupos: gRes.data.grupos?.length || 0,
          ninos: nRes.data.ninos?.length || 0,
          docentes: usuarios.filter(u => u.rol === 'docente').length,
          ayudantes: usuarios.filter(u => u.rol === 'ayudante').length,
        });
        setReuniones(rRes.data.reuniones?.slice(0, 3) || []);
        setPublicaciones((pRes.data.publicaciones || []).slice(0, 3));
        setRegistros((asRes.data.registros || []).slice(0, 5));
      } catch {}
      finally { setCargando(false); }
    };
    cargar();
  }, []);

  const diaSemana = new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">

      {/* Banner de bienvenida */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1F4E5F 0%, #183D4A 60%, #112C36 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white" style={{ transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white" style={{ transform: 'translate(-20%, 20%)' }} />
        </div>
        <div className="relative p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-primary-200 text-sm mb-1 capitalize">{diaSemana}</p>
            <h1 className="text-2xl font-bold text-white">¡Bienvenido, {usuario?.nombre_completo?.split(' ')[0]}!</h1>
            <p className="text-primary-300 text-sm mt-1">Panel de administración · Escuela Dominical Verbo Mañosca</p>
          </div>
          <img src="/favicon_verbo.png" alt="Logo" className="w-16 h-16 rounded-full object-cover opacity-90 hidden sm:block shrink-0" />
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Usuarios', value: stats.usuarios, sub: `${stats.docentes} docentes · ${stats.ayudantes} ayudantes`, icon: FiUsers, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100', to: '/admin/usuarios' },
          { label: 'Reuniones', value: stats.reuniones, sub: 'Horarios activos', icon: FiClock, color: 'bg-amber-50 text-amber-600', border: 'border-amber-100', to: '/admin/reuniones' },
          { label: 'Grupos', value: stats.grupos, sub: 'Por reunión y edad', icon: FiGrid, color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100', to: '/admin/grupos' },
          { label: 'Niños', value: stats.ninos, sub: 'Registrados en el sistema', icon: FiUser, color: 'bg-rose-50 text-rose-600', border: 'border-rose-100', to: '/admin/ninos' },
        ].map(({ label, value, sub, icon: Icon, color, border, to }) => (
          <Link key={label} to={to} className={`bg-white rounded-2xl border ${border} p-5 shadow-sm hover:shadow-md transition group`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color} group-hover:scale-110 transition-transform`}>
              <Icon size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </Link>
        ))}
      </div>

      {/* Fila: Acceso rápido + Reuniones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Acceso rápido */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiTrendingUp size={16} className="text-primary-600" /> Acceso rápido
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/admin/checklist', icon: FiCheckSquare, label: 'Checklist', desc: 'Registrar asistencia', bg: 'bg-primary-600 hover:bg-primary-700 text-white' },
              { to: '/admin/usuarios', icon: FiUsers, label: 'Usuarios', desc: 'Gestionar equipo', bg: 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200' },
              { to: '/admin/reportes', icon: FiBarChart2, label: 'Reportes', desc: 'Ver historial', bg: 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200' },
              { to: '/admin/publicaciones', icon: FiBell, label: 'Publicar', desc: 'Avisos al equipo', bg: 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200' },
            ].map(({ to, icon: Icon, label, desc, bg }) => (
              <Link key={to} to={to} className={`flex flex-col items-start gap-1 px-4 py-3 rounded-xl text-sm font-medium transition ${bg}`}>
                <Icon size={18} />
                <span className="font-semibold">{label}</span>
                <span className="text-xs opacity-70">{desc}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Próximas reuniones */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiCalendar size={16} className="text-primary-600" /> Reuniones configuradas
          </h2>
          {cargando ? (
            <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
          ) : reuniones.length === 0 ? (
            <div className="text-center py-6">
              <FiClock size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">No hay reuniones creadas</p>
              <Link to="/admin/reuniones" className="text-xs text-primary-600 hover:underline mt-1 inline-block">Crear primera reunión →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {reuniones.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-primary-50 transition">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                    <FiClock size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.nombre}</p>
                    <p className="text-xs text-gray-500">{r.hora_inicio} – {r.hora_fin}</p>
                  </div>
                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full shrink-0">Activa</span>
                </div>
              ))}
              <Link to="/admin/reuniones" className="text-xs text-primary-600 hover:underline block text-right">Ver todas →</Link>
            </div>
          )}
        </div>
      </div>

      {/* Fila: Actividad reciente + Publicaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Actividad reciente de asistencia */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiCheckSquare size={16} className="text-primary-600" /> Últimos registros de asistencia
          </h2>
          {cargando ? (
            <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
          ) : registros.length === 0 ? (
            <div className="text-center py-6">
              <FiCheckSquare size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">Sin registros guardados aún</p>
              <Link to="/admin/checklist" className="text-xs text-primary-600 hover:underline mt-1 inline-block">Ir al Checklist →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {registros.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 text-xs font-bold">
                    {r.fecha?.slice(8)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.grupo?.nombre || 'Grupo'}</p>
                    <p className="text-xs text-gray-500">{r.reunion?.nombre} · {r.fecha}</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0">Guardado</span>
                </div>
              ))}
              <Link to="/admin/reportes" className="text-xs text-primary-600 hover:underline block text-right">Ver reportes →</Link>
            </div>
          )}
        </div>

        {/* Últimas publicaciones */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiBell size={16} className="text-primary-600" /> Últimas publicaciones
          </h2>
          {cargando ? (
            <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
          ) : publicaciones.length === 0 ? (
            <div className="text-center py-6">
              <FiBell size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">Sin publicaciones aún</p>
              <Link to="/admin/publicaciones" className="text-xs text-primary-600 hover:underline mt-1 inline-block">Crear publicación →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {publicaciones.map(p => (
                <div key={p.id} className="p-3 rounded-xl bg-gray-50 hover:bg-primary-50 transition">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.titulo}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{p.contenido}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(p.created_at).toLocaleDateString('es-EC')}</p>
                </div>
              ))}
              <Link to="/admin/publicaciones" className="text-xs text-primary-600 hover:underline block text-right">Ver todas →</Link>
            </div>
          )}
        </div>
      </div>

      {/* Versículo inspirador */}
      <div className="rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg, #1F4E5F, #183D4A)' }}>
        <FiBook size={20} className="mx-auto mb-2 text-yellow-300 opacity-80" />
        <p className="text-white text-sm italic">"Dejen que los niños vengan a mí, y no se lo impidan, porque el reino de los cielos es de quienes son como ellos."</p>
        <p className="text-primary-300 text-xs mt-2">— Mateo 19:14</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
