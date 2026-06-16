import React, { useState, useEffect } from 'react';
import { FiDownload, FiFilter, FiFileText, FiX, FiGrid, FiBarChart2 } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';

const ReportesDocentePage = () => {
  const [registros, setRegistros] = useState([]);
  const [filtros, setFiltros] = useState({ fecha_inicio: '', fecha_fin: '' });
  const [cargando, setCargando] = useState(false);
  const [modalDescarga, setModalDescarga] = useState(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
      const { data } = await api.get(`/asistencias/mis-registros?${params}`);
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
      link.href = url; link.setAttribute('download', `asistencia_${registroId}.${ext}`);
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${formato.toUpperCase()} descargado`);
    } catch { toast.error('Error al descargar'); }
  };

  return (
    <div className="space-y-6">
      {/* Banner indigo */}
      <div className="relative rounded-2xl overflow-hidden p-6"
        style={{ background: 'linear-gradient(135deg, #3730a3 0%, #312e81 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-white" style={{ transform: 'translate(30%,-30%)' }} />
        </div>
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Mis Reportes de Asistencia</h1>
            <p className="text-sm mt-0.5 text-indigo-300">Solo los registros de tus grupos</p>
          </div>
          <FiBarChart2 size={36} className="shrink-0 opacity-30 text-white hidden sm:block" />
        </div>
        {registros.length > 0 && (
          <div className="relative mt-4">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
              <p className="text-white font-bold text-lg leading-tight">{registros.length}</p>
              <p className="text-xs text-indigo-300">registro{registros.length !== 1 ? 's' : ''} guardado{registros.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2 text-sm">
          <FiFilter size={15} className="text-indigo-600" /> Filtrar por fecha
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
            <input type="date" value={filtros.fecha_inicio} onChange={e => setFiltros(p => ({ ...p, fecha_inicio: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
            <input type="date" value={filtros.fecha_fin} onChange={e => setFiltros(p => ({ ...p, fecha_fin: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={cargar} className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition">
            <FiFilter size={15} /> Aplicar filtros
          </button>
          {(filtros.fecha_inicio || filtros.fecha_fin) && (
            <button onClick={() => setFiltros({ fecha_inicio: '', fecha_fin: '' })} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <FiX size={12} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /></div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200" style={{ background: '#eef2ff' }}>
                <tr>
                  {['Fecha', 'Reunión', 'Grupo', 'Rango edad', 'Primer ingreso', 'Último ingreso', 'Registrado por', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-center text-xs font-semibold text-indigo-700 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registros.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-center text-gray-700 font-semibold text-xs">{r.fecha}</td>
                    <td className="px-4 py-3 text-center text-gray-600 text-xs">{r.reunion?.nombre}</td>
                    <td className="px-4 py-3 text-center text-gray-600 text-xs">{r.grupo?.nombre}</td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">{r.grupo?.edad_min !== undefined ? `${r.grupo.edad_min}–${r.grupo.edad_max} años` : '—'}</td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">{r.hora_primer_visto ? new Date(r.hora_primer_visto).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">{r.hora_ultimo_visto ? new Date(r.hora_ultimo_visto).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">{r.registrado_por?.nombre_completo || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setModalDescarga(r.id)}
                        className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition font-medium">
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
                <p className="text-gray-400">No se encontraron registros guardados</p>
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
                  </div>
                  <button onClick={() => setModalDescarga(r.id)}
                    className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg shrink-0 font-medium">
                    <FiDownload size={12} /> Descargar
                  </button>
                </div>
              </div>
            ))}
            {registros.length === 0 && <p className="text-center text-gray-400 py-8">No se encontraron registros guardados</p>}
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
            <p className="text-sm text-gray-500 mb-5">Elige el formato:</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => descargar(modalDescarga, 'xlsx')}
                className="flex items-center gap-3 w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-medium py-3 px-4 rounded-xl transition">
                <FiGrid size={22} /><div className="text-left"><p className="text-sm font-semibold">Excel (.xlsx)</p><p className="text-xs text-emerald-600">Hoja de cálculo</p></div>
              </button>
              <button onClick={() => descargar(modalDescarga, 'pdf')}
                className="flex items-center gap-3 w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-medium py-3 px-4 rounded-xl transition">
                <FiFileText size={22} /><div className="text-left"><p className="text-sm font-semibold">PDF (.pdf)</p><p className="text-xs text-red-600">Listo para imprimir</p></div>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ReportesDocentePage;
