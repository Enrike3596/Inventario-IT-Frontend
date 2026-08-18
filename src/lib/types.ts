// Domain types matching the .NET response DTOs (camelCase JSON).

export type EstadoGenerico = "Activo" | "Inactivo";
export type EstadoActivo = "Disponible" | "Asignado" | "EnReparacion" | "DadoDeBaja" | "Venta";
export type EstadoAsignacion = "Activa" | "Finalizada";
export type TipoMovimiento =
  "Entrada" | "Salida" | "Asignacion" | "Devolucion" | "Reparacion" | "Baja";

export type RoleKey = "super_admin" | "coordinador" | "agente_soporte" | "auditor" | "usuario";

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
  idArea?: number | null;
  nombreArea?: string | null;
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

export interface Area {
  idArea: number;
  nombreArea: string;
  estado: boolean;
  fechaCreacion: string;
  fechaModificacion?: string | null;
  creadoPor?: number;
  modificadoPor?: number;
}

export interface Parqueadero {
  idParqueadero: number;
  da: string;
  nombre: string;
  ubicacion: string;
  estado: EstadoGenerico;
}

export interface CategoriaActivo {
  idCategoria: number;
  nombre: string;
  estado: EstadoGenerico;
}

export interface DetalleItemRemision {
  idDetalleItemRemision: number;
  idItemRemision: number;
  serial: string;
  procesado: boolean;
  idActivo: number | null;
  codigoActivo?: string;
  observaciones: string | null;
}

export interface ItemRemision {
  idItemRemision: number;
  idRemision: number;
  idCategoria: number;
  nombreCategoria?: string;
  marca: string;
  modelo: string;
  cantidadEsperada: number;
  cantidadIngresada: number;
  detallesItem: DetalleItemRemision[];
}

export interface Remision {
  idRemision: number;
  numeroRemision: string;
  proveedor: string;
  fechaCompra: string;
  rutaDocumento?: string | null;
  nombreDocumento?: string | null;
  itemsRemision?: ItemRemision[];
}

export interface RemisionDetail {
  idRemision: number;
  numeroRemision: string;
  proveedor: string;
  fechaCompra: string;
  rutaDocumento?: string | null;
  nombreDocumento?: string | null;
  itemsRemision: ItemRemision[];
}

export interface DocumentoRemision {
  rutaDocumento: string;
  nombreDocumento: string;
}

export interface Activo {
  idActivo: number;
  idCategoria: number;
  nombreCategoria?: string;
  idRemision: number;
  numeroRemision?: string;
  idItemRemision?: number;
  idDetalleItemRemision?: number;
  codigoActivo: string;
  serial: string;
  marca: string;
  modelo: string;
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
  motivoEdicion?: string | null;
  formaEntregaDevolucion?: string | null;
  estadoDevolucion?: string | null;
  observacionDevolucion?: string | null;
}

export interface DevolucionAsignacion {
  motivoEdicion: string;
  formaEntregaDevolucion: string;
  estadoDevolucion: string;
  observacionDevolucion?: string;
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
  nombreCanal?: string;
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

export interface FileUploadResponse {
  relativePath: string;
  url: string;
}

export interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

export type EstadoActa = "Pendiente" | "Enviada" | "Firmada" | "Vencida";

export interface ActaActivo {
  idActivo: number;
  codigoActivo: string | null;
  serial: string | null;
  marca: string | null;
  modelo: string | null;
  nombreCategoria: string | null;
}

export interface ActaFirma {
  idActa: number;
  rutaPdf: string | null;
  urlPdf: string | null;
  token: string;
  estado: EstadoActa;
  fechaGeneracion: string;
  fechaEnvio: string | null;
  fechaFirma: string | null;
  fechaVencimiento: string;
  nombreFirmante: string | null;
  documentoFirmante: string | null;
  ipFirma: string | null;
  tipoDestino: string;
  idDestino: number;
  nombreDestino: string | null;
  activos: ActaActivo[];
}

export interface ActaFirmaPublic {
  idActa: number;
  token: string;
  estado: EstadoActa;
  yaFirmada: boolean;
  fechaFirma: string | null;
  nombreFirmante: string | null;
  tipoDestino: string;
  idDestino: number;
  nombreDestino: string | null;
  nombreUsuarioEntrega: string | null;
  fechaAsignacion: string;
  registroSalida: string;
  activos: ActaActivo[];
}

export interface FirmaRequest {
  nombre: string;
  documento: string;
}

export interface FiltrosInventario {
  categoria?: string[];
  estado?: string[];
  sede?: string[];
  area?: string[];
  responsableId?: number[];
  fechaAdquisicionDesde?: string | null;
  fechaAdquisicionHasta?: string | null;
  proveedor?: string | null;
  numeroRemision?: string | null;
}

export interface ReporteInventarioRequest {
  columnas: string[];
  filtros?: FiltrosInventario | null;
  agrupadoPor?: string | null;
  ordenadoPor?: string | null;
  ordenDescendente?: boolean;
  paginaPreview?: number;
  tamPaginaPreview?: number;
}

export interface ReportePreviewResponse {
  columnas: string[];
  filas: Record<string, string | number | null>[];
  totalRegistros: number;
  paginaActual: number;
  totalPaginas: number;
}
