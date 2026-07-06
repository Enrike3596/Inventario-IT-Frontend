import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import { stores } from "@/lib/store";
import type { Salida } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/salidas")({
  head: () => ({ meta: [{ title: "Salidas — SICOT" }] }),
  component: Page,
});

function Page() {
  const canales = stores.canales.list();
  const parqueaderos = stores.parqueaderos.list();
  return (
    <ResourcePage<Salida>
      title="Salidas"
      subtitle="Salidas de inventario por canal y parqueadero"
      resource={stores.salidas}
      idKey="idSalida"
      singular="salida"
      searchKeys={["observaciones"]}
      defaultValues={{ fechaSalida: new Date().toISOString().slice(0, 10) }}
      columns={[
        { header: "Fecha", key: "fechaSalida" },
        {
          header: "Canal",
          render: (s) => canales.find((c) => c.idCanal === s.idCanal)?.nombre ?? "—",
        },
        {
          header: "Parqueadero",
          render: (s) => parqueaderos.find((p) => p.idParqueadero === s.idParqueadero)?.nombre ?? "—",
        },
        { header: "Observaciones", key: "observaciones" },
      ]}
      fields={[
        {
          key: "idCanal",
          label: "Canal",
          type: "select",
          required: true,
          options: canales.map((c) => ({ value: c.idCanal, label: c.nombre })),
        },
        {
          key: "idParqueadero",
          label: "Parqueadero",
          type: "select",
          required: true,
          options: parqueaderos.map((p) => ({ value: p.idParqueadero, label: p.nombre })),
        },
        { key: "fechaSalida", label: "Fecha salida", type: "date", required: true },
        { key: "observaciones", label: "Observaciones", type: "textarea" },
      ]}
    />
  );
}
