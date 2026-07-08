import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useRoles, useCreateRol, useUpdateRol, useDeleteRol } from "@/lib/queries";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/roles")({
  head: () => ({ meta: [{ title: "Roles — Indigo" }] }),
  component: Page,
});

function Page() {
  const { data: roles, isLoading } = useRoles();
  const createMutation = useCreateRol();
  const updateMutation = useUpdateRol();
  const deleteMutation = useDeleteRol();

  const [estadoFilter, setEstadoFilter] = useState("all");

  const filterFn = useMemo(() => {
    if (estadoFilter === "all") return undefined;
    return (item: Role) => item.estado === estadoFilter;
  }, [estadoFilter]);

  return (
    <ResourcePage<Role>
      title="Roles"
      subtitle="Perfiles de acceso al sistema"
      data={roles ?? []}
      isLoading={isLoading}
      idKey="idRol"
      singular="rol"
      searchKeys={["nombre", "tipo"]}
      filterFn={filterFn}
      filters={
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Estado:</span>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Activo">Activo</SelectItem>
              <SelectItem value="Inactivo">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
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
