import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import {
  useSalidas,
  useCreateSalida,
  useUpdateSalida,
  useDeleteSalida,
  useActivos,
} from "@/lib/queries";
import type { Salida, EstadoActivo } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/salidas")({
  head: () => ({ meta: [{ title: "Salidas — Indigo" }] }),
  component: Page,
});

const estadoOptions: { value: EstadoActivo; label: string }[] = [
  { value: "EnReparacion", label: "En reparación" },
  { value: "DadoDeBaja", label: "Dado de baja" },
  { value: "Venta", label: "Venta" },
];

const estadoLabels: Record<EstadoActivo, string> = {
  Disponible: "Disponible",
  Asignado: "Asignado",
  EnReparacion: "En reparación",
  DadoDeBaja: "Dado de baja",
  Venta: "Venta",
};

function Page() {
  const { data: salidas, isLoading } = useSalidas();
  const { data: activos } = useActivos();
  const createMutation = useCreateSalida();
  const updateMutation = useUpdateSalida();
  const deleteMutation = useDeleteSalida();

  const activosOptions = (activos ?? [])
    .filter((a) => a.estadoActivo === "Disponible")
    .map((a) => ({ value: a.idActivo, label: `${a.serial} — ${a.marca} ${a.modelo}` }));

  return (
    <ResourcePage<Salida>
      module="salidas"
      title="Salidas"
      subtitle="Salidas de inventario"
      data={salidas ?? []}
      isLoading={isLoading}
      idKey="idSalida"
      singular="salida"
      searchKeys={["observaciones", "codigoUnico"]}
      defaultValues={{}}
      columns={[
        { header: "Fecha", render: (s) => new Date(s.fechaSalida).toLocaleDateString("es-CO") },
        {
          header: "Estado",
          render: (s) => estadoLabels[s.estadoActivo] ?? s.estadoActivo,
        },
        { header: "Comentarios", render: (s) => s.observaciones ?? "—" },
      ]}
      fields={[
        {
          key: "estadoActivo",
          label: "Estado del activo",
          type: "select",
          required: true,
          options: estadoOptions,
        },
        {
          key: "idActivo",
          label: "Activo",
          type: "select",
          required: true,
          options: activosOptions,
        },
        { key: "observaciones", label: "Comentarios", type: "textarea", required: true },
      ]}
      transformCreate={(data) => {
        const d = data as Record<string, unknown>;
        return {
          ...d,
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
