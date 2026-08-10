import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ResourcePage } from "@/components/resource-page";
import {
  useSalidas,
  useCreateSalida,
  useUpdateSalida,
  useDeleteSalida,
  useActivos,
  useUpdateActivo,
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

const causaOptions = [
  { value: "Daño físico", label: "Daño físico" },
  { value: "Obsolescencia", label: "Obsolescencia" },
  { value: "Donación", label: "Donación" },
  { value: "Venta", label: "Venta" },
  { value: "Baja por deterioro", label: "Baja por deterioro" },
  { value: "Robo / Pérdida", label: "Robo / Pérdida" },
  { value: "Fin de vida útil", label: "Fin de vida útil" },
  { value: "Garantía", label: "Garantía" },
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
  const updateActivo = useUpdateActivo();

  const salidaActivoIds = new Set(
    (salidas ?? []).flatMap((s) =>
      [s.activos?.[0]?.idActivo, s.idActivo].filter((v): v is number => typeof v === "number"),
    ),
  );
  const activosOptions = (activos ?? [])
    .filter((a) => a.estadoActivo === "Disponible" || salidaActivoIds.has(a.idActivo))
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
        {
          header: "Causa de salida",
          render: (s) => s.observaciones ?? "—",
          className: "max-w-xs truncate",
        },
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
        {
          key: "observaciones",
          label: "Causa de salida",
          type: "select",
          required: true,
          options: causaOptions,
        },
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
          estadoActivo: d.estadoActivo,
          observaciones: d.observaciones,
          activos: [{ idActivo: d.idActivo as number, cantidad: 1 }],
        } as Partial<Salida>;
      }}
      transformEdit={(row) => {
        const a = (row as Salida).activos?.[0];
        return {
          estadoActivo: row.estadoActivo,
          idActivo: a?.idActivo ?? row.idActivo,
          observaciones: row.observaciones ?? "",
        } as unknown as Record<string, unknown>;
      }}
      onCreate={(data) => createMutation.mutateAsync(data)}
      onUpdate={async (id, data) => {
        const prev = (salidas ?? []).find((s) => s.idSalida === id);
        const prevIdActivo = prev?.activos?.[0]?.idActivo ?? prev?.idActivo;
        const d = data as Partial<Salida>;
        const nextIdActivo = d.activos?.[0]?.idActivo ?? d.idActivo;
        await updateMutation.mutateAsync({ id, data });
        if (prevIdActivo && nextIdActivo && nextIdActivo !== prevIdActivo) {
          const activo = (activos ?? []).find((a) => a.idActivo === prevIdActivo);
          try {
            if (activo) {
              await updateActivo.mutateAsync({
                id: prevIdActivo,
                data: {
                  idCategoria: activo.idCategoria,
                  idOrden: activo.idOrden,
                  idItemOC: activo.idItemOC,
                  idDetalleItemOC: activo.idDetalleItemOC,
                  codigoActivo: activo.codigoActivo,
                  serial: activo.serial,
                  marca: activo.marca,
                  modelo: activo.modelo,
                  referencia: activo.referencia,
                  estadoActivo: "Disponible",
                  observaciones: activo.observaciones,
                },
              });
            }
          } catch {
            toast.warning(
              "La salida se actualizó, pero no se pudo restaurar el estado del activo anterior.",
            );
          }
        }
      }}
      onDelete={async (id) => {
        await deleteMutation.mutateAsync(id);
      }}
      loadingCreate={createMutation.isPending}
      loadingUpdate={updateMutation.isPending}
      loadingDelete={deleteMutation.isPending}
    />
  );
}
