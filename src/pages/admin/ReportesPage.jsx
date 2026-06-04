import React, { useState, useEffect } from 'react';
import { FiDownload, FiCalendar, FiFilter } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ReportesPage = () => {
  const [registros, setRegistros] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [reuniones, setReuniones] = useState([]);
  const [filtros, setFiltros] = useState({ grupo_id: '', reunion_id: '', fecha_inicio: '', fecha_fin: '' });
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api.get('/grupos').then(r => setGrupos(r.data.grupos || [])).catch(() => {});
    api.get('/reuniones').then(r => setReuniones(r.data.reuniones || [])).catch(() => {});
    cargar();
  }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([k, v]) => { if (v) params.append(k, v); });
      const { data } = await api.get(`/asistencias/historial?${params}`);
      setRegistros(data.registros || []);
    } catch { toast.error('Error al cargar reportes'); }
    finally { setCargando(false); }
  };

  const exportar = (registroId) => {
    const token = localStorage.getItem('token');
    window.open(`${process.env.REACT_APP_API_URL}/asistencias/exportar/${registroId}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Reportes de Asistencia</h1>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><FiFilter size={16} /> Filtros</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Reunión</label>
            <select value={filtros.reunion_id} onChange={e => setFiltros(p => ({ ...p, reunion_id: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Todas</option>
              {reuniones.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Grupo</label>
            <select value={filtros.grupo_id} onChange={e => setFiltros(p => ({ ...p, grupo_id: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Todos</option>
              {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
            <input type="date" value={filtros.fecha_inicio} onChange={e => setFiltros(p => ({ ...p, fecha_inicio: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
            <input type="date" value={filtros.fecha_fin} onChange={e => setFiltros(p => ({ ...p, fecha_fin: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <button onClick={cargar} className="mt-4 flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition">
          <FiFilter size={15} /> Aplicar filtros
        </button>
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Fecha', 'Reunión', 'Grupo', 'Primer ingreso', 'Último ingreso', 'Guardado', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registros.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-700 font-medium">{r.fecha}</td>
                    <td className="px-4 py-3 text-gray-600">{r.reunion?.nombre}</td>
                    <td className="px-4 py-3 text-gray-600">{r.grupo?.nombre}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.hora_primer_visto ? new Date(r.hora_primer_visto).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.hora_ultimo_visto ? new Date(r.hora_ultimo_visto).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${r.guardado_at ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {r.guardado_at ? 'Guardado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => exportar(r.id)}
                        className="flex items-center gap-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg transition">
                        <FiDownload size={12} /> Excel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {registros.length === 0 && <p className="text-center text-gray-400 py-10">No se encontraron registros</p>}
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {registros.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{r.fecha}</p>
                    <p className="text-xs text-gray-500">{r.reunion?.nombre} · {r.grupo?.nombre}</p>
                  </div>
                  <button onClick={() => exportar(r.id)} className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg">
                    <FiDownload size={12} /> Excel
                  </button>
                </div>
              </div>
            ))}
            {registros.length === 0 && <p className="text-center text-gray-400 py-8">No se encontraron registros</p>}
          </div>
        </>
      )}
    </div>
  );
};

export default ReportesPage;
