import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import {
  useActivos,
  useCreateActivo,
  useUpdateActivo,
  useDeleteActivo,
  useCategorias,
  useOrdenesCompra,
} from "@/lib/queries";
import type { Activo } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/activos")({
  head: () => ({ meta: [{ title: "Activos TI — Indigo" }] }),
  component: ActivosPage,
});

const estadoTint: Record<string, string> = {
  Disponible: "bg-success/15 text-success border-success/30",
  Asignado: "bg-primary/15 text-primary border-primary/30",
  EnMantenimiento: "bg-warning/15 text-warning border-warning/30",
  DadoDeBaja: "bg-destructive/15 text-destructive border-destructive/30",
};

function ActivosPage() {
  const { data: activos, isLoading } = useActivos();
  const { data: categorias } = useCategorias();
  const { data: ordenes } = useOrdenesCompra();
  const createMutation = useCreateActivo();
  const updateMutation = useUpdateActivo();
  const deleteMutation = useDeleteActivo();

  return (
    <ResourcePage<Activo>
      title="Activos TI"
      subtitle="Inventario de equipos y dispositivos tecnológicos"
      data={activos ?? []}
      isLoading={isLoading}
      idKey="idActivo"
      singular="activo"
      searchKeys={["serial", "marca", "modelo", "codigoActivo", "observaciones"]}
      defaultValues={{}}
      columns={[
        { header: "Código", key: "codigoActivo", className: "font-mono text-xs" },
        { header: "Serial", key: "serial", className: "font-mono text-xs" },
        { header: "Marca", key: "marca" },
        { header: "Modelo", key: "modelo" },
        {
          header: "Categoría",
          render: (r) => r.nombreCategoria ?? "—",
        },
        {
          header: "Estado",
          render: (r) => (
            <Badge variant="outline" className={estadoTint[r.estadoActivo]}>
              {r.estadoActivo}
            </Badge>
          ),
        },
      ]}
      fields={[
        { key: "codigoActivo", label: "Código activo", type: "text" },
        { key: "serial", label: "Serial", type: "text", required: true },
        { key: "marca", label: "Marca", type: "text", required: true },
        { key: "modelo", label: "Modelo", type: "text", required: true },
        { key: "referencia", label: "Referencia", type: "text" },
        {
          key: "idCategoria",
          label: "Categoría",
          type: "select",
          required: true,
          options: (categorias ?? []).map((c) => ({ value: c.idCategoria, label: c.nombre })),
        },
        {
          key: "idOrden",
          label: "Orden de compra",
          type: "select",
          required: true,
          options: (ordenes ?? []).map((o) => ({ value: o.idOrden, label: o.numeroOC })),
        },
        {
          key: "estadoActivo",
          label: "Estado",
          type: "select",
          required: true,
          options: [
            { value: "Disponible", label: "Disponible" },
            { value: "Asignado", label: "Asignado" },
            { value: "EnMantenimiento", label: "En mantenimiento" },
            { value: "DadoDeBaja", label: "Dado de baja" },
          ],
        },
        { key: "observaciones", label: "Observaciones", type: "textarea" },
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
