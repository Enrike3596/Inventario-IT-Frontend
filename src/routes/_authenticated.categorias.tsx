import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import { stores } from "@/lib/store";
import type { CategoriaActivo } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/categorias")({
  head: () => ({ meta: [{ title: "Categorías — SICOT" }] }),
  component: Page,
});

function Page() {
  return (
    <ResourcePage<CategoriaActivo>
      title="Categorías de Activos"
      subtitle="Clasificación de tipos de equipos"
      resource={stores.categorias}
      idKey="idCategoria"
      singular="categoría"
      searchKeys={["nombre"]}
      defaultValues={{ estado: "Activo" }}
      columns={[
        { header: "ID", key: "idCategoria", className: "w-16 font-mono text-xs" },
        { header: "Nombre", key: "nombre" },
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
