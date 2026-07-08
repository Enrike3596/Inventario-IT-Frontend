import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — Indigo" },
      { name: "description", content: "Acceso al sistema de inventario TI." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Sesión iniciada");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-brand text-primary-foreground">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_70%,var(--brand-teal),transparent_50%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/15 backdrop-blur grid place-items-center font-display font-bold">
              S
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">Indigo</span>
          </div>
        </div>
        <div className="relative z-10 max-w-lg">
          <h1 className="font-display text-4xl xl:text-5xl font-bold leading-tight">
            Control total de tu inventario TI.
          </h1>
          <p className="mt-4 text-white/85 text-lg">
            Activos, asignaciones, órdenes de compra y movimientos operativos en una sola plataforma
            corporativa.
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm text-white/80">
            <ShieldCheck className="h-5 w-5" />
            <span>Acceso con roles: Super Admin · Coordinador · Agente Soporte TI</span>
          </div>
        </div>
        <p className="relative z-10 text-xs text-white/70">
          © {new Date().getFullYear()} Indigo · Sistema Corporativo de Inventario TI
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <Card className="w-full max-w-md border-border/60 shadow-elegant">
          <CardContent className="p-8">
            <div className="mb-8">
              <h2 className="font-display text-2xl font-semibold">Iniciar sesión</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Accede con tus credenciales corporativas.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" variant="brand" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                Ingresar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
