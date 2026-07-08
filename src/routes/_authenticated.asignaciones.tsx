import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import {
  useAsignaciones,
  useCreateAsignacion,
  useUpdateAsignacion,
  useDeleteAsignacion,
  useUsuarios,
  useActivos,
  useParqueaderos,
} from "@/lib/queries";
import type { AsignacionUsuario } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/asignaciones")({
  head: () => ({ meta: [{ title: "Asignaciones — Indigo" }] }),
  component: Page,
});

function Page() {
  const { data: asignaciones, isLoading } = useAsignaciones();
  const { data: usuarios } = useUsuarios();
  const { data: activos } = useActivos();
  const { data: parqueaderos } = useParqueaderos();
  const createMutation = useCreateAsignacion();
  const updateMutation = useUpdateAsignacion();
  const deleteMutation = useDeleteAsignacion();

  return (
    <ResourcePage<AsignacionUsuario>
      title="Asignaciones"
      subtitle="Entrega de activos a usuarios"
      data={asignaciones ?? []}
      isLoading={isLoading}
      idKey="idAsignacion"
      singular="asignación"
      searchKeys={["estadoAsignacion"]}
      defaultValues={{}}
      columns={[
        {
          header: "Usuario",
          render: (a) => a.nombreUsuarioDestino ?? "—",
        },
        {
          header: "Activo",
          render: (a) =>
            a.serial ? `${a.serial}${a.codigoActivo ? ` — ${a.codigoActivo}` : ""}` : "—",
        },
        {
          header: "Asignado",
          render: (a) => new Date(a.fechaAsignacion).toLocaleDateString("es-CO"),
        },
        {
          header: "Estado",
          render: (a) => (
            <Badge variant={a.estadoAsignacion === "Activa" ? "default" : "secondary"}>
              {a.estadoAsignacion}
            </Badge>
          ),
        },
      ]}
      fields={[
        {
          key: "idUsuarioDestino",
          label: "Usuario destino",
          type: "select",
          required: true,
          options: (usuarios ?? []).map((u) => ({ value: u.idUsuario, label: u.nombre })),
        },
        {
          key: "idActivo",
          label: "Activo",
          type: "select",
          required: true,
          options: (activos ?? []).map((a) => ({
            value: a.idActivo,
            label: `${a.serial} — ${a.marca} ${a.modelo}`,
          })),
        },
        {
          key: "idParqueadero",
          label: "Parqueadero origen",
          type: "select",
          options: [
            { value: "" as unknown as number, label: "— Ninguno —" },
            ...(parqueaderos ?? []).map((p) => ({ value: p.idParqueadero, label: p.nombre })),
          ],
        },
        {
          key: "estadoAsignacion",
          label: "Estado",
          type: "select",
          required: true,
          options: [
            { value: "Activa", label: "Activa" },
            { value: "Finalizada", label: "Finalizada" },
          ],
        },
      ]}
      transformCreate={(data) => {
        const d = data as Record<string, unknown>;
        return { ...d, idParqueadero: d.idParqueadero === "" ? null : d.idParqueadero } as Partial<AsignacionUsuario>;
      }}
      transformUpdate={(data) => {
        const d = data as Record<string, unknown>;
        return { estadoAsignacion: d.estadoAsignacion } as Partial<AsignacionUsuario>;
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
