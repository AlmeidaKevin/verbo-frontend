import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiUserPlus, FiCheck, FiClock, FiMessageSquare, FiSave, FiDownload, FiX, FiPlus, FiFileText, FiRefreshCw, FiAlertCircle, FiGrid } from 'react-icons/fi';

import toast from 'react-hot-toast';
import api from '../../services/api';

const ChecklistPage = () => {
  const [reuniones, setReuniones] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [reunionSel, setReunionSel] = useState('');
  const [grupoSel, setGrupoSel] = useState('');

  // Pantalla de selección inicial
  const [registrosHoy, setRegistrosHoy] = useState([]); // registros existentes del día
  const [modoSelector, setModoSelector] = useState(false); // muestra opciones: continuar o nueva

  const [registro, setRegistro] = useState(null);
  const [todosNinos, setTodosNinos] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtrados, setFiltrados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Observación general
  const [observacionGeneral, setObservacionGeneral] = useState('');
  const [mostrarObservacion, setMostrarObservacion] = useState(false);

  const [modalComentario, setModalComentario] = useState(null);
  const [modalAgregar, setModalAgregar] = useState(false);
  const [nuevoNino, setNuevoNino] = useState('');
  const [modalDescarga, setModalDescarga] = useState(false);
  const busquedaRef = useRef();

  useEffect(() => { cargarReuniones(); }, []);

  useEffect(() => {
    if (reunionSel) cargarGrupos(reunionSel);
    else setGrupos([]);
  }, [reunionSel]);

  useEffect(() => {
    const sinMarcar = todosNinos.filter(n => !asistencias.find(a => a.nino_id === n.id));
    if (busqueda.trim()) {
      setFiltrados(sinMarcar.filter(n =>
        n.nombre_completo.toLowerCase().includes(busqueda.toLowerCase())
      ));
    } else {
      setFiltrados(sinMarcar);
    }
  }, [busqueda, todosNinos, asistencias]);

  const cargarReuniones = async () => {
    try {
      const { data } = await api.get('/reuniones');
      setReuniones(data.reuniones || []);
    } catch { toast.error('Error al cargar reuniones'); }
  };

  const cargarGrupos = async (reunionId) => {
    try {
      const { data } = await api.get(`/grupos?reunion_id=${reunionId}`);
      setGrupos(data.grupos || []);
    } catch { toast.error('Error al cargar grupos'); }
  };

  // Al presionar "Iniciar Checklist" — verificar si ya hay registros hoy
  const verificarYIniciar = async () => {
    if (!reunionSel || !grupoSel) return toast.error('Selecciona reunión y grupo');
    setCargando(true);
    try {
      const { data } = await api.get(
        `/asistencias/registros-del-dia?reunion_id=${reunionSel}&grupo_id=${grupoSel}`
      );
      const existentes = data.registros || [];
      if (existentes.length > 0) {
        setRegistrosHoy(existentes);
        setModoSelector(true);
      } else {
        await cargarRegistro(false); // crear nuevo directamente
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al verificar registros');
    } finally {
      setCargando(false);
    }
  };

  // Cargar (o crear) un registro
  const cargarRegistro = async (nuevo, registroId = null) => {
    setCargando(true);
    try {
      let registroData;

      if (registroId) {
        // Cargar uno específico existente
        const { data } = await api.post('/asistencias/registro', {
          reunion_id: reunionSel,
          grupo_id: grupoSel,
          nuevo: false,
        });
        // Buscar el específico entre los del día
        registroData = data;
        // Si el servidor devolvió uno diferente al que queremos, obtenerlo directamente
        // (el backend ya busca el más reciente; para seleccionar uno específico pasamos id)
      } else {
        const { data } = await api.post('/asistencias/registro', {
          reunion_id: reunionSel,
          grupo_id: grupoSel,
          nuevo,
        });
        registroData = data;
      }

      setRegistro(registroData.registro);
      setAsistencias(registroData.asistencias || []);
      setObservacionGeneral(registroData.registro?.observacion_general || '');
      setModoSelector(false);

      const { data: nData } = await api.get('/ninos');
      setTodosNinos(nData.ninos || []);
      toast.success(nuevo ? '✅ Nueva lista iniciada' : '✅ Checklist cargado');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cargar checklist');
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
      setAsistencias(prev =>
        prev.map(a => a.id === modalComentario.id ? { ...a, ...data.asistencia } : a)
      );
      setModalComentario(null);
      toast.success('Actualizado');
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const guardarRegistro = async () => {
    setGuardando(true);
    try {
      await api.post('/asistencias/guardar', {
        registro_id: registro.id,
        observacion_general: observacionGeneral,
      });
      toast.success('✅ Registro guardado exitosamente');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const descargar = async (formato) => {
    try {
      setModalDescarga(false);
      const response = await api.get(
        `/asistencias/exportar/${registro.id}?formato=${formato}`,
        { responseType: 'blob' }
      );
      const ext = formato === 'pdf' ? 'pdf' : 'xlsx';
      const mime =
        formato === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const url = window.URL.createObjectURL(new Blob([response.data], { type: mime }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `asistencia_${registro.fecha || registro.id}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${formato.toUpperCase()} descargado`);
    } catch {
      toast.error('Error al descargar');
    }
  };

  const agregarNuevoNino = async () => {
    if (!nuevoNino.trim()) return toast.error('Ingresa el nombre del niño');
    if (/\d/.test(nuevoNino)) return toast.error('El nombre no puede contener números');
    try {
      const { data } = await api.post('/ninos', {
        nombre_completo: nuevoNino.trim(),
        grupo_id: grupoSel,
        numero_contacto: '0000000',
      });
      setTodosNinos(prev => [...prev, data.nino]);
      setNuevoNino('');
      setModalAgregar(false);
      toast.success('Niño agregado');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al agregar');
    }
  };

  // ─── Pantalla 1: Seleccionar reunión y grupo ────────────────────────────
  if (!registro && !modoSelector) {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Checklist de Asistencia</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reunión</label>
            <select
              value={reunionSel}
              onChange={e => { setReunionSel(e.target.value); setGrupoSel(''); }}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Selecciona reunión --</option>
              {reuniones.map(r => (
                <option key={r.id} value={r.id}>
                  {r.nombre} ({r.hora_inicio} - {r.hora_fin})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
            <select
              value={grupoSel}
              onChange={e => setGrupoSel(e.target.value)}
              disabled={!reunionSel}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
            >
              <option value="">-- Selecciona grupo --</option>
              {grupos.map(g => (
                <option key={g.id} value={g.id}>
                  {g.nombre} ({g.edad_min}-{g.edad_max} años)
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={verificarYIniciar}
            disabled={cargando || !reunionSel || !grupoSel}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
          >
            {cargando ? 'Verificando...' : 'Iniciar Checklist'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Pantalla 2: Ya hay registros hoy — elegir qué hacer ───────────────
  if (modoSelector) {
    const grupoInfo = grupos.find(g => g.id === grupoSel);
    const reunionInfo = reuniones.find(r => r.id === reunionSel);
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Checklist de Asistencia</h1>
        <p className="text-gray-500 text-sm mb-6">
          {reunionInfo?.nombre} · {grupoInfo?.nombre}
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex gap-3">
          <FiAlertCircle className="text-amber-500 mt-0.5 shrink-0" size={18} />
          <p className="text-sm text-amber-700">
            Ya hay <strong>{registrosHoy.length}</strong> lista(s) registradas hoy para este grupo.
            ¿Deseas continuar con una existente o crear una nueva?
          </p>
        </div>

        {/* Listas existentes */}
        <div className="space-y-2 mb-4">
          {registrosHoy.map((r, i) => (
            <button
              key={r.id}
              onClick={() => cargarRegistro(false, r.id)}
              className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-primary-400 hover:bg-primary-50 transition"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">Lista #{i + 1}</p>
                  <p className="text-xs text-gray-400">
                    {r.guardado_at
                      ? `Guardada · ${new Date(r.guardado_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`
                      : 'En progreso'}
                  </p>
                </div>
              </div>
              <span className="text-primary-600 text-xs font-medium flex items-center gap-1">
                <FiRefreshCw size={13} /> Continuar
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => cargarRegistro(true)}
          disabled={cargando}
          className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
        >
          <FiPlus size={18} /> {cargando ? 'Creando...' : 'Crear nueva lista'}
        </button>

        <button
          onClick={() => setModoSelector(false)}
          className="w-full mt-2 py-3 border border-gray-300 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
      </div>
    );
  }

  // ─── Pantalla 3: Checklist activo ──────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-primary-600 text-white rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">Checklist de Asistencia</h1>
            <p className="text-primary-200 text-sm">
              {registro.fecha} · {asistencias.length} asistente{asistencias.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => { setRegistro(null); setModoSelector(false); setBusqueda(''); setAsistencias([]); }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
            title="Volver"
          >
            <FiX size={18} />
          </button>
        </div>
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
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setModalAgregar(true)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
          >
            <FiUserPlus size={16} /> Agregar
          </button>
        </div>

        {/* Lista filtrada */}
        {filtrados.length > 0 && (
          <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
            {filtrados.map(nino => (
              <button
                key={nino.id}
                onClick={() => marcarAsistencia(nino)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-primary-50 text-left text-sm border-b border-gray-100 last:border-0 transition"
              >
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
                  <span className="w-7 h-7 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.nino?.nombre_completo}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">
                        {a.hora_llegada
                          ? new Date(a.hora_llegada).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                      {a.llego_tarde && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <FiClock size={10} /> Tarde
                        </span>
                      )}
                      {a.comentario && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Nota</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setModalComentario({
                    id: a.id,
                    nombre: a.nino?.nombre_completo,
                    comentario: a.comentario || '',
                    tarde: a.llego_tarde || false,
                  })}
                  className="p-2 text-gray-400 hover:text-primary-600 transition"
                >
                  <FiMessageSquare size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Observación general */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <button
          onClick={() => setMostrarObservacion(p => !p)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <span className="font-medium text-gray-700 text-sm flex items-center gap-2">
            <FiMessageSquare size={15} className="text-primary-500" />
            Observación general de la lista
            {observacionGeneral && (
              <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">Agregada</span>
            )}
          </span>
          <span className="text-gray-400 text-xs">{mostrarObservacion ? '▲' : '▼'}</span>
        </button>
        {mostrarObservacion && (
          <div className="px-4 pb-4">
            <textarea
              value={observacionGeneral}
              onChange={e => setObservacionGeneral(e.target.value)}
              rows={3}
              placeholder="Ej: Reunión especial, se canceló por lluvia, observaciones del grupo..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-400 mt-1">Esta observación se guarda junto al registro.</p>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3">
        <button
          onClick={guardarRegistro}
          disabled={guardando}
          className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
        >
          <FiSave size={18} /> {guardando ? 'Guardando...' : 'Guardar Registro'}
        </button>
        <button
          onClick={() => setModalDescarga(true)}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition"
        >
          <FiDownload size={18} /> Descargar
        </button>
      </div>

      {/* Modal selección descarga */}
      {modalDescarga && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Descargar lista</h3>
              <button onClick={() => setModalDescarga(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <FiX size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-5">Elige el formato de descarga:</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => descargar('xlsx')}
                className="flex items-center gap-3 w-full bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-medium py-3 px-4 rounded-xl transition"
              >
                <FiGrid size={22} />
                <div className="text-left">
                  <p className="text-sm font-semibold">Excel (.xlsx)</p>
                  <p className="text-xs text-green-600">Hoja de cálculo editable</p>
                </div>
              </button>
              <button
                onClick={() => descargar('pdf')}
                className="flex items-center gap-3 w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-medium py-3 px-4 rounded-xl transition"
              >
                <FiFileText size={22} />
                <div className="text-left">
                  <p className="text-sm font-semibold">PDF (.pdf)</p>
                  <p className="text-xs text-red-600">Documento listo para imprimir</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal comentario por niño */}
      {modalComentario && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-800 mb-1">Editar asistencia</h3>
            <p className="text-sm text-gray-500 mb-4">{modalComentario.nombre}</p>
            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={modalComentario.tarde}
                onChange={e => setModalComentario(p => ({ ...p, tarde: e.target.checked }))}
                className="w-4 h-4 rounded text-primary-600"
              />
              <span className="text-sm text-gray-700">Llegó tarde</span>
            </label>
            <textarea
              value={modalComentario.comentario}
              onChange={e => setModalComentario(p => ({ ...p, comentario: e.target.value }))}
              placeholder="Comentario o recordatorio..."
              rows={3}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setModalComentario(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={guardarComentario}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal agregar niño */}
      {modalAgregar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-800 mb-4">Agregar niño</h3>
            <input
              value={nuevoNino}
              onChange={e => setNuevoNino(e.target.value)}
              placeholder="Nombre completo del niño"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
              onKeyDown={e => e.key === 'Enter' && agregarNuevoNino()}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setModalAgregar(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={agregarNuevoNino}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChecklistPage;
