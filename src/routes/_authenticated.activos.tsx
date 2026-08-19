import { useState, useMemo, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  History,
  Loader2,
  ArrowRightFromLine,
  ArrowLeftToLine,
  Wrench,
  Trash2,
  Tags,
  ArrowDown,
  UserCheck,
  UserX,
  X,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { ResourcePage, type CustomFormProps } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  keys,
  useActivos,
  useAsignaciones,
  useCreateActivo,
  useUpdateActivo,
  useDeleteActivo,
  useRegistrarRegresoReparacion,
  useMovimientosPorActivo,
  useAsignacionesPorActivo,
  useCategorias,
  useRemisiones,
  useRemisionDetail,
  useDetallesItemRemisionPorItem,
} from "@/lib/queries";
import { sanitizeError } from "@/lib/api";
import type { Activo, Movimiento } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/activos")({
  head: () => ({ meta: [{ title: "Activos TI — Indigo" }] }),
  component: ActivosPage,
});

const estadoLabels: Record<string, string> = {
  Disponible: "Disponible",
  Asignado: "Asignado",
  EnReparacion: "En reparación",
  DadoDeBaja: "Dado de baja",
  Venta: "Venta",
};

const salidaEstadoLabels: Record<string, string> = {
  EnReparacion: "En reparación",
  DadoDeBaja: "Dado de baja",
  Venta: "Venta",
};

const estadoTint: Record<string, string> = {
  Disponible: "bg-success/15 text-success border-success/30",
  Asignado: "bg-primary/15 text-primary border-primary/30",
  EnReparacion: "bg-warning/15 text-warning border-warning/30",
  DadoDeBaja: "bg-destructive/15 text-destructive border-destructive/30",
  Venta: "bg-muted/50 text-muted-foreground border-border",
};

const ESTADOS_ACTIVO = ["Disponible", "Asignado", "EnReparacion", "DadoDeBaja", "Venta"] as const;

const tipoIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  Entrada: ArrowRightFromLine,
  Asignacion: UserCheck,
  Devolucion: UserX,
  Reparacion: Wrench,
  Salida: ArrowLeftToLine,
  Baja: Trash2,
};

const tipoBg: Record<string, string> = {
  Entrada: "bg-success/15 text-success",
  Asignacion: "bg-primary/15 text-primary",
  Devolucion: "bg-accent/40 text-accent-foreground",
  Reparacion: "bg-warning/15 text-warning",
  Salida: "bg-muted/50 text-muted-foreground",
  Baja: "bg-destructive/15 text-destructive",
};

const tipoBadge: Record<string, string> = {
  Entrada: "bg-success/15 text-success border-success/30",
  Asignacion: "bg-primary/15 text-primary border-primary/30",
  Devolucion: "bg-accent/40 text-accent-foreground border-accent",
  Reparacion: "bg-warning/15 text-warning border-warning/30",
  Salida: "bg-muted/50 text-muted-foreground border-border",
  Baja: "bg-destructive/15 text-destructive border-destructive/30",
};

const tipoLabel: Record<string, string> = {
  Entrada: "Ingreso",
  Asignacion: "Asignación",
  Devolucion: "Devolución",
  Reparacion: "Reparación",
  Salida: "Salida",
  Baja: "Dado de baja",
};

function renderMovimientoDesc(m: Movimiento): React.ReactNode {
  switch (m.tipoMovimiento) {
    case "Entrada":
      return <span>Ingreso del activo al inventario.</span>;
    case "Asignacion":
      return (
        <span>
          Asignado a <strong>{m.nombreUsuarioAsignado ?? "—"}</strong>
          {m.nombreUsuarioEntrega ? (
            <>
              {" "}
              por <strong>{m.nombreUsuarioEntrega}</strong>
            </>
          ) : (
            ""
          )}
        </span>
      );
    case "Devolucion":
      return (
        <span>
          {m.nombreUsuarioAsignado ? `Devuelto por ${m.nombreUsuarioAsignado}` : "Devuelto"}
          {m.nombreUsuarioEntrega ? ` (recibido por ${m.nombreUsuarioEntrega})` : ""}
          {m.motivo ? ` — Motivo: ${m.motivo}` : ""}
          {m.estadoDevolucion ? ` — Estado devuelto: ${m.estadoDevolucion}` : ""}
          {m.estadoNuevo === "Disponible"
            ? " — el activo queda en Disponible"
            : m.estadoNuevo
              ? ` — queda en ${estadoLabels[m.estadoNuevo] ?? m.estadoNuevo}`
              : ""}
        </span>
      );
    case "Reparacion":
      return (
        <span>
          Enviado a reparación
          {m.estadoAnterior
            ? ` (estado anterior: ${estadoLabels[m.estadoAnterior] ?? m.estadoAnterior})`
            : ""}
          {m.observaciones ? ` — ${m.observaciones}` : ""}
        </span>
      );
    case "Salida":
      return (
        <span>
          {m.estadoActivoSalida
            ? `Salida por ${salidaEstadoLabels[m.estadoActivoSalida] ?? m.estadoActivoSalida}`
            : "Salida del inventario"}
          {m.codigoSalida ? ` (Código: ${m.codigoSalida})` : ""}
          {m.observaciones ? ` — ${m.observaciones}` : ""}
        </span>
      );
    case "Baja":
      return (
        <span>
          Activo dado de baja
          {m.estadoAnterior
            ? ` (estado anterior: ${estadoLabels[m.estadoAnterior] ?? m.estadoAnterior})`
            : ""}
          {m.observaciones ? ` — ${m.observaciones}` : ""}
        </span>
      );
    default:
      return <span>{m.observaciones ?? "—"}</span>;
  }
}

function generateCodigoActivo(
  ocNumero?: string,
  marca?: string,
  modelo?: string,
  serial?: string,
): string {
  const ocPart =
    ocNumero
      ?.replace(/[^0-9A-Za-z]/g, "")
      .slice(-4)
      .toUpperCase() ?? "XXXX";
  const modelPart = modelo?.slice(0, 3).toUpperCase() ?? "";
  const markPart = marca?.slice(0, 2).toUpperCase() ?? "";
  const unique = serial
    ? serial
        .replace(/[^0-9A-Za-z]/g, "")
        .slice(-4)
        .toUpperCase()
    : Date.now().toString(36).toUpperCase().slice(-4);
  return `ACT-${ocPart}-${markPart}${modelPart}${unique}`;
}

function ActivoFormContent({
  form,
  setForm,
  editing,
  submit,
  fields,
  setOpen,
}: CustomFormProps<Activo>) {
  const { data: categorias } = useCategorias();
  const { data: remisiones } = useRemisiones();
  const createMutation = useCreateActivo();
  const queryClient = useQueryClient();
  const remId = form.idRemision as number | undefined;
  const { data: remDetail } = useRemisionDetail(remId ?? 0);
  const items = remDetail?.itemsRemision ?? [];
  const itemId = form.idItemRemision as number | undefined;
  const { data: detallesItem } = useDetallesItemRemisionPorItem(itemId ?? 0);
  const pendings = detallesItem?.filter((d) => !d.procesado) ?? [];

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: asignacionesActivo } = useAsignacionesPorActivo(editing?.idActivo ?? null);
  const hasAsignacionActiva = useMemo(
    () => (asignacionesActivo ?? []).some((a) => a.estadoAsignacion === "Activa"),
    [asignacionesActivo],
  );

  const handleRemisionChange = (value: string) => {
    const id = Number(value);
    const rem = remisiones?.find((r) => r.idRemision === id);
    setForm((prev) => ({
      ...prev,
      idRemision: id,
      idItemRemision: "",
      idCategoria: "",
      marca: "",
      modelo: "",
      codigoActivo: generateCodigoActivo(rem?.numeroRemision),
      estadoActivo: "Disponible",
    }));
  };

  const handleItemChange = (value: string) => {
    const idItem = Number(value);
    const item = items.find((i) => i.idItemRemision === idItem);
    if (!item) return;
    const rem = remisiones?.find((r) => r.idRemision === (form.idRemision as number));
    setForm((prev) => ({
      ...prev,
      idItemRemision: idItem,
      idCategoria: item.idCategoria,
      marca: item.marca,
      modelo: item.modelo,
      codigoActivo: generateCodigoActivo(rem?.numeroRemision, item.marca, item.modelo),
      estadoActivo: "Disponible",
    }));
  };

  const setFormValue = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const f of fields) {
      if (f.key === "serial" && pendings.length > 0) continue;
      if (f.required && (form[f.key] === "" || form[f.key] === undefined || form[f.key] === null)) {
        toast.error(`${f.label} es obligatorio`);
        return;
      }
    }
    if (!form.serial && pendings.length === 0) {
      toast.error("Serial es obligatorio");
      return;
    }
    if (editing && hasAsignacionActiva && form.estadoActivo !== "Asignado") {
      toast.error(
        "Este activo tiene una asignación activa; su estado debe permanecer 'Asignado'. Finaliza la asignación antes de cambiarlo.",
      );
      return;
    }
    setIsSubmitting(true);
    try {
      if (editing) {
        await submit(e);
      } else if (pendings.length > 0) {
        const det = pendings[0];
        await createMutation.mutateAsync({
          idRemision: remId!,
          idItemRemision: itemId!,
          idDetalleItemRemision: det.idDetalleItemRemision,
          idCategoria: form.idCategoria as number,
          marca: form.marca as string,
          modelo: form.modelo as string,
          serial: det.serial,
          codigoActivo:
            (form.codigoActivo as string) ||
            generateCodigoActivo(
              remisiones?.find((r) => r.idRemision === remId)?.numeroRemision,
              items.find((i) => i.idItemRemision === itemId)?.marca,
              items.find((i) => i.idItemRemision === itemId)?.modelo,
              det.serial,
            ),
          estadoActivo: (form.estadoActivo as string) ?? "Disponible",
          observaciones: (form.observaciones as string) ?? "",
        } as Partial<Activo>);
        toast.success("Activo creado desde la remisión");
      } else {
        await createMutation.mutateAsync({
          ...form,
          idRemision: form.idRemision,
          idItemRemision: form.idItemRemision,
        } as Partial<Activo>);
        toast.success("Activo creado");
      }
      if (remId) queryClient.invalidateQueries({ queryKey: keys.remisiones.detail(remId) });
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear activo(s)";
      toast.error(sanitizeError(message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const busy = isSubmitting || createMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Remisión selector (first field) */}
        <div className="space-y-2">
          <Label htmlFor="idRemision">
            Remisión <span className="text-destructive"> *</span>
          </Label>
          <Select
            value={
              form.idRemision !== undefined && form.idRemision !== ""
                ? String(form.idRemision)
                : undefined
            }
            onValueChange={handleRemisionChange}
          >
            <SelectTrigger id="idRemision">
              <SelectValue placeholder="Selecciona remisión..." />
            </SelectTrigger>
            <SelectContent>
              {(remisiones ?? []).map((r) => (
                <SelectItem key={r.idRemision} value={String(r.idRemision)}>
                  {r.numeroRemision}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Item selector — solo productos con seriales pendientes */}
        {!!remId && items.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="idItemRemision">
              Producto en la remisión <span className="text-destructive"> *</span>
            </Label>
            <Select
              value={
                form.idItemRemision !== undefined && form.idItemRemision !== ""
                  ? String(form.idItemRemision)
                  : undefined
              }
              onValueChange={handleItemChange}
            >
              <SelectTrigger id="idItemRemision">
                <SelectValue placeholder="Selecciona producto..." />
              </SelectTrigger>
              <SelectContent>
                {items
                  .filter(
                    (i) =>
                      !i.detallesItem ||
                      i.detallesItem.length === 0 ||
                      !i.detallesItem.every((d) => d.procesado),
                  )
                  .map((i) => (
                    <SelectItem key={i.idItemRemision} value={String(i.idItemRemision)}>
                      {i.marca} {i.modelo}
                    </SelectItem>
                  ))}
                {items.every(
                  (i) =>
                    i.detallesItem &&
                    i.detallesItem.length > 0 &&
                    i.detallesItem.every((d) => d.procesado),
                ) && (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    Todos los productos de esta remisión ya fueron procesados
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Serial y código cuando hay seriales pendientes desde la remisión */}
        {!!itemId && pendings.length > 0 && (
          <>
            {pendings.slice(0, 1).map((det) => (
              <div key={det.idDetalleItemRemision} className="space-y-2">
                <Label htmlFor="serialOC">Serial</Label>
                <Input id="serialOC" value={det.serial} readOnly className="bg-muted" />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="codigoActivoOC">
                Código activo <span className="text-destructive"> *</span>
              </Label>
              <Input
                id="codigoActivoOC"
                value={String(form.codigoActivo ?? "")}
                onChange={(e) => setFormValue("codigoActivo", e.target.value)}
                placeholder="Ej: ACT-0023-XX01"
              />
            </div>
          </>
        )}

        {/* Campos manuales cuando NO hay OC con seriales pendientes */}
        {(!itemId || pendings.length === 0) && (
          <>
            <div className="space-y-2">
              <Label htmlFor="codigoActivo">Código activo</Label>
              <Input
                id="codigoActivo"
                value={String(form.codigoActivo ?? "")}
                onChange={(e) => setFormValue("codigoActivo", e.target.value)}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serial">
                Serial <span className="text-destructive"> *</span>
              </Label>
              <Input
                id="serial"
                value={String(form.serial ?? "")}
                onChange={(e) => setFormValue("serial", e.target.value)}
              />
            </div>
          </>
        )}

        {/* Categoría (auto-filled from item) */}
        <div className="space-y-2">
          <Label htmlFor="idCategoria">
            Categoría <span className="text-destructive"> *</span>
          </Label>
          <Select
            value={
              form.idCategoria !== undefined && form.idCategoria !== ""
                ? String(form.idCategoria)
                : undefined
            }
            onValueChange={(v) => {
              const opt = (categorias ?? []).find((c) => String(c.idCategoria) === v);
              setFormValue("idCategoria", opt ? opt.idCategoria : v);
            }}
            disabled={!!itemId}
          >
            <SelectTrigger id="idCategoria" className={itemId ? "bg-muted" : ""}>
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              {(categorias ?? []).map((c) => (
                <SelectItem key={c.idCategoria} value={String(c.idCategoria)}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Marca (auto-filled from item) */}
        <div className="space-y-2">
          <Label htmlFor="marca">
            Marca <span className="text-destructive"> *</span>
          </Label>
          <Input
            id="marca"
            value={String(form.marca ?? "")}
            onChange={(e) => setFormValue("marca", e.target.value)}
            readOnly={!!itemId}
            className={itemId ? "bg-muted" : ""}
          />
        </div>

        {/* Modelo (auto-filled from item) */}
        <div className="space-y-2">
          <Label htmlFor="modelo">
            Modelo <span className="text-destructive"> *</span>
          </Label>
          <Input
            id="modelo"
            value={String(form.modelo ?? "")}
            onChange={(e) => setFormValue("modelo", e.target.value)}
            readOnly={!!itemId}
            className={itemId ? "bg-muted" : ""}
          />
        </div>

        {/* Estado */}
        <div className="space-y-2">
          <Label htmlFor="estadoActivo">
            Estado <span className="text-destructive"> *</span>
          </Label>
          <Select
            value={form.estadoActivo ? String(form.estadoActivo) : undefined}
            onValueChange={(v) => setFormValue("estadoActivo", v)}
            disabled={!!itemId}
          >
            <SelectTrigger id="estadoActivo" className={itemId ? "bg-muted" : ""}>
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              {(editing && hasAsignacionActiva ? ["Asignado"] : ESTADOS_ACTIVO).map((e) => (
                <SelectItem key={e} value={e}>
                  {e === "Disponible"
                    ? "Disponible"
                    : e === "Asignado"
                      ? "Asignado"
                      : e === "EnReparacion"
                        ? "En reparación"
                        : e === "DadoDeBaja"
                          ? "Dado de baja"
                          : "Venta"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Observaciones */}
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="observaciones">Observaciones</Label>
          <Textarea
            id="observaciones"
            value={String(form.observaciones ?? "")}
            onChange={(e) => setFormValue("observaciones", e.target.value)}
            readOnly={!!itemId}
            className={itemId ? "bg-muted" : ""}
            rows={3}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
          Cancelar
        </Button>
        <Button type="submit" variant="brand" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {editing ? "Guardar cambios" : pendings.length > 0 ? "Crear activo" : "Crear"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ActivosPage() {
  const { data: activos, isLoading } = useActivos();
  const { data: asignaciones } = useAsignaciones();
  const { data: categorias } = useCategorias();
  const { data: remisiones } = useRemisiones();
  const createMutation = useCreateActivo();
  const updateMutation = useUpdateActivo();
  const deleteMutation = useDeleteActivo();
  const regresoReparacionMutation = useRegistrarRegresoReparacion();

  const [estadoFilter, setEstadoFilter] = useState("all");
  const [categoriaFilter, setCategoriaFilter] = useState("all");
  const [historialActivo, setHistorialActivo] = useState<Activo | null>(null);
  const [regresoReparacionActivo, setRegresoReparacionActivo] = useState<Activo | null>(null);
  const [observacionesRegreso, setObservacionesRegreso] = useState("");
  const { data: movimientos, isLoading: loadingHistorial } = useMovimientosPorActivo(
    historialActivo?.idActivo ?? null,
  );

  const activoAsignadoIds = useMemo(
    () =>
      new Set(
        (asignaciones ?? []).filter((a) => a.estadoAsignacion === "Activa").map((a) => a.idActivo),
      ),
    [asignaciones],
  );

  const estadoEfectivo = useCallback(
    (item: Activo): string => {
      if (item.estadoActivo === "Disponible" && activoAsignadoIds.has(item.idActivo))
        return "Asignado";
      return item.estadoActivo;
    },
    [activoAsignadoIds],
  );

  const hasActiveFilters = estadoFilter !== "all" || categoriaFilter !== "all";

  const clearFilters = () => {
    setEstadoFilter("all");
    setCategoriaFilter("all");
  };

  const filterFn = useMemo(() => {
    return (item: Activo) => {
      if (estadoFilter !== "all" && estadoEfectivo(item) !== estadoFilter) return false;
      if (categoriaFilter !== "all" && String(item.idCategoria) !== categoriaFilter) return false;
      return true;
    };
  }, [estadoFilter, categoriaFilter, estadoEfectivo]);

  const renderCustomForm = (props: CustomFormProps<Activo>) => <ActivoFormContent {...props} />;

  return (
    <>
      <ResourcePage<Activo>
        title="Activos TI"
        subtitle="Inventario de equipos y dispositivos tecnológicos"
        data={activos ?? []}
        isLoading={isLoading}
        idKey="idActivo"
        singular="activo"
        searchKeys={["serial", "marca", "modelo", "codigoActivo", "observaciones"]}
        filterFn={filterFn}
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Estado:</span>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {ESTADOS_ACTIVO.map((e) => (
                  <SelectItem key={e} value={e}>
                    {estadoLabels[e] ?? e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">Categoría:</span>
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {(categorias ?? []).map((c) => (
                  <SelectItem key={c.idCategoria} value={String(c.idCategoria)}>
                    {c.nombre}
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
        defaultValues={{ estadoActivo: "Disponible" }}
        columns={[
          { header: "Código", key: "codigoActivo" },
          { header: "Serial", key: "serial" },
          { header: "Marca", key: "marca" },
          { header: "Modelo", key: "modelo" },
          {
            header: "Categoría",
            render: (r) => r.nombreCategoria ?? "—",
          },
          {
            header: "Estado",
            render: (r) => (
              <Badge variant="outline" className={estadoTint[estadoEfectivo(r)]}>
                {estadoLabels[estadoEfectivo(r)] ?? estadoEfectivo(r)}
              </Badge>
            ),
          },
        ]}
        fields={[
          { key: "codigoActivo", label: "Código activo", type: "text" },
          { key: "serial", label: "Serial", type: "text", required: true },
          { key: "marca", label: "Marca", type: "text", required: true },
          { key: "modelo", label: "Modelo", type: "text", required: true },
          {
            key: "idCategoria",
            label: "Categoría",
            type: "select",
            required: true,
            options: (categorias ?? []).map((c) => ({ value: c.idCategoria, label: c.nombre })),
          },
          {
            key: "idRemision",
            label: "Remisión",
            type: "select",
            required: true,
            options: (remisiones ?? []).map((r) => ({
              value: r.idRemision,
              label: r.numeroRemision,
            })),
          },
          {
            key: "estadoActivo",
            label: "Estado",
            type: "select",
            required: true,
            options: [
              { value: "Disponible", label: "Disponible" },
              { value: "Asignado", label: "Asignado" },
              { value: "EnReparacion", label: "En reparación" },
              { value: "DadoDeBaja", label: "Dado de baja" },
              { value: "Venta", label: "Venta" },
            ],
          },
          { key: "observaciones", label: "Observaciones", type: "textarea" },
        ]}
        renderCustomForm={renderCustomForm}
        extraActions={(row) => (
          <>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setHistorialActivo(row)}
              aria-label="Historial de asignaciones"
            >
              <History className="h-4 w-4" />
            </Button>
            {estadoEfectivo(row) === "EnReparacion" && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setRegresoReparacionActivo(row);
                  setObservacionesRegreso("");
                }}
                aria-label="Registrar regreso de reparación"
                className="text-warning hover:text-warning"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
        onCreate={(data) => createMutation.mutateAsync(data)}
        onUpdate={(id, data) => updateMutation.mutateAsync({ id, data })}
        onDelete={(id) => deleteMutation.mutateAsync(id)}
        loadingCreate={createMutation.isPending}
        loadingUpdate={updateMutation.isPending}
        loadingDelete={deleteMutation.isPending}
      />

      <Dialog open={!!historialActivo} onOpenChange={(o) => !o && setHistorialActivo(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historial del activo — {historialActivo?.serial ?? ""}</DialogTitle>
            {historialActivo && (
              <p className="text-sm text-muted-foreground">
                {historialActivo.marca} {historialActivo.modelo} — {historialActivo.codigoActivo}
              </p>
            )}
          </DialogHeader>
          {loadingHistorial ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : movimientos && movimientos.length > 0 ? (
            <div className="space-y-2">
              {movimientos.map((m) => {
                const Icon = tipoIcon[m.tipoMovimiento] ?? ArrowDown;
                const tint = tipoBg[m.tipoMovimiento] ?? "bg-muted/50 text-muted-foreground";
                return (
                  <div key={m.idHistorial} className="flex items-start gap-3 rounded-lg border p-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tint}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={tipoBadge[m.tipoMovimiento]}>
                          {tipoLabel[m.tipoMovimiento] ?? m.tipoMovimiento}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(m.fechaMovimiento).toLocaleDateString("es-CO", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="mt-1 text-sm">{renderMovimientoDesc(m)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Este activo no tiene movimientos registrados.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistorialActivo(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!regresoReparacionActivo}
        onOpenChange={(o) => !o && setRegresoReparacionActivo(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Regreso de Reparación</DialogTitle>
            <DialogDescription>
              Activo: {regresoReparacionActivo?.serial} — {regresoReparacionActivo?.marca}{" "}
              {regresoReparacionActivo?.modelo}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="observacionesRegreso">
                Observaciones del regreso <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="observacionesRegreso"
                value={observacionesRegreso}
                onChange={(e) => setObservacionesRegreso(e.target.value)}
                placeholder="Describa qué se reparó, quién lo realizó, costo, etc."
                rows={4}
                required
              />
            </div>
            {regresoReparacionMutation.isPending && (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRegresoReparacionActivo(null)}
              disabled={regresoReparacionMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="brand"
              onClick={async () => {
                if (!observacionesRegreso.trim()) {
                  toast.error("Las observaciones son obligatorias");
                  return;
                }
                try {
                  await regresoReparacionMutation.mutateAsync({
                    id: regresoReparacionActivo!.idActivo,
                    observaciones: observacionesRegreso.trim(),
                  });
                  toast.success("Activo regresado a Disponible exitosamente");
                  setRegresoReparacionActivo(null);
                  setObservacionesRegreso("");
                } catch (err) {
                  const message =
                    err instanceof Error ? err.message : "Error al registrar el regreso";
                  toast.error(sanitizeError(message));
                }
              }}
              disabled={regresoReparacionMutation.isPending || !observacionesRegreso.trim()}
            >
              Confirmar Regreso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
