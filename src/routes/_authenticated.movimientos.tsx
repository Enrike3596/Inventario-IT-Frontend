import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useMovimientos, useActivos } from "@/lib/queries";
import type { Movimiento } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/movimientos")({
  head: () => ({ meta: [{ title: "Movimientos — Indigo" }] }),
  component: Page,
});

const tipoTint: Record<string, string> = {
  Entrada: "bg-success/15 text-success border-success/30",
  Asignacion: "bg-primary/15 text-primary border-primary/30",
  Devolucion: "bg-accent/40 text-accent-foreground border-accent",
  Reparacion: "bg-warning/15 text-warning border-warning/30",
  Baja: "bg-destructive/15 text-destructive border-destructive/30",
};

const tipoLabels: Record<string, string> = {
  Entrada: "Ingreso",
  Salida: "Salida",
  Asignacion: "Asignación",
  Devolucion: "Devolución",
  Reparacion: "Reparación",
  Baja: "Baja",
};

const salidaEstadoLabels: Record<string, string> = {
  EnReparacion: "En reparación",
  DadoDeBaja: "Dado de baja",
  Venta: "Venta",
};

const salidaEstadoTint: Record<string, string> = {
  EnReparacion: "bg-warning/15 text-warning border-warning/30",
  DadoDeBaja: "bg-destructive/15 text-destructive border-destructive/30",
  Venta: "bg-muted/50 text-muted-foreground border-border",
};

const TIPOS_MOVIMIENTO = ["Entrada", "Salida", "Asignacion", "Devolucion", "Reparacion", "Baja"] as const;

function Page() {
  const { data: movimientos, isLoading } = useMovimientos();
  const { data: activos } = useActivos();

  const [tipoFilter, setTipoFilter] = useState("all");

  const filterFn = useMemo(() => {
    if (tipoFilter === "all") return undefined;
    return (item: Movimiento) => item.tipoMovimiento === tipoFilter;
  }, [tipoFilter]);

  return (
    <ResourcePage<Movimiento>
      title="Movimientos"
      subtitle="Trazabilidad de entradas, salidas y asignaciones"
      data={movimientos ?? []}
      isLoading={isLoading}
      idKey="idHistorial"
      singular="movimiento"
      searchKeys={["tipoMovimiento"]}
      filterFn={filterFn}
      filters={
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Tipo:</span>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {TIPOS_MOVIMIENTO.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
      defaultValues={{}}
      columns={[
        { header: "Fecha", render: (m) => new Date(m.fechaMovimiento).toLocaleDateString("es-CO") },
        {
          header: "Tipo",
          render: (m) => {
            if (m.tipoMovimiento === "Salida" && m.estadoActivoSalida) {
              return (
                <Badge variant="outline" className={salidaEstadoTint[m.estadoActivoSalida]}>
                  {salidaEstadoLabels[m.estadoActivoSalida] ?? m.estadoActivoSalida}
                </Badge>
              );
            }
            return (
              <Badge variant="outline" className={tipoTint[m.tipoMovimiento]}>
                {tipoLabels[m.tipoMovimiento] ?? m.tipoMovimiento}
              </Badge>
            );
          },
        },
        {
          header: "Activo",
          render: (m) => {
            const a = (activos ?? []).find((x) => x.idActivo === m.idActivo);
            return a ? `${a.serial} — ${a.marca} ${a.modelo}` : `#${m.idActivo}`;
          },
        },
        {
          header: "Detalle",
          render: (m) => {
            if (m.tipoMovimiento === "Asignacion")
              return m.nombreUsuarioAsignado
                ? `Asignado a ${m.nombreUsuarioAsignado}`
                : m.nombreUsuarioEntrega
                  ? `Asignado (entregado por ${m.nombreUsuarioEntrega})`
                  : "Asignado";
            if (m.tipoMovimiento === "Devolucion")
              return m.nombreUsuarioAsignado
                ? `Devuelto por ${m.nombreUsuarioAsignado}`
                : "Devuelto";
            if (m.tipoMovimiento === "Salida" && m.codigoSalida)
              return `Salida ${m.codigoSalida}${m.observaciones ? ` — ${m.observaciones}` : ""}`;
            if (m.tipoMovimiento === "Reparacion")
              return m.observaciones ?? "Enviado a reparación";
            if (m.tipoMovimiento === "Baja")
              return m.observaciones ?? "Dado de baja";
            return m.observaciones ?? "—";
          },
          className: "max-w-xs truncate",
        },
        { header: "Serial", render: (m) => m.serial ?? "—", showOnlyInView: true },
      ]}
      fields={[
        {
          key: "idActivo",
          label: "Activo",
          type: "select",
          required: true,
          options: (activos ?? []).map((a) => ({
            value: a.idActivo,
            label: `${a.serial} — ${a.marca} ${a.modelo}`,
          })),
        },
        {
          key: "tipoMovimiento",
          label: "Tipo",
          type: "select",
          required: true,
          options: [
            { value: "Entrada", label: "Entrada" },
            { value: "Salida", label: "Salida" },
            { value: "Asignacion", label: "Asignación" },
            { value: "Devolucion", label: "Devolución" },
          ],
        },
      ]}
      onCreate={async () => {}}
      onUpdate={async () => {}}
      onDelete={async () => {}}
    />
  );
}
