import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import { useCanales, useCreateCanal, useUpdateCanal, useDeleteCanal } from "@/lib/queries";
import type { Canal } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/canales")({
  head: () => ({ meta: [{ title: "Canales — Indigo" }] }),
  component: Page,
});

function Page() {
  const { data: canales, isLoading } = useCanales();
  const createMutation = useCreateCanal();
  const updateMutation = useUpdateCanal();
  const deleteMutation = useDeleteCanal();

  const validate = useMemo(() => {
    return (form: Record<string, unknown>, editing: Canal | null) => {
      const nombre = ((form.nombre as string) ?? "").trim().toLowerCase();
      if (!nombre) return null;
      const duplicate = (canales ?? []).find(
        (c) => c.nombre.toLowerCase() === nombre && c.idCanal !== editing?.idCanal,
      );
      if (duplicate) return `Ya existe un canal con el nombre "${form.nombre}"`;
      return null;
    };
  }, [canales]);

  return (
    <ResourcePage<Canal>
      title="Canales"
      subtitle="Canales por los que se solicitan salidas"
      data={canales ?? []}
      isLoading={isLoading}
      idKey="idCanal"
      singular="canal"
      searchKeys={["nombre"]}
      defaultValues={{}}
      columns={[
        { header: "Nombre", key: "nombre" },
        {
          header: "Fecha solicitud",
          render: (r) => new Date(r.fechaSolicitud).toLocaleDateString("es-CO"),
        },
      ]}
      fields={[{ key: "nombre", label: "Nombre", type: "text", required: true }]}
      onCreate={(data) => createMutation.mutateAsync(data)}
      onUpdate={(id, data) => updateMutation.mutateAsync({ id, data })}
      onDelete={(id) => deleteMutation.mutateAsync(id)}
      loadingCreate={createMutation.isPending}
      loadingUpdate={updateMutation.isPending}
      loadingDelete={deleteMutation.isPending}
      validate={validate}
    />
  );
}
