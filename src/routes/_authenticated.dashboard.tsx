import { createFileRoute } from "@tanstack/react-router";
import { Activity, Box, Cpu, ShieldCheck, TrendingUp, Users, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useActivos, useUsuarios, useAsignaciones, useMovimientos } from "@/lib/queries";
import { useAuth, ROLE_LABEL } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Indigo" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: activos } = useActivos();
  const { data: usuarios } = useUsuarios();
  const { data: asignaciones } = useAsignaciones();
  const { data: movimientos } = useMovimientos();
  const { user } = useAuth();

  const disponibles = (activos ?? []).filter((a) => a.estadoActivo === "Disponible").length;
  const asignados = (activos ?? []).filter((a) => a.estadoActivo === "Asignado").length;
  const mantenimiento = (activos ?? []).filter((a) => a.estadoActivo === "EnMantenimiento").length;
  const baja = (activos ?? []).filter((a) => a.estadoActivo === "DadoDeBaja").length;

  const stats = [
    {
      label: "Activos totales",
      value: (activos ?? []).length,
      icon: Cpu,
      tint: "from-brand-purple to-brand-magenta",
    },
    {
      label: "Asignaciones activas",
      value: (asignaciones ?? []).filter((a) => a.estadoAsignacion === "Activa").length,
      icon: Box,
      tint: "from-brand-navy to-brand-teal",
    },
    {
      label: "Usuarios registrados",
      value: (usuarios ?? []).length,
      icon: Users,
      tint: "from-brand-magenta to-brand-purple",
    },
    {
      label: "Movimientos",
      value: (movimientos ?? []).length,
      icon: Activity,
      tint: "from-brand-teal to-brand-navy",
    },
  ];

  const recent = [...(movimientos ?? [])].slice(-6).reverse();

  return (
    <>
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </p>
                    <p className="mt-2 font-display text-3xl font-bold">{s.value}</p>
                  </div>
                  <div
                    className={`h-10 w-10 rounded-lg grid place-items-center bg-gradient-to-br ${s.tint} text-white shadow-elegant`}
                  >
                    <s.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-lg font-semibold">Estado de los activos</h2>
                  <p className="text-xs text-muted-foreground">
                    Distribución actual del inventario
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-3">
                <StatusBar
                  label="Disponibles"
                  value={disponibles}
                  total={(activos ?? []).length}
                  color="var(--success)"
                />
                <StatusBar
                  label="Asignados"
                  value={asignados}
                  total={(activos ?? []).length}
                  color="var(--brand-purple)"
                />
                <StatusBar
                  label="En mantenimiento"
                  value={mantenimiento}
                  total={(activos ?? []).length}
                  color="var(--warning)"
                />
                <StatusBar
                  label="Dados de baja"
                  value={baja}
                  total={(activos ?? []).length}
                  color="var(--destructive)"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-semibold">Tu rol</h2>
              </div>
              <p className="text-2xl font-display font-semibold text-gradient-brand">
                {user ? ROLE_LABEL[user.role] : ""}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {user?.role === "super_admin" && "Acceso total al sistema incluyendo eliminación."}
                {user?.role === "coordinador" &&
                  "Puedes crear y editar. No tienes permiso de eliminación."}
                {user?.role === "agente_soporte" &&
                  "Puedes crear y editar. No tienes permiso de eliminación."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">Ver</Badge>
                <Badge variant="secondary">Crear</Badge>
                <Badge variant="secondary">Editar</Badge>
                <Badge variant={user?.role === "super_admin" ? "default" : "outline"}>
                  Eliminar {user?.role !== "super_admin" && "✕"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardContent className="p-6">
              <h2 className="font-display text-lg font-semibold mb-4">Movimientos recientes</h2>
              {recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin movimientos recientes.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {recent.map((m) => (
                    <li key={m.idHistorial} className="py-3 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-md bg-muted grid place-items-center">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {m.tipoMovimiento} — Activo #{m.idActivo}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{m.serial ?? ""}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(m.fechaMovimiento).toLocaleDateString("es-CO")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}

function StatusBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {value} <span className="text-xs">({pct}%)</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
