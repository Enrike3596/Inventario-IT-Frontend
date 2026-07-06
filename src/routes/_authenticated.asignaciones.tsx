import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import { stores } from "@/lib/store";
import type { AsignacionUsuario } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/asignaciones")({
  head: () => ({ meta: [{ title: "Asignaciones — SICOT" }] }),
  component: Page,
});

function Page() {
  const usuarios = stores.usuarios.list();
  const activos = stores.activos.list();
  const parqueaderos = stores.parqueaderos.list();

  return (
    <ResourcePage<AsignacionUsuario>
      title="Asignaciones"
      subtitle="Entrega de activos a usuarios"
      resource={stores.asignaciones}
      idKey="idAsignacion"
      singular="asignación"
      searchKeys={["estado"]}
      defaultValues={{ estado: "Activa", fechaAsignacion: new Date().toISOString().slice(0, 10) }}
      columns={[
        {
          header: "Usuario",
          render: (a) => {
            const u = usuarios.find((x) => x.idUsuario === a.idUsuario);
            return u ? `${u.nombres} ${u.apellidos}` : "—";
          },
        },
        {
          header: "Activo",
          render: (a) => {
            const x = activos.find((v) => v.idActivo === a.idActivo);
            return x ? `${x.marca} ${x.modelo} — ${x.serial}` : "—";
          },
        },
        { header: "Asignado", key: "fechaAsignacion" },
        { header: "Devolución", render: (a) => a.fechaDevolucion ?? "—" },
        {
          header: "Estado",
          render: (a) => (
            <Badge variant={a.estado === "Activa" ? "default" : "secondary"}>{a.estado}</Badge>
          ),
        },
      ]}
      fields={[
        {
          key: "idUsuario",
          label: "Usuario",
          type: "select",
          required: true,
          options: usuarios.map((u) => ({ value: u.idUsuario, label: `${u.nombres} ${u.apellidos}` })),
        },
        {
          key: "idActivo",
          label: "Activo",
          type: "select",
          required: true,
          options: activos.map((a) => ({ value: a.idActivo, label: `${a.serial} — ${a.marca} ${a.modelo}` })),
        },
        {
          key: "idParqueadero",
          label: "Parqueadero origen",
          type: "select",
          options: [
            { value: "", label: "— Ninguno —" },
            ...parqueaderos.map((p) => ({ value: p.idParqueadero, label: p.nombre })),
          ],
        },
        { key: "fechaAsignacion", label: "Fecha asignación", type: "date", required: true },
        { key: "fechaDevolucion", label: "Fecha devolución", type: "date" },
        {
          key: "estado",
          label: "Estado",
          type: "select",
          required: true,
          options: [
            { value: "Activa", label: "Activa" },
            { value: "Finalizada", label: "Finalizada" },
          ],
        },
      ]}
    />
  );
}
