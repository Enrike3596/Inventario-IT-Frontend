// Domain types matching the .NET response DTOs (camelCase JSON).

export type EstadoGenerico = "Activo" | "Inactivo";
export type EstadoActivo = "Disponible" | "Asignado" | "EnReparacion" | "DadoDeBaja" | "Venta";
export type EstadoAsignacion = "Activa" | "Finalizada";
export type TipoMovimiento = "Entrada" | "Salida" | "Asignacion" | "Devolucion" | "Reparacion" | "Baja";

export type RoleKey = "super_admin" | "coordinador" | "agente_soporte";

export interface Role {
  idRol: number;
  nombre: string;
  tipo: string;
  estado: EstadoGenerico;
}

export interface Usuario {
  idUsuario: number;
  idRol: number;
  nombreRol?: string;
  idSede: number;
  nombreSede?: string;
  nombre: string;
  correo: string;
  telefono: string;
  cargo: string;
  estadoUsuario: EstadoGenerico;
  fechaCreacion: string;
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
  nombreSede?: string;
  nombre: string;
  ubicacion: string;
  estado: EstadoGenerico;
}

export interface CategoriaActivo {
  idCategoria: number;
  nombre: string;
  estado: EstadoGenerico;
}

export interface DetalleItemOC {
  idDetalleItemOC: number;
  idItemOC: number;
  serial: string;
  procesado: boolean;
  idActivo: number | null;
  codigoActivo?: string;
  observaciones: string | null;
}

export interface ItemOC {
  idItemOC: number;
  idOrden: number;
  idCategoria: number;
  nombreCategoria?: string;
  nombreProducto: string;
  marca: string;
  modelo: string;
  referencia: string | null;
  observaciones: string | null;
  cantidadEsperada: number;
  cantidadIngresada: number;
  detallesItem: DetalleItemOC[];
}

export interface OrdenCompra {
  idOrden: number;
  numeroOC: string;
  proveedor: string;
  total: number;
  observaciones: string;
  fechaCompra: string;
  itemsOC?: ItemOC[];
}

export interface OrdenCompraDetail {
  idOrden: number;
  numeroOC: string;
  proveedor: string;
  total: number;
  observaciones: string;
  fechaCompra: string;
  itemsOC: ItemOC[];
}

export interface Activo {
  idActivo: number;
  idCategoria: number;
  nombreCategoria?: string;
  idOrden: number;
  numeroOC?: string;
  idItemOC?: number;
  idDetalleItemOC?: number;
  codigoActivo: string;
  serial: string;
  marca: string;
  modelo: string;
  referencia: string | null;
  estadoActivo: EstadoActivo;
  fechaAdquisicion: string;
  fechaBaja: string | null;
  observaciones: string;
}

export interface Canal {
  idCanal: number;
  nombre: string;
  fechaSolicitud: string;
}

export interface SalidaActivo {
  idActivo: number;
  cantidad: number;
  codigoActivo?: string;
  serial?: string;
  marca?: string;
  modelo?: string;
  nombreCategoria?: string;
}

export interface Salida {
  idSalida: number;
  codigoUnico: string;
  estadoActivo: EstadoActivo;
  fechaSalida: string;
  observaciones: string | null;
  idActivo?: number;
  codigoActivo?: string;
  serial?: string;
  marca?: string;
  modelo?: string;
  nombreCategoria?: string;
  activos?: SalidaActivo[];
}

export interface AsignacionUsuario {
  idAsignacion: number;
  idActivo: number;
  codigoActivo?: string;
  serial?: string;
  idUsuarioDestino: number;
  nombreUsuarioDestino?: string;
  idParqueadero: number | null;
  nombreParqueadero?: string;
  idCanal: number;
  nombreCanal?: string;
  idUsuarioEntrega: number;
  nombreUsuarioEntrega?: string;
  registroSalida: string;
  numeroTicket: string | null;
  fechaAsignacion: string;
  estadoAsignacion: EstadoAsignacion;
  fechaModificacion?: string | null;
}

export interface Movimiento {
  idHistorial: number;
  idActivo: number;
  codigoActivo?: string;
  serial?: string;
  idSalida?: number;
  codigoSalida?: string;
  estadoActivoSalida?: string;
  observaciones?: string;
  tipoMovimiento: TipoMovimiento;
  fechaMovimiento: string;
  idUsuarioEntrega?: number;
  nombreUsuarioEntrega?: string;
  idAsignacion?: number;
  nombreUsuarioAsignado?: string;
  registroSalidaAsignacion?: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
  fechaCreacion: string;
  fechaModificacion?: string | null;
  creadoPor?: number;
  modificadoPor?: number;
}

export interface AuthUser {
  idUsuario: number;
  nombre: string;
  correo: string;
  role: RoleKey;
  idSede: number;
  idRol: number;
}

export interface ApiResponse<T> {
  exito: boolean;
  data: T;
  mensaje: string | null;
}
