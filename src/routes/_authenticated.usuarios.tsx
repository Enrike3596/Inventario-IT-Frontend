import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { X } from "lucide-react";
import { ResourcePage } from "@/components/resource-page";
import type { CustomFormProps } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useUsuarios,
  useCreateUsuario,
  useUpdateUsuario,
  useDeleteUsuario,
  useRoles,
  useAreas,
} from "@/lib/queries";
import type { Usuario } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({ meta: [{ title: "Usuarios — Indigo" }] }),
  component: Page,
});

function Page() {
  const { data: usuarios, isLoading } = useUsuarios();
  const { data: roles } = useRoles();
  const { data: areas } = useAreas();
  const createMutation = useCreateUsuario();
  const updateMutation = useUpdateUsuario();
  const deleteMutation = useDeleteUsuario();

  const [estadoFilter, setEstadoFilter] = useState("all");
  const [cargoFilter, setCargoFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");

  const cargos = useMemo(() => {
    const set = new Set((usuarios ?? []).map((u) => u.cargo).filter(Boolean));
    return Array.from(set).sort();
  }, [usuarios]);

  const hasActiveFilters = estadoFilter !== "all" || cargoFilter !== "all" || areaFilter !== "all";

  const clearFilters = () => {
    setEstadoFilter("all");
    setCargoFilter("all");
    setAreaFilter("all");
  };

  const filterFn = useMemo(() => {
    return (item: Usuario) => {
      if (estadoFilter !== "all" && item.estadoUsuario !== estadoFilter) return false;
      if (cargoFilter !== "all" && item.cargo !== cargoFilter) return false;
      if (areaFilter !== "all" && String(item.idArea) !== areaFilter) return false;
      return true;
    };
  }, [estadoFilter, cargoFilter, areaFilter]);

  const isUsuarioRol = (idRol: unknown) => {
    if (!idRol || !roles) return false;
    const rol = roles.find((r) => r.idRol === Number(idRol));
    return rol?.tipo === "usuario";
  };

  const renderUsuarioForm = (props: CustomFormProps<Usuario>) => {
    const { form, setForm, editing, submitting, submit, setOpen } = props;
    const esUsuario = isUsuarioRol(form.idRol);

    return (
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">
              Nombre completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nombre"
              value={String(form.nombre ?? "")}
              onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="correo">
              Correo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="correo"
              type="email"
              value={String(form.correo ?? "")}
              onChange={(e) => setForm((s) => ({ ...s, correo: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              value={String(form.telefono ?? "")}
              onChange={(e) => setForm((s) => ({ ...s, telefono: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cargo">
              Cargo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cargo"
              value={String(form.cargo ?? "")}
              onChange={(e) => setForm((s) => ({ ...s, cargo: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="idRol">
              Rol <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.idRol !== undefined && form.idRol !== "" ? String(form.idRol) : undefined}
              onValueChange={(v) => {
                const rol = roles?.find((r) => r.idRol === Number(v));
                const esUsuario = rol?.tipo === "usuario";
                setForm((s) => ({
                  ...s,
                  idRol: Number(v),
                  ...(esUsuario ? { contraseña: "" } : {}),
                }));
              }}
            >
              <SelectTrigger id="idRol">
                <SelectValue placeholder="Selecciona..." />
              </SelectTrigger>
              <SelectContent>
                {(roles ?? []).map((r) => (
                  <SelectItem key={r.idRol} value={String(r.idRol)}>
                    {r.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contraseña">
              Contraseña {!editing && !esUsuario && <span className="text-destructive">*</span>}
              {esUsuario && (
                <span className="text-xs text-muted-foreground ml-1">(no requiere)</span>
              )}
            </Label>
            <Input
              id="contraseña"
              type="password"
              value={String(form.contraseña ?? "")}
              onChange={(e) => setForm((s) => ({ ...s, contraseña: e.target.value }))}
              placeholder={
                esUsuario
                  ? "No aplica"
                  : editing
                    ? "Dejar vacío para no cambiar"
                    : "Mín. 6 caracteres"
              }
              disabled={esUsuario}
              required={!editing && !esUsuario}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="idArea">Área</Label>
            <Select
              value={
                form.idArea !== undefined && form.idArea !== "" ? String(form.idArea) : undefined
              }
              onValueChange={(v) => setForm((s) => ({ ...s, idArea: Number(v) }))}
            >
              <SelectTrigger id="idArea">
                <SelectValue placeholder="Selecciona..." />
              </SelectTrigger>
              <SelectContent>
                {(areas ?? []).map((a) => (
                  <SelectItem key={a.idArea} value={String(a.idArea)}>
                    {a.nombreArea}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {editing && (
            <div className="space-y-2">
              <Label htmlFor="estadoUsuario">Estado</Label>
              <Select
                value={String(form.estadoUsuario ?? "Activo")}
                onValueChange={(v) => setForm((s) => ({ ...s, estadoUsuario: v }))}
              >
                <SelectTrigger id="estadoUsuario">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="brand" disabled={submitting}>
            {editing ? "Guardar cambios" : "Crear"}
          </Button>
        </div>
      </form>
    );
  };

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
        <div className="flex flex-wrap items-center gap-2">
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
          <span className="text-xs text-muted-foreground">Cargo:</span>
          <Select value={cargoFilter} onValueChange={setCargoFilter}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {cargos.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">Area:</span>
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {(areas ?? []).map((a) => (
                <SelectItem key={a.idArea} value={String(a.idArea)}>
                  {a.nombreArea}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2 text-muted-foreground"
              onClick={clearFilters}
            >
              <X className="h-4 w-4 mr-1" /> Limpiar
            </Button>
          )}
        </div>
      }
      defaultValues={{ estadoUsuario: "Activo" }}
      columns={[
        { header: "Nombre", key: "nombre" },
        { header: "Correo", key: "correo" },
        { header: "Cargo", key: "cargo" },
        {
          header: "Rol",
          render: (u) => u.nombreRol ?? "—",
        },
        {
          header: "Area",
          render: (u) => u.nombreArea ?? "—",
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
        {
          key: "contraseña",
          label: "Contraseña",
          type: "password",
          required: true,
          placeholder: "Mín. 6 caracteres",
        },
        {
          key: "idRol",
          label: "Rol",
          type: "select",
          required: true,
          options: (roles ?? []).map((r) => ({ value: r.idRol, label: r.nombre })),
        },
        {
          key: "idArea",
          label: "Area",
          type: "select",
          required: false,
          options: (areas ?? []).map((a) => ({ value: a.idArea, label: a.nombreArea })),
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
      renderCustomForm={renderUsuarioForm}
      onCreate={(data) => createMutation.mutateAsync(data)}
      onUpdate={(id, data) => updateMutation.mutateAsync({ id, data })}
      onDelete={(id) => deleteMutation.mutateAsync(id)}
      loadingCreate={createMutation.isPending}
      loadingUpdate={updateMutation.isPending}
      loadingDelete={deleteMutation.isPending}
    />
  );
}
