import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import { stores } from "@/lib/store";
import type { Activo } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/activos")({
  head: () => ({ meta: [{ title: "Activos TI — SICOT" }] }),
  component: ActivosPage,
});

const estadoTint: Record<string, string> = {
  Disponible: "bg-success/15 text-success border-success/30",
  Asignado: "bg-primary/15 text-primary border-primary/30",
  EnMantenimiento: "bg-warning/15 text-warning border-warning/30",
  DadoDeBaja: "bg-destructive/15 text-destructive border-destructive/30",
};

function ActivosPage() {
  const categorias = stores.categorias.list();
  const ordenes = stores.ordenes.list();

  return (
    <ResourcePage<Activo>
      title="Activos TI"
      subtitle="Inventario de equipos y dispositivos tecnológicos"
      resource={stores.activos}
      idKey="idActivo"
      singular="activo"
      searchKeys={["serial", "marca", "modelo", "descripcion"]}
      defaultValues={{ estado: "Disponible" }}
      columns={[
        { header: "Serial", key: "serial", className: "font-mono text-xs" },
        { header: "Marca", key: "marca" },
        { header: "Modelo", key: "modelo" },
        {
          header: "Categoría",
          render: (r) =>
            categorias.find((c) => c.idCategoria === r.idCategoria)?.nombre ?? "—",
        },
        {
          header: "Estado",
          render: (r) => (
            <Badge variant="outline" className={estadoTint[r.estado]}>
              {r.estado}
            </Badge>
          ),
        },
      ]}
      fields={[
        { key: "serial", label: "Serial", type: "text", required: true },
        { key: "marca", label: "Marca", type: "text", required: true },
        { key: "modelo", label: "Modelo", type: "text", required: true },
        { key: "descripcion", label: "Descripción", type: "textarea" },
        {
          key: "idCategoria",
          label: "Categoría",
          type: "select",
          required: true,
          options: categorias.map((c) => ({ value: c.idCategoria, label: c.nombre })),
        },
        {
          key: "idOrden",
          label: "Orden de compra",
          type: "select",
          options: [
            { value: "", label: "— Ninguna —" },
            ...ordenes.map((o) => ({ value: o.idOrden, label: o.numeroOC })),
          ],
        },
        {
          key: "estado",
          label: "Estado",
          type: "select",
          required: true,
          options: [
            { value: "Disponible", label: "Disponible" },
            { value: "Asignado", label: "Asignado" },
            { value: "EnMantenimiento", label: "En mantenimiento" },
            { value: "DadoDeBaja", label: "Dado de baja" },
          ],
        },
      ]}
    />
  );
}
