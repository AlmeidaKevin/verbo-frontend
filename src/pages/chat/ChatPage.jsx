import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FiSearch, FiX, FiSend, FiPaperclip, FiFile,
  FiCheck, FiMessageSquare, FiDownload, FiChevronLeft,
  FiMoreVertical, FiUser, FiUserPlus
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import supabase from '../../config/supabase';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ── Helpers ──────────────────────────────────────────────────
const formatHora = (fecha) =>
  new Date(fecha).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

const formatFecha = (fecha) => {
  const hoy = new Date();
  const d = new Date(fecha);
  const diffDias = Math.floor((hoy - d) / 86400000);
  if (diffDias === 0) return 'Hoy';
  if (diffDias === 1) return 'Ayer';
  return d.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });
};

const esMismoDia = (a, b) => {
  const da = new Date(a); const db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
};

const esImagen = (tipo) => tipo?.startsWith('image/');

// ── Palomitas ────────────────────────────────────────────────
const Palomitas = ({ estado, esMio }) => {
  if (!esMio) return null;
  if (estado === 'visto')    return <span className="text-blue-400 text-xs ml-1">✓✓</span>;
  if (estado === 'recibido') return <span className="text-gray-400 text-xs ml-1">✓✓</span>;
  return <span className="text-gray-400 text-xs ml-1">✓</span>;
};

// ── Burbuja de mensaje ───────────────────────────────────────
const BurbujaMensaje = ({ msg, esMio }) => {
  const esArch = msg.tipo === 'archivo' || msg.tipo === 'imagen';
  const imgTipo = esArch && esImagen(msg.archivo_tipo);

  return (
    <div className={`flex ${esMio ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`max-w-[72%] sm:max-w-[60%] rounded-2xl px-3 py-2 shadow-sm ${
        esMio ? 'rounded-tr-sm text-white' : 'rounded-tl-sm bg-white text-gray-800 border border-gray-100'
      }`} style={esMio ? { background: '#1F4E5F' } : {}}>

        {esArch && (
          imgTipo ? (
            <a href={msg.archivo_url} target="_blank" rel="noreferrer">
              <img src={msg.archivo_url} alt={msg.archivo_nombre}
                className="rounded-xl max-h-48 w-full object-cover mb-1 cursor-pointer hover:opacity-90 transition" />
            </a>
          ) : (
            <a href={msg.archivo_url} target="_blank" rel="noreferrer"
              className={`flex items-center gap-2 p-2 rounded-xl mb-1 transition ${
                esMio ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-50 hover:bg-gray-100'
              }`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                esMio ? 'bg-white/20' : 'bg-primary-100'
              }`}>
                <FiFile size={16} className={esMio ? 'text-white' : 'text-primary-600'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${esMio ? 'text-white' : 'text-gray-800'}`}>
                  {msg.archivo_nombre}
                </p>
              </div>
              <FiDownload size={14} className={esMio ? 'text-white/70' : 'text-gray-400'} />
            </a>
          )
        )}

        {msg.contenido && (
          <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
            esMio ? 'text-white' : 'text-gray-800'
          }`}>{msg.contenido}</p>
        )}

        <div className={`flex items-center justify-end gap-1 mt-0.5 ${
          esMio ? 'text-white/60' : 'text-gray-400'
        }`}>
          <span className="text-xs">{formatHora(msg.created_at)}</span>
          <Palomitas estado={msg.estado} esMio={esMio} />
        </div>
      </div>
    </div>
  );
};

// ── Separador de fecha ───────────────────────────────────────
const SeparadorFecha = ({ fecha }) => (
  <div className="flex items-center justify-center my-4">
    <span className="text-xs text-gray-500 bg-white/80 px-3 py-1 rounded-full shadow-sm">
      {formatFecha(fecha)}
    </span>
  </div>
);

// ── Tarjeta de conversación ──────────────────────────────────
const TarjetaConversacion = ({ conv, activa, onClick }) => {
  const ultimo = conv.ultimo_mensaje;
  const esConocido = conv.es_contacto !== false; // true por defecto

  const previewTexto = () => {
    if (!ultimo) return 'Inicia la conversación';
    if (ultimo.tipo === 'imagen') return '📷 Imagen';
    if (ultimo.tipo === 'archivo') return `📎 ${ultimo.archivo_nombre || 'Archivo'}`;
    return ultimo.contenido?.slice(0, 45) || '';
  };

  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left border-b border-gray-100 last:border-0 ${
        activa ? 'bg-primary-50 border-l-4 border-l-primary-600' : ''
      } ${!esConocido ? 'opacity-80' : ''}`}>
      <div className="relative shrink-0">
        {conv.contacto.foto_url
          ? <img src={conv.contacto.foto_url} alt=""
              className={`w-11 h-11 rounded-full object-cover ${!esConocido ? 'grayscale' : ''}`} />
          : <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white ${
              !esConocido ? 'bg-gray-400' : ''
            }`} style={esConocido ? { background: '#1F4E5F' } : {}}>
              {conv.contacto.nombre_completo[0]}
            </div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className={`text-sm font-semibold truncate ${!esConocido ? 'text-gray-500' : 'text-gray-800'}`}>
              {conv.contacto.nombre_completo}
            </p>
            {!esConocido && (
              <span className="text-xs px-1.5 py-0.5 rounded-full shrink-0 font-medium"
                style={{ background: '#FEF3C7', color: '#D97706' }}>
                Desconocido
              </span>
            )}
          </div>
          {ultimo && (
            <span className="text-xs text-gray-400 shrink-0">{formatHora(ultimo.created_at)}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-gray-400 truncate">{previewTexto()}</p>
          {conv.no_leidos > 0 && (
            <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center shrink-0 font-bold"
              style={{ background: '#1F4E5F', minWidth: 20 }}>
              {conv.no_leidos > 9 ? '9+' : conv.no_leidos}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

// ── Página principal ─────────────────────────────────────────
const ChatPage = () => {
  const { usuario } = useAuth();
  const [conversaciones, setConversaciones] = useState([]);
  const [convActiva, setConvActiva] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [cargandoMsgs, setCargandoMsgs] = useState(false);
  const [mostrarPanel, setMostrarPanel] = useState(false);
  // En móvil: 'lista' | 'chat'
  const [vistaMovil, setVistaMovil] = useState('lista');

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const busquedaTimer = useRef(null);
  const canalRef = useRef(null);
  const todosNinosRef = useRef([]);

  // ── Cargar conversaciones ──
  const cargarConversaciones = useCallback(async () => {
    try {
      const { data } = await api.get('/chat/conversaciones');
      setConversaciones(data.conversaciones || []);
    } catch {}
  }, []);

  useEffect(() => { cargarConversaciones(); }, [cargarConversaciones]);

  // ── En móvil siempre empieza en lista ──
  useEffect(() => { setVistaMovil('lista'); }, []);

  // ── Scroll al final ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // ── Buscar usuarios en tiempo real ──
  useEffect(() => {
    if (busquedaTimer.current) clearTimeout(busquedaTimer.current);
    if (!busqueda.trim() || busqueda.length < 2) { setResultados([]); return; }
    setBuscando(true);
    busquedaTimer.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/chat/buscar-usuarios?q=${encodeURIComponent(busqueda)}`);
        setResultados(data.usuarios || []);
      } catch { setResultados([]); }
      finally { setBuscando(false); }
    }, 300);
    return () => clearTimeout(busquedaTimer.current);
  }, [busqueda]);

  // ── Abrir conversación ──
  const abrirConversacion = async (contacto) => {
    setBusqueda(''); setResultados([]);
    try {
      const { data } = await api.post('/chat/conversaciones', { contacto_id: contacto.id });
      await cargarConversaciones();
      await cargarMensajes(data.conversacion_id, contacto);
      setVistaMovil('chat');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al abrir conversación');
    }
  };

  // ── Cargar mensajes ──
  const cargarMensajes = async (convId, contacto = null) => {
    setCargandoMsgs(true);
    try {
      const { data } = await api.get(`/chat/mensajes/${convId}`);
      setMensajes(data.mensajes || []);
      setConversaciones(prev => prev.map(c =>
        c.id === convId ? { ...c, no_leidos: 0 } : c
      ));
      let contactoInfo = contacto;
      if (!contactoInfo) {
        const conv = conversaciones.find(c => c.id === convId);
        contactoInfo = conv?.contacto;
      }
      setConvActiva({ id: convId, contacto: contactoInfo });
      suscribirRealtime(convId);
    } catch { toast.error('Error al cargar mensajes'); }
    finally { setCargandoMsgs(false); }
  };

  // ── Realtime ──
  const suscribirRealtime = (convId) => {
    if (canalRef.current) supabase.removeChannel(canalRef.current);
    canalRef.current = supabase
      .channel(`chat-conv-${convId}-${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'mensajes',
        filter: `conversacion_id=eq.${convId}`
      }, async (payload) => {
        const nuevo = payload.new;
        if (nuevo.remitente_id === usuario.id) return;
        await api.put(`/chat/mensajes/${nuevo.id}/recibido`).catch(() => {});
        setMensajes(prev => {
          if (prev.find(m => m.id === nuevo.id)) return prev;
          return [...prev, { ...nuevo, estado: 'recibido' }];
        });
        // Marcar visto inmediatamente
        await api.get(`/chat/mensajes/${convId}`).catch(() => {});
        setConversaciones(prev => prev.map(c =>
          c.id === convId ? { ...c, no_leidos: 0, ultimo_mensaje: nuevo } : c
        ));
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'mensajes',
        filter: `conversacion_id=eq.${convId}`
      }, (payload) => {
        setMensajes(prev => prev.map(m =>
          m.id === payload.new.id ? { ...m, estado: payload.new.estado } : m
        ));
      })
      .subscribe((status) => {
        console.log('Realtime chat:', status);
      });
  };

  // Suscribir a conversaciones nuevas (mensajes de desconocidos)
  useEffect(() => {
    if (!usuario?.id) return;
    const canalGlobal = supabase
      .channel(`chat-global-${usuario.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'conversaciones',
      }, () => {
        cargarConversaciones();
      })
      .subscribe();
    return () => supabase.removeChannel(canalGlobal);
  }, [usuario?.id, cargarConversaciones]);

  useEffect(() => {
    return () => { if (canalRef.current) supabase.removeChannel(canalRef.current); };
  }, []);

  // ── Enviar mensaje ──
  const enviarMensaje = async () => {
    if (!texto.trim() || !convActiva || enviando) return;
    const contenido = texto.trim();
    setTexto('');
    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      id: tempId, conversacion_id: convActiva.id,
      remitente_id: usuario.id, contenido, tipo: 'texto',
      estado: 'enviado', created_at: new Date().toISOString(),
    };
    setMensajes(prev => [...prev, tempMsg]);
    setEnviando(true);
    try {
      const { data } = await api.post('/chat/mensajes', {
        conversacion_id: convActiva.id, contenido, tipo: 'texto',
      });
      setMensajes(prev => prev.map(m => m.id === tempId ? data.mensaje : m));
      setConversaciones(prev => prev.map(c =>
        c.id === convActiva.id ? { ...c, ultimo_mensaje: data.mensaje } : c
      ));
    } catch {
      setMensajes(prev => prev.filter(m => m.id !== tempId));
      toast.error('Error al enviar mensaje');
    } finally { setEnviando(false); }
  };

  // ── Enviar archivo ──
  const enviarArchivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !convActiva) return;
    e.target.value = '';
    if (file.size > 5 * 1024 * 1024) return toast.error('El archivo no puede superar 5MB');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data: upload } = await api.post('/chat/subir-archivo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const tipo = file.type.startsWith('image/') ? 'imagen' : 'archivo';
      const tempId = `temp-${Date.now()}`;
      setMensajes(prev => [...prev, {
        id: tempId, conversacion_id: convActiva.id,
        remitente_id: usuario.id, contenido: null, tipo,
        archivo_url: upload.url, archivo_nombre: upload.nombre, archivo_tipo: upload.tipo,
        estado: 'enviado', created_at: new Date().toISOString(),
      }]);
      const { data } = await api.post('/chat/mensajes', {
        conversacion_id: convActiva.id, tipo,
        archivo_url: upload.url, archivo_nombre: upload.nombre, archivo_tipo: upload.tipo,
      });
      setMensajes(prev => prev.map(m => m.id === tempId ? data.mensaje : m));
      setConversaciones(prev => prev.map(c =>
        c.id === convActiva.id ? { ...c, ultimo_mensaje: data.mensaje } : c
      ));
    } catch { toast.error('Error al enviar archivo'); }
  };

  // ── Renderizar mensajes con separadores ──
  const renderMensajes = () => {
    const elementos = [];
    mensajes.forEach((msg, i) => {
      const anterior = mensajes[i - 1];
      if (!anterior || !esMismoDia(anterior.created_at, msg.created_at)) {
        elementos.push(<SeparadorFecha key={`fecha-${msg.id}`} fecha={msg.created_at} />);
      }
      elementos.push(
        <BurbujaMensaje key={msg.id} msg={msg} esMio={msg.remitente_id === usuario.id} />
      );
    });
    return elementos;
  };

  // ── Panel info lateral ──
  const PanelInfo = () => (
    <div className="w-64 border-l border-gray-200 bg-white flex flex-col shrink-0">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <p className="font-semibold text-gray-800 text-sm">Información</p>
        <button onClick={() => setMostrarPanel(false)}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition">
          <FiX size={16} />
        </button>
      </div>
      <div className="p-6 text-center border-b border-gray-100">
        {convActiva?.contacto?.foto_url
          ? <img src={convActiva.contacto.foto_url} alt=""
              className="w-20 h-20 rounded-full object-cover mx-auto mb-3" />
          : <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3"
              style={{ background: '#1F4E5F' }}>
              {convActiva?.contacto?.nombre_completo?.[0]}
            </div>
        }
        <p className="font-bold text-gray-800">{convActiva?.contacto?.nombre_completo}</p>
        <p className="text-xs text-gray-400 mt-1">{convActiva?.contacto?.email}</p>
        <span className="inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-medium"
          style={{ background: '#EEF4F6', color: '#1F4E5F' }}>
          {convActiva?.contacto?.rol || 'Usuario'}
        </span>
      </div>
      <div className="p-4 text-center">
        <p className="text-xs text-gray-400">
          Más opciones estarán disponibles próximamente.
        </p>
      </div>
    </div>
  );

  // ── Panel vacío ──
  const PanelVacio = () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: '#EEF4F6' }}>
        <FiMessageSquare size={36} style={{ color: '#1F4E5F' }} />
      </div>
      <p className="text-lg font-bold text-gray-700">Mensajes</p>
      <p className="text-sm text-gray-400 mt-1 text-center px-6">
        Selecciona una conversación o busca un usuario para comenzar
      </p>
    </div>
  );

  return (
    // Ocupa exactamente el espacio del main sin scroll externo
    <div className="flex overflow-hidden rounded-2xl border border-gray-200 shadow-sm bg-white"
      style={{ height: 'calc(100vh - 7rem)' }}>

      {/* ── PANEL IZQUIERDO ── */}
      <div className={`
        flex flex-col border-r border-gray-200 shrink-0
        ${vistaMovil === 'chat' ? 'hidden md:flex' : 'flex'}
        w-full md:w-80 lg:w-96
      `}>

        {/* Header del panel */}
        <div className="p-4 border-b border-gray-100 shrink-0" style={{ background: '#1F4E5F' }}>
          <p className="text-base font-bold text-white mb-3">Mensajes</p>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={14} />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar usuario..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-sm bg-white/10 text-white placeholder-white/50 focus:outline-none focus:bg-white/20 transition" />
            {busqueda && (
              <button onClick={() => { setBusqueda(''); setResultados([]); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                <FiX size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Resultados búsqueda */}
        {(resultados.length > 0 || buscando) && (
          <div className="border-b border-gray-200 bg-white max-h-48 overflow-y-auto shrink-0">
            {buscando ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
              </div>
            ) : resultados.map(u => (
              <button key={u.id} onClick={() => abrirConversacion(u)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition border-b border-gray-100 last:border-0">
                {u.foto_url
                  ? <img src={u.foto_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                  : <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: '#1F4E5F' }}>
                      {u.nombre_completo[0]}
                    </div>
                }
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{u.nombre_completo}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Lista conversaciones — scroll solo aquí */}
        <div className="flex-1 overflow-y-auto">
          {conversaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: '#EEF4F6' }}>
                <FiUser size={22} style={{ color: '#1F4E5F' }} />
              </div>
              <p className="text-sm font-semibold text-gray-600">Sin conversaciones</p>
              <p className="text-xs text-gray-400 mt-1">Busca un usuario arriba para comenzar</p>
            </div>
          ) : (
            conversaciones.map(conv => (
              <TarjetaConversacion key={conv.id} conv={conv}
                activa={convActiva?.id === conv.id}
                onClick={() => {
                  cargarMensajes(conv.id);
                  setVistaMovil('chat');
                }} />
            ))
          )}
        </div>
      </div>

      {/* ── PANEL DERECHO: chat ── */}
      <div className={`
        flex-1 flex flex-col min-w-0 overflow-hidden
        ${vistaMovil === 'lista' ? 'hidden md:flex' : 'flex'}
      `}>
        {!convActiva ? <PanelVacio /> : (
          <>
            {/* Header del chat */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => { setVistaMovil('lista'); setMostrarPanel(false); }}
                  className="md:hidden p-1.5 text-gray-400 hover:text-gray-600 -ml-1">
                  <FiChevronLeft size={20} />
                </button>
                <button onClick={() => setMostrarPanel(p => !p)}
                  className="flex items-center gap-3 hover:opacity-80 transition">
                  {convActiva.contacto?.foto_url
                    ? <img src={convActiva.contacto.foto_url} alt=""
                        className="w-9 h-9 rounded-full object-cover" />
                    : <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ background: '#1F4E5F' }}>
                        {convActiva.contacto?.nombre_completo?.[0]}
                      </div>
                  }
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800 leading-tight">
                      {convActiva.contacto?.nombre_completo}
                    </p>
                    <p className="text-xs text-gray-400">{convActiva.contacto?.email}</p>
                  </div>
                </button>
              </div>
              <button onClick={() => setMostrarPanel(p => !p)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition">
                <FiMoreVertical size={18} />
              </button>
            </div>

            {/* Mensajes — scroll solo aquí */}
            <div className="flex-1 overflow-y-auto px-4 py-4"
              style={{ background: '#F0EDE8' }}>
              {cargandoMsgs ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2"
                    style={{ borderColor: '#1F4E5F' }} />
                </div>
              ) : mensajes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-sm text-gray-400">No hay mensajes aún</p>
                  <p className="text-xs text-gray-300 mt-1">Sé el primero en escribir</p>
                </div>
              ) : (
                <>
                  {renderMensajes()}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-white border-t border-gray-200 shrink-0">
              <div className="flex items-end gap-2">
                <input ref={fileInputRef} type="file" className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={enviarArchivo} />
                <button onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition shrink-0">
                  <FiPaperclip size={18} />
                </button>
                <textarea
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      enviarMensaje();
                    }
                  }}
                  placeholder="Escribe un mensaje..."
                  rows={1}
                  className="flex-1 border border-gray-300 rounded-2xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 max-h-28"
                />
                <button onClick={enviarMensaje}
                  disabled={!texto.trim() || enviando}
                  className="p-2.5 rounded-xl transition shrink-0 disabled:opacity-40"
                  style={{ background: texto.trim() ? '#1F4E5F' : '#E5E7EB' }}>
                  <FiSend size={18} className={texto.trim() ? 'text-white' : 'text-gray-400'} />
                </button>
              </div>
              <p className="text-xs text-gray-300 mt-1 text-right">
                Enter para enviar · Shift+Enter para nueva línea
              </p>
            </div>
          </>
        )}
      </div>

      {/* Panel info lateral */}
      {mostrarPanel && convActiva && <PanelInfo />}
    </div>
  );
};

export default ChatPage;
