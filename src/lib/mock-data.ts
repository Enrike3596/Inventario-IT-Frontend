// In-memory mock store. Replace with real API calls once VITE_API_URL is set.
import type {
  Activo,
  AsignacionUsuario,
  Canal,
  CategoriaActivo,
  Movimiento,
  OrdenCompra,
  Parqueadero,
  Role,
  Salida,
  Sede,
  Usuario,
} from "./types";

let idCounter = 1000;
export const nextId = () => ++idCounter;

export const mockRoles: Role[] = [
  { idRol: 1, nombre: "Super Administrador", tipo: "super_admin", estado: "Activo" },
  { idRol: 2, nombre: "Coordinador", tipo: "coordinador", estado: "Activo" },
  { idRol: 3, nombre: "Agente Soporte TI", tipo: "agente_soporte", estado: "Activo" },
];

export const mockSedes: Sede[] = [
  { idSede: 1, nombre: "Sede Bogotá Norte", direccion: "Cra 15 #100-20", ciudad: "Bogotá", estado: "Activo" },
  { idSede: 2, nombre: "Sede Medellín", direccion: "Av El Poblado #10-45", ciudad: "Medellín", estado: "Activo" },
  { idSede: 3, nombre: "Sede Cali", direccion: "Av 6N #23-15", ciudad: "Cali", estado: "Inactivo" },
];

export const mockParqueaderos: Parqueadero[] = [
  { idParqueadero: 1, idSede: 1, nombre: "Bodega TI Norte", ubicacion: "Piso 3 - Zona A", estado: "Activo" },
  { idParqueadero: 2, idSede: 1, nombre: "Bodega TI Sur", ubicacion: "Piso 1 - Zona B", estado: "Activo" },
  { idParqueadero: 3, idSede: 2, nombre: "Bodega Central MDE", ubicacion: "Sótano 2", estado: "Activo" },
];

export const mockCategorias: CategoriaActivo[] = [
  { idCategoria: 1, nombre: "Laptop", estado: "Activo" },
  { idCategoria: 2, nombre: "Monitor", estado: "Activo" },
  { idCategoria: 3, nombre: "Teclado", estado: "Activo" },
  { idCategoria: 4, nombre: "Mouse", estado: "Activo" },
  { idCategoria: 5, nombre: "Impresora", estado: "Activo" },
  { idCategoria: 6, nombre: "Servidor", estado: "Activo" },
];

export const mockOrdenes: OrdenCompra[] = [
  { idOrden: 1, numeroOC: "OC-2025-001", proveedor: "TechCorp SAS", total: 45000000, observaciones: "Renovación laptops Q1", fechaCompra: "2025-02-14" },
  { idOrden: 2, numeroOC: "OC-2025-014", proveedor: "InfraTech Ltda", total: 12800000, observaciones: "Monitores sala reuniones", fechaCompra: "2025-04-22" },
];

export const mockActivos: Activo[] = [
  { idActivo: 1, serial: "SN-LT-000123", marca: "Dell", modelo: "Latitude 5540", descripcion: "Laptop corporativa i7 16GB", idCategoria: 1, idOrden: 1, estado: "Asignado" },
  { idActivo: 2, serial: "SN-LT-000124", marca: "Dell", modelo: "Latitude 5540", descripcion: "Laptop corporativa i7 16GB", idCategoria: 1, idOrden: 1, estado: "Disponible" },
  { idActivo: 3, serial: "SN-MN-000045", marca: "LG", modelo: "27UP550", descripcion: "Monitor 27\" 4K", idCategoria: 2, idOrden: 2, estado: "Disponible" },
  { idActivo: 4, serial: "SN-MN-000046", marca: "LG", modelo: "27UP550", descripcion: "Monitor 27\" 4K", idCategoria: 2, idOrden: 2, estado: "EnMantenimiento" },
  { idActivo: 5, serial: "SN-KB-000200", marca: "Logitech", modelo: "MX Keys", descripcion: "Teclado inalámbrico", idCategoria: 3, idOrden: null, estado: "Disponible" },
];

export const mockCanales: Canal[] = [
  { idCanal: 1, nombre: "Mesa de Ayuda", fechaSolicitud: "2025-06-01" },
  { idCanal: 2, nombre: "Solicitud Directa", fechaSolicitud: "2025-06-05" },
];

export const mockSalidas: Salida[] = [
  { idSalida: 1, idCanal: 1, idParqueadero: 1, fechaSalida: "2025-06-10", observaciones: "Entrega equipos onboarding" },
];

export const mockUsuarios: Usuario[] = [
  { idUsuario: 1, nombres: "Andrea", apellidos: "Ramírez", email: "admin@sicot.local", documento: "1010101010", idRol: 1, idSede: 1, estado: "Activo" },
  { idUsuario: 2, nombres: "Carlos", apellidos: "Gómez", email: "coord@sicot.local", documento: "2020202020", idRol: 2, idSede: 1, estado: "Activo" },
  { idUsuario: 3, nombres: "María", apellidos: "López", email: "soporte@sicot.local", documento: "3030303030", idRol: 3, idSede: 2, estado: "Activo" },
];

export const mockAsignaciones: AsignacionUsuario[] = [
  { idAsignacion: 1, idUsuario: 3, idActivo: 1, idParqueadero: 1, fechaAsignacion: "2025-05-20", fechaDevolucion: null, estado: "Activa" },
];

export const mockMovimientos: Movimiento[] = [
  { idMovimiento: 1, idActivo: 1, tipo: "Entrada", fecha: "2025-02-20", observaciones: "Ingreso desde OC-2025-001" },
  { idMovimiento: 2, idActivo: 1, tipo: "Asignacion", fecha: "2025-05-20", observaciones: "Asignado a María López" },
  { idMovimiento: 3, idActivo: 3, tipo: "Entrada", fecha: "2025-04-25", observaciones: "Ingreso monitor" },
];
