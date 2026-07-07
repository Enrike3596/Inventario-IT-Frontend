import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";
import type {
  Role,
  Sede,
  Usuario,
  CategoriaActivo,
  Parqueadero,
  OrdenCompra,
  OrdenCompraDetail,
  Activo,
  ItemOC,
  DetalleItemOC,
  Canal,
  Salida,
  AsignacionUsuario,
  Movimiento,
} from "./types";

// ---- Query key factories ----
export const keys = {
  roles: { all: ["roles"] as const },
  sedes: { all: ["sedes"] as const },
  usuarios: { all: ["usuarios"] as string[] },
  categorias: { all: ["categorias"] as const },
  parqueaderos: { all: ["parqueaderos"] as const },
  ordenes: { all: ["ordenes"] as const, detail: (id: number) => ["ordenes", id] as const },
  itemsOC: { all: ["itemsOC"] as const, porOrden: (id: number) => ["itemsOC", "orden", id] as const },
  detallesItemOC: { all: ["detallesItemOC"] as const, porItem: (id: number) => ["detallesItemOC", "item", id] as const },
  activos: { all: ["activos"] as const },
  canales: { all: ["canales"] as const },
  salidas: { all: ["salidas"] as const },
  asignaciones: { all: ["asignaciones"] as const },
  movimientos: { all: ["movimientos"] as const },
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

// ---- Órdenes de compra ----
export function useOrdenesCompra() {
  return useList<OrdenCompra>(keys.ordenes.all, "/api/OrdenesCompra");
}
export function useOrdenCompraDetail(id: number) {
  return useQuery<OrdenCompraDetail>({
    queryKey: keys.ordenes.detail(id),
    queryFn: () => apiFetch<OrdenCompraDetail>(`/api/OrdenesCompra/${id}`),
    enabled: !!id,
  });
}
export function useCreateOrdenCompra() {
  return useCreate<OrdenCompra>(keys.ordenes.all, "/api/OrdenesCompra");
}
export function useUpdateOrdenCompra() {
  return useUpdate<OrdenCompra>(keys.ordenes.all, "/api/OrdenesCompra");
}
export function useDeleteOrdenCompra() {
  return useDelete(keys.ordenes.all, "/api/OrdenesCompra");
}
export function useConfirmarIngreso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<Activo[]>(`/api/OrdenesCompra/${id}/confirmar`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.ordenes.all as unknown as string[] });
      qc.invalidateQueries({ queryKey: keys.activos.all as unknown as string[] });
      qc.invalidateQueries({ queryKey: keys.itemsOC.all as unknown as string[] });
    },
  });
}

// ---- Items de OC ----
export function useItemsOCPorOrden(idOrden: number) {
  return useQuery<ItemOC[]>({
    queryKey: keys.itemsOC.porOrden(idOrden),
    queryFn: () => apiFetch<ItemOC[]>(`/api/ItemsOC/orden/${idOrden}`),
    enabled: !!idOrden,
  });
}
export function useCreateItemOC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ItemOC>) =>
      apiFetch<ItemOC>("/api/ItemsOC", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.itemsOC.all as unknown as string[] });
      qc.invalidateQueries({ queryKey: keys.ordenes.all as unknown as string[] });
    },
  });
}
export function useDeleteItemOC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/ItemsOC/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.itemsOC.all as unknown as string[] });
      qc.invalidateQueries({ queryKey: keys.ordenes.all as unknown as string[] });
    },
  });
}

// ---- Detalles de Item OC ----
export function useDetallesItemOCPorItem(idItemOC: number) {
  return useQuery<DetalleItemOC[]>({
    queryKey: keys.detallesItemOC.porItem(idItemOC),
    queryFn: () => apiFetch<DetalleItemOC[]>(`/api/DetallesItemOC/item/${idItemOC}`),
    enabled: !!idItemOC,
  });
}
export function useCreateDetalleItemOC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DetalleItemOC>) =>
      apiFetch<DetalleItemOC>("/api/DetallesItemOC", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.detallesItemOC.all as unknown as string[] });
      qc.invalidateQueries({ queryKey: keys.itemsOC.all as unknown as string[] });
    },
  });
}
export function useCreateDetalleItemOCBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { idItemOC: number; seriales: string[] }) =>
      apiFetch<DetalleItemOC[]>("/api/DetallesItemOC/batch", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.detallesItemOC.all as unknown as string[] });
      qc.invalidateQueries({ queryKey: keys.itemsOC.all as unknown as string[] });
    },
  });
}
export function useDeleteDetalleItemOC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/DetallesItemOC/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.detallesItemOC.all as unknown as string[] });
      qc.invalidateQueries({ queryKey: keys.itemsOC.all as unknown as string[] });
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
export function useCreateSalida() {
  return useCreate<Salida>(keys.salidas.all, "/api/Salidas");
}
export function useUpdateSalida() {
  return useUpdate<Salida>(keys.salidas.all, "/api/Salidas");
}
export function useDeleteSalida() {
  return useDelete(keys.salidas.all, "/api/Salidas");
}

// ---- Asignaciones ----
export function useAsignaciones() {
  return useList<AsignacionUsuario>(keys.asignaciones.all, "/api/AsignacionesUsuario");
}
export function useCreateAsignacion() {
  return useCreate<AsignacionUsuario>(keys.asignaciones.all, "/api/AsignacionesUsuario");
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
    },
  });
}
export function useDeleteAsignacion() {
  return useDelete(keys.asignaciones.all, "/api/AsignacionesUsuario");
}

// ---- Movimientos (HistorialActivo) ----
export function useMovimientos() {
  return useList<Movimiento>(keys.movimientos.all, "/api/HistorialActivo");
}
