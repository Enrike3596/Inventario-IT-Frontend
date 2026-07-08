import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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

  const [estadoFilter, setEstadoFilter] = useState("all");

  const filterFn = useMemo(() => {
    if (estadoFilter === "all") return undefined;
    return (item: Sede) => item.estado === estadoFilter;
  }, [estadoFilter]);

  return (
    <ResourcePage<Sede>
      title="Sedes"
      subtitle="Ubicaciones físicas de la organización"
      data={sedes ?? []}
      isLoading={isLoading}
      idKey="idSede"
      singular="sede"
      searchKeys={["nombre", "ciudad", "direccion"]}
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
