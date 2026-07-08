import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useParqueaderos,
  useCreateParqueadero,
  useUpdateParqueadero,
  useDeleteParqueadero,
  useSedes,
} from "@/lib/queries";
import type { Parqueadero } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/parqueaderos")({
  head: () => ({ meta: [{ title: "Parqueaderos — Indigo" }] }),
  component: Page,
});

function Page() {
  const { data: parqueaderos, isLoading } = useParqueaderos();
  const { data: sedes } = useSedes();
  const createMutation = useCreateParqueadero();
  const updateMutation = useUpdateParqueadero();
  const deleteMutation = useDeleteParqueadero();

  const [estadoFilter, setEstadoFilter] = useState("all");

  const filterFn = useMemo(() => {
    if (estadoFilter === "all") return undefined;
    return (item: Parqueadero) => item.estado === estadoFilter;
  }, [estadoFilter]);

  return (
    <ResourcePage<Parqueadero>
      title="Parqueaderos"
      subtitle="Bodegas y zonas de almacenamiento por sede"
      data={parqueaderos ?? []}
      isLoading={isLoading}
      idKey="idParqueadero"
      singular="parqueadero"
      searchKeys={["nombre", "ubicacion"]}
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
          header: "Sede",
          render: (r) => r.nombreSede ?? "—",
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
          options: (sedes ?? []).map((s) => ({ value: s.idSede, label: s.nombre })),
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
      onCreate={(data) => createMutation.mutateAsync(data)}
      onUpdate={(id, data) => updateMutation.mutateAsync({ id, data })}
      onDelete={(id) => deleteMutation.mutateAsync(id)}
      loadingCreate={createMutation.isPending}
      loadingUpdate={updateMutation.isPending}
      loadingDelete={deleteMutation.isPending}
    />
  );
}
