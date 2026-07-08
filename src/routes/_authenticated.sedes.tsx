import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import { useSedes, useCreateSede, useUpdateSede, useDeleteSede } from "@/lib/queries";
import type { Sede } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/sedes")({
  head: () => ({ meta: [{ title: "Sedes — Indigo" }] }),
  component: Page,
});

function Page() {
  const { data: sedes, isLoading } = useSedes();
  const createMutation = useCreateSede();
  const updateMutation = useUpdateSede();
  const deleteMutation = useDeleteSede();

  return (
    <ResourcePage<Sede>
      title="Sedes"
      subtitle="Ubicaciones físicas de la organización"
      data={sedes ?? []}
      isLoading={isLoading}
      idKey="idSede"
      singular="sede"
      searchKeys={["nombre", "ciudad", "direccion"]}
      defaultValues={{}}
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
      onCreate={(data) => createMutation.mutateAsync(data)}
      onUpdate={(id, data) => updateMutation.mutateAsync({ id, data })}
      onDelete={(id) => deleteMutation.mutateAsync(id)}
      loadingCreate={createMutation.isPending}
      loadingUpdate={updateMutation.isPending}
      loadingDelete={deleteMutation.isPending}
    />
  );
}
