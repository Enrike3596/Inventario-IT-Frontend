import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import {
  useCategorias,
  useCreateCategoria,
  useUpdateCategoria,
  useDeleteCategoria,
} from "@/lib/queries";
import type { CategoriaActivo } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/categorias")({
  head: () => ({ meta: [{ title: "Categorías — Indigo" }] }),
  component: Page,
});

function Page() {
  const { data: categorias, isLoading } = useCategorias();
  const createMutation = useCreateCategoria();
  const updateMutation = useUpdateCategoria();
  const deleteMutation = useDeleteCategoria();

  return (
    <ResourcePage<CategoriaActivo>
      title="Categorías de Activos"
      subtitle="Clasificación de tipos de equipos"
      data={categorias ?? []}
      isLoading={isLoading}
      idKey="idCategoria"
      singular="categoría"
      searchKeys={["nombre"]}
      defaultValues={{}}
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
      onCreate={(data) => createMutation.mutateAsync(data)}
      onUpdate={(id, data) => updateMutation.mutateAsync({ id, data })}
      onDelete={(id) => deleteMutation.mutateAsync(id)}
      loadingCreate={createMutation.isPending}
      loadingUpdate={updateMutation.isPending}
      loadingDelete={deleteMutation.isPending}
    />
  );
}
