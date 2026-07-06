import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import { stores } from "@/lib/store";
import type { Sede } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/sedes")({
  head: () => ({ meta: [{ title: "Sedes — SICOT" }] }),
  component: Page,
});

function Page() {
  return (
    <ResourcePage<Sede>
      title="Sedes"
      subtitle="Ubicaciones físicas de la organización"
      resource={stores.sedes}
      idKey="idSede"
      singular="sede"
      searchKeys={["nombre", "ciudad", "direccion"]}
      defaultValues={{ estado: "Activo" }}
      columns={[
        { header: "Nombre", key: "nombre" },
        { header: "Ciudad", key: "ciudad" },
        { header: "Dirección", key: "direccion" },
        {
          header: "Estado",
          render: (r) => (
            <Badge variant={r.estado === "Activo" ? "default" : "secondary"}>{r.estado}</Badge>
          ),
        },
      ]}
      fields={[
        { key: "nombre", label: "Nombre", type: "text", required: true },
        { key: "ciudad", label: "Ciudad", type: "text", required: true },
        { key: "direccion", label: "Dirección", type: "text", required: true },
        {
          key: "estado",
          label: "Estado",
          type: "select",
          required: true,
          options: [
            { value: "Activo", label: "Activo" },
            { value: "Inactivo", label: "Inactivo" },
          ],
        },
      ]}
    />
  );
}
