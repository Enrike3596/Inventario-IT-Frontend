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
import {
  useParqueaderos,
  useCreateParqueadero,
  useUpdateParqueadero,
  useDeleteParqueadero,
} from "@/lib/queries";
import type { Parqueadero } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/parqueaderos")({
  head: () => ({ meta: [{ title: "Parqueaderos — Indigo" }] }),
  component: Page,
});

function Page() {
  const { data: parqueaderos, isLoading } = useParqueaderos();
  const createMutation = useCreateParqueadero();
  const updateMutation = useUpdateParqueadero();
  const deleteMutation = useDeleteParqueadero();

  const [estadoFilter, setEstadoFilter] = useState("all");

  const hasActiveFilters = estadoFilter !== "all";

  const clearFilters = () => {
    setEstadoFilter("all");
  };

  const filterFn = useMemo(() => {
    if (estadoFilter === "all") return undefined;
    return (item: Parqueadero) => item.estado === estadoFilter;
  }, [estadoFilter]);

  return (
    <ResourcePage<Parqueadero>
      title="Parqueaderos"
      subtitle="Bodegas y zonas de almacenamiento"
      data={parqueaderos ?? []}
      isLoading={isLoading}
      idKey="idParqueadero"
      singular="parqueadero"
      searchKeys={["nombre", "ubicacion", "da"]}
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
              <SelectItem value="Activo">Activo</SelectItem>
              <SelectItem value="Inactivo">Inactivo</SelectItem>
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
      defaultValues={{ estado: "Activo" }}
      columns={[
        { header: "DA", key: "da" },
        { header: "Nombre", key: "nombre" },
        { header: "Ubicación", key: "ubicacion" },
        {
          header: "Estado",
          render: (r) => (
            <Badge variant={r.estado === "Activo" ? "default" : "secondary"}>{r.estado}</Badge>
          ),
        },
      ]}
      fields={[
        { key: "da", label: "DA", type: "text", required: true, maxLength: 50 },
        { key: "nombre", label: "Nombre", type: "text", required: true },
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
      onCreate={(data) => createMutation.mutateAsync(data)}
      onUpdate={(id, data) => updateMutation.mutateAsync({ id, data })}
      onDelete={(id) => deleteMutation.mutateAsync(id)}
      loadingCreate={createMutation.isPending}
      loadingUpdate={updateMutation.isPending}
      loadingDelete={deleteMutation.isPending}
    />
  );
}
