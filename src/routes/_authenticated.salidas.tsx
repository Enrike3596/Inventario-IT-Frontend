import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import {
  useSalidas,
  useCreateSalida,
  useUpdateSalida,
  useDeleteSalida,
  useCanales,
  useParqueaderos,
  useUsuarios,
} from "@/lib/queries";
import type { Salida } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/salidas")({
  head: () => ({ meta: [{ title: "Salidas — SICOT" }] }),
  component: Page,
});

function Page() {
  const { data: salidas, isLoading } = useSalidas();
  const { data: canales } = useCanales();
  const { data: parqueaderos } = useParqueaderos();
  const { data: usuarios } = useUsuarios();
  const createMutation = useCreateSalida();
  const updateMutation = useUpdateSalida();
  const deleteMutation = useDeleteSalida();

  return (
    <ResourcePage<Salida>
      title="Salidas"
      subtitle="Salidas de inventario por canal y parqueadero"
      data={salidas ?? []}
      isLoading={isLoading}
      idKey="idSalida"
      singular="salida"
      searchKeys={["observaciones", "codigoUnico"]}
      defaultValues={{}}
      columns={[
        { header: "Fecha", render: (s) => new Date(s.fechaSalida).toLocaleDateString("es-CO") },
        {
          header: "Canal",
          render: (s) => s.nombreCanal ?? "—",
        },
        {
          header: "Parqueadero",
          render: (s) => s.nombreParqueaderoDestino ?? "—",
        },
        { header: "Observaciones", render: (s) => s.observaciones ?? "—" },
      ]}
      fields={[
        {
          key: "idCanal",
          label: "Canal",
          type: "select",
          required: true,
          options: (canales ?? []).map((c) => ({ value: c.idCanal, label: c.nombre })),
        },
        {
          key: "idParqueaderoDestino",
          label: "Parqueadero destino",
          type: "select",
          options: [
            { value: "" as unknown as number, label: "— Ninguno —" },
            ...(parqueaderos ?? []).map((p) => ({ value: p.idParqueadero, label: p.nombre })),
          ],
        },
        {
          key: "idUsuarioDestino",
          label: "Usuario destino",
          type: "select",
          options: [
            { value: "" as unknown as number, label: "— Ninguno —" },
            ...(usuarios ?? []).map((u) => ({ value: u.idUsuario, label: u.nombre })),
          ],
        },
        {
          key: "idUsuarioEntrega",
          label: "Usuario entrega",
          type: "select",
          required: true,
          options: (usuarios ?? []).map((u) => ({ value: u.idUsuario, label: u.nombre })),
        },
        { key: "registroSalida", label: "Registro de salida", type: "text", required: true },
        { key: "numeroTicket", label: "N° Ticket", type: "text" },
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
