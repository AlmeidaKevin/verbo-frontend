import React, { useState, useEffect } from 'react';
import { FiDownload, FiFilter, FiFileText, FiX, FiGrid, FiBarChart2 } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';

const ReportesPage = () => {
  const [registros, setRegistros] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [reuniones, setReuniones] = useState([]);
  const [filtros, setFiltros] = useState({ grupo_id: '', reunion_id: '', fecha_inicio: '', fecha_fin: '' });
  const [cargando, setCargando] = useState(false);
  const [modalDescarga, setModalDescarga] = useState(null);

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

  const descargar = async (registroId, formato) => {
    try {
      setModalDescarga(null);
      const response = await api.get(`/asistencias/exportar/${registroId}?formato=${formato}`, { responseType: 'blob' });
      const ext = formato === 'pdf' ? 'pdf' : 'xlsx';
      const mime = formato === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const url = window.URL.createObjectURL(new Blob([response.data], { type: mime }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `asistencia_${registroId}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${formato.toUpperCase()} descargado`);
    } catch { toast.error('Error al descargar'); }
  };

  const guardados = registros.filter(r => r.guardado_at).length;
  const pendientes = registros.filter(r => !r.guardado_at).length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden p-6"
        style={{ background: 'linear-gradient(135deg, #1F4E5F 0%, #183D4A 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-white" style={{ transform: 'translate(30%,-30%)' }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white" style={{ transform: 'translate(-20%,20%)' }} />
        </div>
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Reportes de Asistencia</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9EC5D0' }}>Historial de registros guardados</p>
          </div>
          <FiBarChart2 size={36} className="shrink-0 opacity-30 text-white hidden sm:block" />
        </div>
        {registros.length > 0 && (
          <div className="relative flex gap-4 mt-4">
            {[
              { label: 'Total', value: registros.length, color: 'bg-white/10' },
              { label: 'Guardados', value: guardados, color: 'bg-emerald-500/20' },
              { label: 'Pendientes', value: pendientes, color: 'bg-amber-500/20' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`${color} rounded-xl px-4 py-2 text-center`}>
                <p className="text-white font-bold text-lg leading-tight">{value}</p>
                <p className="text-xs" style={{ color: '#9EC5D0' }}>{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2 text-sm">
          <FiFilter size={15} className="text-primary-600" /> Filtrar registros
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Reunión</label>
            <select value={filtros.reunion_id} onChange={e => setFiltros(p => ({ ...p, reunion_id: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Todas</option>
              {reuniones.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Grupo</label>
            <select value={filtros.grupo_id} onChange={e => setFiltros(p => ({ ...p, grupo_id: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Todos</option>
              {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
            <input type="date" value={filtros.fecha_inicio} onChange={e => setFiltros(p => ({ ...p, fecha_inicio: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
            <input type="date" value={filtros.fecha_fin} onChange={e => setFiltros(p => ({ ...p, fecha_fin: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={cargar}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition">
            <FiFilter size={15} /> Aplicar filtros
          </button>
          {(filtros.reunion_id || filtros.grupo_id || filtros.fecha_inicio || filtros.fecha_fin) && (
            <button onClick={() => { setFiltros({ grupo_id: '', reunion_id: '', fecha_inicio: '', fecha_fin: '' }); }}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <FiX size={12} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200" style={{ background: '#EEF4F6' }}>
                <tr>
                  {['Fecha', 'Registrado por', 'Reunión', 'Grupo', 'Rango edad', 'Primer ingreso', 'Último ingreso', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registros.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-center text-gray-700 font-semibold text-xs">{r.fecha}</td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">{r.registrado_por?.nombre_completo || '—'}</td>
                    <td className="px-4 py-3 text-center text-gray-600 text-xs">{r.reunion?.nombre}</td>
                    <td className="px-4 py-3 text-center text-gray-600 text-xs">{r.grupo?.nombre}</td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">
                      {r.grupo?.edad_min !== undefined ? `${r.grupo.edad_min}–${r.grupo.edad_max} años` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">
                      {r.hora_primer_visto ? new Date(r.hora_primer_visto).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">
                      {r.hora_ultimo_visto ? new Date(r.hora_ultimo_visto).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${r.guardado_at ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.guardado_at ? 'Guardado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setModalDescarga(r.id)}
                        className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition font-medium">
                        <FiDownload size={12} /> Descargar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {registros.length === 0 && (
              <div className="text-center py-12">
                <FiBarChart2 size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400">No se encontraron registros</p>
                <p className="text-xs text-gray-400 mt-1">Prueba cambiando los filtros</p>
              </div>
            )}
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {registros.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm">{r.fecha}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.reunion?.nombre} · {r.grupo?.nombre}</p>
                    {r.grupo?.edad_min !== undefined && <p className="text-xs text-gray-400">{r.grupo.edad_min}–{r.grupo.edad_max} años</p>}
                    {r.registrado_por && <p className="text-xs text-gray-400 mt-1">Por: {r.registrado_por.nombre_completo}</p>}
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.guardado_at ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.guardado_at ? 'Guardado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setModalDescarga(r.id)}
                    className="flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg shrink-0 font-medium">
                    <FiDownload size={12} /> Descargar
                  </button>
                </div>
              </div>
            ))}
            {registros.length === 0 && <p className="text-center text-gray-400 py-8">No se encontraron registros</p>}
          </div>
        </>
      )}

      {/* Modal descarga */}
      {modalDescarga && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Descargar reporte</h3>
              <button onClick={() => setModalDescarga(null)} className="p-1 text-gray-400 hover:text-gray-600"><FiX size={18} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-5">Elige el formato de descarga:</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => descargar(modalDescarga, 'xlsx')}
                className="flex items-center gap-3 w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-medium py-3 px-4 rounded-xl transition">
                <FiGrid size={22} />
                <div className="text-left"><p className="text-sm font-semibold">Excel (.xlsx)</p><p className="text-xs text-emerald-600">Hoja de cálculo editable</p></div>
              </button>
              <button onClick={() => descargar(modalDescarga, 'pdf')}
                className="flex items-center gap-3 w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-medium py-3 px-4 rounded-xl transition">
                <FiFileText size={22} />
                <div className="text-left"><p className="text-sm font-semibold">PDF (.pdf)</p><p className="text-xs text-red-600">Documento listo para imprimir</p></div>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ReportesPage;
