// Domain types mirroring the .NET models.

export type EstadoGenerico = "Activo" | "Inactivo";
export type EstadoUsuario = "Activo" | "Inactivo";
export type EstadoActivo = "Disponible" | "Asignado" | "EnMantenimiento" | "DadoDeBaja";
export type EstadoAsignacion = "Activa" | "Finalizada";
export type TipoMovimiento = "Entrada" | "Salida" | "Asignacion" | "Devolucion";

export type RoleKey = "super_admin" | "coordinador" | "agente_soporte";

export interface Role {
  idRol: number;
  nombre: string;
  tipo: RoleKey;
  estado: EstadoGenerico;
}

export interface Usuario {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  email: string;
  documento: string;
  idRol: number;
  idSede: number;
  estado: EstadoUsuario;
}

export interface Sede {
  idSede: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  estado: EstadoGenerico;
}

export interface Parqueadero {
  idParqueadero: number;
  idSede: number;
  nombre: string;
  ubicacion: string;
  estado: EstadoGenerico;
}

export interface CategoriaActivo {
  idCategoria: number;
  nombre: string;
  estado: EstadoGenerico;
}

export interface OrdenCompra {
  idOrden: number;
  numeroOC: string;
  proveedor: string;
  total: number;
  observaciones: string;
  fechaCompra: string;
}

export interface Activo {
  idActivo: number;
  serial: string;
  marca: string;
  modelo: string;
  descripcion: string;
  idCategoria: number;
  idOrden: number | null;
  estado: EstadoActivo;
}

export interface Canal {
  idCanal: number;
  nombre: string;
  fechaSolicitud: string;
}

export interface Salida {
  idSalida: number;
  idCanal: number;
  idParqueadero: number;
  fechaSalida: string;
  observaciones: string;
}

export interface AsignacionUsuario {
  idAsignacion: number;
  idUsuario: number;
  idActivo: number;
  idParqueadero: number | null;
  fechaAsignacion: string;
  fechaDevolucion: string | null;
  estado: EstadoAsignacion;
}

export interface Movimiento {
  idMovimiento: number;
  idActivo: number;
  tipo: TipoMovimiento;
  fecha: string;
  observaciones: string;
}

export interface AuthUser {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  email: string;
  role: RoleKey;
  idSede: number;
}
