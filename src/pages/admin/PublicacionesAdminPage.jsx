import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import {
  FiPlus, FiTrash2, FiEdit2, FiX, FiPaperclip, FiSend, FiBell,
  FiInfo, FiSave, FiUsers, FiUser, FiUserCheck, FiTarget,
  FiGlobe, FiGrid, FiMapPin
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SUPER_ADMIN_EMAIL = 'almeidakevin783@gmail.com';

const TIPOS = [
  {
    value: 'todos',
    label: 'Todos los Docentes y Ayudantes',
    icon: FiUsers,
    info: 'Solo los docentes y los ayudantes verán la publicación.',
    grupo: 'Personal',
  },
  {
    value: 'solo_docentes',
    label: 'Todos los Docentes',
    icon: FiUser,
    info: 'Solo los docentes verán la publicación.',
    grupo: 'Personal',
  },
  {
    value: 'solo_ayudantes',
    label: 'Todos los Ayudantes',
    icon: FiUserCheck,
    info: 'Solo los ayudantes verán la publicación.',
    grupo: 'Personal',
  },
  {
    value: 'docentes_especificos',
    label: 'Docente/s en específico',
    icon: FiTarget,
    info: 'Solo los docentes que seleccionaste verán la publicación.',
    grupo: 'Personal',
  },
  {
    value: 'ayudantes_especificos',
    label: 'Ayudante/s en específico',
    icon: FiTarget,
    info: 'Solo los ayudantes que seleccionaste verán la publicación.',
    grupo: 'Personal',
  },
  {
    value: 'grupos_con_ninos',
    label: 'Todos los grupos, también los niños',
    icon: FiGlobe,
    info: 'Esta publicación la verán absolutamente todos (docentes, ayudantes y niños).',
    grupo: 'Grupos',
  },
  {
    value: 'grupos_sin_ninos',
    label: 'Todos los grupos, no los niños',
    icon: FiGrid,
    info: 'Esta publicación la verán todos los docentes y ayudantes (excepto los niños).',
    grupo: 'Grupos',
  },
  {
    value: 'grupo_especifico_con_ninos',
    label: 'Grupo en específico, también los niños',
    icon: FiMapPin,
    info: 'Esta publicación la verán los docentes, ayudantes y niños solo de los grupos que seleccionaste.',
    grupo: 'Grupos',
  },
  {
    value: 'grupo_especifico_sin_ninos',
    label: 'Grupo en específico, no los niños',
    icon: FiMapPin,
    info: 'Esta publicación la verán los docentes y ayudantes solo de los grupos que seleccionaste (excepto los niños).',
    grupo: 'Grupos',
  },
];

// Tooltip info component
const InfoTooltip = ({ texto }) => {
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);

  const mostrar = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.right - 224 });
    }
  };

  return (
    <span className="relative inline-flex shrink-0">
      <button ref={btnRef} type="button"
        onMouseEnter={mostrar} onMouseLeave={() => setPos(null)}
        onFocus={mostrar} onBlur={() => setPos(null)}
        className="text-gray-400 hover:text-primary-600 transition">
        <FiInfo size={14} />
      </button>
      {pos && createPortal(
        <span className="fixed w-56 bg-gray-800 text-white text-xs rounded-xl px-3 py-2 shadow-2xl leading-relaxed pointer-events-none"
          style={{ top: pos.top, left: pos.left, zIndex: 99999 }}>
          {texto}
        </span>,
        document.body
      )}
    </span>
  );
};

const PublicacionesAdminPage = () => {
  const { usuario: usuarioActual } = useAuth();
  const esSuperAdmin = usuarioActual?.email === SUPER_ADMIN_EMAIL;

  const [publicaciones, setPublicaciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [archivos, setArchivos] = useState([]);
  const [tipoSel, setTipoSel] = useState('todos');
  const [destinatariosSeleccionados, setDestinatariosSeleccionados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      const [pRes, uRes, gRes] = await Promise.all([
        api.get('/publicaciones'),
        api.get('/usuarios'),
        api.get('/grupos'),
      ]);
      setPublicaciones(pRes.data.publicaciones || []);
      setUsuarios(uRes.data.usuarios?.filter(u => u.activo && u.rol !== 'admin') || []);
      setGrupos(gRes.data.grupos || []);
    } catch { toast.error('Error al cargar'); }
    finally { setCargando(false); }
  };

  // Solo el autor de la publicación o el super admin pueden editarla/eliminarla
  const puedeGestionar = (p) => esSuperAdmin || p.publicado_por?.id === usuarioActual?.id;

  const abrirModal = (pub = null) => {
    setEditando(pub);
    setArchivos([]);
    setTipoSel(pub?.tipo_destinatario || 'todos');
    setDestinatariosSeleccionados([]);
    if (pub) {
      setValue('titulo', pub.titulo);
      setValue('contenido', pub.contenido);
    } else {
      reset();
    }
    setModal(true);
  };

  const cerrar = () => {
    setModal(false); setArchivos([]); setTipoSel('todos');
    setDestinatariosSeleccionados([]); setEditando(null); reset();
  };

  const toggleDestinatario = (id) => {
    setDestinatariosSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const obtenerDestinatariosDeGrupos = async (grupoIds) => {
    const ids = new Set();
    for (const gId of grupoIds) {
      const { data } = await api.get(`/grupos/${gId}`);
      const g = data.grupo;
      if (g.docente_id) ids.add(g.docente_id);
      if (g.ayudante1_id) ids.add(g.ayudante1_id);
      if (g.ayudante2_id) ids.add(g.ayudante2_id);
    }
    return Array.from(ids);
  };

  const onSubmit = async (datos) => {
    setCargando(true);
    try {
      let destIds = destinatariosSeleccionados;
      let grupoIds = [];
      if (['grupo_especifico_con_ninos', 'grupo_especifico_sin_ninos'].includes(tipoSel)) {
        grupoIds = [...destinatariosSeleccionados];
        destIds = await obtenerDestinatariosDeGrupos(destinatariosSeleccionados);
      }

      if (editando) {
        const { data } = await api.put(`/publicaciones/${editando.id}`, {
          titulo: datos.titulo,
          contenido: datos.contenido,
        });
        setPublicaciones(prev => prev.map(p => p.id === editando.id ? { ...p, ...data.publicacion } : p));
        toast.success('Publicación actualizada');
        cerrar();
        return;
      }

      const formData = new FormData();
      formData.append('titulo', datos.titulo);
      formData.append('contenido', datos.contenido);
      formData.append('tipo_destinatario', tipoSel);
      formData.append('destinatarios_ids', JSON.stringify(destIds));
      formData.append('grupos_ids', JSON.stringify(grupoIds));
      archivos.forEach(f => formData.append('archivos', f));

      const { data } = await api.post('/publicaciones', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPublicaciones(prev => [data.publicacion, ...prev]);
      toast.success('Publicación enviada');
      cerrar();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al publicar');
    } finally { setCargando(false); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta publicación?')) return;
    try {
      await api.delete(`/publicaciones/${id}`);
      setPublicaciones(prev => prev.filter(p => p.id !== id));
      toast.success('Eliminada');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const tipoInfo = TIPOS.find(t => t.value === tipoSel)?.info || '';
  const necesitaDocentes = tipoSel === 'docentes_especificos';
  const necesitaAyudantes = tipoSel === 'ayudantes_especificos';
  const necesitaGrupos = ['grupo_especifico_con_ninos', 'grupo_especifico_sin_ninos'].includes(tipoSel);
  const docentesList = usuarios.filter(u => u.rol === 'docente');
  const ayudantesList = usuarios.filter(u => u.rol === 'ayudante');

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 flex items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, #1F4E5F 0%, #183D4A 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white" style={{ transform: 'translate(30%,-30%)' }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white" style={{ transform: 'translate(-20%,20%)' }} />
        </div>
        <div className="relative">
          <h1 className="text-xl font-bold text-white">Publicaciones</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9EC5D0' }}>
            {publicaciones.length} publicación{publicaciones.length !== 1 ? 'es' : ''} enviada{publicaciones.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => abrirModal()}
          className="relative flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition shrink-0"
          style={{ background: '#C8A96B', color: '#112C36' }}>
          <FiPlus size={18} /> Nueva Publicación
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-4">
        {cargando && publicaciones.length === 0 && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          </div>
        )}
        {!cargando && publicaciones.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center
