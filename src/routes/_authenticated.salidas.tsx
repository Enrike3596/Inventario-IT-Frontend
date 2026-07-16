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
import { Badge } from "@/components/ui/badge";

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

const estadoTint: Record<EstadoActivo, string> = {
  Disponible: "bg-success/15 text-success border-success/30",
  Asignado: "bg-primary/15 text-primary border-primary/30",
  EnReparacion: "bg-warning/15 text-warning border-warning/30",
  DadoDeBaja: "bg-destructive/15 text-destructive border-destructive/30",
  Venta: "bg-muted/50 text-muted-foreground border-border",
};

function Page() {
  const { data: salidas, isLoading } = useSalidas();
  const { data: activos } = useActivos();
  const createMutation = useCreateSalida();
  const updateMutation = useUpdateSalida();
  const deleteMutation = useDeleteSalida();

  const activosOptions = (activos ?? [])
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
          render: (s) => (
            <Badge variant="outline" className={estadoTint[s.estadoActivo]}>
              {estadoLabels[s.estadoActivo] ?? s.estadoActivo}
            </Badge>
          ),
        },
        {
          header: "Activo",
          render: (s) => {
            const a = s.activos?.[0];
            return a
              ? [a.serial, a.marca, a.modelo].filter(Boolean).join(" — ") || a.codigoActivo || "—"
              : [s.codigoActivo, s.serial, s.marca, s.modelo].filter(Boolean).join(" — ") || "—";
          },
        },
        { header: "Comentarios", render: (s) => s.observaciones ?? "—", className: "max-w-xs truncate" },
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
      transformUpdate={(data) => {
        const d = data as Record<string, unknown>;
        return {
          ...d,
          activos: [{ idActivo: d.idActivo as number, cantidad: 1 }],
        } as Partial<Salida>;
      }}
      transformEdit={(row) => {
        const base = { ...row } as unknown as Record<string, unknown>;
        const a = (row as Salida).activos?.[0];
        if (a && base.idActivo === undefined) {
          base.idActivo = a.idActivo;
        }
        return base;
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
