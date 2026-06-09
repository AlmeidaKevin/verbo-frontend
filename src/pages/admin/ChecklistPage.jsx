import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiUserPlus, FiCheck, FiClock, FiMessageSquare, FiSave, FiDownload, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ChecklistPage = () => {
  const [reuniones, setReuniones] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [reunionSel, setReunionSel] = useState('');
  const [grupoSel, setGrupoSel] = useState('');
  const [registro, setRegistro] = useState(null);
  const [todosNinos, setTodosNinos] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtrados, setFiltrados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [modalComentario, setModalComentario] = useState(null); // { asistenciaId, nombre, comentario, tarde }
  const [modalAgregar, setModalAgregar] = useState(false);
  const [nuevoNino, setNuevoNino] = useState('');
  const busquedaRef = useRef();

  useEffect(() => { cargarReuniones(); }, []);
  useEffect(() => { if (reunionSel) cargarGrupos(reunionSel); }, [reunionSel]);
  useEffect(() => {
    if (busqueda.trim()) {
      setFiltrados(todosNinos.filter(n =>
        n.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) &&
        !asistencias.find(a => a.nino_id === n.id)
      ));
    } else {
      setFiltrados(todosNinos.filter(n => !asistencias.find(a => a.nino_id === n.id)));
    }
  }, [busqueda, todosNinos, asistencias]);

  const cargarReuniones = async () => {
    const { data } = await api.get('/reuniones');
    setReuniones(data.reuniones || []);
  };

  const cargarGrupos = async (reunionId) => {
    const { data } = await api.get(`/grupos?reunion_id=${reunionId}`);
    setGrupos(data.grupos || []);
  };

  const iniciarChecklist = async () => {
    if (!reunionSel || !grupoSel) return toast.error('Selecciona reunión y grupo');
    setCargando(true);
    try {
      const { data } = await api.post('/asistencias/registro', { reunion_id: reunionSel, grupo_id: grupoSel });
      setRegistro(data.registro);
      setAsistencias(data.asistencias || []);

      const { data: nData } = await api.get('/ninos');
      setTodosNinos(nData.ninos || []);
      toast.success('Checklist iniciado');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al iniciar checklist');
    } finally {
      setCargando(false);
    }
  };

  const marcarAsistencia = async (nino) => {
    try {
      const { data } = await api.post('/asistencias/marcar', {
        registro_id: registro.id,
        nino_id: nino.id,
        llego_tarde: false,
      });
      setAsistencias(prev => [...prev, { ...data.asistencia, nino }]);
      setBusqueda('');
      toast.success(`✅ ${nino.nombre_completo} marcado`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al marcar');
    }
  };

  const guardarComentario = async () => {
    if (!modalComentario) return;
    try {
      const { data } = await api.put(`/asistencias/${modalComentario.id}`, {
        llego_tarde: modalComentario.tarde,
        comentario: modalComentario.comentario,
      });
      setAsistencias(prev => prev.map(a => a.id === modalComentario.id ? { ...a, ...data.asistencia } : a));
      setModalComentario(null);
      toast.success('Actualizado');
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const guardarRegistro = async () => {
    setGuardando(true);
    try {
      await api.post('/asistencias/guardar', { registro_id: registro.id });
      toast.success('Registro guardado exitosamente');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const exportarExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/asistencias/exportar/${registro.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `asistencia_${registro.fecha || registro.id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Excel descargado');
    } catch {
      toast.error('Error al descargar el Excel');
    }
  };

  const agregarNuevoNino = async () => {
    if (!nuevoNino.trim()) return toast.error('Ingresa el nombre del niño');
    if (/\d/.test(nuevoNino)) return toast.error('El nombre no puede contener números');
    try {
      const { data } = await api.post('/ninos', { nombre_completo: nuevoNino.trim(), grupo_id: grupoSel });
      setTodosNinos(prev => [...prev, data.nino]);
      setNuevoNino('');
      setModalAgregar(false);
      toast.success('Niño agregado');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al agregar');
    }
  };

  if (!registro) {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Checklist de Asistencia</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reunión</label>
            <select value={reunionSel} onChange={e => setReunionSel(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">-- Selecciona reunión --</option>
              {reuniones.map(r => <option key={r.id} value={r.id}>{r.nombre} ({r.hora_inicio} - {r.hora_fin})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
            <select value={grupoSel} onChange={e => setGrupoSel(e.target.value)} disabled={!reunionSel}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100">
              <option value="">-- Selecciona grupo --</option>
              {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre} ({g.edad_min}-{g.edad_max} años)</option>)}
            </select>
          </div>
          <button onClick={iniciarChecklist} disabled={cargando}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60">
            {cargando ? 'Cargando...' : 'Iniciar Checklist'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-primary-600 text-white rounded-2xl p-4">
        <h1 className="font-bold text-lg">Checklist de Asistencia</h1>
        <p className="text-primary-200 text-sm">{registro.fecha} · {asistencias.length} asistente{asistencias.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Buscador + Agregar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={busquedaRef}
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar niño..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <FiX size={16} />
              </button>
            )}
          </div>
          <button onClick={() => setModalAgregar(true)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
            <FiUserPlus size={16} /> Agregar
          </button>
        </div>

        {/* Lista filtrada */}
        {filtrados.length > 0 && (
          <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
            {filtrados.map(nino => (
              <button key={nino.id} onClick={() => marcarAsistencia(nino)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-primary-50 text-left text-sm border-b border-gray-100 last:border-0 transition">
                <span className="text-gray-800">{nino.nombre_completo}</span>
                <span className="text-primary-600 text-xs font-medium flex items-center gap-1">
                  <FiCheck size={14} /> Marcar
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de asistentes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Asistentes ({asistencias.length})</h2>
        </div>
        {asistencias.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">Aún no hay asistentes marcados</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {asistencias.map((a, i) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.nino?.nombre_completo}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{a.hora_llegada ? new Date(a.hora_llegada).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      {a.llego_tarde && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full flex items-center gap-1"><FiClock size={10} /> Tarde</span>}
                      {a.comentario && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Nota</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setModalComentario({ id: a.id, nombre: a.nino?.nombre_completo, comentario: a.comentario || '', tarde: a.llego_tarde || false })}
                  className="p-2 text-gray-400 hover:text-primary-600 transition">
                  <FiMessageSquare size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3">
        <button onClick={guardarRegistro} disabled={guardando}
          className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60">
          <FiSave size={18} /> {guardando ? 'Guardando...' : 'Guardar Registro'}
        </button>
        <button onClick={exportarExcel}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition">
          <FiDownload size={18} /> Excel
        </button>
      </div>

      {/* Modal comentario */}
      {modalComentario && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-800 mb-1">Editar asistencia</h3>
            <p className="text-sm text-gray-500 mb-4">{modalComentario.nombre}</p>
            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <input type="checkbox" checked={modalComentario.tarde} onChange={e => setModalComentario(p => ({ ...p, tarde: e.target.checked }))}
                className="w-4 h-4 rounded text-primary-600" />
              <span className="text-sm text-gray-700">Llegó tarde</span>
            </label>
            <textarea value={modalComentario.comentario} onChange={e => setModalComentario(p => ({ ...p, comentario: e.target.value }))}
              placeholder="Comentario o recordatorio..."
              rows={3} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setModalComentario(null)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={guardarComentario} className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal agregar niño */}
      {modalAgregar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-800 mb-4">Agregar niño</h3>
            <input value={nuevoNino} onChange={e => setNuevoNino(e.target.value)}
              placeholder="Nombre completo del niño"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
              onKeyDown={e => e.key === 'Enter' && agregarNuevoNino()}
            />
            <div className="flex gap-2">
              <button onClick={() => setModalAgregar(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={agregarNuevoNino} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition">Agregar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChecklistPage;
