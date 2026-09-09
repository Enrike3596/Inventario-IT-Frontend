import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ResourcePage, type CustomFormProps } from "@/components/resource-page";
import {
  useSalidas,
  useCreateSalida,
  useUpdateSalida,
  useDeleteSalida,
  useActivos,
  useUpdateActivo,
  useCategorias,
} from "@/lib/queries";
import type { Salida, EstadoActivo, Activo, CategoriaActivo } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

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

/** Etiqueta unificada solicitada: código del activo + modelo. */
function etiquetaActivo(a: Activo): string {
  const codigo = a.codigoActivo || a.serial || `#${a.idActivo}`;
  return [codigo, a.modelo].filter(Boolean).join(" — ");
}

type SalidaForm = CustomFormProps<Salida> & {
  categorias: CategoriaActivo[];
  activosDisponibles: Activo[];
};

function SalidaFormContent({
  form,
  setForm,
  editing,
  submitting,
  submit,
  setOpen,
  categorias,
  activosDisponibles,
}: SalidaForm) {
  const categoriaId =
    form.idCategoria !== undefined && form.idCategoria !== "" && form.idCategoria !== null
      ? Number(form.idCategoria)
      : undefined;

  const activosFiltrados = useMemo(() => {
    if (!categoriaId) return [];
    return activosDisponibles
      .filter((a) => a.idCategoria === categoriaId)
      .sort((x, y) => etiquetaActivo(x).localeCompare(etiquetaActivo(y)));
  }, [activosDisponibles, categoriaId]);

  const activoSeleccionado = useMemo(() => {
    if (form.idActivo === undefined || form.idActivo === "" || form.idActivo === null)
      return undefined;
    return activosDisponibles.find((a) => a.idActivo === Number(form.idActivo));
  }, [activosDisponibles, form.idActivo]);

  const handleCategoriaChange = (v: string) => {
    setForm((s) => ({ ...s, idCategoria: Number(v), idActivo: "" }));
  };

  const handleActivoChange = (v: string) => {
    setForm((s) => ({ ...s, idActivo: Number(v) }));
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. Categoría: filtra el siguiente campo */}
        <div className="space-y-2">
          <Label htmlFor="idCategoria">
            Categoría <span className="text-destructive"> *</span>
          </Label>
          <Select
            value={categoriaId !== undefined ? String(categoriaId) : undefined}
            onValueChange={handleCategoriaChange}
          >
            <SelectTrigger id="idCategoria">
              <SelectValue placeholder="Selecciona categoría..." />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((c) => (
                <SelectItem key={c.idCategoria} value={String(c.idCategoria)}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 2. Activo: solo los asociados a la categoría elegida */}
        <div className="space-y-2">
          <Label htmlFor="idActivo">
            Activo (código — modelo) <span className="text-destructive"> *</span>
          </Label>
          <Select
            value={
              form.idActivo !== undefined && form.idActivo !== "" && form.idActivo !== null
                ? String(form.idActivo)
                : undefined
            }
            onValueChange={handleActivoChange}
            disabled={!categoriaId}
          >
            <SelectTrigger id="idActivo">
              <SelectValue
                placeholder={
                  !categoriaId
                    ? "Primero selecciona una categoría..."
                    : activosFiltrados.length === 0
                      ? "Sin activos disponibles..."
                      : "Selecciona activo..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              {activosFiltrados.map((a) => (
                <SelectItem key={a.idActivo} value={String(a.idActivo)}>
                  {etiquetaActivo(a)}
                </SelectItem>
              ))}
              {categoriaId !== undefined && activosFiltrados.length === 0 && (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  No hay activos disponibles en esta categoría
                </div>
              )}
            </SelectContent>
          </Select>
          {categoriaId !== undefined && activosFiltrados.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {activosFiltrados.length} activo{activosFiltrados.length === 1 ? "" : "s"} disponible
              {activosFiltrados.length === 1 ? "" : "s"} en esta categoría
            </p>
          )}
          {activoSeleccionado && (
            <p className="text-xs text-muted-foreground">
              Serial: {activoSeleccionado.serial} · Marca: {activoSeleccionado.marca}
            </p>
          )}
        </div>

        {/* 3. Estado del activo */}
        <div className="space-y-2">
          <Label htmlFor="estadoActivo">
            Estado del activo <span className="text-destructive"> *</span>
          </Label>
          <Select
            value={form.estadoActivo ? String(form.estadoActivo) : undefined}
            onValueChange={(v) => setForm((s) => ({ ...s, estadoActivo: v }))}
          >
            <SelectTrigger id="estadoActivo">
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              {estadoOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 4. Causa de salida */}
        <div className="space-y-2">
          <Label htmlFor="observaciones">
            Causa de salida <span className="text-destructive"> *</span>
          </Label>
          <Select
            value={form.observaciones ? String(form.observaciones) : undefined}
            onValueChange={(v) => setForm((s) => ({ ...s, observaciones: v }))}
          >
            <SelectTrigger id="observaciones">
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              {causaOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button type="submit" variant="brand" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {editing ? "Guardar cambios" : "Crear"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function Page() {
  const { data: salidas, isLoading } = useSalidas();
  const { data: activos } = useActivos();
  const { data: categorias } = useCategorias();
  const createMutation = useCreateSalida();
  const updateMutation = useUpdateSalida();
  const deleteMutation = useDeleteSalida();
  const updateActivo = useUpdateActivo();

  const salidaActivoIds = new Set(
    (salidas ?? []).flatMap((s) =>
      [s.activos?.[0]?.idActivo, s.idActivo].filter((v): v is number => typeof v === "number"),
    ),
  );

  // Solo disponibles (o el ya vinculado si se está editando) para no saturar el listado.
  const activosDisponibles = useMemo(
    () =>
      (activos ?? []).filter(
        (a) => a.estadoActivo === "Disponible" || salidaActivoIds.has(a.idActivo),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activos, salidas],
  );

  const activoPorId = useMemo(
    () => new Map((activos ?? []).map((a) => [a.idActivo, a])),
    [activos],
  );

  const renderCustomForm = (props: CustomFormProps<Salida>) => (
    <SalidaFormContent
      {...props}
      categorias={categorias ?? []}
      activosDisponibles={activosDisponibles}
    />
  );

  return (
    <ResourcePage<Salida>
      hideView
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
          header: "Categoría",
          render: (s) => {
            const id = s.activos?.[0]?.idActivo ?? s.idActivo;
            const a = id !== undefined ? activoPorId.get(id) : undefined;
            return a?.nombreCategoria ?? s.nombreCategoria ?? "—";
          },
        },
        {
          header: "Activo",
          render: (s) => {
            const a = s.activos?.[0];
            if (a?.idActivo !== undefined) {
              const full = activoPorId.get(a.idActivo);
              if (full) return etiquetaActivo(full);
            }
            return (
              [a?.codigoActivo ?? s.codigoActivo, a?.modelo ?? s.modelo]
                .filter(Boolean)
                .join(" — ") ||
              [s.codigoActivo, s.serial, s.marca, s.modelo].filter(Boolean).join(" — ") ||
              "—"
            );
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
          key: "idCategoria",
          label: "Categoría",
          type: "select",
          required: true,
          options: (categorias ?? []).map((c) => ({
            value: c.idCategoria,
            label: c.nombre,
          })),
        },
        {
          key: "idActivo",
          label: "Activo",
          type: "select",
          required: true,
          options: [],
        },
        {
          key: "estadoActivo",
          label: "Estado del activo",
          type: "select",
          required: true,
          options: estadoOptions,
        },
        {
          key: "observaciones",
          label: "Causa de salida",
          type: "select",
          required: true,
          options: causaOptions,
        },
      ]}
      renderCustomForm={renderCustomForm}
      validate={(form) => {
        if (!form.idCategoria) return "La categoría es obligatoria";
        if (!form.idActivo) return "El activo es obligatorio";
        if (!form.estadoActivo) return "El estado del activo es obligatorio";
        if (!form.observaciones) return "La causa de salida es obligatoria";
        return null;
      }}
      transformCreate={(data) => {
        const d = data as Record<string, unknown>;
        return {
          estadoActivo: d.estadoActivo,
          observaciones: d.observaciones,
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
        const idActivo = a?.idActivo ?? row.idActivo;
        const full = idActivo !== undefined ? activoPorId.get(idActivo) : undefined;
        return {
          estadoActivo: row.estadoActivo,
          idCategoria: full?.idCategoria ?? "",
          idActivo: idActivo ?? "",
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
                  idRemision: activo.idRemision,
                  idItemRemision: activo.idItemRemision,
                  idDetalleItemRemision: activo.idDetalleItemRemision,
                  codigoActivo: activo.codigoActivo,
                  serial: activo.serial,
                  marca: activo.marca,
                  modelo: activo.modelo,
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
