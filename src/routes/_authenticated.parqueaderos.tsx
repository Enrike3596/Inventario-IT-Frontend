import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import { stores } from "@/lib/store";
import type { Parqueadero } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/parqueaderos")({
  head: () => ({ meta: [{ title: "Parqueaderos — SICOT" }] }),
  component: Page,
});

function Page() {
  const sedes = stores.sedes.list();
  return (
    <ResourcePage<Parqueadero>
      title="Parqueaderos"
      subtitle="Bodegas y zonas de almacenamiento por sede"
      resource={stores.parqueaderos}
      idKey="idParqueadero"
      singular="parqueadero"
      searchKeys={["nombre", "ubicacion"]}
      defaultValues={{ estado: "Activo" }}
      columns={[
        { header: "Nombre", key: "nombre" },
        {
          header: "Sede",
          render: (r) => sedes.find((s) => s.idSede === r.idSede)?.nombre ?? "—",
        },
        { header: "Ubicación", key: "ubicacion" },
        {
          header: "Estado",
          render: (r) => (
            <Badge variant={r.estado === "Activo" ? "default" : "secondary"}>{r.estado}</Badge>
          ),
        },
      ]}
      fields={[
        { key: "nombre", label: "Nombre", type: "text", required: true },
        {
          key: "idSede",
          label: "Sede",
          type: "select",
          required: true,
          options: sedes.map((s) => ({ value: s.idSede, label: s.nombre })),
        },
        { key: "ubicacion", label: "Ubicación", type: "text", required: true },
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
