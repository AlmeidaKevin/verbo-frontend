import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiX, FiEye, FiEyeOff, FiSearch, FiUsers, FiInfo, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SUPER_ADMIN_EMAIL = 'almeidakevin783@gmail.com';

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'docente', label: 'Docente / Líder' },
  { value: 'ayudante', label: 'Ayudante / Colaborador' },
];

const ESTADOS = [
  { value: 'activada',    label: 'Activada',    color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500',
    info: 'El usuario verificó su cuenta y puede iniciar sesión normalmente.' },
  { value: 'pendiente',   label: 'Pendiente',   color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-400',
    info: 'El usuario recibió el correo de verificación pero aún no hizo clic en el enlace.' },
  { value: 'desactivada', label: 'Desactivada', color: 'bg-red-100 text-red-700',        dot: 'bg-red-500',
    info: 'El usuario no puede iniciar sesión. Verá el mensaje "Tu cuenta ha sido desactivada".' },
];

const estadoInfo = (estado) => ESTADOS.find(e => e.value === estado) || ESTADOS[1];

const InfoTooltip = ({ texto }) => {
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const mostrar = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: Math.max(8, rect.right - 224) });
    }
  };
  return (
    <span className="inline-flex shrink-0">
      <button ref={btnRef} type="button" onMouseEnter={mostrar} onMouseLeave={() => setPos(null)}
        className="text-gray-400 hover:text-primary-600 transition ml-1">
        <FiInfo size={13} />
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

const UsuariosPage = () => {
  const { usuario: usuarioActual } = useAuth();
  const esSuperAdmin = usuarioActual?.email === SUPER_ADMIN_EMAIL;

  const [usuarios, setUsuarios] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [rolFiltro, setRolFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [verPass, setVerPass] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [dropdownAbierto, setDropdownAbierto] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(data.usuarios || []);
    } catch { toast.error('Error al cargar usuarios'); }
    finally { setCargando(false); }
  };

  const abrirModal = (usuario = null) => {
    setEditando(usuario);
    setVerPass(false);
    reset(usuario
      ? { nombre_completo: usuario.nombre_completo, cedula: usuario.cedula, email: usuario.email, telefono: usuario.telefono, rol: usuario.rol, password: '' }
      : { nombre_completo: '', cedula: '', email: '', telefono: '', rol: 'docente', password: '' });
    setModal(true);
  };

  const cerrar = () => { setModal(false); setEditando(null); };

  const onSubmit = async (datos) => {
    setCargando(true);
    try {
      if (editando) {
        const { data } = await api.put(`/usuarios/${editando.id}`, {
          nombre_completo: datos.nombre_completo, cedula: datos.cedula,
          email: datos.email, telefono: datos.telefono, rol: datos.rol,
        });
        setUsuarios(prev => prev.map(u => u.id === editando.id ? { ...u, ...data.usuario } : u));
        toast.success('Usuario actualizado');
      } else {
        const { data } = await api.post('/auth/crear-usuario', datos);
        setUsuarios(prev => [data.usuario, ...prev]);
        toast.success('Usuario creado. Se envió email de verificación.');
      }
      cerrar();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar usuario'); }
    finally { setCargando(false); }
  };

  const cambiarEstado = async (usuario, nuevoEstado) => {
    if (usuario.rol === 'admin') return toast.error('No se puede modificar el estado de un administrador');
    try {
      const { data } = await api.put(`/usuarios/${usuario.id}`, { estado: nuevoEstado });
      setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, ...data.usuario } : u));
      toast.success(`Estado cambiado a "${nuevoEstado}"`);
    } catch (err) { toast.error(err.response?.data?.message || 'Error al cambiar estado'); }
  };

  const eliminar = async (usuario) => {
    // Verificar si puede eliminar
    if (usuario.rol === 'admin' && !esSuperAdmin) {
      return toast.error('Solo el administrador principal puede eliminar otros administradores');
    }
    if (!window.confirm(`¿Eliminar permanentemente a ${usuario.nombre_completo}? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/usuarios/${usuario.id}`);
      setUsuarios(prev => prev.filter(u => u.id !== usuario.id));
      toast.success('Usuario eliminado');
    } catch (err) { toast.error(err.response?.data?.message || 'Error al eliminar usuario'); }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const matchBusqueda = u.nombre_completo.toLowerCase().includes(filtro.toLowerCase()) ||
      u.email.toLowerCase().includes(filtro.toLowerCase()) || u.cedula.includes(filtro);
    const matchRol = rolFiltro ? u.rol === rolFiltro : true;
    const matchEstado = estadoFiltro ? (u.estado || 'pendiente') === estadoFiltro : true;
    return matchBusqueda && matchRol && matchEstado;
  });

  const rolBadge = (rol) => ({ admin: 'bg-red-100 text-red-700', docente: 'bg-blue-100 text-blue-700', ayudante: 'bg-emerald-100 text-emerald-700' }[rol] || 'bg-gray-100 text-gray-600');
  const validarSoloLetras = v => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(v) || 'Solo se permiten letras';
  const validarSoloNumeros = v => /^\d+$/.test(v) || 'Solo se permiten números';

  const activos = usuarios.filter(u => u.estado === 'activada').length;
  const pendientes = usuarios.filter(u => u.estado === 'pendiente').length;
  const docentes = usuarios.filter(u => u.rol === 'docente').length;
  const ayudantes = usuarios.filter(u => u.rol === 'ayudante').length;

  const opcionesEstado = (usuario) => {
    if (usuario.email_verificado) return ESTADOS.filter(e => e.value !== 'pendiente');
    return ESTADOS;
  };

  // Determinar si se puede mostrar el botón eliminar para un usuario
  const puedeEliminar = (u) => {
    if (u.id === usuarioActual?.id) return false; // no puede eliminarse a sí mismo
    if (u.rol === 'admin') return esSuperAdmin; // solo super admin puede eliminar admins
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 flex items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, #1F4E5F 0%, #183D4A 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white" style={{ transform: 'translate(30%,-30%)' }} />
        </div>
        <div className="relative flex-1">
          <h1 className="text-xl font-bold text-white">Usuarios</h1>
          <div className="flex flex-wrap gap-4 mt-2">
            <span className="text-xs" style={{ color: '#9EC5D0' }}>{activos} activados</span>
            <span className="text-xs" style={{ color: '#9EC5D0' }}>{pendientes} pendientes</span>
            <span className="text-xs" style={{ color: '#9EC5D0' }}>{docentes} docentes</span>
            <span className="text-xs" style={{ color: '#9EC5D0' }}>{ayudantes} ayudantes</span>
          </div>
        </div>
        <button onClick={() => abrirModal()}
          className="relative flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition shrink-0"
          style={{ background: '#C8A96B', color: '#112C36' }}>
          <FiPlus size={18} /> Nuevo Usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={filtro} onChange={e => setFiltro(e.target.value)}
            placeholder="Buscar por nombre, email o cédula..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <select value={rolFiltro} onChange={e => setRolFiltro(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
          <option value="">Todos los roles</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
      </div>

      {cargando ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200" style={{ background: '#EEF4F6' }}>
                <tr>
                  {['Nombre', 'Cédula', 'Email', 'Teléfono', 'Rol', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuariosFiltrados.map(u => {
                  const est = estadoInfo(u.estado || 'pendiente');
                  const esAdmin = u.rol === 'admin';
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {u.foto_url
                            ? <img src={u.foto_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                            : <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">{u.nombre_completo[0]}</div>}
                          <span className="font-medium text-gray-800">{u.nombre_completo}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{u.cedula}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{u.telefono}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${rolBadge(u.rol)}`}>
                          {ROLES.find(r => r.value === u.rol)?.label || u.rol}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {esAdmin ? (
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-700">Admin</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <div className="relative">
                              <button
                                onClick={() => setDropdownAbierto(dropdownAbierto === u.id ? null : u.id)}
                                className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${est.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${est.dot}`} />
                                {est.label}
                                <span className="ml-0.5 opacity-60">▾</span>
                              </button>
                              {dropdownAbierto === u.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setDropdownAbierto(null)} />
                                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 min-w-[150px] overflow-hidden">
                                    {opcionesEstado(u).map(op => (
                                      <button key={op.value}
                                        onClick={() => { cambiarEstado(u, op.value); setDropdownAbierto(null); }}
                                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-gray-50 transition ${op.value === u.estado ? 'font-semibold bg-gray-50' : ''}`}>
                                        <span className={`w-2 h-2 rounded-full ${op.dot} shrink-0`} />
                                        {op.label}
                                        {op.value === u.estado && <span className="ml-auto text-primary-600">✓</span>}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                            <InfoTooltip texto={est.info} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => abrirModal(u)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                            title="Editar">
                            <FiEdit2 size={14} />
                          </button>
                          {puedeEliminar(u) && (
                            <button onClick={() => eliminar(u)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Eliminar">
                              <FiTrash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {usuariosFiltrados.length === 0 && (
              <div className="text-center py-10">
                <FiUsers size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400">No se encontraron usuarios</p>
              </div>
            )}
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {usuariosFiltrados.map(u => {
              const est = estadoInfo(u.estado || 'pendiente');
              const esAdmin = u.rol === 'admin';
              return (
                <div key={u.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {u.foto_url
                        ? <img src={u.foto_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        : <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">{u.nombre_completo[0]}</div>}
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{u.nombre_completo}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${rolBadge(u.rol)}`}>{ROLES.find(r => r.value === u.rol)?.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => abrirModal(u)} className="p-2 text-gray-400 hover:text-primary-600">
                        <FiEdit2 size={16} />
                      </button>
                      {puedeEliminar(u) && (
                        <button onClick={() => eliminar(u)} className="p-2 text-gray-400 hover:text-red-500">
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-gray-500">
                    <p>📧 {u.email}</p>
                    <p>🪪 {u.cedula} · 📞 {u.telefono}</p>
                  </div>
                  {!esAdmin && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {opcionesEstado(u).map(op => (
                        <button key={op.value} onClick={() => cambiarEstado(u, op.value)}
                          className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 transition ${
                            op.value === u.estado ? op.color + ' ring-2 ring-offset-1 ring-current' : 'bg-gray-100 text-gray-500'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${op.dot}`} />
                          {op.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal crear/editar */}
      {modal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="font-bold text-gray-800">{editando ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editando ? 'Actualiza la información del usuario' : 'Se enviará un correo de verificación'}</p>
              </div>
              <button onClick={cerrar} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"><FiX /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>
              {[
                { name: 'nombre_completo', label: 'Nombre completo *', placeholder: 'Nombre y apellido', rules: { required: 'Requerido', validate: validarSoloLetras } },
                { name: 'cedula', label: 'Número de cédula *', placeholder: '0000000000', rules: { required: 'Requerido', validate: validarSoloNumeros, minLength: { value: 8, message: 'Mínimo 8 dígitos' }, maxLength: { value: 15, message: 'Máximo 15 dígitos' } } },
                { name: 'email', label: 'Correo electrónico *', placeholder: 'correo@ejemplo.com', type: 'email', rules: { required: 'Requerido', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' } } },
                { name: 'telefono', label: 'Teléfono *', placeholder: '0999999999', rules: { required: 'Requerido', validate: validarSoloNumeros, minLength: { value: 7, message: 'Mínimo 7 dígitos' } } },
              ].map(({ name, label, placeholder, type, rules }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type || 'text'}
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors[name] ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder={placeholder} {...register(name, rules)} />
                  {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>}
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  {...register('rol', { required: 'Requerido' })}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {!editando && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                  <div className="relative">
                    <input type={verPass ? 'text' : 'password'}
                      className={`w-full border rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
                      placeholder="Mínimo 8 caracteres"
                      {...register('password', {
                        required: 'Requerida', minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                        validate: {
                          mayus: v => /[A-Z]/.test(v) || 'Necesita una mayúscula',
                          minus: v => /[a-z]/.test(v) || 'Necesita una minúscula',
                          num: v => /\d/.test(v) || 'Necesita un número',
                          especial: v => /[!@#$%^&*(),.?":{}|<>]/.test(v) || 'Necesita un carácter especial',
                        },
                      })} />
                    <button type="button" onClick={() => setVerPass(!verPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {verPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                  <p className="text-xs text-gray-400 mt-1">Debe tener: mayúscula, minúscula, número y carácter especial</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrar} className="flex-1 py-3 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" disabled={cargando} className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-60">
                  {cargando ? 'Guardando...' : editando ? 'Actualizar' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UsuariosPage;
