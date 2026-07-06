import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import { stores } from "@/lib/store";
import type { OrdenCompra } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/ordenes-compra")({
  head: () => ({ meta: [{ title: "Órdenes de Compra — SICOT" }] }),
  component: Page,
});

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

function Page() {
  return (
    <ResourcePage<OrdenCompra>
      title="Órdenes de Compra"
      subtitle="Compras y adquisiciones registradas"
      resource={stores.ordenes}
      idKey="idOrden"
      singular="orden"
      searchKeys={["numeroOC", "proveedor"]}
      defaultValues={{ fechaCompra: new Date().toISOString().slice(0, 10) }}
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
        { key: "fechaCompra", label: "Fecha de compra", type: "date", required: true },
        { key: "observaciones", label: "Observaciones", type: "textarea" },
      ]}
    />
  );
}
