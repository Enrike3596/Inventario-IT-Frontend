import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { apiFetch, apiFetchRaw, apiDownload } from "./api";
import { uploadFile as uploadFileService } from "./file-storage";
import { sendEmail as sendEmailService } from "./email";
import type {
  Role,
  Sede,
  Usuario,
  CategoriaActivo,
  Parqueadero,
  Remision,
  RemisionDetail,
  Activo,
  ItemRemision,
  DetalleItemRemision,
  Canal,
  Salida,
  AsignacionUsuario,
  Movimiento,
  FileUploadResponse,
  EmailRequest,
  ActaFirma,
  ActaFirmaPublic,
  FirmaRequest,
  Area,
  ReporteInventarioRequest,
  ReportePreviewResponse,
} from "./types";

// ---- Query key factories ----
export const keys = {
  roles: { all: ["roles"] as const },
  sedes: { all: ["sedes"] as const },
  usuarios: { all: ["usuarios"] as string[] },
  categorias: { all: ["categorias"] as const },
  parqueaderos: { all: ["parqueaderos"] as const },
  remisiones: {
    all: ["remisiones"] as const,
    detail: (id: number) => ["remisiones", id] as const,
  },
  itemsRemision: {
    all: ["itemsRemision"] as const,
    porRemision: (id: number) => ["itemsRemision", "remision", id] as const,
  },
  detallesItemRemision: {
    all: ["detallesItemRemision"] as const,
    porItem: (id: number) => ["detallesItemRemision", "item", id] as const,
  },
  activos: { all: ["activos"] as const },
  canales: { all: ["canales"] as const },
  salidas: { all: ["salidas"] as const },
  asignaciones: { all: ["asignaciones"] as const },
  movimientos: { all: ["movimientos"] as const },
  areas: { all: ["areas"] as const },
};

// ---- Generic hook factory ----
function useList<T>(key: readonly string[], url: string) {
  return useQuery<T[]>({ queryKey: key as string[], queryFn: () => apiFetch<T[]>(url) });
}

function useCreate<T>(key: readonly string[], url: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<T>) =>
      apiFetch<T>(url, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key as string[] });
    },
  });
}

function useUpdate<T>(key: readonly string[], url: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<T> }) =>
      apiFetch<T>(`${url}/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key as string[] });
    },
  });
}

function useDelete(key: readonly string[], url: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`${url}/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key as string[] });
    },
  });
}

// ---- Roles ----
export function useRoles() {
  return useList<Role>(keys.roles.all, "/api/Roles");
}
export function useCreateRol() {
  return useCreate<Role>(keys.roles.all, "/api/Roles");
}
export function useUpdateRol() {
  return useUpdate<Role>(keys.roles.all, "/api/Roles");
}
export function useDeleteRol() {
  return useDelete(keys.roles.all, "/api/Roles");
}

// ---- Sedes ----
export function useSedes() {
  return useList<Sede>(keys.sedes.all, "/api/Sedes");
}
export function useCreateSede() {
  return useCreate<Sede>(keys.sedes.all, "/api/Sedes");
}
export function useUpdateSede() {
  return useUpdate<Sede>(keys.sedes.all, "/api/Sedes");
}
export function useDeleteSede() {
  return useDelete(keys.sedes.all, "/api/Sedes");
}

// ---- Usuarios ----
export function useUsuarios() {
  return useList<Usuario>(keys.usuarios.all, "/api/Usuarios");
}
export function useCreateUsuario() {
  return useCreate<Usuario>(keys.usuarios.all, "/api/Usuarios");
}
export function useUpdateUsuario() {
  return useUpdate<Usuario>(keys.usuarios.all, "/api/Usuarios");
}
export function useDeleteUsuario() {
  return useDelete(keys.usuarios.all, "/api/Usuarios");
}

// ---- Categorías ----
export function useCategorias() {
  return useList<CategoriaActivo>(keys.categorias.all, "/api/CategoriasActivo");
}
export function useCreateCategoria() {
  return useCreate<CategoriaActivo>(keys.categorias.all, "/api/CategoriasActivo");
}
export function useUpdateCategoria() {
  return useUpdate<CategoriaActivo>(keys.categorias.all, "/api/CategoriasActivo");
}
export function useDeleteCategoria() {
  return useDelete(keys.categorias.all, "/api/CategoriasActivo");
}

// ---- Parqueaderos ----
export function useParqueaderos() {
  return useList<Parqueadero>(keys.parqueaderos.all, "/api/Parqueaderos");
}
export function useCreateParqueadero() {
  return useCreate<Parqueadero>(keys.parqueaderos.all, "/api/Parqueaderos");
}
export function useUpdateParqueadero() {
  return useUpdate<Parqueadero>(keys.parqueaderos.all, "/api/Parqueaderos");
}
export function useDeleteParqueadero() {
  return useDelete(keys.parqueaderos.all, "/api/Parqueaderos");
}

// ---- Remisiones ----
export function useRemisiones() {
  return useList<Remision>(keys.remisiones.all, "/api/Remisiones");
}
export function useRemisionDetail(id: number) {
  return useQuery<RemisionDetail>({
    queryKey: keys.remisiones.detail(id),
    queryFn: () => apiFetch<RemisionDetail>(`/api/Remisiones/${id}`),
    enabled: !!id,
  });
}
export function useCreateRemision() {
  return useCreate<Remision>(keys.remisiones.all, "/api/Remisiones");
}
export function useUpdateRemision() {
  return useUpdate<Remision>(keys.remisiones.all, "/api/Remisiones");
}
export function useDeleteRemision() {
  return useDelete(keys.remisiones.all, "/api/Remisiones");
}
export function useConfirmarIngreso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<Activo[]>(`/api/Remisiones/${id}/confirmar`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.remisiones.all as unknown as string[] });
      qc.invalidateQueries({ queryKey: keys.activos.all as unknown as string[] });
      qc.invalidateQueries({ queryKey: keys.itemsRemision.all as unknown as string[] });
    },
  });
}

// ---- Items de remisión ----
export function useItemsRemisionPorRemision(idRemision: number) {
  return useQuery<ItemRemision[]>({
    queryKey: keys.itemsRemision.porRemision(idRemision),
    queryFn: () => apiFetch<ItemRemision[]>(`/api/ItemsRemision/remision/${idRemision}`),
    enabled: !!idRemision,
  });
}
export function useCreateItemRemision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ItemRemision>) =>
      apiFetch<ItemRemision>("/api/ItemsRemision", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.itemsRemision.all as unknown as string[] });
      qc.invalidateQueries({ queryKey: keys.remisiones.all as unknown as string[] });
    },
  });
}
export function useDeleteItemRemision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/api/ItemsRemision/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.itemsRemision.all as unknown as string[] });
      qc.invalidateQueries({ queryKey: keys.remisiones.all as unknown as string[] });
    },
  });
}

// ---- Detalles de ItemRemision ----
export function useDetallesItemRemisionPorItem(idItemRemision: number) {
  return useQuery<DetalleItemRemision[]>({
    queryKey: keys.detallesItemRemision.porItem(idItemRemision),
    queryFn: () =>
      apiFetch<DetalleItemRemision[]>(`/api/DetallesItemRemision/item/${idItemRemision}`),
    enabled: !!idItemRemision,
  });
}
export function useCreateDetalleItemRemision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DetalleItemRemision>) =>
      apiFetch<DetalleItemRemision>("/api/DetallesItemRemision", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.detallesItemRemision.all as unknown as string[] });
      qc.invalidateQueries({ queryKey: keys.itemsRemision.all as unknown as string[] });
    },
  });
}
export function useCreateDetalleItemRemisionBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { idItemRemision: number; seriales: string[] }) =>
      apiFetch<DetalleItemRemision[]>("/api/DetallesItemRemision/batch", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.detallesItemRemision.all as unknown as string[] });
      qc.invalidateQueries({ queryKey: keys.itemsRemision.all as unknown as string[] });
    },
  });
}
export function useDeleteDetalleItemRemision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/api/DetallesItemRemision/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.detallesItemRemision.all as unknown as string[] });
      qc.invalidateQueries({ queryKey: keys.itemsRemision.all as unknown as string[] });
    },
  });
}

// ---- Activos ----
export function useActivos() {
  return useList<Activo>(keys.activos.all, "/api/Activos");
}
export function useCreateActivo() {
  return useCreate<Activo>(keys.activos.all, "/api/Activos");
}
export function useUpdateActivo() {
  return useUpdate<Activo>(keys.activos.all, "/api/Activos");
}
export function useDeleteActivo() {
  return useDelete(keys.activos.all, "/api/Activos");
}
export function useRegistrarRegresoReparacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, observaciones }: { id: number; observaciones: string }) =>
      apiFetch<Activo>(`/api/Activos/${id}/regreso-reparacion`, {
        method: "POST",
        body: JSON.stringify({ observaciones }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.activos.all as unknown as string[] });
      qc.invalidateQueries({ queryKey: keys.movimientos.all as unknown as string[] });
      qc.invalidateQueries({ queryKey: keys.salidas.all as unknown as string[] });
    },
  });
}

// ---- Canales ----
export function useCanales() {
  return useList<Canal>(keys.canales.all, "/api/Canales");
}
export function useCreateCanal() {
  return useCreate<Canal>(keys.canales.all, "/api/Canales");
}
export function useUpdateCanal() {
  return useUpdate<Canal>(keys.canales.all, "/api/Canales");
}
export function useDeleteCanal() {
  return useDelete(keys.canales.all, "/api/Canales");
}

// ---- Salidas ----
export function useSalidas() {
  return useList<Salida>(keys.salidas.all, "/api/Salidas");
}

function invalidateSalidaRelaciones(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: keys.salidas.all as unknown as string[] });
  qc.invalidateQueries({ queryKey: keys.activos.all as unknown as string[] });
  qc.invalidateQueries({ queryKey: keys.movimientos.all as unknown as string[] });
}

export function useCreateSalida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Salida>) =>
      apiFetch<Salida>("/api/Salidas", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => invalidateSalidaRelaciones(qc),
  });
}

export function useUpdateSalida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Salida> }) =>
      apiFetch<Salida>(`/api/Salidas/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => invalidateSalidaRelaciones(qc),
  });
}

export function useDeleteSalida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/Salidas/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateSalidaRelaciones(qc),
  });
}

// ---- Asignaciones ----
export function useAsignaciones() {
  return useList<AsignacionUsuario>(keys.asignaciones.all, "/api/AsignacionesUsuario");
}
export function useCreateAsignacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AsignacionUsuario>) =>
      apiFetch<AsignacionUsuario>("/api/AsignacionesUsuario", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.asignaciones.all as unknown as string[] });
      qc.invalidateQueries({ queryKey: keys.activos.all as unknown as string[] });
      qc.invalidateQueries({ queryKey: keys.movimientos.all as unknown as string[] });
    },
  });
}
export function useUpdateAsignacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AsignacionUsuario> }) =>
      apiFetch<AsignacionUsuario>(`/api/AsignacionesUsuario/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.asignaciones.all as unknown as string[] });
      qc.invalidateQueries({ queryKey: keys.activos.all as unknown as string[] });
      qc.invalidateQueries({ queryKey: keys.movimientos.all as unknown as string[] });
    },
  });
}
export function useAsignacionesPorActivo(idActivo: number | null) {
  return useQuery<AsignacionUsuario[]>({
    queryKey: [...keys.asignaciones.all, "activo", idActivo] as string[],
    queryFn: () => apiFetch<AsignacionUsuario[]>(`/api/AsignacionesUsuario/activo/${idActivo}`),
    enabled: !!idActivo,
  });
}

export function useDeleteAsignacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/api/AsignacionesUsuario/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.asignaciones.all as unknown as string[] });
      qc.invalidateQueries({ queryKey: keys.activos.all as unknown as string[] });
      qc.invalidateQueries({ queryKey: keys.movimientos.all as unknown as string[] });
    },
  });
}

// ---- Movimientos (HistorialActivo) ----
export function useMovimientos() {
  return useList<Movimiento>(keys.movimientos.all, "/api/HistorialActivo");
}

export function useMovimientosPorActivo(idActivo: number | null) {
  return useQuery<Movimiento[]>({
    queryKey: [...keys.movimientos.all, "activo", idActivo] as string[],
    queryFn: () => apiFetch<Movimiento[]>(`/api/HistorialActivo/activo/${idActivo}`),
    enabled: !!idActivo,
  });
}

// ---- Areas ----
export function useAreas() {
  return useList<Area>(keys.areas.all, "/api/Area");
}
export function useCreateArea() {
  return useCreate<Area>(keys.areas.all, "/api/Area");
}
export function useUpdateArea() {
  return useUpdate<Area>(keys.areas.all, "/api/Area");
}
export function useDeleteArea() {
  return useDelete(keys.areas.all, "/api/Area");
}

// ---- File Storage ----
export function useUploadFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ container, file }: { container: string; file: File }) =>
      uploadFileService(container, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["archivos"] as string[] });
    },
  });
}

// ---- Email ----
export function useSendEmail() {
  return useMutation({
    mutationFn: (msg: EmailRequest) => sendEmailService(msg),
  });
}

// ---- Actas / Firma Electrónica ----
const actaKeys = {
  porDestino: (tipo: string, id: number) => ["acta", tipo, String(id)] as string[],
  publica: (token: string) => ["acta", "public", token] as string[],
};

export function useGenerarActa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { tipoDestino: string; idDestino: number }) =>
      apiFetch<ActaFirma>("/api/Actas/generar", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acta"] as string[] });
    },
  });
}

export function useEnviarActa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { tipoDestino: string; idDestino: number }) =>
      apiFetch<ActaFirma>("/api/Actas/enviar", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acta"] as string[] });
    },
  });
}

export function useActaPorDestino(tipo: string | null, idDestino: number | null) {
  return useQuery<ActaFirma>({
    queryKey: actaKeys.porDestino(tipo ?? "", idDestino ?? 0),
    queryFn: () => apiFetch<ActaFirma>(`/api/Actas/destino?tipo=${tipo}&id=${idDestino}`),
    enabled: !!tipo && !!idDestino,
    retry: false,
  });
}

export function useEliminarActa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { tipoDestino: string; idDestino: number }) =>
      apiFetch(`/api/Actas/destino?tipo=${payload.tipoDestino}&id=${payload.idDestino}`, {
        method: "DELETE",
      }),
    onSuccess: (_data, payload) => {
      qc.removeQueries({ queryKey: ["acta", payload.tipoDestino, String(payload.idDestino)] });
      qc.invalidateQueries({ queryKey: ["acta"] as string[] });
    },
  });
}

export function useActaPublica(token: string) {
  return useQuery<ActaFirmaPublic>({
    queryKey: actaKeys.publica(token),
    queryFn: () => apiFetch<ActaFirmaPublic>(`/api/Actas/firmar/${token}`),
    enabled: !!token,
  });
}

export function useFirmarActa() {
  return useMutation({
    mutationFn: ({ token, data }: { token: string; data: FirmaRequest }) =>
      apiFetch<ActaFirma>(`/api/Actas/firmar/${token}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

// ---- Informes de inventario ----
export const REPORTE_COLUMNAS: { key: string; label: string }[] = [
  { key: "codigoActivo", label: "Código activo" },
  { key: "serial", label: "Serial" },
  { key: "marca", label: "Marca" },
  { key: "modelo", label: "Modelo" },
  { key: "categoria", label: "Categoría" },
  { key: "estado", label: "Estado" },
  { key: "fechaAdquisicion", label: "Fecha adquisición" },
  { key: "fechaBaja", label: "Fecha baja" },
  { key: "numeroRemision", label: "N° remisión" },
  { key: "proveedor", label: "Proveedor" },
  { key: "fechaCompra", label: "Fecha compra" },
  { key: "responsable", label: "Responsable" },
  { key: "area", label: "Área" },
  { key: "sede", label: "Sede" },
  { key: "observaciones", label: "Observaciones" },
];

export const REPORTE_ESTADOS = [
  "Disponible",
  "Asignado",
  "EnReparacion",
  "DadoDeBaja",
  "Venta",
] as const;

export function useReportePreview(request: ReporteInventarioRequest | null) {
  return useQuery<ReportePreviewResponse>({
    queryKey: ["reportes", "preview", JSON.stringify(request)],
    queryFn: () =>
      apiFetchRaw<ReportePreviewResponse>("/api/reportes/preview", {
        method: "POST",
        body: JSON.stringify(request),
      }),
    enabled: !!request,
    retry: false,
  });
}

export function useExportarReporte() {
  return useMutation({
    mutationFn: ({
      request,
      formato,
    }: {
      request: ReporteInventarioRequest;
      formato: "pdf" | "excel";
    }) =>
      apiDownload(
        `/api/reportes/exportar?formato=${formato}`,
        { method: "POST", body: JSON.stringify(request) },
        `informe-inventario-${formato}`,
      ),
  });
}
