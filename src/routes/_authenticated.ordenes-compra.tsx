import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import {
  useOrdenesCompra,
  useCreateOrdenCompra,
  useUpdateOrdenCompra,
  useDeleteOrdenCompra,
} from "@/lib/queries";
import type { OrdenCompra } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/ordenes-compra")({
  head: () => ({ meta: [{ title: "Órdenes de Compra — SICOT" }] }),
  component: Page,
});

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function Page() {
  const { data: ordenes, isLoading } = useOrdenesCompra();
  const createMutation = useCreateOrdenCompra();
  const updateMutation = useUpdateOrdenCompra();
  const deleteMutation = useDeleteOrdenCompra();

  return (
    <ResourcePage<OrdenCompra>
      title="Órdenes de Compra"
      subtitle="Compras y adquisiciones registradas"
      data={ordenes ?? []}
      isLoading={isLoading}
      idKey="idOrden"
      singular="orden"
      searchKeys={["numeroOC", "proveedor"]}
      defaultValues={{}}
      columns={[
        { header: "N° OC", key: "numeroOC", className: "font-mono text-xs" },
        { header: "Proveedor", key: "proveedor" },
        { header: "Fecha", render: (r) => new Date(r.fechaCompra).toLocaleDateString("es-CO") },
        { header: "Total", render: (r) => money.format(r.total), className: "text-right" },
      ]}
      fields={[
        { key: "numeroOC", label: "Número OC", type: "text", required: true },
        { key: "proveedor", label: "Proveedor", type: "text", required: true },
        { key: "total", label: "Total", type: "number", required: true },
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
