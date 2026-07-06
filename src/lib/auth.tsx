import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, IS_MOCK, setToken } from "./api";
import { stores } from "./store";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(readStored());
    setLoading(false);
  }, []);

  const persist = (u: AuthUser | null) => {
    setUser(u);
    if (typeof window !== "undefined") {
      if (u) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login: AuthState["login"] = async (email, password) => {
    if (IS_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      const found = stores.usuarios.list().find(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      );
      if (!found) throw new Error("Credenciales inválidas");
      if (password.length < 4) throw new Error("Credenciales inválidas");
      const role = stores.roles.list().find((r) => r.idRol === found.idRol);
      const auth: AuthUser = {
        idUsuario: found.idUsuario,
        nombres: found.nombres,
        apellidos: found.apellidos,
        email: found.email,
        role: (role?.tipo ?? "agente_soporte") as RoleKey,
        idSede: found.idSede,
      };
      setToken(`mock-token-${found.idUsuario}`);
      persist(auth);
      return;
    }
    const res = await apiFetch<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(res.token);
    persist(res.user);
  };

  const logout = () => {
    setToken(null);
    persist(null);
  };

  const forgotPassword: AuthState["forgotPassword"] = async (email) => {
    if (IS_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      return;
    }
    await apiFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  };

  const resetPassword: AuthState["resetPassword"] = async (token, password) => {
    if (IS_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      return;
    }
    await apiFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
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
