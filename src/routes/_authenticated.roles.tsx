import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import { useRoles, useCreateRol, useUpdateRol, useDeleteRol } from "@/lib/queries";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/roles")({
  head: () => ({ meta: [{ title: "Roles — SICOT" }] }),
  component: Page,
});

function Page() {
  const { data: roles, isLoading } = useRoles();
  const createMutation = useCreateRol();
  const updateMutation = useUpdateRol();
  const deleteMutation = useDeleteRol();

  return (
    <ResourcePage<Role>
      title="Roles"
      subtitle="Perfiles de acceso al sistema"
      data={roles ?? []}
      isLoading={isLoading}
      idKey="idRol"
      singular="rol"
      searchKeys={["nombre", "tipo"]}
      defaultValues={{}}
      columns={[
        { header: "Nombre", key: "nombre" },
        {
          header: "Tipo",
          render: (r) => (
            <Badge variant="outline" className="font-mono text-[10px]">
              {r.tipo}
            </Badge>
          ),
        },
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
          key: "tipo",
          label: "Tipo",
          type: "select",
          required: true,
          options: [
            { value: "super_admin", label: "Super Admin" },
            { value: "coordinador", label: "Coordinador" },
            { value: "agente_soporte", label: "Agente Soporte TI" },
          ],
        },
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
