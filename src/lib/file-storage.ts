import { apiFetch, apiUpload, getToken } from "./api";

const RAW_API_URL = import.meta.env.VITE_API_URL as string | undefined;
const API_URL = RAW_API_URL?.replace(/\/+$/, "");

export interface FileUploadResult {
  relativePath: string;
  url: string;
}

export async function uploadFile(container: string, file: File): Promise<FileUploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  const relativePath = await apiUpload<string>(
    `/api/Archivos/upload?container=${encodeURIComponent(container)}`,
    formData,
  );
  const url = `${API_URL}/api/Archivos/${relativePath.replace(/\\/g, "/")}`;
  return { relativePath, url };
}

export async function getFileUrl(relativePath: string): Promise<string | null> {
  return apiFetch<string | null>(`/api/Archivos/url?path=${encodeURIComponent(relativePath)}`);
}

export async function deleteFile(container: string, fileName: string): Promise<boolean> {
  return apiFetch<boolean>(
    `/api/Archivos/${encodeURIComponent(container)}/${encodeURIComponent(fileName)}`,
    {
      method: "DELETE",
    },
  );
}

export function buildFileUrl(relativePath: string): string {
  if (!relativePath) return "";
  return `${API_URL}/uploads/${relativePath.replace(/\\/g, "/")}`;
}

export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---- Documento de remisión ----

export interface DocumentoRemisionUpload {
  rutaDocumento: string;
  nombreDocumento: string;
}

export async function subirDocumentoRemision(file: File): Promise<DocumentoRemisionUpload> {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<DocumentoRemisionUpload>("/api/Remisiones/documento", formData);
}

export async function eliminarDocumentoRemisionTemporal(path: string): Promise<void> {
  await apiFetch(`/api/Remisiones/documento?path=${encodeURIComponent(path)}`, {
    method: "DELETE",
  });
}

export async function reemplazarDocumentoRemision(
  id: number,
  file: File,
): Promise<DocumentoRemisionUpload> {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<DocumentoRemisionUpload>(`/api/Remisiones/${id}/documento`, formData);
}

export async function eliminarDocumentoRemision(id: number): Promise<void> {
  await apiFetch(`/api/Remisiones/${id}/documento`, { method: "DELETE" });
}

export function buildDocumentoRemisionUrl(id: number): string {
  const token = getToken();
  const base = `${API_URL}/api/Remisiones/${id}/documento`;
  return token ? `${base}?access_token=${encodeURIComponent(token)}` : base;
}
