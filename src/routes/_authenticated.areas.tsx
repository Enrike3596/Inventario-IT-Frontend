import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { X } from "lucide-react";
import { ResourcePage } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAreas, useCreateArea, useUpdateArea, useDeleteArea } from "@/lib/queries";
import type { Area } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/areas")({
  head: () => ({ meta: [{ title: "Areas — Indigo" }] }),
  component: Page,
});

function Page() {
  const { data: areas, isLoading } = useAreas();
  const createMutation = useCreateArea();
  const updateMutation = useUpdateArea();
  const deleteMutation = useDeleteArea();

  const [estadoFilter, setEstadoFilter] = useState("all");

  const hasActiveFilters = estadoFilter !== "all";

  const clearFilters = () => {
    setEstadoFilter("all");
  };

  const filterFn = useMemo(() => {
    if (estadoFilter === "all") return undefined;
    const isActive = estadoFilter === "true";
    return (item: Area) => item.estado === isActive;
  }, [estadoFilter]);

  const validate = (form: Record<string, unknown>, editing: Area | null) => {
    const nombre = ((form.nombreArea as string) ?? "").trim().toLowerCase();
    if (!nombre) return null;
    const duplicate = (areas ?? []).find(
      (a) => a.nombreArea.toLowerCase() === nombre && a.idArea !== editing?.idArea,
    );
    if (duplicate) return `Ya existe un area con el nombre "${form.nombreArea}"`;
    return null;
  };

  return (
    <ResourcePage<Area>
      title="Areas"
      subtitle="Gestion de areas de la organizacion"
      data={areas ?? []}
      isLoading={isLoading}
      idKey="idArea"
      singular="area"
      searchKeys={["nombreArea"]}
      filterFn={filterFn}
      filters={
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Estado:</span>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Activo</SelectItem>
              <SelectItem value="false">Inactivo</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2 text-muted-foreground"
              onClick={clearFilters}
            >
              <X className="h-4 w-4 mr-1" /> Limpiar
            </Button>
          )}
        </div>
      }
      defaultValues={{ estado: true }}
      validate={validate}
      columns={[
        { header: "Nombre", key: "nombreArea" },
        {
          header: "Estado",
          render: (r) => (
            <Badge variant={r.estado ? "default" : "secondary"}>
              {r.estado ? "Activo" : "Inactivo"}
            </Badge>
          ),
        },
      ]}
      fields={[{ key: "nombreArea", label: "Nombre", type: "text", required: true }]}
      onCreate={(data) => createMutation.mutateAsync(data)}
      onUpdate={(id, data) => updateMutation.mutateAsync({ id, data })}
      onDelete={(id) => deleteMutation.mutateAsync(id)}
      loadingCreate={createMutation.isPending}
      loadingUpdate={updateMutation.isPending}
      loadingDelete={deleteMutation.isPending}
    />
  );
}
