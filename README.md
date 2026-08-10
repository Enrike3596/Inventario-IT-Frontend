<<<<<<< HEAD

# Indigo — Sistema de Inventario TI

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TanStack Start](https://img.shields.io/badge/TanStack%20Start-1.168-FF4154?logo=tanstack)](https://tanstack.com/start)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.2-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#licencia)

> **Indigo** — Sistema Corporativo de Inventario TI. Aplicación web moderna para la gestión integral de activos informáticos, asignaciones, salidas de inventario y trazabilidad de movimientos.

---

## Tabla de Contenidos

- [Descripción](#descripción)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Módulos del Sistema](#módulos-del-sistema)
- [Capturas de Pantalla](#capturas-de-pantalla)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Ejecución](#instalación-y-ejecución)
- [Scripts Disponibles](#scripts-disponibles)
- [Variables de Entorno](#variables-de-entorno)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Autenticación y Roles](#autenticación-y-roles)
- [API Backend](#api-backend)
- [Desarrollo](#desarrollo)
- [Construcción para Producción](#construcción-para-producción)
- [Licencia](#licencia)

---

## Descripción

Indigo es una aplicación **full-stack** para la administración del inventario de tecnología en una organización. Permite gestionar activos, usuarios, sedes, parqueaderos, órdenes de compra, categorías, canales de solicitud, asignaciones y salidas de inventario, con un panel de control que ofrece visibilidad en tiempo real del estado del inventario.

El frontend está construido con **TanStack Start** (React 19 + SSR), **Tailwind CSS v4** y **shadcn/ui**, consumiendo una API REST backend en **ASP.NET Core 10**.

### Funcionalidades Principales

- **Dashboard** con métricas clave y distribución de estados de activos.
- **CRUD completo** en 11 módulos de gestión.
- **Autenticación JWT** con recuperación de contraseña.
- **Control de permisos** basado en roles (Super Administrador, Coordinador, Agente Soporte TI).
- **Tema claro/oscuro** con persistencia.
- **Interfaz responsive** con sidebar colapsable.
- **Notificaciones toast** para feedback de operaciones.
- **Búsqueda y filtrado** en tiempo real sobre todos los módulos.

---

## Stack Tecnológico

| Categoría           | Tecnología                    | Versión     |
| ------------------- | ----------------------------- | ----------- |
| **Framework**       | React + TanStack Start        | 19 / 1.168  |
| **Lenguaje**        | TypeScript                    | 5.8         |
| **Ruteo**           | TanStack Router (file-based)  | 1.170       |
| **Estado servidor** | TanStack React Query          | 5.101       |
| **Estilos**         | Tailwind CSS v4               | 4.2         |
| **Componentes**     | shadcn/ui + Radix UI          | —           |
| **Formularios**     | React Hook Form + Zod         | 7.71 / 3.24 |
| **Gráficas**        | Recharts                      | 2.15        |
| **Fechas**          | date-fns                      | 4.1         |
| **Iconos**          | Lucide React                  | 0.575       |
| **Notificaciones**  | Sonner                        | 2.0         |
| **Fuentes**         | Inter + Sora (via Fontsource) | —           |
| **Build**           | Vite 8                        | 8.0         |
| **SSR**             | Nitro (TanStack Start)        | 3.0         |
| **Backend**         | ASP.NET Core 10               | 10.0        |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                    Cliente web                       │
│  ┌───────────────────────────────────────────────┐  │
│  │        TanStack Start (SSR + CSR)             │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────┐  │  │
│  │  │  Router  │  │  React   │  │  React     │  │  │
│  │  │ (file-   │  │  Query   │  │  Hook Form │  │  │
│  │  │  based)  │  │  (cache) │  │  + Zod     │  │  │
│  │  └──────────┘  └──────────┘  └────────────┘  │  │
│  │              ┌──────────────┐                  │  │
│  │              │ Auth Context │                  │  │
│  │              │  (JWT + rol) │                  │  │
│  │              └──────────────┘                  │  │
│  └───────────────────────────────────────────────┘  │
│                         │                            │
│                   HTTP / JSON                        │
│              Authorization: Bearer <JWT>             │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│          ASP.NET Core 10 REST API                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │Controllers│→│ Services │→│  Repositories     │  │
│  │ (REST)    │  │ (lógica) │  │  (PostgreSQL)    │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│         ┌────────────────────────────┐              │
│         │  JWT Authentication        │              │
│         └────────────────────────────┘              │
└─────────────────────────────────────────────────────┘
```

El frontend se comunica exclusivamente mediante HTTP REST con el backend, usando un cliente HTTP tipado (`apiFetch<T>`) que maneja automáticamente:

- Inclusión del token JWT en los headers.
- Mapeo de enums (string ↔ number) en las respuestas.
- Errores estructurados con la clase `ApiError`.

---

## Módulos del Sistema

| Módulo                | Ruta              | Descripción                                                         | CRUD |
| --------------------- | ----------------- | ------------------------------------------------------------------- | ---- |
| **Dashboard**         | `/dashboard`      | Panel con métricas, distribución de activos y movimientos recientes | —    |
| **Usuarios**          | `/usuarios`       | Gestión de usuarios del sistema                                     | ✅   |
| **Roles**             | `/roles`          | Catálogo de roles y permisos                                        | ✅   |
| **Sedes**             | `/sedes`          | Gestión de sedes/ubicaciones                                        | ✅   |
| **Parqueaderos**      | `/parqueaderos`   | Gestión de áreas de almacenamiento                                  | ✅   |
| **Categorías**        | `/categorias`     | Catálogo de categorías de activos                                   | ✅   |
| **Órdenes de Compra** | `/ordenes-compra` | Registro de órdenes de compra                                       | ✅   |
| **Activos**           | `/activos`        | Inventario de activos informáticos                                  | ✅   |
| **Canales**           | `/canales`        | Canales de solicitud (tickets, teléfono, etc.)                      | ✅   |
| **Salidas**           | `/salidas`        | Salidas de inventario                                               | ✅   |
| **Asignaciones**      | `/asignaciones`   | Asignación de activos a usuarios                                    | ✅   |
| **Movimientos**       | `/movimientos`    | Historial de movimientos de activos (solo lectura)                  | —    |

Cada módulo CRUD se renderiza mediante el componente genérico `ResourcePage<T>`, que recibe la configuración de columnas, campos de formulario y callbacks de mutación.

---

## Capturas de Pantalla

> _(Agregar capturas de pantalla aquí — recomendado: dashboard, tabla de activos, formulario de edición)_

---

## Requisitos Previos

- **Node.js** ≥ 20.x
- **pnpm** ≥ 9.x (recomendado) o **bun** ≥ 1.x
- **Backend** .NET 10 corriendo en la URL configurada (ver [Variables de Entorno](#variables-de-entorno))

---

## Instalación y Ejecución

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd inventario-it-frontend
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con la URL del backend:

```env
VITE_API_URL=http://localhost:5176
```

### 4. Iniciar en modo desarrollo

```bash
pnpm dev
```

La aplicación se abrirá en `http://localhost:8080`.

---

## Scripts Disponibles

| Comando          | Descripción                                   |
| ---------------- | --------------------------------------------- |
| `pnpm dev`       | Inicia el servidor de desarrollo Vite con SSR |
| `pnpm build`     | Compila para producción                       |
| `pnpm build:dev` | Compila en modo desarrollo                    |
| `pnpm preview`   | Previsualiza la compilación de producción     |
| `pnpm lint`      | Ejecuta ESLint sobre el código                |
| `pnpm format`    | Formatea el código con Prettier               |

---

## Variables de Entorno

| Variable       | Requerida | Descripción                     | Ejemplo                 |
| -------------- | --------- | ------------------------------- | ----------------------- |
| `VITE_API_URL` | ✅        | URL base de la API REST backend | `http://localhost:5176` |

---

## Estructura del Proyecto

```
src/
├── routes/                    # Rutas file-based (TanStack Router)
│   ├── __root.tsx             # Layout raíz (providers, tema, auth)
│   ├── index.tsx              # Redirección a /auth
│   ├── auth.tsx               # Página de inicio de sesión
│   ├── forgot-password.tsx    # Recuperación de contraseña
│   ├── reset-password.tsx     # Restablecimiento de contraseña
│   ├── _authenticated.tsx     # Layout autenticado (sidebar)
│   └── _authenticated.*.tsx   # Módulos protegidos (dashboard, usuarios, etc.)
├── components/                # Componentes React
│   ├── ui/                    # Componentes shadcn/ui (button, input, dialog, etc.)
│   ├── resource-page.tsx      # Componente CRUD genérico
│   ├── app-header.tsx         # Encabezado de página
│   ├── app-sidebar.tsx        # Barra lateral de navegación
│   └── theme-toggle.tsx       # Alternar tema claro/oscuro
├── lib/                       # Lógica de aplicación
│   ├── types.ts               # Tipos e interfaces del dominio
│   ├── api.ts                 # Cliente HTTP (apiFetch, manejo de errores)
│   ├── auth.tsx               # Contexto de autenticación (JWT + roles)
│   ├── queries.ts             # Hooks React Query (CRUD por recurso)
│   ├── utils.ts               # Utilidades (cn, mapEnum, deepMapEnums)
│   ├── theme.tsx              # Contexto de tema (claro/oscuro)
│   └── hooks/                 # Custom hooks
├── styles.css                 # Tailwind CSS v4 + tokens de diseño
├── router.tsx                 # Configuración del router
├── start.ts                   # Punto de entrada de la aplicación
└── server.ts                  # Entry point SSR
```

---

## Autenticación y Roles

### Flujo de autenticación

1. El usuario inicia sesión en `/auth` con correo y contraseña.
2. El backend valida las credenciales y devuelve un **JWT** + datos del usuario.
3. El token y los datos del usuario se almacenan en `localStorage`.
4. En cada petición, el token se incluye automáticamente via `Authorization: Bearer`.
5. Al recargar la página, se verifica la sesión contra `GET /api/Auth/me`.
6. El cierre de sesión limpia `localStorage`.

### Roles y Permisos

| Rol                     | Clave            | Permisos                               |
| ----------------------- | ---------------- | -------------------------------------- |
| **Super Administrador** | `super_admin`    | Vista, creación, edición y eliminación |
| **Coordinador**         | `coordinador`    | Vista, creación y edición              |
| **Agente Soporte TI**   | `agente_soporte` | Vista, creación y edición              |

El control de permisos se realiza mediante la función `can(action)` expuesta por el `AuthContext`:

```typescript
const { can } = useAuth();
if (can("create")) {
  /* mostrar botón */
}
```

### Recuperación de Contraseña

- **Olvidé mi contraseña** → `/forgot-password` — envía correo electrónico.
- **Restablecer contraseña** → `/reset-password?token=<token>` — establece nueva contraseña.

---

## API Backend

El frontend consume una API REST en ASP.NET Core 10 disponible en `VITE_API_URL`.

### Endpoints

| Método           | Ruta                            | Autenticado |
| ---------------- | ------------------------------- | :---------: |
| `POST`           | `/api/Auth/login`               |     ❌      |
| `POST`           | `/api/Auth/forgot-password`     |     ❌      |
| `POST`           | `/api/Auth/reset-password`      |     ❌      |
| `GET`            | `/api/Auth/me`                  |     ✅      |
| `GET/POST`       | `/api/Roles`                    |     ✅      |
| `GET/PUT/DELETE` | `/api/Roles/{id}`               |     ✅      |
| `GET/POST`       | `/api/Sedes`                    |     ✅      |
| `GET/PUT/DELETE` | `/api/Sedes/{id}`               |     ✅      |
| `GET/POST`       | `/api/Usuarios`                 |     ✅      |
| `GET/PUT/DELETE` | `/api/Usuarios/{id}`            |     ✅      |
| `GET/POST`       | `/api/CategoriasActivo`         |     ✅      |
| `GET/PUT/DELETE` | `/api/CategoriasActivo/{id}`    |     ✅      |
| `GET/POST`       | `/api/Parqueaderos`             |     ✅      |
| `GET/PUT/DELETE` | `/api/Parqueaderos/{id}`        |     ✅      |
| `GET/POST`       | `/api/OrdenesCompra`            |     ✅      |
| `GET/PUT/DELETE` | `/api/OrdenesCompra/{id}`       |     ✅      |
| `GET/POST`       | `/api/Activos`                  |     ✅      |
| `GET/PUT/DELETE` | `/api/Activos/{id}`             |     ✅      |
| `GET/POST`       | `/api/Canales`                  |     ✅      |
| `GET/PUT/DELETE` | `/api/Canales/{id}`             |     ✅      |
| `GET/POST`       | `/api/Salidas`                  |     ✅      |
| `GET/PUT/DELETE` | `/api/Salidas/{id}`             |     ✅      |
| `GET/POST`       | `/api/AsignacionesUsuario`      |     ✅      |
| `GET/PUT/DELETE` | `/api/AsignacionesUsuario/{id}` |     ✅      |
| `GET`            | `/api/HistorialActivo`          |     ✅      |

Todas las respuestas utilizan el formato:

```json
{
  "exito": true,
  "data": {/* recurso o array */},
  "mensaje": "Operación exitosa."
}
```

Los errores se estructuran como:

```json
{
  "exito": false,
  "mensaje": "Descripción del error."
}
```

---

## Desarrollo

### Trabajar con el componente ResourcePage

El componente `ResourcePage<T>` es la pieza central de la interfaz CRUD. Para crear un nuevo módulo:

```typescript
<ResourcePage<MiRecurso>
  title="Mi Recurso"
  subtitle="Descripción del módulo"
  data={data ?? []}
  isLoading={isLoading}
  idKey="idRecurso"
  singular="recurso"
  searchKeys={["nombre"]}
  columns={[
    { header: "Nombre", key: "nombre" },
    { header: "Estado", render: (r) => <Badge>{r.estado}</Badge> },
  ]}
  fields={[
    { key: "nombre", label: "Nombre", type: "text", required: true },
    { key: "estado", label: "Estado", type: "select", options: [...] },
  ]}
  onCreate={(data) => mutation.mutateAsync(data)}
  onUpdate={(id, data) => mutation.mutateAsync({ id, data })}
  onDelete={(id) => mutation.mutateAsync(id)}
/>
```

### Agregar un nuevo recurso

1. Definir la interfaz en `src/lib/types.ts`.
2. Agregar hooks en `src/lib/queries.ts` usando `useList`, `useCreate`, `useUpdate`, `useDelete`.
3. Agregar la ruta en `src/routes/_authenticated.<recurso>.tsx`.
4. La ruta se auto-registra gracias al file-based routing de TanStack Router.

---

## Construcción para Producción

```bash
pnpm build
```

El resultado se genera en `.output/` (servidor) y `dist/` (cliente), listo para desplegar en entornos compatibles con Nitro (Cloudflare, Node, etc.).

Para previsualizar la compilación:

```bash
pnpm preview
```

---

## Licencia

Uso interno — todos los derechos reservados.

---

## Reconocimientos

- [shadcn/ui](https://ui.shadcn.com/) — Componentes base.
- [TanStack](https://tanstack.com/) — Router, Query, Start.
- [Lovable](https://lovable.dev/) — Configuración inicial del proyecto.
  \=======

# Introduction

TODO: Give a short introduction of your project. Let this section explain the objectives or the motivation behind this project.

# Getting Started

TODO: Guide users through getting your code up and running on their own system. In this section you can talk about:

1. Installation process
2. Software dependencies
3. Latest releases
4. API references

# Build and Test

TODO: Describe and show how to build your code and run the tests.

# Contribute

TODO: Explain how other users and developers can contribute to make your code better.

If you want to learn more about creating good readme files then refer the following [guidelines](https://docs.microsoft.com/en-us/azure/devops/repos/git/create-a-readme?view=azure-devops). You can also seek inspiration from the below readme files:

- [ASP.NET Core](https://github.com/aspnet/Home)
- [Visual Studio Code](https://github.com/Microsoft/vscode)
- [Chakra Core](https://github.com/Microsoft/ChakraCore)

> > > > > > > 025c8ab3992e748bef2c875d3a2e186f8de1fbb8
