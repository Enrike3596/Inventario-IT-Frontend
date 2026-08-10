import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { Activity, Box, Cpu, TrendingUp, Users, Layers, Hash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  useActivos,
  useUsuarios,
  useAsignaciones,
  useMovimientos,
  useCanales,
} from "@/lib/queries";
import type { Activo } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Indigo" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: activos } = useActivos();
  const { data: usuarios } = useUsuarios();
  const { data: asignaciones } = useAsignaciones();
  const { data: movimientos } = useMovimientos();
  const { data: canales } = useCanales();

  const activoAsignadoIds = useMemo(
    () =>
      new Set(
        (asignaciones ?? []).filter((a) => a.estadoAsignacion === "Activa").map((a) => a.idActivo),
      ),
    [asignaciones],
  );

  const estadoEfectivo = useCallback(
    (a: Activo): string =>
      a.estadoActivo === "Disponible" && activoAsignadoIds.has(a.idActivo)
        ? "Asignado"
        : a.estadoActivo,
    [activoAsignadoIds],
  );

  const disponibles = (activos ?? []).filter((a) => estadoEfectivo(a) === "Disponible").length;
  const asignados = (activos ?? []).filter((a) => estadoEfectivo(a) === "Asignado").length;
  const mantenimiento = (activos ?? []).filter((a) => a.estadoActivo === "EnReparacion").length;
  const baja = (activos ?? []).filter((a) => a.estadoActivo === "DadoDeBaja").length;
  const venta = (activos ?? []).filter((a) => a.estadoActivo === "Venta").length;

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

  const activosPorCategoria = (activos ?? []).reduce<Record<string, number>>((acc, a) => {
    const cat = a.nombreCategoria ?? "Sin categoría";
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});

  const asignacionesPorCanal = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of asignaciones ?? []) {
      const canal = a.nombreCanal ?? "Sin canal";
      map[canal] = (map[canal] ?? 0) + 1;
    }
    for (const c of canales ?? []) {
      if (!(c.nombre in map)) map[c.nombre] = 0;
    }
    return map;
  }, [asignaciones, canales]);

  const canalesList = useMemo(
    () =>
      Object.entries(asignacionesPorCanal)
        .map(([nombre, count]) => ({ nombre, count }))
        .sort((a, b) => b.count - a.count),
    [asignacionesPorCanal],
  );
  const topCanal: [string, number] | undefined = canalesList[0]
    ? [canalesList[0].nombre, canalesList[0].count]
    : undefined;
  const totalAsignaciones = canalesList.reduce((s, c) => s + c.count, 0);

  return (
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

      <section className="grid grid-cols-1 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Estado de los activos</h2>
                <p className="text-xs text-muted-foreground">Distribución actual del inventario</p>
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
              <StatusBar
                label="Venta"
                value={venta}
                total={(activos ?? []).length}
                color="var(--muted-foreground)"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Activos por categoría</h2>
            </div>
            {Object.keys(activosPorCategoria).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin activos registrados.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(activosPorCategoria)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, count]) => {
                    const total = (activos ?? []).length;
                    const pct = total === 0 ? 0 : Math.round((count / total) * 100);
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between text-sm">
                          <span>{cat}</span>
                          <span className="text-muted-foreground">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Hash className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Canal con más asignaciones</h2>
            </div>
            {!topCanal && (canales ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin canales registrados.</p>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <p className="text-3xl font-display font-bold text-gradient-brand">
                  {topCanal ? topCanal[0] : "—"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {topCanal && topCanal[1] > 0
                    ? `${topCanal[1]} asignación${topCanal[1] !== 1 ? "es" : ""}`
                    : "Sin asignaciones"}
                </p>
                {canalesList.length > 0 && (
                  <div className="w-full mt-6 space-y-2">
                    {canalesList.map(({ nombre, count }) => {
                      const total = totalAsignaciones;
                      const pct = total === 0 ? 0 : Math.round((count / total) * 100);
                      return (
                        <div key={nombre}>
                          <div className="flex items-center justify-between text-sm">
                            <span>{nombre}</span>
                            <span className="text-muted-foreground">
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-brand-purple transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
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
