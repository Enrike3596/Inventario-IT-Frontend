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
