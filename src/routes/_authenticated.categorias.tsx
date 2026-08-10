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

  const [estadoFilter, setEstadoFilter] = useState("all");

  const hasActiveFilters = estadoFilter !== "all";

  const clearFilters = () => {
    setEstadoFilter("all");
  };

  const filterFn = useMemo(() => {
    if (estadoFilter === "all") return undefined;
    return (item: CategoriaActivo) => item.estado === estadoFilter;
  }, [estadoFilter]);

  return (
    <ResourcePage<CategoriaActivo>
      title="Categorías de Activos"
      subtitle="Clasificación de tipos de equipos"
      data={categorias ?? []}
      isLoading={isLoading}
      idKey="idCategoria"
      singular="categoría"
      searchKeys={["nombre"]}
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
      defaultValues={{}}
      columns={[
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
