import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import { stores } from "@/lib/store";
import type { Movimiento } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/movimientos")({
  head: () => ({ meta: [{ title: "Movimientos — SICOT" }] }),
  component: Page,
});

const tipoTint: Record<string, string> = {
  Entrada: "bg-success/15 text-success border-success/30",
  Salida: "bg-warning/15 text-warning border-warning/30",
  Asignacion: "bg-primary/15 text-primary border-primary/30",
  Devolucion: "bg-accent/40 text-accent-foreground border-accent",
};

function Page() {
  const activos = stores.activos.list();
  return (
    <ResourcePage<Movimiento>
      title="Movimientos"
      subtitle="Trazabilidad de entradas, salidas y asignaciones"
      resource={stores.movimientos}
      idKey="idMovimiento"
      singular="movimiento"
      searchKeys={["observaciones", "tipo"]}
      defaultValues={{ fecha: new Date().toISOString().slice(0, 10), tipo: "Entrada" }}
      columns={[
        { header: "Fecha", key: "fecha" },
        {
          header: "Tipo",
          render: (m) => (
            <Badge variant="outline" className={tipoTint[m.tipo]}>
              {m.tipo}
            </Badge>
          ),
        },
        {
          header: "Activo",
          render: (m) => {
            const a = activos.find((x) => x.idActivo === m.idActivo);
            return a ? `${a.serial} — ${a.marca} ${a.modelo}` : `#${m.idActivo}`;
          },
        },
        { header: "Observaciones", key: "observaciones" },
      ]}
      fields={[
        {
          key: "idActivo",
          label: "Activo",
          type: "select",
          required: true,
          options: activos.map((a) => ({ value: a.idActivo, label: `${a.serial} — ${a.marca} ${a.modelo}` })),
        },
        {
          key: "tipo",
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
        { key: "fecha", label: "Fecha", type: "date", required: true },
        { key: "observaciones", label: "Observaciones", type: "textarea" },
      ]}
    />
  );
}
