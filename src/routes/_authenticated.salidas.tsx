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
  useActivos,
} from "@/lib/queries";
import type { Salida } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/salidas")({
  head: () => ({ meta: [{ title: "Salidas — Indigo" }] }),
  component: Page,
});

function Page() {
  const { data: salidas, isLoading } = useSalidas();
  const { data: canales } = useCanales();
  const { data: parqueaderos } = useParqueaderos();
  const { data: usuarios } = useUsuarios();
  const { data: activos } = useActivos();
  const createMutation = useCreateSalida();
  const updateMutation = useUpdateSalida();
  const deleteMutation = useDeleteSalida();

  const activosOptions = (activos ?? [])
    .filter((a) => a.estadoActivo === "Disponible")
    .map((a) => ({ value: a.idActivo, label: `${a.serial} — ${a.marca} ${a.modelo}` }));

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
        {
          key: "idActivo",
          label: "Activo",
          type: "select",
          required: true,
          options: activosOptions,
        },
        { key: "observaciones", label: "Observaciones", type: "textarea" },
      ]}
      transformCreate={(data) => {
        const d = data as Record<string, unknown>;
        return {
          ...d,
          idParqueaderoDestino: d.idParqueaderoDestino === "" ? null : d.idParqueaderoDestino,
          idUsuarioDestino: d.idUsuarioDestino === "" ? null : d.idUsuarioDestino,
          activos: [{ idActivo: d.idActivo as number, cantidad: 1 }],
        } as Partial<Salida>;
      }}
      onCreate={(data) => createMutation.mutateAsync(data)}
      onUpdate={(id, data) => updateMutation.mutateAsync({ id, data })}
      onDelete={(id) => deleteMutation.mutateAsync(id)}
      loadingCreate={createMutation.isPending}
      loadingUpdate={updateMutation.isPending}
      loadingDelete={deleteMutation.isPending}
    />
  );
}
