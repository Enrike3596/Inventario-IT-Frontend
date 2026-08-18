import { useState, useMemo, useRef } from "react";
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
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  FileText,
  FileUp,
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
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import {
  useRemisiones,
  useRemisionDetail,
  useCreateRemision,
  useUpdateRemision,
  useDeleteRemision,
  useConfirmarIngreso,
  useSubirDocumentoRemision,
  useLimpiarDocumentoRemision,
  useReemplazarDocumentoRemision,
  useEliminarDocumentoRemision,
  useCategorias,
  keys,
} from "@/lib/queries";
import { apiFetch, apiDownload } from "@/lib/api";
import { buildDocumentoRemisionUrl } from "@/lib/file-storage";
import type { Remision, RemisionDetail } from "@/lib/types";

function SeccionDocumento({
  existe,
  nombreDocumento,
  subiendo,
  puedeEditar,
  esCreacion,
  onUpload,
  onDelete,
  onView,
  onDownload,
}: {
  existe: boolean;
  nombreDocumento?: string | null;
  subiendo: boolean;
  puedeEditar: boolean;
  esCreacion?: boolean;
  onUpload: (file: File) => void;
  onDelete: () => void;
  onView?: () => void;
  onDownload?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-semibold">
        Documento de la remisión (PDF) <span className="text-destructive">*</span>
      </h4>

      {!existe ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Adjunta el PDF de la remisión. Solo archivos .pdf de máximo 10 MB.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={subiendo}
            onClick={() => fileInputRef.current?.click()}
          >
            {subiendo ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <FileUp className="h-3.5 w-3.5 mr-1" />
            )}
            {subiendo ? "Subiendo..." : "Subir documento"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-success min-w-0">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[220px]">{nombreDocumento || "Documento.pdf"}</span>
          </span>
          <div className="flex items-center flex-wrap gap-1">
            {onView && (
              <Button type="button" size="sm" variant="outline" onClick={onView}>
                <Eye className="h-3.5 w-3.5 mr-1" /> Ver
              </Button>
            )}
            {onDownload && (
              <Button type="button" size="sm" variant="outline" onClick={onDownload}>
                <Download className="h-3.5 w-3.5 mr-1" /> Descargar
              </Button>
            )}
            {puedeEditar && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUpload(f);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={subiendo}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {subiendo ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : (
                    <FileUp className="h-3.5 w-3.5 mr-1" />
                  )}
                  {subiendo ? "Subiendo..." : esCreacion ? "Cambiar" : "Reemplazar"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Quitar
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/remisiones")({
  head: () => ({ meta: [{ title: "Remisiones — Indigo" }] }),
  component: Page,
});

function Page() {
  const { can, user } = useAuth();
  const { data: remisiones, isLoading } = useRemisiones();
  const { data: categorias } = useCategorias();
  const createMutation = useCreateRemision();
  const updateMutation = useUpdateRemision();
  const deleteMutation = useDeleteRemision();
  const confirmarMutation = useConfirmarIngreso();
  const subirDocumentoMutation = useSubirDocumentoRemision();
  const limpiarDocumentoMutation = useLimpiarDocumentoRemision();
  const reemplazarDocumentoMutation = useReemplazarDocumentoRemision();
  const eliminarDocumentoMutation = useEliminarDocumentoRemision();

  const qc = useQueryClient();
  const canCreate = can("create", "remisiones");
  const canEdit = can("edit", "remisiones");
  const canDelete = can("delete", "remisiones");

  // Remisión form state
  const [remFormOpen, setRemFormOpen] = useState(false);
  const [editingRem, setEditingRem] = useState<Remision | null>(null);
  const [remForm, setRemForm] = useState({
    numeroRemision: "",
    proveedor: "",
    motivoEdicion: "",
    rutaDocumento: "",
    nombreDocumento: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [documentoSubiendo, setDocumentoSubiendo] = useState(false);
  const [editReasonOpen, setEditReasonOpen] = useState(false);
  const [editReason, setEditReason] = useState("");
  const [pendingEditRem, setPendingEditRem] = useState<Remision | null>(null);

  // Items to create with new remisión
  const [createItems, setCreateItems] = useState<
    Array<{
      idItemRemision?: number;
      idCategoria: number;
      marca: string;
      modelo: string;
      cantidadEsperada: number;
    }>
  >([]);
  const [createItemForm, setCreateItemForm] = useState({
    idCategoria: "",
    marca: "",
    modelo: "",
    cantidadEsperada: 1,
  });
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // Delete confirmation
  const [toDelete, setToDelete] = useState<Remision | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Detail view
  const [detailView, setDetailView] = useState<Remision | null>(null);
  const detailId = detailView?.idRemision;
  const { data: detailData } = useRemisionDetail(detailId ?? 0);

  // ItemRemision form
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [itemForRemision, setItemForRemision] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState({
    idCategoria: "",
    marca: "",
    modelo: "",
    cantidadEsperada: 1,
  });

  // Serial form
  const [serialFormOpen, setSerialFormOpen] = useState(false);
  const [serialForItem, setSerialForItem] = useState<{
    idItemRemision: number;
    nombre: string;
    maxSerials: number;
  } | null>(null);
  const [serialInput, setSerialInput] = useState("");
  const [serialBatch, setSerialBatch] = useState<string[]>([]);
  const [existingSerials, setExistingSerials] = useState<
    { idDetalleItemRemision: number; serial: string }[]
  >([]);
  const [removedSerialIds, setRemovedSerialIds] = useState<number[]>([]);
  const [editedSerials, setEditedSerials] = useState<Record<number, string>>({});

  const openCreateRem = () => {
    setRemForm({
      numeroRemision: "",
      proveedor: "",
      motivoEdicion: "",
      rutaDocumento: "",
      nombreDocumento: "",
    });
    setCreateItems([]);
    setCreateItemForm({ idCategoria: "", marca: "", modelo: "", cantidadEsperada: 1 });
    setEditingItemIndex(null);
    setEditingRem(null);
    setRemFormOpen(true);
  };

  const addItemToCreateList = () => {
    const f = createItemForm;
    if (!f.idCategoria || !f.marca || !f.modelo) {
      toast.error("Categoría, marca y modelo son obligatorios");
      return;
    }
    const newItem = {
      idCategoria: Number(f.idCategoria),
      marca: f.marca,
      modelo: f.modelo,
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
    setCreateItemForm({ idCategoria: "", marca: "", modelo: "", cantidadEsperada: 1 });
  };

  const loadItemToForm = (idx: number) => {
    const item = createItems[idx];
    setCreateItemForm({
      idCategoria: String(item.idCategoria),
      marca: item.marca,
      modelo: item.modelo,
      cantidadEsperada: item.cantidadEsperada,
    });
    setEditingItemIndex(idx);
  };

  const removeItemFromCreateList = (idx: number) => {
    setCreateItems((prev) => prev.filter((_, i) => i !== idx));
    if (editingItemIndex === idx) {
      setEditingItemIndex(null);
      setCreateItemForm({ idCategoria: "", marca: "", modelo: "", cantidadEsperada: 1 });
    }
  };

  const openEditRem = (rem: Remision) => {
    if (user?.role === "coordinador") {
      setEditReason("");
      setPendingEditRem(rem);
      setEditReasonOpen(true);
      return;
    }
    setRemForm({
      numeroRemision: rem.numeroRemision,
      proveedor: rem.proveedor,
      motivoEdicion: "",
      rutaDocumento: rem.rutaDocumento ?? "",
      nombreDocumento: rem.nombreDocumento ?? "",
    });
    setEditingRem(rem);
    const items = ((rem as any).itemsRemision ?? []).map((i: any) => ({
      idItemRemision: i.idItemRemision,
      idCategoria: i.idCategoria,
      marca: i.marca,
      modelo: i.modelo,
      cantidadEsperada: i.cantidadEsperada,
    }));
    setCreateItems(items);
    setEditingItemIndex(null);
    setRemFormOpen(true);
  };

  const confirmRemEditReason = () => {
    if (!pendingEditRem) return;
    const rem = pendingEditRem;
    setRemForm({
      numeroRemision: rem.numeroRemision,
      proveedor: rem.proveedor,
      motivoEdicion: editReason,
      rutaDocumento: rem.rutaDocumento ?? "",
      nombreDocumento: rem.nombreDocumento ?? "",
    });
    setEditingRem(rem);
    const items = ((rem as any).itemsRemision ?? []).map((i: any) => ({
      idItemRemision: i.idItemRemision,
      idCategoria: i.idCategoria,
      marca: i.marca,
      modelo: i.modelo,
      cantidadEsperada: i.cantidadEsperada,
    }));
    setCreateItems(items);
    setEditingItemIndex(null);
    setEditReasonOpen(false);
    setPendingEditRem(null);
    setRemFormOpen(true);
  };

  const submitRem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remForm.numeroRemision || !remForm.proveedor) {
      toast.error("N° remisión y Proveedor son obligatorios");
      return;
    }
    if (!remForm.rutaDocumento) {
      toast.error("El documento PDF de la remisión es obligatorio");
      return;
    }
    setSubmitting(true);
    try {
      if (editingRem) {
        await updateMutation.mutateAsync({ id: editingRem.idRemision, data: remForm });
        const originalItems = ((editingRem as any).itemsRemision ?? []) as any[];
        const originalIds = originalItems.map((i: any) => i.idItemRemision);
        const currentIds = createItems
          .filter((i) => i.idItemRemision)
          .map((i) => i.idItemRemision!);
        const removedIds = originalIds.filter((id: number) => !currentIds.includes(id));
        for (const id of removedIds) {
          await apiFetch(`/api/ItemsRemision/${id}`, { method: "DELETE" });
        }
        for (const item of createItems) {
          if (item.idItemRemision) {
            await apiFetch(`/api/ItemsRemision/${item.idItemRemision}`, {
              method: "PUT",
              body: JSON.stringify(item),
            });
          } else {
            await apiFetch("/api/ItemsRemision", {
              method: "POST",
              body: JSON.stringify({ idRemision: editingRem.idRemision, ...item }),
            });
          }
        }
        toast.success("Remisión actualizada");
      } else {
        const rem = (await createMutation.mutateAsync(remForm)) as any;
        for (const item of createItems) {
          await apiFetch("/api/ItemsRemision", {
            method: "POST",
            body: JSON.stringify({ idRemision: rem.idRemision, ...item }),
          });
        }
        toast.success("Remisión creada");
      }
      qc.invalidateQueries({ queryKey: keys.remisiones.all });
      setRemFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRem = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync(toDelete.idRemision);
      toast.success("Remisión eliminada");
      setToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setDeleting(false);
    }
  };

  const confirmarRem = async (id: number) => {
    try {
      const result = await confirmarMutation.mutateAsync(id);
      toast.success(`Ingreso confirmado. ${result.length} activo(s) creado(s).`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  const esPdfValido = (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Solo se permiten archivos PDF");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo excede el tamaño máximo permitido (10 MB)");
      return false;
    }
    return true;
  };

  const subirDocumento = async (file: File) => {
    if (!esPdfValido(file)) return;
    if (remForm.rutaDocumento && !editingRem) {
      try {
        await limpiarDocumentoMutation.mutateAsync(remForm.rutaDocumento);
      } catch {
        /* ignore */
      }
    }
    setDocumentoSubiendo(true);
    try {
      if (editingRem) {
        const res = await reemplazarDocumentoMutation.mutateAsync({
          id: editingRem.idRemision,
          file,
        });
        setRemForm((s) => ({
          ...s,
          rutaDocumento: res.rutaDocumento,
          nombreDocumento: res.nombreDocumento,
        }));
        toast.success("Documento actualizado");
      } else {
        const res = await subirDocumentoMutation.mutateAsync(file);
        setRemForm((s) => ({
          ...s,
          rutaDocumento: res.rutaDocumento,
          nombreDocumento: res.nombreDocumento,
        }));
        toast.success("Documento subido");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir el documento");
    } finally {
      setDocumentoSubiendo(false);
    }
  };

  const quitarDocumentoForm = async () => {
    if (editingRem) {
      if (!remForm.rutaDocumento) return;
      setDocumentoSubiendo(true);
      try {
        await eliminarDocumentoMutation.mutateAsync(editingRem.idRemision);
        setRemForm((s) => ({ ...s, rutaDocumento: "", nombreDocumento: "" }));
        toast.success("Documento eliminado. Sube uno nuevo para guardar.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al eliminar el documento");
      } finally {
        setDocumentoSubiendo(false);
      }
    } else if (remForm.rutaDocumento) {
      try {
        await limpiarDocumentoMutation.mutateAsync(remForm.rutaDocumento);
      } catch {
        /* ignore */
      }
      setRemForm((s) => ({ ...s, rutaDocumento: "", nombreDocumento: "" }));
    }
  };

  const cerrarRemForm = async () => {
    if (!editingRem && remForm.rutaDocumento) {
      try {
        await limpiarDocumentoMutation.mutateAsync(remForm.rutaDocumento);
      } catch {
        /* ignore */
      }
    }
    setRemFormOpen(false);
  };

  const verDocumento = (id: number) => {
    window.open(buildDocumentoRemisionUrl(id), "_blank", "noopener,noreferrer");
  };

  const descargarDocumento = async (id: number, nombre?: string | null) => {
    try {
      await apiDownload(
        `/api/Remisiones/${id}/documento?descarga=1`,
        {},
        nombre || `remision-${id}.pdf`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al descargar el documento");
    }
  };

  const subirDocumentoDetalle = async (id: number, file: File) => {
    if (!esPdfValido(file)) return;
    setDocumentoSubiendo(true);
    try {
      await reemplazarDocumentoMutation.mutateAsync({ id, file });
      toast.success("Documento subido");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir el documento");
    } finally {
      setDocumentoSubiendo(false);
    }
  };

  const eliminarDocumentoDetalle = async (id: number) => {
    setDocumentoSubiendo(true);
    try {
      await eliminarDocumentoMutation.mutateAsync(id);
      toast.success("Documento eliminado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar el documento");
    } finally {
      setDocumentoSubiendo(false);
    }
  };

  const openAddItem = (idRemision: number) => {
    setItemForRemision(idRemision);
    setItemForm({ idCategoria: "", marca: "", modelo: "", cantidadEsperada: 1 });
    setItemFormOpen(true);
  };

  const submitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !itemForRemision ||
      !itemForm.idCategoria ||
      !itemForm.marca ||
      !itemForm.modelo
    ) {
      toast.error("Categoría, marca y modelo son obligatorios");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/ItemsRemision", {
        method: "POST",
        body: JSON.stringify({
          idRemision: itemForRemision,
          idCategoria: Number(itemForm.idCategoria),
          marca: itemForm.marca,
          modelo: itemForm.modelo,
          cantidadEsperada: itemForm.cantidadEsperada,
        }),
      });
      toast.success("Ítem agregado a la remisión");
      setItemFormOpen(false);
      qc.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const openAddSerials = (idItemRemision: number, nombre: string, maxSerials: number) => {
    setSerialForItem({ idItemRemision, nombre, maxSerials });
    setSerialInput("");
    setSerialBatch([]);
    setExistingSerials([]);
    setRemovedSerialIds([]);
    setEditedSerials({});
    setSerialFormOpen(true);
  };

  const openEditSerials = (
    idItemRemision: number,
    nombre: string,
    maxSerials: number,
    detalles: any[],
  ) => {
    setSerialForItem({ idItemRemision, nombre, maxSerials });
    setExistingSerials(
      detalles.map((d: any) => ({
        idDetalleItemRemision: d.idDetalleItemRemision,
        serial: d.serial,
      })),
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

  const removeExistingSerial = (idDetalleItemRemision: number) => {
    setRemovedSerialIds((prev) => [...prev, idDetalleItemRemision]);
  };

  const restoreExistingSerial = (idDetalleItemRemision: number) => {
    setRemovedSerialIds((prev) => prev.filter((id) => id !== idDetalleItemRemision));
  };

  const updateExistingSerial = (idDetalleItemRemision: number, value: string) => {
    setEditedSerials((prev) => ({ ...prev, [idDetalleItemRemision]: value }));
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
        await apiFetch("/api/DetallesItemRemision/batch", {
          method: "POST",
          body: JSON.stringify({ idItemRemision: serialForItem.idItemRemision, seriales: serialBatch }),
        });
        countAdded = serialBatch.length;
      }
      if (hasRemoved) {
        for (const id of removedSerialIds) {
          await apiFetch(`/api/DetallesItemRemision/${id}`, { method: "DELETE" });
          countDeleted++;
        }
      }
      if (hasUpdates) {
        for (const [id, serial] of Object.entries(editedSerials)) {
          await apiFetch(`/api/DetallesItemRemision/${id}`, {
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
      qc.invalidateQueries({ queryKey: keys.remisiones.all });
      qc.invalidateQueries({ queryKey: keys.itemsRemision.all });
      qc.invalidateQueries({ queryKey: keys.detallesItemRemision.all });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const ingresadosCount = (item: any) => item.detallesItem?.length ?? item.cantidadIngresada ?? 0;

  const pendientes = (rem: Remision) => {
    const items = (rem as any).itemsRemision ?? [];
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

  const remList = useMemo(() => {
    const list = remisiones ?? [];
    const q = query.toLowerCase().trim();
    let filtered = list;
    if (q) {
      filtered = filtered.filter(
        (rem) =>
          rem.numeroRemision.toLowerCase().includes(q) ||
          rem.proveedor.toLowerCase().includes(q) ||
          new Date(rem.fechaCompra).toLocaleDateString("es-CO").includes(q),
      );
    }
    if (statusFilter === "pending") {
      filtered = filtered.filter((rem) => pendientes(rem) > 0);
    } else if (statusFilter === "completed") {
      filtered = filtered.filter((rem) => pendientes(rem) === 0);
    }
    return filtered;
  }, [remisiones, query, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(remList.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRem = useMemo(
    () => remList.slice((safePage - 1) * pageSize, safePage * pageSize),
    [remList, safePage, pageSize],
  );

  return (
    <>
      <AppHeader
        title="Remisiones"
        subtitle="Remisiones de ingreso de activos"
        actions={
          canCreate && (
            <Button onClick={openCreateRem} variant="brand" size="sm">
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
                placeholder="Buscar por N° remisión, proveedor o fecha..."
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
              {remList.length} registro{remList.length === 1 ? "" : "s"}
            </span>
          </div>
        </Card>
        {/* Desktop: table view */}
        <Card className="overflow-hidden hidden sm:block">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>N° Remisión</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Documento</TableHead>
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
                ) : !remList.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      Sin registros
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRem.map((rem) => {
                    const items = (rem as any).itemsRemision ?? [];
                    const totalItems = items.reduce(
                      (a: number, i: any) => a + i.cantidadEsperada,
                      0,
                    );
                    const ingresados = items.reduce(
                      (a: number, i: any) => a + ingresadosCount(i),
                      0,
                    );
                    return (
                      <TableRow key={rem.idRemision} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs">{rem.numeroRemision}</TableCell>
                        <TableCell>{rem.proveedor}</TableCell>
                        <TableCell>
                          {new Date(rem.fechaCompra).toLocaleDateString("es-CO")}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">
                            {ingresados}/{totalItems} ingresados
                          </span>
                          {pendientes(rem) > 0 && (
                            <Badge
                              variant="outline"
                              className="ml-2 bg-warning/15 text-warning text-xs"
                            >
                              {pendientes(rem)} pend.
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {rem.rutaDocumento ? (
                            <Badge
                              variant="outline"
                              className="bg-success/10 text-success text-xs whitespace-nowrap"
                            >
                              <FileText className="h-3 w-3 mr-1" /> PDF
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-muted text-muted-foreground text-xs whitespace-nowrap"
                            >
                              Sin doc.
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDetailView(rem)}
                              aria-label="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canEdit && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditRem(rem)}
                                aria-label="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setToDelete(rem)}
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
          ) : !remList.length ? (
            <Card className="p-6">
              <p className="text-center text-sm text-muted-foreground">Sin registros</p>
            </Card>
          ) : (
            paginatedRem.map((rem) => {
              const items = (rem as any).itemsRemision ?? [];
              const totalItems = items.reduce((a: number, i: any) => a + i.cantidadEsperada, 0);
              const ingresados = items.reduce((a: number, i: any) => a + ingresadosCount(i), 0);
              return (
                <Card key={rem.idRemision} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-muted-foreground font-medium shrink-0 w-28 leading-5">
                        N° Remisión
                      </span>
                      <span className="text-sm text-right font-mono leading-5">
                        {rem.numeroRemision}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-muted-foreground font-medium shrink-0 w-28 leading-5">
                        Proveedor
                      </span>
                      <span className="text-sm text-right leading-5">{rem.proveedor}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-muted-foreground font-medium shrink-0 w-28 leading-5">
                        Fecha
                      </span>
                      <span className="text-sm text-right leading-5">
                        {new Date(rem.fechaCompra).toLocaleDateString("es-CO")}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-muted-foreground font-medium shrink-0 w-28 leading-5">
                        Items
                      </span>
                      <span className="text-sm text-right leading-5">
                        {ingresados}/{totalItems} ingresados
                        {pendientes(rem) > 0 && (
                          <Badge
                            variant="outline"
                            className="ml-1 bg-warning/15 text-warning text-xs"
                          >
                            {pendientes(rem)} pend.
                          </Badge>
                        )}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-muted-foreground font-medium shrink-0 w-28 leading-5">
                        Documento
                      </span>
                      <span className="text-sm text-right leading-5">
                        {rem.rutaDocumento ? (
                          <Badge
                            variant="outline"
                            className="bg-success/10 text-success text-xs whitespace-nowrap"
                          >
                            <FileText className="h-3 w-3 mr-1" /> PDF
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-muted text-muted-foreground text-xs whitespace-nowrap"
                          >
                            Sin doc.
                          </Badge>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1 pt-3 mt-3 border-t">
                    <Button size="sm" variant="ghost" onClick={() => setDetailView(rem)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                    </Button>
                    {canEdit && (
                      <Button size="sm" variant="ghost" onClick={() => openEditRem(rem)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setToDelete(rem)}
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

        {remList.length > 0 && (
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

      {/* Remisión Create/Edit Dialog */}
      <Dialog
        open={remFormOpen}
        onOpenChange={(o) => {
          if (!o) cerrarRemForm();
        }}
      >
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRem ? "Editar remisión" : "Nueva remisión"}</DialogTitle>
            <DialogDescription>Ingresa los datos de la remisión.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitRem} className="space-y-6">
            {/* Remisión fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numeroRemision">
                  N° Remisión <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="numeroRemision"
                  value={remForm.numeroRemision}
                  onChange={(e) =>
                    setRemForm((s) => ({ ...s, numeroRemision: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proveedor">
                  Proveedor <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="proveedor"
                  value={remForm.proveedor}
                  onChange={(e) => setRemForm((s) => ({ ...s, proveedor: e.target.value }))}
                />
              </div>
            </div>

            {/* Documento de la remisión */}
            <SeccionDocumento
              existe={!!remForm.rutaDocumento}
              nombreDocumento={remForm.nombreDocumento}
              subiendo={documentoSubiendo}
              puedeEditar
              esCreacion={!editingRem}
              onUpload={subirDocumento}
              onDelete={quitarDocumentoForm}
              onView={editingRem ? () => verDocumento(editingRem.idRemision) : undefined}
              onDownload={
                editingRem
                  ? () => descargarDocumento(editingRem.idRemision, remForm.nombreDocumento)
                  : undefined
              }
            />

            {/* Items section */}
            <>
              <hr />
              <div>
                <h4 className="text-sm font-semibold mb-3">Ítems de la remisión</h4>
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
                          marca: "",
                          modelo: "",
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
                onClick={() => cerrarRemForm()}
                disabled={submitting || documentoSubiendo}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="brand"
                disabled={submitting || documentoSubiendo || !remForm.rutaDocumento}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingRem ? "Guardar cambios" : "Crear remisión"}
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
              {detailData?.numeroRemision ?? detailView?.numeroRemision ?? "Detalles de la remisión"}
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
              const items = (data as any).itemsRemision ?? [];
              const totalItems = items.reduce((a: number, i: any) => a + i.cantidadEsperada, 0);
              const ingresados = items.reduce((a: number, i: any) => a + ingresadosCount(i), 0);
              const hasPendientes = items.some((i: any) =>
                i.detallesItem?.some((d: any) => !d.procesado),
              );
              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground text-xs">N° Remisión</Label>
                      <p className="font-medium truncate">{data.numeroRemision}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Proveedor</Label>
                      <p className="truncate">{data.proveedor}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Fecha</Label>
                      <p>{new Date(data.fechaCompra).toLocaleDateString("es-CO")}</p>
                    </div>
                  </div>

                  {/* Documento de la remisión */}
                  <SeccionDocumento
                    existe={!!data.rutaDocumento}
                    nombreDocumento={data.nombreDocumento}
                    subiendo={documentoSubiendo}
                    puedeEditar={canEdit}
                    onUpload={(f) => subirDocumentoDetalle(data.idRemision, f)}
                    onDelete={() => eliminarDocumentoDetalle(data.idRemision)}
                    onView={() => verDocumento(data.idRemision)}
                    onDownload={() => descargarDocumento(data.idRemision, data.nombreDocumento)}
                  />

                  <div>
                    <div className="flex flex-wrap gap-2 items-center mb-3">
                      <h4 className="text-sm font-semibold">Ítems de la remisión</h4>
                      {canCreate && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const id = data.idRemision;
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
                              const id = data.idRemision;
                              setDetailView(null);
                              confirmarRem(id);
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
                                  <TableRow key={item.idItemRemision} className="hover:bg-muted/30">
                                    <TableCell>
                                      <div className="flex flex-col gap-0.5 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Badge
                                            variant="outline"
                                            className="text-[10px] h-4 px-1.5 shrink-0"
                                          >
                                            {item.nombreCategoria ?? "—"}
                                          </Badge>
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
                                              key={d.idDetalleItemRemision}
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
                                              const id = item.idItemRemision;
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
                                            const id = item.idItemRemision;
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
                              <Card key={item.idItemRemision} className="p-3">
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
                                  <div className="flex flex-wrap gap-1 items-center pt-1">
                                    {detalles.length > 0 ? (
                                      detalles.map((d: any) => (
                                        <Badge
                                          key={d.idDetalleItemRemision}
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
                                          const id = item.idItemRemision;
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
                                        const id = item.idItemRemision;
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
            <DialogTitle>Agregar ítem a la remisión</DialogTitle>
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
                  const isRemoved = removedSerialIds.includes(es.idDetalleItemRemision);
                  const editedValue = editedSerials[es.idDetalleItemRemision] ?? es.serial;
                  return (
                    <div
                      key={es.idDetalleItemRemision}
                      className={`flex items-center gap-2 text-sm px-2 py-1.5 rounded ${isRemoved ? "bg-destructive/10 line-through opacity-50" : "bg-muted/30"}`}
                    >
                      <Input
                        value={editedValue}
                        onChange={(e) =>
                          updateExistingSerial(es.idDetalleItemRemision, e.target.value)
                        }
                        disabled={isRemoved}
                        className="h-7 font-mono text-xs flex-1 min-w-0"
                      />
                      {isRemoved ? (
                        <button
                          onClick={() => restoreExistingSerial(es.idDetalleItemRemision)}
                          className="text-xs text-primary hover:text-primary/80 shrink-0"
                        >
                          Restaurar
                        </button>
                      ) : (
                        <button
                          onClick={() => removeExistingSerial(es.idDetalleItemRemision)}
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
            setPendingEditRem(null);
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
                setPendingEditRem(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="brand" onClick={confirmRemEditReason} disabled={!editReason.trim()}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar remisión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán también sus ítems y seriales no
              procesados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteRem}
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