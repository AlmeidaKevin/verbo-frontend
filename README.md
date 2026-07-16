# Sistema Escuela Dominical — Frontend

Frontend del sistema de gestión para la Escuela Dominical de la **Iglesia Cristiana Verbo Mañosca**. Aplicación web construida en React, que consume la API REST del backend mediante Axios y se conecta directamente a Supabase para eventos en tiempo real.

## 📺 Manual de usuario

- **YouTube:** https://youtu.be/STA7XPuSRTE
- **Google Drive** (mismo video): https://drive.google.com/file/d/1YNoMLMT_BxqqWNlygKyz-fJWt71Al-Fm/view?usp=drive_link

---

## Tabla de contenido

- [Descripción general](#descripción-general)
- [Tecnologías utilizadas](#tecnologías-utilizadas)
- [Paneles por rol](#paneles-por-rol)
- [Funcionalidades principales](#funcionalidades-principales)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Despliegue](#despliegue)
- [Autor](#autor)

---

## Descripción general

La aplicación ofrece una interfaz diferenciada por rol (administrador, docente y ayudante) para gestionar usuarios, niños, reuniones, grupos, asistencia en tiempo real, publicaciones internas y mensajería, además de una página pública informativa accesible sin necesidad de iniciar sesión.

## Tecnologías utilizadas

| Herramienta | Uso |
|---|---|
| **React (Create React App)** | Librería principal de la interfaz |
| **React Router** | Navegación entre vistas y rutas protegidas por rol |
| **Tailwind CSS** | Estilización de la interfaz |
| **React Hook Form** | Manejo y validación de formularios |
| **Axios** | Comunicación con la API REST (con interceptor JWT) |
| **Supabase Client (SDK)** | Suscripción a eventos en tiempo real (Realtime) |
| **React Hot Toast** | Notificaciones visuales |
| **React Icons** | Iconografía de la interfaz |

## Paneles por rol

| Rol | Color de panel | Módulos disponibles |
|---|---|---|
| **Administrador** | Azul institucional | Dashboard, Usuarios, Niños, Reuniones, Grupos, Checklist, Reportes, Publicaciones, Chat, Perfil |
| **Docente** | Índigo | Dashboard, Mis Grupos, Checklist, Tareas, Reportes, Publicaciones, Chat, Perfil |
| **Ayudante** | Violeta | Dashboard, Checklist, Avisos, Chat, Perfil |

Cada rol accede únicamente a las rutas y funcionalidades que le corresponden, validado tanto en la interfaz como en el backend.

## Funcionalidades principales

- Inicio de sesión con verificación de estado de cuenta (activada, pendiente, desactivada)
- Gestión de usuarios con roles diferenciados y protección especial para cuentas de administrador
- Checklist de asistencia en tiempo real, sincronizado entre docentes y ayudantes mediante Supabase Realtime
- Publicaciones internas segmentadas por rol o grupo, con indicador de no leídas en tiempo real
- Mensajería interna en tiempo real con envío de archivos
- Página pública sin autenticación con información de reuniones, grupos y publicaciones
- Exportación de reportes de asistencia en PDF y Excel
- Diseño responsivo (smartphone, tablet y escritorio)

## Requisitos previos

- Node.js 18 o superior
- Backend del sistema en ejecución (local o desplegado)
- Proyecto de Supabase configurado (mismo utilizado por el backend)

## Instalación

```bash
git clone <url-del-repositorio>
cd frontend
npm install
```

Crea un archivo `.env` en la raíz del proyecto siguiendo la sección de [Variables de entorno](#variables-de-entorno).

```bash
npm start
```

La aplicación queda disponible por defecto en `http://localhost:3000`.

## Variables de entorno

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=tu_clave_anonima
```

## Scripts disponibles

```bash
npm start        # Inicia la aplicación en modo desarrollo
npm run build     # Genera la versión de producción
```

## Estructura del proyecto

```
frontend/
├── public/
│   └── favicon_verbo.png
├── src/
│   ├── components/
│   │   └── shared/         # Layouts por rol (AdminLayout, DocenteLayout, AyudanteLayout)
│   ├── context/             # Contexto de autenticación (AuthContext)
│   ├── pages/
│   │   ├── admin/           # Vistas exclusivas de administrador
│   │   ├── docente/         # Vistas exclusivas de docente
│   │   ├── ayudante/        # Vistas exclusivas de ayudante
│   │   ├── auth/            # Login, verificación de cuenta, recuperación de contraseña
│   │   ├── chat/            # Mensajería interna
│   │   ├── shared/          # Vistas comunes entre roles (perfil)
│   │   └── publico/         # Página pública sin autenticación
│   ├── services/            # Configuración de Axios (api.js)
│   ├── config/               # Configuración del cliente de Supabase
│   ├── App.jsx               # Definición de rutas
│   └── index.js
└── .env                      # Variables de entorno (no versionado)
```

## Despliegue

El frontend se despliega como servicio independiente en **Render**, conectado al repositorio de GitHub para redespliegue automático. Al ser una aplicación de una sola página (SPA), Render está configurado con una regla de reescritura que redirige todas las rutas al archivo `index.html`, para que la navegación de React Router funcione correctamente al acceder directamente mediante una URL.

## Autor

**Kevin Fernando Almeida Arreaga**
Desarrollo del sistema para la Iglesia Cristiana Verbo Mañosca.
