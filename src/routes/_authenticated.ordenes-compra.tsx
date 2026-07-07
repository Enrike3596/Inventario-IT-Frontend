import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, PackageCheck, ScanLine, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import {
  useOrdenesCompra, useCreateOrdenCompra, useUpdateOrdenCompra, useDeleteOrdenCompra, useConfirmarIngreso,
  useCategorias,
} from "@/lib/queries";
import { apiFetch } from "@/lib/api";
import type { OrdenCompra, OrdenCompraDetail } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/ordenes-compra")({
  head: () => ({ meta: [{ title: "Órdenes de Compra — SICOT" }] }),
  component: Page,
});

const money = new Intl.NumberFormat("es-CO", {
  style: "currency", currency: "COP", maximumFractionDigits: 0,
});

function Page() {
  const { can } = useAuth();
  const { data: ordenes, isLoading } = useOrdenesCompra();
  const { data: categorias } = useCategorias();
  const createMutation = useCreateOrdenCompra();
  const updateMutation = useUpdateOrdenCompra();
  const deleteMutation = useDeleteOrdenCompra();
  const confirmarMutation = useConfirmarIngreso();

  const qc = useQueryClient();
  const canCreate = can("create");
  const canEdit = can("edit");
  const canDelete = can("delete");

  // OC form state
  const [ocFormOpen, setOcFormOpen] = useState(false);
  const [editingOC, setEditingOC] = useState<OrdenCompra | null>(null);
  const [ocForm, setOcForm] = useState({ numeroOC: "", proveedor: "", total: 0, observaciones: "" });
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [toDelete, setToDelete] = useState<OrdenCompra | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Expanded OC detail
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // ItemOC form
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [itemForOrden, setItemForOrden] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState({
    idCategoria: "", nombreProducto: "", marca: "", modelo: "",
    referencia: "", observaciones: "", cantidadEsperada: 1,
  });

  // Serial form
  const [serialFormOpen, setSerialFormOpen] = useState(false);
  const [serialForItem, setSerialForItem] = useState<{ idItemOC: number; nombre: string } | null>(null);
  const [serialInput, setSerialInput] = useState("");
  const [serialBatch, setSerialBatch] = useState<string[]>([]);

  const openCreateOC = () => {
    setOcForm({ numeroOC: "", proveedor: "", total: 0, observaciones: "" });
    setEditingOC(null);
    setOcFormOpen(true);
  };

  const openEditOC = (oc: OrdenCompra) => {
    setOcForm({ numeroOC: oc.numeroOC, proveedor: oc.proveedor, total: oc.total, observaciones: oc.observaciones });
    setEditingOC(oc);
    setOcFormOpen(true);
  };

  const submitOC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ocForm.numeroOC || !ocForm.proveedor) {
      toast.error("N° OC y Proveedor son obligatorios"); return;
    }
    setSubmitting(true);
    try {
      if (editingOC) {
        await updateMutation.mutateAsync({ id: editingOC.idOrden, data: ocForm });
        toast.success("Orden actualizada");
      } else {
        await createMutation.mutateAsync(ocForm);
        toast.success("Orden creada");
      }
      setOcFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally { setSubmitting(false); }
  };

  const deleteOC = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync(toDelete.idOrden);
      toast.success("Orden eliminada");
      setToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally { setDeleting(false); }
  };

  const confirmarOC = async (id: number) => {
    try {
      const result = await confirmarMutation.mutateAsync(id);
      toast.success(`Ingreso confirmado. ${result.length} activo(s) creado(s).`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  const openAddItem = (idOrden: number) => {
    setItemForOrden(idOrden);
    setItemForm({ idCategoria: "", nombreProducto: "", marca: "", modelo: "", referencia: "", observaciones: "", cantidadEsperada: 1 });
    setItemFormOpen(true);
  };

  const submitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForOrden || !itemForm.idCategoria || !itemForm.nombreProducto || !itemForm.marca || !itemForm.modelo) {
      toast.error("Categoría, producto, marca y modelo son obligatorios"); return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/ItemsOC", {
        method: "POST",
        body: JSON.stringify({
          idOrden: itemForOrden,
          idCategoria: Number(itemForm.idCategoria),
          nombreProducto: itemForm.nombreProducto,
          marca: itemForm.marca,
          modelo: itemForm.modelo,
          referencia: itemForm.referencia || null,
          observaciones: itemForm.observaciones || null,
          cantidadEsperada: itemForm.cantidadEsperada,
        }),
      });
      toast.success("Ítem agregado a la orden");
      setItemFormOpen(false);
      qc.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally { setSubmitting(false); }
  };

  const openAddSerials = (idItemOC: number, nombre: string) => {
    setSerialForItem({ idItemOC, nombre });
    setSerialInput("");
    setSerialBatch([]);
    setSerialFormOpen(true);
  };

  const addSerialToBatch = () => {
    const s = serialInput.trim();
    if (!s) return;
    if (serialBatch.includes(s)) { toast.error("Serial ya agregado"); return; }
    setSerialBatch((prev) => [...prev, s]);
    setSerialInput("");
  };

  const removeSerialFromBatch = (idx: number) => {
    setSerialBatch((prev) => prev.filter((_, i) => i !== idx));
  };

  const submitSerials = async () => {
    if (!serialForItem || serialBatch.length === 0) {
      toast.error("Agrega al menos un serial"); return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/DetallesItemOC/batch", {
        method: "POST",
        body: JSON.stringify({ idItemOC: serialForItem.idItemOC, seriales: serialBatch }),
      });
      toast.success(`${serialBatch.length} serial(es) registrado(s)`);
      setSerialFormOpen(false);
      qc.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally { setSubmitting(false); }
  };

  const pendientes = (oc: OrdenCompra) => {
    const items = (oc as any).itemsOC ?? [];
    return items.filter((i: any) => i.cantidadIngresada < i.cantidadEsperada).length;
  };

  const ocDetail = expandedId ? (ordenes ?? []).find((o) => o.idOrden === expandedId) as any : null;

  return (
    <>
      <AppHeader
        title="Órdenes de Compra"
        subtitle="Compras, adquisiciones e ingreso de activos"
        actions={
          canCreate && (
            <Button onClick={openCreateOC} variant="brand" size="sm">
              <Plus className="h-4 w-4" /> Nueva OC
            </Button>
          )
        }
      />

      <main className="flex-1 p-4 sm:p-6 space-y-4">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-8" />
                  <TableHead>N° OC</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="w-40 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : !ordenes?.length ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                      Sin registros
                    </TableCell>
                  </TableRow>
                ) : (
                  ordenes.map((oc) => {
                    const items = (oc as any).itemsOC ?? [];
                    const totalItems = items.reduce((a: number, i: any) => a + i.cantidadEsperada, 0);
                    const ingresados = items.reduce((a: number, i: any) => a + i.cantidadIngresada, 0);
                    return (
                      <>
                        <TableRow key={oc.idOrden} className="hover:bg-muted/30">
                          <TableCell>
                            <button
                              onClick={() => setExpandedId(expandedId === oc.idOrden ? null : oc.idOrden)}
                              className="p-1 hover:bg-muted rounded"
                            >
                              {expandedId === oc.idOrden ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{oc.numeroOC}</TableCell>
                          <TableCell>{oc.proveedor}</TableCell>
                          <TableCell>{new Date(oc.fechaCompra).toLocaleDateString("es-CO")}</TableCell>
                          <TableCell className="text-right">{money.format(oc.total)}</TableCell>
                          <TableCell>
                            <span className="text-xs">
                              {ingresados}/{totalItems} ingresados
                            </span>
                            {pendientes(oc) > 0 && (
                              <Badge variant="outline" className="ml-2 bg-warning/15 text-warning text-xs">
                                {pendientes(oc)} pend.
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex gap-1">
                              {canEdit && (
                                <Button size="icon" variant="ghost" onClick={() => openEditOC(oc)} aria-label="Editar">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button size="icon" variant="ghost" onClick={() => setToDelete(oc)} aria-label="Eliminar" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedId === oc.idOrden && (
                          <TableRow key={`${oc.idOrden}-detail`}>
                            <TableCell colSpan={7} className="bg-muted/20 p-4">
                              <div className="space-y-4">
                                <div className="flex gap-2 items-center">
                                  <h4 className="text-sm font-semibold">Ítems de la orden</h4>
                                  {canCreate && (
                                    <Button size="sm" variant="outline" onClick={() => openAddItem(oc.idOrden)}>
                                      <Plus className="h-3 w-3" /> Agregar ítem
                                    </Button>
                                  )}
                                  {canEdit && ingresados > 0 && ingresados === totalItems && (
                                    <Button size="sm" variant="brand" onClick={() => confirmarOC(oc.idOrden)}>
                                      <PackageCheck className="h-3 w-3" /> Confirmar ingreso
                                    </Button>
                                  )}
                                </div>

                                {items.length === 0 ? (
                                  <p className="text-xs text-muted-foreground">No hay ítems registrados.</p>
                                ) : (
                                  <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-muted/40">
                                          <TableHead>Producto</TableHead>
                                          <TableHead>Categoría</TableHead>
                                          <TableHead>Marca</TableHead>
                                          <TableHead>Modelo</TableHead>
                                          <TableHead>Esperados</TableHead>
                                          <TableHead>Seriales</TableHead>
                                          <TableHead className="w-32 text-right">Acciones</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {items.map((item: any) => {
                                          const detalles = item.detallesItem ?? [];
                                          return (
                                            <TableRow key={item.idItemOC} className="hover:bg-muted/30">
                                              <TableCell className="font-medium">{item.nombreProducto}</TableCell>
                                              <TableCell>{item.nombreCategoria ?? "—"}</TableCell>
                                              <TableCell>{item.marca}</TableCell>
                                              <TableCell>{item.modelo}</TableCell>
                                              <TableCell>{item.cantidadEsperada}</TableCell>
                                              <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                  {detalles.map((d: any) => (
                                                    <Badge
                                                      key={d.idDetalleItemOC}
                                                      variant="outline"
                                                      className={d.procesado ? "bg-success/15 text-success" : "bg-muted"}
                                                    >
                                                      <span className="font-mono text-xs">{d.serial}</span>
                                                    </Badge>
                                                  ))}
                                                  {canCreate && !item.todosProcesados && (
                                                    <Button size="sm" variant="ghost" className="h-5 text-xs" onClick={() => openAddSerials(item.idItemOC, item.nombreProducto)}>
                                                      <ScanLine className="h-3 w-3" /> Agregar serial
                                                    </Button>
                                                  )}
                                                </div>
                                              </TableCell>
                                              <TableCell className="text-right">
                                                {canDelete && (
                                                  <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="Eliminar item">
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                )}
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                      </TableBody>
                                    </Table>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>

      {/* OC Create/Edit Dialog */}
      <Dialog open={ocFormOpen} onOpenChange={setOcFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingOC ? "Editar orden" : "Nueva orden de compra"}</DialogTitle>
            <DialogDescription>Ingresa los datos de la orden de compra.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitOC} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numeroOC">N° OC <span className="text-destructive">*</span></Label>
                <Input id="numeroOC" value={ocForm.numeroOC} onChange={(e) => setOcForm((s) => ({ ...s, numeroOC: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proveedor">Proveedor <span className="text-destructive">*</span></Label>
                <Input id="proveedor" value={ocForm.proveedor} onChange={(e) => setOcForm((s) => ({ ...s, proveedor: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total">Total</Label>
                <Input id="total" type="number" value={ocForm.total} onChange={(e) => setOcForm((s) => ({ ...s, total: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea id="observaciones" value={ocForm.observaciones} onChange={(e) => setOcForm((s) => ({ ...s, observaciones: e.target.value }))} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOcFormOpen(false)} disabled={submitting}>Cancelar</Button>
              <Button type="submit" variant="brand" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingOC ? "Guardar cambios" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Item form Dialog */}
      <Dialog open={itemFormOpen} onOpenChange={setItemFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar ítem a la orden</DialogTitle>
            <DialogDescription>Selecciona la categoría y completa los datos del producto.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitItem} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cat">Categoría <span className="text-destructive">*</span></Label>
                <Select value={itemForm.idCategoria || undefined} onValueChange={(v) => setItemForm((s) => ({ ...s, idCategoria: v }))}>
                  <SelectTrigger id="cat"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent>
                    {(categorias ?? []).map((c) => (
                      <SelectItem key={c.idCategoria} value={String(c.idCategoria)}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prod">Nombre producto <span className="text-destructive">*</span></Label>
                <Input id="prod" value={itemForm.nombreProducto} onChange={(e) => setItemForm((s) => ({ ...s, nombreProducto: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marca">Marca <span className="text-destructive">*</span></Label>
                <Input id="marca" value={itemForm.marca} onChange={(e) => setItemForm((s) => ({ ...s, marca: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo <span className="text-destructive">*</span></Label>
                <Input id="modelo" value={itemForm.modelo} onChange={(e) => setItemForm((s) => ({ ...s, modelo: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ref">Referencia</Label>
                <Input id="ref" value={itemForm.referencia} onChange={(e) => setItemForm((s) => ({ ...s, referencia: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cant">Cant. esperada</Label>
                <Input id="cant" type="number" min={1} value={itemForm.cantidadEsperada} onChange={(e) => setItemForm((s) => ({ ...s, cantidadEsperada: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="obs">Observaciones</Label>
                <Textarea id="obs" value={itemForm.observaciones} onChange={(e) => setItemForm((s) => ({ ...s, observaciones: e.target.value }))} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setItemFormOpen(false)} disabled={submitting}>Cancelar</Button>
              <Button type="submit" variant="brand" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Agregar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Serial form Dialog */}
      <Dialog open={serialFormOpen} onOpenChange={setSerialFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar seriales</DialogTitle>
            <DialogDescription>Agrega uno o más seriales para: {serialForItem?.nombre}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                placeholder="Escribe un serial y presiona Agregar"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSerialToBatch())}
              />
              <Button type="button" variant="outline" onClick={addSerialToBatch}>Agregar</Button>
            </div>
            {serialBatch.length > 0 && (
              <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                <p className="text-xs font-semibold text-muted-foreground">Seriales a registrar ({serialBatch.length})</p>
                {serialBatch.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-muted/30 px-2 py-1 rounded">
                    <span className="font-mono text-xs">{s}</span>
                    <button onClick={() => removeSerialFromBatch(i)} className="text-destructive hover:text-destructive/80 text-xs">Quitar</button>
                  </div>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSerialFormOpen(false)} disabled={submitting}>Cancelar</Button>
              <Button type="button" variant="brand" onClick={submitSerials} disabled={submitting || serialBatch.length === 0}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Guardar {serialBatch.length > 0 ? `(${serialBatch.length})` : ""}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar orden?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán también sus ítems y seriales no procesados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteOC} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
