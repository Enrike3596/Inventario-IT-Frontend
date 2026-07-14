import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { History, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ResourcePage, type CustomFormProps } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  keys,
  useActivos,
  useCreateActivo,
  useUpdateActivo,
  useDeleteActivo,
  useAsignacionesPorActivo,
  useCategorias,
  useOrdenesCompra,
  useOrdenCompraDetail,
  useDetallesItemOCPorItem,
} from "@/lib/queries";
import { sanitizeError } from "@/lib/api";
import type { Activo } from "@/lib/types";

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

const estadoTint: Record<string, string> = {
  Disponible: "bg-success/15 text-success border-success/30",
  Asignado: "bg-primary/15 text-primary border-primary/30",
  EnReparacion: "bg-warning/15 text-warning border-warning/30",
  DadoDeBaja: "bg-destructive/15 text-destructive border-destructive/30",
  Venta: "bg-muted/50 text-muted-foreground border-border",
};

const ESTADOS_ACTIVO = ["Disponible", "Asignado", "EnReparacion", "DadoDeBaja", "Venta"] as const;

function generateCodigoActivo(ocNumero?: string, marca?: string, modelo?: string, serial?: string): string {
  const ocPart = ocNumero?.replace(/[^0-9A-Za-z]/g, "").slice(-4).toUpperCase() ?? "XXXX";
  const modelPart = modelo?.slice(0, 3).toUpperCase() ?? "";
  const markPart = marca?.slice(0, 2).toUpperCase() ?? "";
  const unique = serial
    ? serial.replace(/[^0-9A-Za-z]/g, "").slice(-4).toUpperCase()
    : Date.now().toString(36).toUpperCase().slice(-4);
  return `ACT-${ocPart}-${markPart}${modelPart}${unique}`;
}

function ActivoFormContent({
  form, setForm, editing, submit, fields, setOpen,
}: CustomFormProps<Activo>) {
  const { data: categorias } = useCategorias();
  const { data: ordenes } = useOrdenesCompra();
  const createMutation = useCreateActivo();
  const queryClient = useQueryClient();
  const ocId = form.idOrden as number | undefined;
  const { data: ocDetail } = useOrdenCompraDetail(ocId ?? 0);
  const items = ocDetail?.itemsOC ?? [];
  const itemId = form.idItemOC as number | undefined;
  const { data: detallesItem } = useDetallesItemOCPorItem(itemId ?? 0);
  const pendings = detallesItem?.filter((d) => !d.procesado) ?? [];

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOCChange = (value: string) => {
    const id = Number(value);
    const oc = ordenes?.find((o) => o.idOrden === id);
    setForm((prev) => ({
      ...prev,
      idOrden: id,
      idItemOC: "",
      idCategoria: "",
      marca: "",
      modelo: "",
      referencia: "",
      codigoActivo: generateCodigoActivo(oc?.numeroOC),
    }));
  };

  const handleItemChange = (value: string) => {
    const idItem = Number(value);
    const item = items.find((i) => i.idItemOC === idItem);
    if (!item) return;
    const oc = ordenes?.find((o) => o.idOrden === form.idOrden as number);
    setForm((prev) => ({
      ...prev,
      idItemOC: idItem,
      idCategoria: item.idCategoria,
      marca: item.marca,
      modelo: item.modelo,
      referencia: item.referencia ?? "",
      codigoActivo: generateCodigoActivo(oc?.numeroOC, item.marca, item.modelo),
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
    if (pendings.length === 0 && !form.serial) {
      toast.error("Serial es obligatorio");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editing) {
        await submit(e);
      } else if (pendings.length > 0) {
        const oc = ordenes?.find((o) => o.idOrden === ocId);
        const item = items.find((i) => i.idItemOC === itemId);
        for (const det of pendings) {
          await createMutation.mutateAsync({
            idOrden: ocId!,
            idItemOC: itemId!,
            idDetalleItemOC: det.idDetalleItemOC,
            idCategoria: form.idCategoria as number,
            marca: form.marca as string,
            modelo: form.modelo as string,
            referencia: (form.referencia as string) ?? null,
            serial: det.serial,
            codigoActivo: generateCodigoActivo(oc?.numeroOC, item?.marca, item?.modelo, det.serial),
            estadoActivo: (form.estadoActivo as string) ?? "Disponible",
            observaciones: (form.observaciones as string) ?? "",
          } as Partial<Activo>);
        }
        toast.success(`${pendings.length} activo${pendings.length > 1 ? "s" : ""} creado${pendings.length > 1 ? "s" : ""} desde la orden de compra`);
      } else {
        await createMutation.mutateAsync({
          ...form,
          idOrden: form.idOrden,
          idItemOC: form.idItemOC,
        } as Partial<Activo>);
        toast.success("Activo creado");
      }
      queryClient.invalidateQueries({ queryKey: keys.ordenes.detail(ocId!) });
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
        {/* OC selector (first field) */}
        <div className="space-y-2">
          <Label htmlFor="idOrden">
            Orden de compra <span className="text-destructive"> *</span>
          </Label>
          <Select
            value={form.idOrden !== undefined && form.idOrden !== "" ? String(form.idOrden) : undefined}
            onValueChange={handleOCChange}
          >
            <SelectTrigger id="idOrden">
              <SelectValue placeholder="Selecciona orden..." />
            </SelectTrigger>
            <SelectContent>
              {(ordenes ?? []).map((o) => (
                <SelectItem key={o.idOrden} value={String(o.idOrden)}>
                  {o.numeroOC}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Item selector — solo productos con seriales pendientes */}
        {!!ocId && items.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="idItemOC">
              Producto en OC <span className="text-destructive"> *</span>
            </Label>
            <Select
              value={form.idItemOC !== undefined && form.idItemOC !== "" ? String(form.idItemOC) : undefined}
              onValueChange={handleItemChange}
            >
              <SelectTrigger id="idItemOC">
                <SelectValue placeholder="Selecciona producto..." />
              </SelectTrigger>
              <SelectContent>
                {items.filter((i) => !i.detallesItem?.every((d) => d.procesado)).map((i) => (
                  <SelectItem key={i.idItemOC} value={String(i.idItemOC)}>
                    {i.nombreProducto} — {i.marca} {i.modelo}
                  </SelectItem>
                ))}
                {items.every((i) => i.detallesItem?.every((d) => d.procesado)) && (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    Todos los productos de esta orden ya fueron procesados
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Seriales del producto (when available from OC) */}
        {!!itemId && pendings.length > 0 && (
          <div className="sm:col-span-2 space-y-2 border rounded-md p-3 bg-muted/20">
            <Label className="text-sm font-medium">
              Seriales del producto ({pendings.length} pendiente{pendings.length > 1 ? "s" : ""})
            </Label>
            <div className="space-y-1.5">
              {pendings.map((det) => (
                <div key={det.idDetalleItemOC} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Serial</Label>
                    <Input value={det.serial} readOnly className="bg-muted h-8" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Código de activo</Label>
                    <Input
                      value={generateCodigoActivo(
                        ordenes?.find((o) => o.idOrden === ocId)?.numeroOC,
                        items.find((i) => i.idItemOC === itemId)?.marca,
                        items.find((i) => i.idItemOC === itemId)?.modelo,
                        det.serial,
                      )}
                      readOnly
                      className="bg-muted h-8 font-mono text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Código activo individual (when no OC serials) */}
        {pendings.length === 0 && (
          <div className="space-y-2">
            <Label htmlFor="codigoActivo">Código activo</Label>
            <Input
              id="codigoActivo"
              value={String(form.codigoActivo ?? "")}
              readOnly
              className="bg-muted"
            />
          </div>
        )}

        {/* Categoría (auto-filled from item) */}
        <div className="space-y-2">
          <Label htmlFor="idCategoria">
            Categoría <span className="text-destructive"> *</span>
          </Label>
          <Select
            value={form.idCategoria !== undefined && form.idCategoria !== "" ? String(form.idCategoria) : undefined}
            onValueChange={(v) => {
              const opt = (categorias ?? []).find((c) => String(c.idCategoria) === v);
              setFormValue("idCategoria", opt ? opt.idCategoria : v);
            }}
          >
            <SelectTrigger id="idCategoria">
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
          />
        </div>

        {/* Referencia (auto-filled from item) */}
        <div className="space-y-2">
          <Label htmlFor="referencia">Referencia</Label>
          <Input
            id="referencia"
            value={String(form.referencia ?? "")}
            onChange={(e) => setFormValue("referencia", e.target.value)}
          />
        </div>

        {/* Serial (manual input when no OC serials) */}
        {pendings.length === 0 && (
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
        )}

        {/* Estado */}
        <div className="space-y-2">
          <Label htmlFor="estadoActivo">
            Estado <span className="text-destructive"> *</span>
          </Label>
          <Select
            value={form.estadoActivo ? String(form.estadoActivo) : undefined}
            onValueChange={(v) => setFormValue("estadoActivo", v)}
          >
            <SelectTrigger id="estadoActivo">
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_ACTIVO.map((e) => (
                <SelectItem key={e} value={e}>
                  {e === "Disponible" ? "Disponible" : e === "Asignado" ? "Asignado" : e === "EnReparacion" ? "En reparación" : e === "DadoDeBaja" ? "Dado de baja" : "Venta"}
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
          {editing ? "Guardar cambios" : pendings.length > 1 ? `Crear ${pendings.length} activos` : "Crear"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ActivosPage() {
  const { data: activos, isLoading } = useActivos();
  const { data: categorias } = useCategorias();
  const { data: ordenes } = useOrdenesCompra();
  const createMutation = useCreateActivo();
  const updateMutation = useUpdateActivo();
  const deleteMutation = useDeleteActivo();

  const [estadoFilter, setEstadoFilter] = useState("all");
  const [historialActivo, setHistorialActivo] = useState<Activo | null>(null);
  const { data: asignaciones, isLoading: loadingHistorial } = useAsignacionesPorActivo(historialActivo?.idActivo ?? null);

  const filterFn = useMemo(() => {
    if (estadoFilter === "all") return undefined;
    return (item: Activo) => item.estadoActivo === estadoFilter;
  }, [estadoFilter]);

  const renderCustomForm = (props: CustomFormProps<Activo>) => (
    <ActivoFormContent {...props} />
  );

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
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Estado:</span>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {ESTADOS_ACTIVO.map((e) => (
                  <SelectItem key={e} value={e}>{estadoLabels[e] ?? e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        defaultValues={{}}
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
              <Badge variant="outline" className={estadoTint[r.estadoActivo]}>
                {estadoLabels[r.estadoActivo] ?? r.estadoActivo}
              </Badge>
            ),
          },
        ]}
        fields={[
          { key: "codigoActivo", label: "Código activo", type: "text" },
          { key: "serial", label: "Serial", type: "text", required: true },
          { key: "marca", label: "Marca", type: "text", required: true },
          { key: "modelo", label: "Modelo", type: "text", required: true },
          { key: "referencia", label: "Referencia", type: "text" },
          {
            key: "idCategoria",
            label: "Categoría",
            type: "select",
            required: true,
            options: (categorias ?? []).map((c) => ({ value: c.idCategoria, label: c.nombre })),
          },
          {
            key: "idOrden",
            label: "Orden de compra",
            type: "select",
            required: true,
            options: (ordenes ?? []).map((o) => ({ value: o.idOrden, label: o.numeroOC })),
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
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setHistorialActivo(row)}
            aria-label="Historial de asignaciones"
          >
            <History className="h-4 w-4" />
          </Button>
        )}
        onCreate={(data) => createMutation.mutateAsync(data)}
        onUpdate={(id, data) => updateMutation.mutateAsync({ id, data })}
        onDelete={(id) => deleteMutation.mutateAsync(id)}
        loadingCreate={createMutation.isPending}
        loadingUpdate={updateMutation.isPending}
        loadingDelete={deleteMutation.isPending}
      />

      <Dialog open={!!historialActivo} onOpenChange={(o) => !o && setHistorialActivo(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Historial de asignaciones — {historialActivo?.serial ?? ""}
            </DialogTitle>
          </DialogHeader>
          {loadingHistorial ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : asignaciones && asignaciones.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Fecha asignación</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha modificación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asignaciones.map((a) => (
                  <TableRow key={a.idAsignacion}>
                    <TableCell>
                      {new Date(a.fechaAsignacion).toLocaleDateString("es-CO", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{a.nombreUsuarioDestino ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={a.estadoAsignacion === "Activa" ? "default" : "secondary"}>
                        {a.estadoAsignacion}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {a.fechaModificacion
                        ? new Date(a.fechaModificacion).toLocaleDateString("es-CO", {
                            year: "numeric", month: "short", day: "numeric",
                          })
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Este activo no tiene asignaciones registradas.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistorialActivo(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
