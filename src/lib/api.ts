import type { ApiResponse } from "./types";

const RAW_API_URL = import.meta.env.VITE_API_URL as string | undefined;
const TOKEN_KEY = "sicot.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const enumValues = {
  EstadoGenerico: ["Activo", "Inactivo"] as const,
  EstadoActivo: ["Disponible", "Asignado", "EnMantenimiento", "DadoDeBaja"] as const,
  EstadoAsignacion: ["Activa", "Finalizada"] as const,
  TipoMovimiento: ["Entrada", "Salida", "Asignacion", "Devolucion"] as const,
};

function mapEnum<T extends string>(value: unknown, values: readonly T[]): T {
  if (typeof value === "number" && value >= 0 && value < values.length) return values[value];
  if (typeof value === "string") {
    const match = values.find((v) => v.toLowerCase() === value.toLowerCase());
    if (match) return match;
    const idx = Number(value);
    if (!isNaN(idx) && idx >= 0 && idx < values.length) return values[idx];
  }
  return value as T;
}

function deepMapEnums(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(deepMapEnums);
  if (typeof obj !== "object") return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    let mapped = deepMapEnums(value);
    if (key === "estado" || key === "estadoUsuario") {
      mapped = mapEnum(mapped, enumValues.EstadoGenerico);
    } else if (key === "estadoActivo") {
      mapped = mapEnum(mapped, enumValues.EstadoActivo);
    } else if (key === "estadoAsignacion") {
      mapped = mapEnum(mapped, enumValues.EstadoAsignacion);
    } else if (key === "tipoMovimiento") {
      mapped = mapEnum(mapped, enumValues.TipoMovimiento);
    } else if (key === "tipo") {
      if (typeof mapped === "number") {
        const tipos = ["super_admin", "coordinador", "agente_soporte"] as const;
        mapped = mapEnum(mapped, tipos);
      }
    }
    result[key] = mapped;
  }
  return result;
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  if (!RAW_API_URL) {
    throw new ApiError(
      "VITE_API_URL no configurada. Crea un archivo .env en la raíz con: VITE_API_URL=http://localhost:5176",
      0,
    );
  }
  const API_URL = RAW_API_URL.replace(/\/+$/, "");
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (res.status === 204) return undefined as T;
  const body = await res.json();
  if (!res.ok) {
    const msg = body?.mensaje ?? body?.detail ?? body?.title ?? res.statusText;
    throw new ApiError(msg, res.status);
  }
  const response = body as ApiResponse<T>;
  if (response.exito === true) {
    return deepMapEnums(response.data) as T;
  }
  throw new ApiError(response.mensaje ?? "Error desconocido", res.status);
}
