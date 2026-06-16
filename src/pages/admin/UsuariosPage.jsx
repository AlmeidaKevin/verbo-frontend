import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiX, FiEye, FiEyeOff, FiSearch, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'docente', label: 'Docente / Líder' },
  { value: 'ayudante', label: 'Ayudante / Colaborador' },
];

const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [rolFiltro, setRolFiltro] = useState('');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [verPass, setVerPass] = useState(false);
  const [cargando, setCargando] = useState(false);
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
        const { data } = await api.put(`/usuarios/${editando.id}`, { nombre_completo: datos.nombre_completo, cedula: datos.cedula, email: datos.email, telefono: datos.telefono, rol: datos.rol });
        setUsuarios(prev => prev.map(u => u.id === editando.id ? data.usuario : u));
        toast.success('Usuario actualizado');
      } else {
        const { data } = await api.post('/auth/crear-usuario', datos);
        setUsuarios(prev => [data.usuario, ...prev]);
        toast.success('Usuario creado. Se envió email con credenciales.');
      }
      cerrar();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar usuario'); }
    finally { setCargando(false); }
  };

  const toggleActivo = async (usuario) => {
    try {
      await api.put(`/usuarios/${usuario.id}`, { activo: !usuario.activo });
      setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, activo: !u.activo } : u));
      toast.success(usuario.activo ? 'Usuario desactivado' : 'Usuario activado');
    } catch { toast.error('Error al cambiar estado'); }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const matchBusqueda = u.nombre_completo.toLowerCase().includes(filtro.toLowerCase()) ||
      u.email.toLowerCase().includes(filtro.toLowerCase()) || u.cedula.includes(filtro);
    return matchBusqueda && (rolFiltro ? u.rol === rolFiltro : true);
  });

  const rolBadge = (rol) => ({ admin: 'bg-red-100 text-red-700', docente: 'bg-blue-100 text-blue-700', ayudante: 'bg-emerald-100 text-emerald-700' }[rol] || 'bg-gray-100 text-gray-600');
  const validarSoloLetras = v => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(v) || 'Solo se permiten letras';
  const validarSoloNumeros = v => /^\d+$/.test(v) || 'Solo se permiten números';

  const activos = usuarios.filter(u => u.activo).length;
  const docentes = usuarios.filter(u => u.rol === 'docente').length;
  const ayudantes = usuarios.filter(u => u.rol === 'ayudante').length;

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
          <div className="flex gap-4 mt-2">
            <span className="text-xs" style={{ color: '#9EC5D0' }}>{activos} activos</span>
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
                {usuariosFiltrados.map(u => (
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
                      <button onClick={() => toggleActivo(u)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${u.activo ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => abrirModal(u)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"><FiEdit2 size={14} /></button>
                    </td>
                  </tr>
                ))}
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
            {usuariosFiltrados.map(u => (
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
                  <button onClick={() => abrirModal(u)} className="p-2 text-gray-400 hover:text-primary-600"><FiEdit2 size={16} /></button>
                </div>
                <div className="mt-3 space-y-1 text-xs text-gray-500">
                  <p>📧 {u.email}</p>
                  <p>🪪 {u.cedula} · 📞 {u.telefono}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="font-bold text-gray-800">{editando ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editando ? 'Actualiza la información del usuario' : 'Completa los datos para crear el usuario'}</p>
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
                        validate: { mayus: v => /[A-Z]/.test(v) || 'Necesita una mayúscula', minus: v => /[a-z]/.test(v) || 'Necesita una minúscula', num: v => /\d/.test(v) || 'Necesita un número', especial: v => /[!@#$%^&*(),.?":{}|<>]/.test(v) || 'Necesita un carácter especial' },
                      })} />
                    <button type="button" onClick={() => setVerPass(!verPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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
