import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import { stores } from "@/lib/store";
import type { Usuario } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({ meta: [{ title: "Usuarios — SICOT" }] }),
  component: Page,
});

function Page() {
  const roles = stores.roles.list();
  const sedes = stores.sedes.list();
  return (
    <ResourcePage<Usuario>
      title="Usuarios"
      subtitle="Personas con acceso al sistema"
      resource={stores.usuarios}
      idKey="idUsuario"
      singular="usuario"
      searchKeys={["nombres", "apellidos", "email", "documento"]}
      defaultValues={{ estado: "Activo" }}
      columns={[
        { header: "Documento", key: "documento", className: "font-mono text-xs" },
        {
          header: "Nombre",
          render: (u) => `${u.nombres} ${u.apellidos}`,
        },
        { header: "Correo", key: "email" },
        {
          header: "Rol",
          render: (u) => roles.find((r) => r.idRol === u.idRol)?.nombre ?? "—",
        },
        {
          header: "Sede",
          render: (u) => sedes.find((s) => s.idSede === u.idSede)?.nombre ?? "—",
        },
        {
          header: "Estado",
          render: (u) => (
            <Badge variant={u.estado === "Activo" ? "default" : "secondary"}>{u.estado}</Badge>
          ),
        },
      ]}
      fields={[
        { key: "nombres", label: "Nombres", type: "text", required: true },
        { key: "apellidos", label: "Apellidos", type: "text", required: true },
        { key: "documento", label: "Documento", type: "text", required: true },
        { key: "email", label: "Correo", type: "email", required: true },
        {
          key: "idRol",
          label: "Rol",
          type: "select",
          required: true,
          options: roles.map((r) => ({ value: r.idRol, label: r.nombre })),
        },
        {
          key: "idSede",
          label: "Sede",
          type: "select",
          required: true,
          options: sedes.map((s) => ({ value: s.idSede, label: s.nombre })),
        },
        {
          key: "estado",
          label: "Estado",
          type: "select",
          required: true,
          options: [
            { value: "Activo", label: "Activo" },
            { value: "Inactivo", label: "Inactivo" },
          ],
        },
      ]}
    />
  );
}
