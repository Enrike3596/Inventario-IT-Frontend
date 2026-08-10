import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Plus,
  Pencil,
  Trash2,
  PackageCheck,
  ScanLine,
  Loader2,
  Eye,
  X,
  Info,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import {
  useOrdenesCompra,
  useOrdenCompraDetail,
  useCreateOrdenCompra,
  useUpdateOrdenCompra,
  useDeleteOrdenCompra,
  useConfirmarIngreso,
  useCategorias,
  keys,
} from "@/lib/queries";
import { apiFetch } from "@/lib/api";
import type { OrdenCompra, OrdenCompraDetail } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/ordenes-compra")({
  head: () => ({ meta: [{ title: "Órdenes de Compra — Indigo" }] }),
  component: Page,
});

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function Page() {
  const { can, user } = useAuth();
  const { data: ordenes, isLoading } = useOrdenesCompra();
  const { data: categorias } = useCategorias();
  const createMutation = useCreateOrdenCompra();
  const updateMutation = useUpdateOrdenCompra();
  const deleteMutation = useDeleteOrdenCompra();
  const confirmarMutation = useConfirmarIngreso();

  const qc = useQueryClient();
  const canCreate = can("create", "ordenes-compra");
  const canEdit = can("edit", "ordenes-compra");
  const canDelete = can("delete", "ordenes-compra");

  // OC form state
  const [ocFormOpen, setOcFormOpen] = useState(false);
  const [editingOC, setEditingOC] = useState<OrdenCompra | null>(null);
  const [ocForm, setOcForm] = useState({
    numeroOC: "",
    proveedor: "",
    total: 0,
    observaciones: "",
    motivoEdicion: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [editReasonOpen, setEditReasonOpen] = useState(false);
  const [editReason, setEditReason] = useState("");
  const [pendingEditOC, setPendingEditOC] = useState<OrdenCompra | null>(null);

  // Items to create with new OC
  const [createItems, setCreateItems] = useState<
    Array<{
      idItemOC?: number;
      idCategoria: number;
      nombreProducto: string;
      marca: string;
      modelo: string;
      referencia: string | null;
      observaciones: string | null;
      cantidadEsperada: number;
    }>
  >([]);
  const [createItemForm, setCreateItemForm] = useState({
    idCategoria: "",
    nombreProducto: "",
    marca: "",
    modelo: "",
    referencia: "",
    observaciones: "",
    cantidadEsperada: 1,
  });
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // Delete confirmation
  const [toDelete, setToDelete] = useState<OrdenCompra | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Detail view
  const [detailView, setDetailView] = useState<OrdenCompra | null>(null);
  const detailId = detailView?.idOrden;
  const { data: detailData } = useOrdenCompraDetail(detailId ?? 0);

  // ItemOC form
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [itemForOrden, setItemForOrden] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState({
    idCategoria: "",
    nombreProducto: "",
    marca: "",
    modelo: "",
    referencia: "",
    observaciones: "",
    cantidadEsperada: 1,
  });

  // Serial form
  const [serialFormOpen, setSerialFormOpen] = useState(false);
  const [serialForItem, setSerialForItem] = useState<{
    idItemOC: number;
    nombre: string;
    maxSerials: number;
  } | null>(null);
  const [serialInput, setSerialInput] = useState("");
  const [serialBatch, setSerialBatch] = useState<string[]>([]);
  const [existingSerials, setExistingSerials] = useState<
    { idDetalleItemOC: number; serial: string }[]
  >([]);
  const [removedSerialIds, setRemovedSerialIds] = useState<number[]>([]);
  const [editedSerials, setEditedSerials] = useState<Record<number, string>>({});

  const openCreateOC = () => {
    setOcForm({ numeroOC: "", proveedor: "", total: 0, observaciones: "", motivoEdicion: "" });
    setCreateItems([]);
    setCreateItemForm({
      idCategoria: "",
      nombreProducto: "",
      marca: "",
      modelo: "",
      referencia: "",
      observaciones: "",
      cantidadEsperada: 1,
    });
    setEditingItemIndex(null);
    setEditingOC(null);
    setOcFormOpen(true);
  };

  const addItemToCreateList = () => {
    const f = createItemForm;
    if (!f.idCategoria || !f.nombreProducto || !f.marca || !f.modelo) {
      toast.error("Categoría, producto, marca y modelo son obligatorios");
      return;
    }
    const newItem = {
      idCategoria: Number(f.idCategoria),
      nombreProducto: f.nombreProducto,
      marca: f.marca,
      modelo: f.modelo,
      referencia: f.referencia || null,
      observaciones: f.observaciones || null,
      cantidadEsperada: f.cantidadEsperada,
    };
    if (editingItemIndex !== null) {
      setCreateItems((prev) =>
        prev.map((item, i) => (i === editingItemIndex ? { ...item, ...newItem } : item)),
      );
      setEditingItemIndex(null);
      toast.success("Ítem actualizado");
    } else {
      setCreateItems((prev) => [...prev, newItem]);
      toast.success("Ítem agregado");
    }
    setCreateItemForm({
      idCategoria: "",
      nombreProducto: "",
      marca: "",
      modelo: "",
      referencia: "",
      observaciones: "",
      cantidadEsperada: 1,
    });
  };

  const loadItemToForm = (idx: number) => {
    const item = createItems[idx];
    setCreateItemForm({
      idCategoria: String(item.idCategoria),
      nombreProducto: item.nombreProducto,
      marca: item.marca,
      modelo: item.modelo,
      referencia: item.referencia ?? "",
      observaciones: item.observaciones ?? "",
      cantidadEsperada: item.cantidadEsperada,
    });
    setEditingItemIndex(idx);
  };

  const removeItemFromCreateList = (idx: number) => {
    setCreateItems((prev) => prev.filter((_, i) => i !== idx));
    if (editingItemIndex === idx) {
      setEditingItemIndex(null);
      setCreateItemForm({
        idCategoria: "",
        nombreProducto: "",
        marca: "",
        modelo: "",
        referencia: "",
        observaciones: "",
        cantidadEsperada: 1,
      });
    }
  };

  const openEditOC = (oc: OrdenCompra) => {
    if (user?.role === "coordinador") {
      setEditReason("");
      setPendingEditOC(oc);
      setEditReasonOpen(true);
      return;
    }
    setOcForm({
      numeroOC: oc.numeroOC,
      proveedor: oc.proveedor,
      total: oc.total,
      observaciones: oc.observaciones,
      motivoEdicion: "",
    });
    setEditingOC(oc);
    const items = ((oc as any).itemsOC ?? []).map((i: any) => ({
      idItemOC: i.idItemOC,
      idCategoria: i.idCategoria,
      nombreProducto: i.nombreProducto,
      marca: i.marca,
      modelo: i.modelo,
      referencia: i.referencia,
      observaciones: i.observaciones,
      cantidadEsperada: i.cantidadEsperada,
    }));
    setCreateItems(items);
    setEditingItemIndex(null);
    setOcFormOpen(true);
  };

  const confirmOCEditReason = () => {
    if (!pendingEditOC) return;
    const oc = pendingEditOC;
    setOcForm({
      numeroOC: oc.numeroOC,
      proveedor: oc.proveedor,
      total: oc.total,
      observaciones: oc.observaciones,
      motivoEdicion: editReason,
    });
    setEditingOC(oc);
    const items = ((oc as any).itemsOC ?? []).map((i: any) => ({
      idItemOC: i.idItemOC,
      idCategoria: i.idCategoria,
      nombreProducto: i.nombreProducto,
      marca: i.marca,
      modelo: i.modelo,
      referencia: i.referencia,
      observaciones: i.observaciones,
      cantidadEsperada: i.cantidadEsperada,
    }));
    setCreateItems(items);
    setEditingItemIndex(null);
    setEditReasonOpen(false);
    setPendingEditOC(null);
    setOcFormOpen(true);
  };

  const submitOC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ocForm.numeroOC || !ocForm.proveedor) {
      toast.error("N° OC y Proveedor son obligatorios");
      return;
    }
    setSubmitting(true);
    try {
      if (editingOC) {
        await updateMutation.mutateAsync({ id: editingOC.idOrden, data: ocForm });
        const originalItems = ((editingOC as any).itemsOC ?? []) as any[];
        const originalIds = originalItems.map((i: any) => i.idItemOC);
        const currentIds = createItems.filter((i) => i.idItemOC).map((i) => i.idItemOC!);
        const removedIds = originalIds.filter((id: number) => !currentIds.includes(id));
        for (const id of removedIds) {
          await apiFetch(`/api/ItemsOC/${id}`, { method: "DELETE" });
        }
        for (const item of createItems) {
          if (item.idItemOC) {
            await apiFetch(`/api/ItemsOC/${item.idItemOC}`, {
              method: "PUT",
              body: JSON.stringify(item),
            });
          } else {
            await apiFetch("/api/ItemsOC", {
              method: "POST",
              body: JSON.stringify({ idOrden: editingOC.idOrden, ...item }),
            });
          }
        }
        toast.success("Orden actualizada");
      } else {
        const oc = (await createMutation.mutateAsync(ocForm)) as any;
        for (const item of createItems) {
          await apiFetch("/api/ItemsOC", {
            method: "POST",
            body: JSON.stringify({ idOrden: oc.idOrden, ...item }),
          });
        }
        toast.success("Orden creada");
      }
      qc.invalidateQueries({ queryKey: keys.ordenes.all });
      setOcFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
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
    } finally {
      setDeleting(false);
    }
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
    setItemForm({
      idCategoria: "",
      nombreProducto: "",
      marca: "",
      modelo: "",
      referencia: "",
      observaciones: "",
      cantidadEsperada: 1,
    });
    setItemFormOpen(true);
  };

  const submitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !itemForOrden ||
      !itemForm.idCategoria ||
      !itemForm.nombreProducto ||
      !itemForm.marca ||
      !itemForm.modelo
    ) {
      toast.error("Categoría, producto, marca y modelo son obligatorios");
      return;
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
    } finally {
      setSubmitting(false);
    }
  };

  const openAddSerials = (idItemOC: number, nombre: string, maxSerials: number) => {
    setSerialForItem({ idItemOC, nombre, maxSerials });
    setSerialInput("");
    setSerialBatch([]);
    setExistingSerials([]);
    setRemovedSerialIds([]);
    setEditedSerials({});
    setSerialFormOpen(true);
  };

  const openEditSerials = (
    idItemOC: number,
    nombre: string,
    maxSerials: number,
    detalles: any[],
  ) => {
    setSerialForItem({ idItemOC, nombre, maxSerials });
    setExistingSerials(
      detalles.map((d: any) => ({ idDetalleItemOC: d.idDetalleItemOC, serial: d.serial })),
    );
    setEditedSerials({});
    setRemovedSerialIds([]);
    setSerialInput("");
    setSerialBatch([]);
    setSerialFormOpen(true);
  };

  const addSerialToBatch = () => {
    const s = serialInput.trim();
    if (!s) return;
    if (serialBatch.includes(s)) {
      toast.error("Serial ya agregado");
      return;
    }
    if (serialForItem && serialBatch.length >= serialForItem.maxSerials) {
      toast.error(`Máximo ${serialForItem.maxSerials} serial(es) permitido(s) para esta cantidad`);
      return;
    }
    setSerialBatch((prev) => [...prev, s]);
    setSerialInput("");
  };

  const removeSerialFromBatch = (idx: number) => {
    setSerialBatch((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingSerial = (idDetalleItemOC: number) => {
    setRemovedSerialIds((prev) => [...prev, idDetalleItemOC]);
  };

  const restoreExistingSerial = (idDetalleItemOC: number) => {
    setRemovedSerialIds((prev) => prev.filter((id) => id !== idDetalleItemOC));
  };

  const updateExistingSerial = (idDetalleItemOC: number, value: string) => {
    setEditedSerials((prev) => ({ ...prev, [idDetalleItemOC]: value }));
  };

  const submitSerials = async () => {
    if (!serialForItem) return;
    const hasNewSerials = serialBatch.length > 0;
    const hasRemoved = removedSerialIds.length > 0;
    const hasUpdates = Object.keys(editedSerials).length > 0;
    if (!hasNewSerials && !hasRemoved && !hasUpdates) {
      toast.error("No hay cambios que guardar");
      return;
    }
    setSubmitting(true);
    let countAdded = 0;
    let countDeleted = 0;
    let countUpdated = 0;
    try {
      if (hasNewSerials) {
        await apiFetch("/api/DetallesItemOC/batch", {
          method: "POST",
          body: JSON.stringify({ idItemOC: serialForItem.idItemOC, seriales: serialBatch }),
        });
        countAdded = serialBatch.length;
      }
      if (hasRemoved) {
        for (const id of removedSerialIds) {
          await apiFetch(`/api/DetallesItemOC/${id}`, { method: "DELETE" });
          countDeleted++;
        }
      }
      if (hasUpdates) {
        for (const [id, serial] of Object.entries(editedSerials)) {
          await apiFetch(`/api/DetallesItemOC/${id}`, {
            method: "PUT",
            body: JSON.stringify({ serial }),
          });
          countUpdated++;
        }
      }
      const parts: string[] = [];
      if (countAdded > 0) parts.push(`${countAdded} agregado(s)`);
      if (countUpdated > 0) parts.push(`${countUpdated} actualizado(s)`);
      if (countDeleted > 0) parts.push(`${countDeleted} eliminado(s)`);
      toast.success(`Seriales guardados: ${parts.join(", ")}`);
      setSerialFormOpen(false);
      qc.invalidateQueries({ queryKey: keys.ordenes.all });
      qc.invalidateQueries({ queryKey: keys.itemsOC.all });
      qc.invalidateQueries({ queryKey: keys.detallesItemOC.all });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const ingresadosCount = (item: any) => item.detallesItem?.length ?? item.cantidadIngresada ?? 0;

  const pendientes = (oc: OrdenCompra) => {
    const items = (oc as any).itemsOC ?? [];
    return items.filter((i: any) => ingresadosCount(i) < i.cantidadEsperada).length;
  };

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const PAGE_SIZES = [10, 20, 30, 50, 100] as const;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const hasActiveFilters = statusFilter !== "all";

  const clearFilters = () => {
    setStatusFilter("all");
    setQuery("");
  };

  const ocList = useMemo(() => {
    const list = ordenes ?? [];
    const q = query.toLowerCase().trim();
    let filtered = list;
    if (q) {
      filtered = filtered.filter(
        (oc) =>
          oc.numeroOC.toLowerCase().includes(q) ||
          oc.proveedor.toLowerCase().includes(q) ||
          new Date(oc.fechaCompra).toLocaleDateString("es-CO").includes(q),
      );
    }
    if (statusFilter === "pending") {
      filtered = filtered.filter((oc) => pendientes(oc) > 0);
    } else if (statusFilter === "completed") {
      filtered = filtered.filter((oc) => pendientes(oc) === 0);
    }
    return filtered;
  }, [ordenes, query, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(ocList.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedOC = useMemo(
    () => ocList.slice((safePage - 1) * pageSize, safePage * pageSize),
    [ocList, safePage, pageSize],
  );

  return (
    <>
      <AppHeader
        title="Órdenes de Compra"
        subtitle="Compras, adquisiciones e ingreso de activos"
        actions={
          canCreate && (
            <Button onClick={openCreateOC} variant="brand" size="sm">
              <Plus className="h-4 w-4" /> Nuevo
            </Button>
          )
        }
      />

      <main className="flex-1 p-4 sm:p-6 space-y-4">
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative w-full sm:flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por N° OC, proveedor o fecha..."
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-muted-foreground">Estado:</span>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="pending">Con pendientes</SelectItem>
                  <SelectItem value="completed">Completadas</SelectItem>
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
            <span className="text-xs text-muted-foreground sm:ml-auto whitespace-nowrap">
              {ocList.length} registro{ocList.length === 1 ? "" : "s"}
            </span>
          </div>
        </Card>
        {/* Desktop: table view */}
        <Card className="overflow-hidden hidden sm:block">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>N° OC</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="w-56 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : !ocList.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      Sin registros
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOC.map((oc) => {
                    const items = (oc as any).itemsOC ?? [];
                    const totalItems = items.reduce(
                      (a: number, i: any) => a + i.cantidadEsperada,
                      0,
                    );
                    const ingresados = items.reduce(
                      (a: number, i: any) => a + ingresadosCount(i),
                      0,
                    );
                    return (
                      <TableRow key={oc.idOrden} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs">{oc.numeroOC}</TableCell>
                        <TableCell>{oc.proveedor}</TableCell>
                        <TableCell>
                          {new Date(oc.fechaCompra).toLocaleDateString("es-CO")}
                        </TableCell>
                        <TableCell className="text-right">{money.format(oc.total)}</TableCell>
                        <TableCell>
                          <span className="text-xs">
                            {ingresados}/{totalItems} ingresados
                          </span>
                          {pendientes(oc) > 0 && (
                            <Badge
                              variant="outline"
                              className="ml-2 bg-warning/15 text-warning text-xs"
                            >
                              {pendientes(oc)} pend.
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDetailView(oc)}
                              aria-label="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canEdit && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditOC(oc)}
                                aria-label="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setToDelete(oc)}
                                aria-label="Eliminar"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Mobile: card view */}
        <div className="sm:hidden space-y-3">
          {isLoading ? (
            <Card className="p-6">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            </Card>
          ) : !ocList.length ? (
            <Card className="p-6">
              <p className="text-center text-sm text-muted-foreground">Sin registros</p>
            </Card>
          ) : (
            paginatedOC.map((oc) => {
              const items = (oc as any).itemsOC ?? [];
              const totalItems = items.reduce((a: number, i: any) => a + i.cantidadEsperada, 0);
              const ingresados = items.reduce((a: number, i: any) => a + ingresadosCount(i), 0);
              return (
                <Card key={oc.idOrden} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-muted-foreground font-medium shrink-0 w-28 leading-5">
                        N° OC
                      </span>
                      <span className="text-sm text-right font-mono leading-5">{oc.numeroOC}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-muted-foreground font-medium shrink-0 w-28 leading-5">
                        Proveedor
                      </span>
                      <span className="text-sm text-right leading-5">{oc.proveedor}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-muted-foreground font-medium shrink-0 w-28 leading-5">
                        Fecha
                      </span>
                      <span className="text-sm text-right leading-5">
                        {new Date(oc.fechaCompra).toLocaleDateString("es-CO")}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-muted-foreground font-medium shrink-0 w-28 leading-5">
                        Total
                      </span>
                      <span className="text-sm text-right leading-5">{money.format(oc.total)}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-muted-foreground font-medium shrink-0 w-28 leading-5">
                        Items
                      </span>
                      <span className="text-sm text-right leading-5">
                        {ingresados}/{totalItems} ingresados
                        {pendientes(oc) > 0 && (
                          <Badge
                            variant="outline"
                            className="ml-1 bg-warning/15 text-warning text-xs"
                          >
                            {pendientes(oc)} pend.
                          </Badge>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1 pt-3 mt-3 border-t">
                    <Button size="sm" variant="ghost" onClick={() => setDetailView(oc)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                    </Button>
                    {canEdit && (
                      <Button size="sm" variant="ghost" onClick={() => openEditOC(oc)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setToDelete(oc)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {ocList.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Filas por página:
              </span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Página {safePage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* OC Create/Edit Dialog */}
      <Dialog open={ocFormOpen} onOpenChange={setOcFormOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOC ? "Editar orden" : "Nueva orden de compra"}</DialogTitle>
            <DialogDescription>Ingresa los datos de la orden de compra.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitOC} className="space-y-6">
            {/* OC fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numeroOC">
                  N° OC <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="numeroOC"
                  value={ocForm.numeroOC}
                  onChange={(e) => setOcForm((s) => ({ ...s, numeroOC: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proveedor">
                  Proveedor <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="proveedor"
                  value={ocForm.proveedor}
                  onChange={(e) => setOcForm((s) => ({ ...s, proveedor: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total">Total</Label>
                <Input
                  id="total"
                  type="number"
                  value={ocForm.total}
                  onChange={(e) => setOcForm((s) => ({ ...s, total: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={ocForm.observaciones}
                  onChange={(e) => setOcForm((s) => ({ ...s, observaciones: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            {/* Items section */}
            <>
              <hr />
              <div>
                <h4 className="text-sm font-semibold mb-3">Ítems de la orden</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  <div className="space-y-2">
                    <Label>
                      Categoría <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={createItemForm.idCategoria || undefined}
                      onValueChange={(v) => setCreateItemForm((s) => ({ ...s, idCategoria: v }))}
                    >
                      <SelectTrigger>
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
                  <div className="space-y-2">
                    <Label>
                      Marca <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={createItemForm.marca}
                      onChange={(e) => setCreateItemForm((s) => ({ ...s, marca: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Modelo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={createItemForm.modelo}
                      onChange={(e) => setCreateItemForm((s) => ({ ...s, modelo: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cant. esperada</Label>
                    <Input
                      type="number"
                      min={1}
                      value={createItemForm.cantidadEsperada}
                      onChange={(e) =>
                        setCreateItemForm((s) => ({
                          ...s,
                          cantidadEsperada: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Observaciones del ítem</Label>
                    <Textarea
                      value={createItemForm.observaciones}
                      onChange={(e) =>
                        setCreateItemForm((s) => ({ ...s, observaciones: e.target.value }))
                      }
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={addItemToCreateList}>
                    <Plus className="h-3 w-3" />{" "}
                    {editingItemIndex !== null ? "Actualizar ítem" : "Agregar ítem"}
                  </Button>
                  {editingItemIndex !== null && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingItemIndex(null);
                        setCreateItemForm({
                          idCategoria: "",
                          nombreProducto: "",
                          marca: "",
                          modelo: "",
                          referencia: "",
                          observaciones: "",
                          cantidadEsperada: 1,
                        });
                      }}
                    >
                      Cancelar edición
                    </Button>
                  )}
                </div>
              </div>

              {/* Added items list */}
              {createItems.length > 0 && (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {createItems.map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between gap-2 px-3 py-2 text-sm ${editingItemIndex === i ? "ring-1 ring-primary/30 rounded" : ""}`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-muted-foreground text-xs">
                          {item.marca} / {item.modelo} × {item.cantidadEsperada}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => loadItemToForm(i)}
                          className="text-muted-foreground hover:text-primary text-xs"
                          aria-label="Editar ítem"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItemFromCreateList(i)}
                          className="text-destructive hover:text-destructive/80"
                          aria-label="Quitar ítem"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOcFormOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="brand" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingOC ? "Guardar cambios" : "Crear orden"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail view Dialog */}
      <Dialog open={!!detailView} onOpenChange={(o) => !o && setDetailView(null)}>
        <DialogContent className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detailData?.numeroOC ?? detailView?.numeroOC ?? "Detalles de la orden"}
            </DialogTitle>
            <DialogDescription>
              {detailData?.proveedor ??
                detailView?.proveedor ??
                "Información completa y gestión de ítems."}
            </DialogDescription>
          </DialogHeader>
          {(detailData ?? detailView) &&
            (() => {
              const data = detailData ?? detailView!;
              const items = (data as any).itemsOC ?? [];
              const totalItems = items.reduce((a: number, i: any) => a + i.cantidadEsperada, 0);
              const ingresados = items.reduce((a: number, i: any) => a + ingresadosCount(i), 0);
              const hasPendientes = items.some((i: any) =>
                i.detallesItem?.some((d: any) => !d.procesado),
              );
              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground text-xs">N° OC</Label>
                      <p className="font-medium truncate">{data.numeroOC}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Proveedor</Label>
                      <p className="truncate">{data.proveedor}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Fecha</Label>
                      <p>{new Date(data.fechaCompra).toLocaleDateString("es-CO")}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Total</Label>
                      <p className="font-medium truncate">{money.format(data.total)}</p>
                    </div>
                    <div className="col-span-full">
                      <Label className="text-muted-foreground text-xs">Observaciones</Label>
                      <p className="text-sm break-words">{data.observaciones || "—"}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-2 items-center mb-3">
                      <h4 className="text-sm font-semibold">Ítems de la orden</h4>
                      {canCreate && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const id = data.idOrden;
                            setDetailView(null);
                            openAddItem(id);
                          }}
                        >
                          <Plus className="h-3 w-3" /> Agregar ítem
                        </Button>
                      )}
                      {canEdit &&
                        ingresados > 0 &&
                        ingresados === totalItems &&
                        hasPendientes &&
                        false && (
                          <Button
                            size="sm"
                            variant="brand"
                            onClick={() => {
                              const id = data.idOrden;
                              setDetailView(null);
                              confirmarOC(id);
                            }}
                          >
                            <PackageCheck className="h-3 w-3" /> Confirmar ingreso
                          </Button>
                        )}
                    </div>

                    {items.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No hay ítems registrados.</p>
                    ) : (
                      <>
                        {/* Desktop: table view */}
                        <div className="hidden sm:block border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/40">
                                <TableHead className="min-w-[180px]">Producto</TableHead>
                                <TableHead>Cant.</TableHead>
                                <TableHead>Seriales</TableHead>
                                <TableHead className="w-20 text-right">Acción</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {items.map((item: any) => {
                                const detalles = item.detallesItem ?? [];
                                const serialesCount = detalles.length;
                                const completo = serialesCount >= item.cantidadEsperada;
                                return (
                                  <TableRow key={item.idItemOC} className="hover:bg-muted/30">
                                    <TableCell>
                                      <div className="flex flex-col gap-0.5 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Badge
                                            variant="outline"
                                            className="text-[10px] h-4 px-1.5 shrink-0"
                                          >
                                            {item.nombreCategoria ?? "—"}
                                          </Badge>
                                          {item.observaciones && (
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                                                </TooltipTrigger>
                                                <TooltipContent
                                                  side="top"
                                                  className="max-w-[250px] text-xs"
                                                >
                                                  {item.observaciones}
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {item.marca} / {item.modelo}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className={`text-xs font-medium whitespace-nowrap ${completo ? "text-success" : ""}`}
                                        >
                                          {serialesCount}/{item.cantidadEsperada}
                                        </span>
                                        {completo ? (
                                          <Badge
                                            variant="outline"
                                            className="text-[10px] h-4 px-1.5 bg-success/15 text-success shrink-0"
                                          >
                                            Completo
                                          </Badge>
                                        ) : serialesCount > 0 ? (
                                          <Badge
                                            variant="outline"
                                            className="text-[10px] h-4 px-1.5 bg-warning/15 text-warning shrink-0"
                                          >
                                            Parcial
                                          </Badge>
                                        ) : (
                                          <Badge
                                            variant="outline"
                                            className="text-[10px] h-4 px-1.5 bg-muted text-muted-foreground shrink-0"
                                          >
                                            Pendiente
                                          </Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1 items-center max-w-[200px]">
                                        {detalles.length > 0 ? (
                                          detalles.map((d: any) => (
                                            <Badge
                                              key={d.idDetalleItemOC}
                                              variant="outline"
                                              className={`text-[10px] h-5 px-1.5 ${d.procesado ? "bg-success/15 text-success border-success/30" : "bg-muted"}`}
                                            >
                                              <span className="font-mono truncate max-w-24">
                                                {d.serial}
                                              </span>
                                            </Badge>
                                          ))
                                        ) : (
                                          <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                        {canCreate && !completo && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 shrink-0"
                                            onClick={() => {
                                              const id = item.idItemOC;
                                              const nombre = item.nombreCategoria ?? "";
                                              const remaining = Math.max(
                                                0,
                                                item.cantidadEsperada - serialesCount,
                                              );
                                              openAddSerials(id, nombre, remaining);
                                            }}
                                          >
                                            <ScanLine className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {canEdit && (
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-7 w-7"
                                          aria-label="Editar seriales"
                                          onClick={() => {
                                            const id = item.idItemOC;
                                            const nombre = item.nombreCategoria ?? "";
                                            const remaining = Math.max(
                                              0,
                                              item.cantidadEsperada - serialesCount,
                                            );
                                            openEditSerials(id, nombre, remaining, detalles);
                                          }}
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Mobile: card view */}
                        <div className="sm:hidden space-y-3">
                          {items.map((item: any) => {
                            const detalles = item.detallesItem ?? [];
                            const serialesCount = detalles.length;
                            const completo = serialesCount >= item.cantidadEsperada;
                            return (
                              <Card key={item.idItemOC} className="p-3">
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                          {item.nombreCategoria ?? "—"}
                                        </Badge>
                                      </div>
                                      <span className="text-xs text-muted-foreground block mt-0.5">
                                        {item.marca} / {item.modelo}
                                      </span>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] h-5 shrink-0 ${completo ? "bg-success/15 text-success" : serialesCount > 0 ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}
                                    >
                                      {serialesCount}/{item.cantidadEsperada}
                                    </Badge>
                                  </div>
                                  {item.observaciones && (
                                    <p className="text-xs text-muted-foreground">
                                      {item.observaciones}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-1 items-center pt-1">
                                    {detalles.length > 0 ? (
                                      detalles.map((d: any) => (
                                        <Badge
                                          key={d.idDetalleItemOC}
                                          variant="outline"
                                          className={`text-[10px] h-5 px-1.5 ${d.procesado ? "bg-success/15 text-success border-success/30" : "bg-muted"}`}
                                        >
                                          <span className="font-mono">{d.serial}</span>
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        Sin seriales
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {canEdit && (
                                  <div className="flex items-center justify-end gap-1 pt-2 mt-2 border-t">
                                    {canCreate && !completo && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs"
                                        onClick={() => {
                                          const id = item.idItemOC;
                                          const nombre = item.nombreCategoria ?? "";
                                          const remaining = Math.max(
                                            0,
                                            item.cantidadEsperada - serialesCount,
                                          );
                                          openAddSerials(id, nombre, remaining);
                                        }}
                                      >
                                        <ScanLine className="h-3 w-3 mr-1" /> Agregar serial
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs"
                                      onClick={() => {
                                        const id = item.idItemOC;
                                        const nombre = item.nombreCategoria ?? "";
                                        const remaining = Math.max(
                                          0,
                                          item.cantidadEsperada - serialesCount,
                                        );
                                        openEditSerials(id, nombre, remaining, detalles);
                                      }}
                                    >
                                      <Pencil className="h-3 w-3 mr-1" /> Editar
                                    </Button>
                                  </div>
                                )}
                              </Card>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailView(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item form Dialog */}
      <Dialog open={itemFormOpen} onOpenChange={setItemFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar ítem a la orden</DialogTitle>
            <DialogDescription>
              Selecciona la categoría y completa los datos del producto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitItem} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cat">
                  Categoría <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={itemForm.idCategoria || undefined}
                  onValueChange={(v) => setItemForm((s) => ({ ...s, idCategoria: v }))}
                >
                  <SelectTrigger id="cat">
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
              <div className="space-y-2">
                <Label htmlFor="marca">
                  Marca <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="marca"
                  value={itemForm.marca}
                  onChange={(e) => setItemForm((s) => ({ ...s, marca: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelo">
                  Modelo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="modelo"
                  value={itemForm.modelo}
                  onChange={(e) => setItemForm((s) => ({ ...s, modelo: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cant">Cant. esperada</Label>
                <Input
                  id="cant"
                  type="number"
                  min={1}
                  value={itemForm.cantidadEsperada}
                  onChange={(e) =>
                    setItemForm((s) => ({ ...s, cantidadEsperada: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="obs">Observaciones</Label>
                <Textarea
                  id="obs"
                  value={itemForm.observaciones}
                  onChange={(e) => setItemForm((s) => ({ ...s, observaciones: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setItemFormOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionar seriales</DialogTitle>
            <DialogDescription>
              {serialForItem?.nombre}
              {serialForItem ? ` (máx. ${serialForItem.maxSerials})` : ""}
              {existingSerials.length > 0 ? ` · ${existingSerials.length} existente(s)` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Existing serials */}
            {existingSerials.length > 0 && (
              <div className="border rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Seriales existentes</p>
                {existingSerials.map((es) => {
                  const isRemoved = removedSerialIds.includes(es.idDetalleItemOC);
                  const editedValue = editedSerials[es.idDetalleItemOC] ?? es.serial;
                  return (
                    <div
                      key={es.idDetalleItemOC}
                      className={`flex items-center gap-2 text-sm px-2 py-1.5 rounded ${isRemoved ? "bg-destructive/10 line-through opacity-50" : "bg-muted/30"}`}
                    >
                      <Input
                        value={editedValue}
                        onChange={(e) => updateExistingSerial(es.idDetalleItemOC, e.target.value)}
                        disabled={isRemoved}
                        className="h-7 font-mono text-xs flex-1 min-w-0"
                      />
                      {isRemoved ? (
                        <button
                          onClick={() => restoreExistingSerial(es.idDetalleItemOC)}
                          className="text-xs text-primary hover:text-primary/80 shrink-0"
                        >
                          Restaurar
                        </button>
                      ) : (
                        <button
                          onClick={() => removeExistingSerial(es.idDetalleItemOC)}
                          className="text-destructive hover:text-destructive/80 text-xs shrink-0"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add new serials */}
            <div className="flex gap-2">
              <Input
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                placeholder="Escribe un serial y presiona Agregar"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSerialToBatch())}
              />
              <Button type="button" variant="outline" onClick={addSerialToBatch}>
                Agregar
              </Button>
            </div>
            {serialBatch.length > 0 && (
              <div className="border rounded-lg p-3 space-y-2 max-h-36 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Nuevos a registrar ({serialBatch.length})
                  </p>
                  {serialForItem && (
                    <span className="text-xs text-muted-foreground">
                      {serialForItem.maxSerials - serialBatch.length} restantes
                    </span>
                  )}
                </div>
                {serialBatch.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm bg-muted/30 px-2 py-1 rounded"
                  >
                    <span className="font-mono text-xs">{s}</span>
                    <button
                      onClick={() => removeSerialFromBatch(i)}
                      className="text-destructive hover:text-destructive/80 text-xs"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSerialFormOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="button" variant="brand" onClick={submitSerials} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Guardar cambios
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit reason dialog (coordinador) */}
      <Dialog
        open={editReasonOpen}
        onOpenChange={(o) => {
          if (!o) {
            setEditReasonOpen(false);
            setPendingEditOC(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Motivo de la edición</DialogTitle>
            <DialogDescription>
              Indica el motivo por el cual deseas realizar esta modificación.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="Describe el motivo de la edición..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditReasonOpen(false);
                setPendingEditOC(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="brand" onClick={confirmOCEditReason} disabled={!editReason.trim()}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar orden?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán también sus ítems y seriales no
              procesados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteOC}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
