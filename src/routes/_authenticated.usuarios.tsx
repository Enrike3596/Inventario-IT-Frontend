import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useUsuarios,
  useCreateUsuario,
  useUpdateUsuario,
  useDeleteUsuario,
  useRoles,
  useSedes,
} from "@/lib/queries";
import type { Usuario } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({ meta: [{ title: "Usuarios — Indigo" }] }),
  component: Page,
});

function Page() {
  const { data: usuarios, isLoading } = useUsuarios();
  const { data: roles } = useRoles();
  const { data: sedes } = useSedes();
  const createMutation = useCreateUsuario();
  const updateMutation = useUpdateUsuario();
  const deleteMutation = useDeleteUsuario();

  const [estadoFilter, setEstadoFilter] = useState("all");

  const filterFn = useMemo(() => {
    if (estadoFilter === "all") return undefined;
    return (item: Usuario) => item.estadoUsuario === estadoFilter;
  }, [estadoFilter]);

  return (
    <ResourcePage<Usuario>
      title="Usuarios"
      subtitle="Personas con acceso al sistema"
      data={usuarios ?? []}
      isLoading={isLoading}
      idKey="idUsuario"
      singular="usuario"
      searchKeys={["nombre", "correo", "cargo"]}
      filterFn={filterFn}
      filters={
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Estado:</span>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Activo">Activo</SelectItem>
              <SelectItem value="Inactivo">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
      defaultValues={{}}
      columns={[
        { header: "Nombre", key: "nombre" },
        { header: "Correo", key: "correo" },
        { header: "Cargo", key: "cargo" },
        {
          header: "Rol",
          render: (u) => u.nombreRol ?? "—",
        },
        {
          header: "Sede",
          render: (u) => u.nombreSede ?? "—",
        },
        {
          header: "Estado",
          render: (u) => (
            <Badge variant={u.estadoUsuario === "Activo" ? "default" : "secondary"}>
              {u.estadoUsuario}
            </Badge>
          ),
        },
      ]}
      fields={[
        { key: "nombre", label: "Nombre completo", type: "text", required: true },
        { key: "correo", label: "Correo", type: "email", required: true },
        { key: "telefono", label: "Teléfono", type: "text" },
        { key: "cargo", label: "Cargo", type: "text", required: true },
        { key: "contraseña", label: "Contraseña", type: "password", required: true, placeholder: "Mín. 6 caracteres" },
        {
          key: "idRol",
          label: "Rol",
          type: "select",
          required: true,
          options: (roles ?? []).map((r) => ({ value: r.idRol, label: r.nombre })),
        },
        {
          key: "idSede",
          label: "Sede",
          type: "select",
          required: true,
          options: (sedes ?? []).map((s) => ({ value: s.idSede, label: s.nombre })),
        },
        {
          key: "estadoUsuario",
          label: "Estado",
          type: "select",
          required: true,
          options: [
            { value: "Activo", label: "Activo" },
            { value: "Inactivo", label: "Inactivo" },
          ],
        },
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
