import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, setToken, getToken } from "./api";
import type { AuthUser, RoleKey } from "./types";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  can: (action: "view" | "create" | "edit" | "delete") => boolean;
}

const STORAGE_KEY = "sicot.user";

const AuthContext = createContext<AuthState | null>(null);

function readStored(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

interface LoginResponse {
  token: string;
  expira: string;
  usuario: {
    idUsuario: number;
    idRol: number;
    nombreRol?: string;
    idSede: number;
    nombreSede?: string;
    nombre: string;
    correo: string;
    telefono: string;
    cargo: string;
    estadoUsuario: string;
    fechaCreacion: string;
  };
}

const ROLE_MAP: Record<string, RoleKey> = {
  super_admin: "super_admin",
  coordinador: "coordinador",
  agente_soporte: "agente_soporte",
};

function mapRole(nombreRol?: string): RoleKey {
  if (!nombreRol) return "agente_soporte";
  const lower = nombreRol.toLowerCase().replace(/\s+/g, "_");
  return ROLE_MAP[lower] ?? "agente_soporte";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = readStored();
    if (stored && getToken()) {
      apiFetch<LoginResponse["usuario"]>("/api/Auth/me")
        .then((data) => {
          const authUser: AuthUser = {
            idUsuario: data.idUsuario,
            nombre: data.nombre,
            correo: data.correo,
            role: mapRole(data.nombreRol),
            idSede: data.idSede,
            idRol: data.idRol,
          };
          persist(authUser);
        })
        .catch(() => {
          setToken(null);
          persist(null);
        })
        .finally(() => setLoading(false));
    } else {
      setUser(stored);
      setLoading(false);
    }
  }, []);

  const persist = (u: AuthUser | null) => {
    setUser(u);
    if (typeof window !== "undefined") {
      if (u) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login: AuthState["login"] = async (email, password) => {
    const res = await apiFetch<LoginResponse>("/api/Auth/login", {
      method: "POST",
      body: JSON.stringify({ correo: email, contraseña: password }),
    });
    setToken(res.token);
    const authUser: AuthUser = {
      idUsuario: res.usuario.idUsuario,
      nombre: res.usuario.nombre,
      correo: res.usuario.correo,
      role: mapRole(res.usuario.nombreRol),
      idSede: res.usuario.idSede,
      idRol: res.usuario.idRol,
    };
    persist(authUser);
  };

  const logout = () => {
    setToken(null);
    persist(null);
  };

  const forgotPassword: AuthState["forgotPassword"] = async (email) => {
    await apiFetch("/api/Auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ correo: email }),
    });
  };

  const resetPassword: AuthState["resetPassword"] = async (token, password) => {
    await apiFetch("/api/Auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, nuevaContrasena: password }),
    });
  };

  const can: AuthState["can"] = (action) => {
    if (!user) return false;
    if (user.role === "super_admin") return true;
    if (action === "delete") return false;
    return true;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, forgotPassword, resetPassword, can }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export const ROLE_LABEL: Record<RoleKey, string> = {
  super_admin: "Super Administrador",
  coordinador: "Coordinador",
  agente_soporte: "Agente Soporte TI",
};
