import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import { stores } from "@/lib/store";
import type { Canal } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/canales")({
  head: () => ({ meta: [{ title: "Canales — SICOT" }] }),
  component: Page,
});

function Page() {
  return (
    <ResourcePage<Canal>
      title="Canales"
      subtitle="Canales por los que se solicitan salidas"
      resource={stores.canales}
      idKey="idCanal"
      singular="canal"
      searchKeys={["nombre"]}
      defaultValues={{ fechaSolicitud: new Date().toISOString().slice(0, 10) }}
      columns={[
        { header: "Nombre", key: "nombre" },
        { header: "Fecha solicitud", key: "fechaSolicitud" },
      ]}
      fields={[
        { key: "nombre", label: "Nombre", type: "text", required: true },
        { key: "fechaSolicitud", label: "Fecha solicitud", type: "date", required: true },
      ]}
    />
  );
}
