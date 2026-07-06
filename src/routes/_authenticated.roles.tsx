import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import { stores } from "@/lib/store";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/roles")({
  head: () => ({ meta: [{ title: "Roles — SICOT" }] }),
  component: Page,
});

function Page() {
  return (
    <ResourcePage<Role>
      title="Roles"
      subtitle="Perfiles de acceso al sistema"
      resource={stores.roles}
      idKey="idRol"
      singular="rol"
      searchKeys={["nombre", "tipo"]}
      defaultValues={{ estado: "Activo", tipo: "agente_soporte" }}
      columns={[
        { header: "Nombre", key: "nombre" },
        {
          header: "Tipo",
          render: (r) => (
            <Badge variant="outline" className="font-mono text-[10px]">
              {r.tipo}
            </Badge>
          ),
        },
        {
          header: "Estado",
          render: (r) => (
            <Badge variant={r.estado === "Activo" ? "default" : "secondary"}>{r.estado}</Badge>
          ),
        },
      ]}
      fields={[
        { key: "nombre", label: "Nombre", type: "text", required: true },
        {
          key: "tipo",
          label: "Tipo",
          type: "select",
          required: true,
          options: [
            { value: "super_admin", label: "Super Admin" },
            { value: "coordinador", label: "Coordinador" },
            { value: "agente_soporte", label: "Agente Soporte TI" },
          ],
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
