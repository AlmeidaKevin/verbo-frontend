import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiSearch, FiUserPlus, FiCheck, FiClock, FiMessageSquare, FiSave, FiDownload, FiX, FiPlus, FiFileText, FiRefreshCw, FiAlertCircle, FiGrid, FiCheckSquare, FiChevronDown, FiEye} from 'react-icons/fi';
import toast from 'react-hot-toast';
import supabase from '../../config/supabase';
import api from '../../services/api';

const ChecklistPage = () => {
  const [reuniones, setReuniones] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [reunionSel, setReunionSel] = useState('');
  const [grupoSel, setGrupoSel] = useState('');
  const [registrosHoy, setRegistrosHoy] = useState([]);
  const [modoSelector, setModoSelector] = useState(false);
  const [registro, setRegistro] = useState(null);
  const [todosNinos, setTodosNinos] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtrados, setFiltrados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [marcando, setMarcando] = useState(false);
  const [observacionGeneral, setObservacionGeneral] = useState('');
  const [mostrarObservacion, setMostrarObservacion] = useState(false);
  const [modalComentario, setModalComentario] = useState(null);
  const [modalNota, setModalNota] = useState(null);
  const [modalDescarga, setModalDescarga] = useState(false);

  const [modalAgregar, setModalAgregar] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [masInfo, setMasInfo] = useState(false);
  const [nuevoEdad, setNuevoEdad] = useState('');
  const [nuevoContacto, setNuevoContacto] = useState('');
  const [nuevoGrupoId, setNuevoGrupoId] = useState('');
  const [nuevoObservacion, setNuevoObservacion] = useState('');

  const busquedaRef = useRef();
  const todosNinosRef = useRef([]);

  useEffect(() => { todosNinosRef.current = todosNinos; }, [todosNinos]);
  useEffect(() => { cargarReuniones(); }, []);
  useEffect(() => { if (reunionSel) cargarGrupos(reunionSel); else setGrupos([]); }, [reunionSel]);
  useEffect(() => {
    const sinMarcar = todosNinos.filter(n => !asistencias.find(a => (a.nino_id || a.nino?.id) === n.id));
    setFiltrados(busqueda.trim() ? sinMarcar.filter(n => n.nombre_completo.toLowerCase().includes(busqueda.toLowerCase())) : sinMarcar);
  }, [busqueda, todosNinos, asistencias]);

  useEffect(() => {
    if (!registro) return;
    const canal = supabase.channel(`checklist-${registro.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'asistencias', filter: `registro_id=eq.${registro.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const nino = todosNinosRef.current.find(n => n.id === payload.new.nino_id);
            const nuevaAsistencia = { ...payload.new, nino: nino ? { id: nino.id, nombre_completo: nino.nombre_completo } : { id: payload.new.nino_id, nombre_completo: 'Cargando...' } };
            setAsistencias(prev => { if (prev.find(a => a.id === payload.new.id)) return prev; return [...prev, nuevaAsistencia].sort((a, b) => (a.orden_llegada || 0) - (b.orden_llegada || 0)); });
          }
          if (payload.eventType === 'DELETE') setAsistencias(prev => prev.filter(a => a.id !== payload.old.id));
          if (payload.eventType === 'UPDATE') setAsistencias(prev => prev.map(a => a.id === payload.new.id ? { ...a, ...payload.new } : a));
        })
      .subscribe((status) => console.log('Realtime status:', status));
    return () => { supabase.removeChannel(canal); };
  }, [registro?.id]);

  const cargarReuniones = async () => {
    try { const { data } = await api.get('/reuniones'); setReuniones(data.reuniones || []); }
    catch { toast.error('Error al cargar reuniones'); }
  };

  const cargarGrupos = async (reunionId) => {
    try { const { data } = await api.get(`/grupos?reunion_id=${reunionId}`); setGrupos(data.grupos || []); }
    catch { toast.error('Error al cargar grupos'); }
  };

  const verificarYIniciar = async () => {
    if (!reunionSel || !grupoSel) return toast.error('Selecciona reunión y grupo');
    setCargando(true);
    try {
      const { data } = await api.get(`/asistencias/registros-del-dia?reunion_id=${reunionSel}&grupo_id=${grupoSel}`);
      const existentes = data.registros || [];
      if (existentes.length > 0) { setRegistrosHoy(existentes); setModoSelector(true); }
      else await cargarRegistro(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Error al verificar registros'); }
    finally { setCargando(false); }
  };

  const cargarRegistro = async (nuevo, registroId = null) => {
    setCargando(true);
    try {
      const { data } = await api.post('/asistencias/registro', { reunion_id: reunionSel, grupo_id: grupoSel, nuevo: registroId ? false : nuevo });
      setRegistro(data.registro);
      setAsistencias(data.asistencias || []);
      setObservacionGeneral(data.registro?.observacion_general || '');
      setModoSelector(false);
      const { data: nData } = await api.get('/ninos');
      setTodosNinos(nData.ninos || []);
      toast.success(nuevo ? 'Nueva lista iniciada' : 'Checklist cargado');
    } catch (err) { toast.error(err.response?.data?.message || 'Error al cargar checklist'); }
    finally { setCargando(false); }
  };

  const marcarAsistencia = async (nino) => {
    if (marcando) return;
    setMarcando(true);
    try {
      const { data } = await api.post('/asistencias/marcar', { registro_id: registro.id, nino_id: nino.id, llego_tarde: false });
      setAsistencias(prev => { if (prev.find(a => a.id === data.asistencia.id)) return prev; return [...prev, { ...data.asistencia, nino }]; });
      setBusqueda('');
      toast.success(`${nino.nombre_completo} marcado`);
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('ya fue marcado')) { toast('Este niño ya fue marcado', { icon: '⚠️' }); return; }
      toast.error(msg || 'Error al marcar');
    } finally {
      setMarcando(false);
    }
  };

  const desmarcarAsistencia = async (asistenciaId, ninoNombre) => {
    if (!window.confirm(`¿Desmarcar a ${ninoNombre}?`)) return;
    try {
      await api.delete(`/asistencias/${asistenciaId}`);
      setAsistencias(prev => prev.filter(a => a.id !== asistenciaId));
      toast.success(`${ninoNombre} desmarcado`);
    } catch (err) { toast.error(err.response?.data?.message || 'Error al desmarcar'); }
  };

  const guardarComentario = async () => {
    if (!modalComentario) return;
    try {
      const { data } = await api.put(`/asistencias/${modalComentario.id}`, { llego_tarde: modalComentario.tarde, comentario: modalComentario.comentario });
      setAsistencias(prev => prev.map(a => a.id === modalComentario.id ? { ...a, ...data.asistencia } : a));
      setModalComentario(null);
      toast.success('Actualizado');
    } catch { toast.error('Error al actualizar'); }
  };

  const guardarRegistro = async () => {
    setGuardando(true);
    try {
      await api.post('/asistencias/guardar', { registro_id: registro.id, observacion_general: observacionGeneral });
      toast.success('Registro guardado exitosamente');
    } catch { toast.error('Error al guardar'); }
    finally { setGuardando(false); }
  };

  const descargar = async (formato) => {
    try {
      setModalDescarga(false);
      const response = await api.get(`/asistencias/exportar/${registro.id}?formato=${formato}`, { responseType: 'blob' });
      const ext = formato === 'pdf' ? 'pdf' : 'xlsx';
      const mime = formato === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const url = window.URL.createObjectURL(new Blob([response.data], { type: mime }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `asistencia_${registro.fecha || registro.id}.${ext}`);
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${formato.toUpperCase()} descargado`);
    } catch { toast.error('Error al descargar'); }
  };

  const abrirModalAgregar = () => {
    setNuevoNombre('');
    setMasInfo(false);
    setNuevoEdad('');
    setNuevoContacto('');
    setNuevoGrupoId(grupoSel || '');
    setNuevoObservacion('');
    setModalAgregar(true);
  };

  const agregarNuevoNino = async () => {
    if (!nuevoNombre.trim()) return toast.error('Ingresa el nombre del niño');
    if (/\d/.test(nuevoNombre)) return toast.error('El nombre no puede contener números');
    if (masInfo && nuevoContacto && !/^\d+$/.test(nuevoContacto)) return toast.error('El contacto solo puede contener números');
    try {
      const payload = {
        nombre_completo: nuevoNombre.trim(),
        grupo_id: nuevoGrupoId || grupoSel || null,
        numero_contacto: nuevoContacto.trim() || '0000000',
        edad: nuevoEdad ? parseInt(nuevoEdad) : null,
        observacion: nuevoObservacion.trim() || null,
      };
      const { data } = await api.post('/ninos', payload);
      setTodosNinos(prev => [...prev, data.nino]);
      setModalAgregar(false);
      toast.success('Niño agregado');
    } catch (err) { toast.error(err.response?.data?.message || 'Error al agregar'); }
  };

  // ── Pantalla 1 ───────────────────────────────────────────────
  if (!registro && !modoSelector) {
    return (
      <div className="space-y-6">
        <div className="relative rounded-2xl overflow-hidden p-6"
          style={{ background: 'linear-gradient(135deg, var(--p600) 0%, var(--p700) 100%)' }}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white" style={{ transform: 'translate(30%,-30%)' }} />
          </div>
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <FiCheckSquare size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Checklist de Asistencia</h1>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>Selecciona la reunión y grupo para comenzar</p>
            </div>
          </div>
        </div>
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reunión</label>
              <select value={reunionSel} onChange={e => { setReunionSel(e.target.value); setGrupoSel(''); }}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                <option value="">-- Selecciona reunión --</option>
                {reuniones.map(r => <option key={r.id} value={r.id}>{r.nombre} ({r.hora_inicio} - {r.hora_fin})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
              <select value={grupoSel} onChange={e => setGrupoSel(e.target.value)} disabled={!reunionSel}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 text-sm">
                <option value="">-- Selecciona grupo --</option>
                {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre} ({g.edad_min}-{g.edad_max} años)</option>)}
              </select>
            </div>
            <button onClick={verificarYIniciar} disabled={cargando || !reunionSel || !grupoSel}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2">
              <FiCheckSquare size={18} /> {cargando ? 'Verificando...' : 'Iniciar Checklist'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Pantalla 2 ───────────────────────────────────────────────
  if (modoSelector) {
    const grupoInfo = grupos.find(g => g.id === grupoSel);
    const reunionInfo = reuniones.find(r => r.id === reunionSel);
    return (
      <div className="space-y-6">
        <div className="relative rounded-2xl overflow-hidden p-6"
          style={{ background: 'linear-gradient(135deg, var(--p600) 0%, var(--p700) 100%)' }}>
          <div className="relative">
            <h1 className="text-xl font-bold text-white">Checklist de Asistencia</h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>{reunionInfo?.nombre} · {grupoInfo?.nombre}</p>
          </div>
        </div>
        <div className="max-w-lg mx-auto space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <FiAlertCircle className="text-amber-500 mt-0.5 shrink-0" size={18} />
            <p className="text-sm text-amber-700">Ya hay <strong>{registrosHoy.length}</strong> lista(s) registradas hoy. ¿Continuar con una existente o crear nueva?</p>
          </div>
          <div className="space-y-2">
            {registrosHoy.map((r, i) => (
              <button key={r.id} onClick={() => cargarRegistro(false, r.id)}
                className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-primary-400 hover:bg-primary-50 transition">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">Lista #{i + 1}</p>
                    <p className="text-xs text-gray-400">{r.guardado_at ? `Guardada · ${new Date(r.guardado_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}` : 'En progreso'}</p>
                  </div>
                </div>
                <span className="text-primary-600 text-xs font-medium flex items-center gap-1"><FiRefreshCw size={13} /> Continuar</span>
              </button>
            ))}
          </div>
          <button onClick={() => cargarRegistro(true)} disabled={cargando}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60">
            <FiPlus size={18} /> {cargando ? 'Creando...' : 'Crear nueva lista'}
          </button>
          <button onClick={() => setModoSelector(false)} className="w-full py-3 border border-gray-300 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition">Cancelar</button>
        </div>
      </div>
    );
  }

  // ── Pantalla 3: Checklist activo ─────────────────────────────
  const grupoActivo = grupos.find(g => g.id === grupoSel);
  const reunionActiva = reuniones.find(r => r.id === reunionSel);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="relative rounded-2xl overflow-hidden p-4" style={{ background: 'linear-gradient(135deg, var(--p600) 0%, var(--p700) 100%)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <FiCheckSquare size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white">{grupoActivo?.nombre || 'Checklist de Asistencia'}</h1>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {registro.fecha} · {reunionActiva?.nombre} · {asistencias.length} asistente{asistencias.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button onClick={() => { setRegistro(null); setModoSelector(false); setBusqueda(''); setAsistencias([]); }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition" title="Volver">
            <FiX size={18} className="text-white" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input ref={busquedaRef} value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar niño para marcar..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
            {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><FiX size={16} /></button>}
          </div>
          <button onClick={abrirModalAgregar} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
            <FiUserPlus size={16} /> Agregar
          </button>
        </div>
        {filtrados.length > 0 && (
          <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
            {filtrados.map(nino => (
              <button key={nino.id} onClick={() => marcarAsistencia(nino)}
                disabled={marcando}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-primary-50 text-left text-sm border-b border-gray-100 last:border-0 transition disabled:opacity-50 disabled:cursor-not-allowed">
                <span className="text-gray-800">{nino.nombre_completo}</span>
                <span className="text-primary-600 text-xs font-medium flex items-center gap-1">
                  {marcando ? <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-600" /> : <FiCheck size={14} />}
                  Marcar
                </span>
              </button>
            ))}
          </div>
        )}
        {busqueda && filtrados.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-3 py-2">No se encontró "{busqueda}"</p>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Asistentes</h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ background: 'var(--p600)' }}>{asistencias.length}</span>
        </div>
        {asistencias.length === 0 ? (
          <div className="text-center py-10">
            <FiCheckSquare size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400 text-sm">Busca un niño arriba para marcarlo</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {asistencias.map((a, i) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition group">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: 'var(--p600)' }}>{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{a.nino?.nombre_completo}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{a.hora_llegada ? new Date(a.hora_llegada).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      {a.llego_tarde && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full flex items-center gap-1"><FiClock size={10} /> Tarde</span>}
                      {a.comentario && (
                        <button
                          onClick={() => setModalNota({ nombre: a.nino?.nombre_completo, comentario: a.comentario })}
                          className="flex items-center gap-1 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full hover:bg-blue-200 transition">
                          <FiEye size={10} />Nota
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => setModalComentario({ id: a.id, nombre: a.nino?.nombre_completo, comentario: a.comentario || '', tarde: a.llego_tarde || false })}
                    className="p-2 text-gray-400 hover:text-primary-600 transition"><FiMessageSquare size={16} /></button>
                  <button onClick={() => desmarcarAsistencia(a.id, a.nino?.nombre_completo)}
                    className="p-2 text-gray-400 hover:text-red-500 transition"><FiX size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <button onClick={() => setMostrarObservacion(p => !p)} className="w-full flex items-center justify-between p-4 text-left">
          <span className="font-medium text-gray-700 text-sm flex items-center gap-2">
            <FiMessageSquare size={15} className="text-primary-500" />
            Observación general
            {observacionGeneral && <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">Agregada</span>}
          </span>
          <span className="text-gray-400 text-xs">{mostrarObservacion ? '▲' : '▼'}</span>
        </button>
        {mostrarObservacion && (
          <div className="px-4 pb-4">
            <textarea value={observacionGeneral} onChange={e => setObservacionGeneral(e.target.value)} rows={3}
              placeholder="Observaciones del grupo, incidencias, etc."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={guardarRegistro} disabled={guardando}
          className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60">
          <FiSave size={18} /> {guardando ? 'Guardando...' : 'Guardar Registro'}
        </button>
        <button onClick={() => setModalDescarga(true)}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-5 rounded-xl transition">
          <FiDownload size={18} /> Descargar
        </button>
      </div>

      {/* Modal descarga */}
      {modalDescarga && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Descargar lista</h3>
              <button onClick={() => setModalDescarga(false)} className="p-1 text-gray-400 hover:text-gray-600"><FiX size={18} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-5">Elige el formato:</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => descargar('xlsx')} className="flex items-center gap-3 w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-medium py-3 px-4 rounded-xl transition">
                <FiGrid size={22} /><div className="text-left"><p className="text-sm font-semibold">Excel (.xlsx)</p><p className="text-xs text-emerald-600">Hoja de cálculo</p></div>
              </button>
              <button onClick={() => descargar('pdf')} className="flex items-center gap-3 w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-medium py-3 px-4 rounded-xl transition">
                <FiFileText size={22} /><div className="text-left"><p className="text-sm font-semibold">PDF (.pdf)</p><p className="text-xs text-red-600">Listo para imprimir</p></div>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal ver nota */}
      {modalNota && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl mx-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-800">Nota</h3>
                <p className="text-xs text-gray-400 mt-0.5">{modalNota.nombre}</p>
              </div>
              <button onClick={() => setModalNota(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"><FiX /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{modalNota.comentario}</p>
            </div>
            <div className="px-5 pb-5">
              <button onClick={() => setModalNota(null)}
                className="w-full py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal comentario */}
      {modalComentario && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl mx-4">
            <h3 className="font-bold text-gray-800 mb-1">Editar asistencia</h3>
            <p className="text-sm text-gray-500 mb-4">{modalComentario.nombre}</p>
            <label className="flex items-center gap-3 mb-4 cursor-pointer p-3 bg-orange-50 rounded-xl">
              <input type="checkbox" checked={modalComentario.tarde} onChange={e => setModalComentario(p => ({ ...p, tarde: e.target.checked }))} className="w-4 h-4 rounded text-primary-600" />
              <span className="text-sm text-gray-700 font-medium">Llegó tarde</span>
            </label>
            <textarea value={modalComentario.comentario} onChange={e => setModalComentario(p => ({ ...p, comentario: e.target.value }))}
              placeholder="Comentario o recordatorio..." rows={3}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setModalComentario(null)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={guardarComentario} className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition">Guardar</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal agregar niño */}
      {modalAgregar && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h3 className="font-bold text-gray-800">Agregar niño</h3>
                <p className="text-xs text-gray-400 mt-0.5">El niño quedará registrado en el sistema</p>
              </div>
              <button onClick={() => setModalAgregar(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"><FiX /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)}
                  placeholder="Nombre y apellido del niño"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onKeyDown={e => e.key === 'Enter' && !masInfo && agregarNuevoNino()} autoFocus />
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                <input type="checkbox" checked={masInfo} onChange={e => setMasInfo(e.target.checked)} className="w-4 h-4 rounded text-primary-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Agregar más información</p>
                  <p className="text-xs text-gray-400">Edad, contacto, grupo y observaciones</p>
                </div>
                <FiChevronDown size={16} className={`text-gray-400 transition-transform ${masInfo ? 'rotate-180' : ''}`} />
              </label>
              {masInfo && (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
                    <input type="number" min={0} max={17} value={nuevoEdad} onChange={e => setNuevoEdad(e.target.value)}
                      placeholder="Ej: 7"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número de contacto</label>
                    <input value={nuevoContacto} onChange={e => setNuevoContacto(e.target.value)}
                      placeholder="Ej: 0991234567"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grupo asignado</label>
                    <select value={nuevoGrupoId} onChange={e => setNuevoGrupoId(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Sin grupo asignado</option>
                      {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre} ({g.edad_min}–{g.edad_max} años)</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observación <span className="text-gray-400 font-normal">(opcional)</span></label>
                    <textarea rows={3} value={nuevoObservacion} onChange={e => setNuevoObservacion(e.target.value)}
                      placeholder="Alergias, condiciones especiales, etc."
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setModalAgregar(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button onClick={agregarNuevoNino} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition">Agregar</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ChecklistPage;
