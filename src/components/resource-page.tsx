import { useMemo, useState, useEffect, type ReactNode } from "react";
import { Plus, Pencil, Trash2, Search, Loader2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

const PAGE_SIZES = [10, 20, 30, 50, 100] as const;

export type FieldDef =
  | {
      key: string;
      label: string;
      type: "text" | "email" | "number" | "date" | "password";
      required?: boolean;
      placeholder?: string;
    }
  | { key: string; label: string; type: "textarea"; required?: boolean; placeholder?: string }
  | {
      key: string;
      label: string;
      type: "select";
      options: { value: string | number; label: string }[];
      required?: boolean;
    };

export interface Column<T> {
  header: string;
  key?: keyof T;
  render?: (row: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface ResourcePageProps<T> {
  title: string;
  subtitle?: string;
  data: T[];
  isLoading: boolean;
  idKey: keyof T;
  columns: Column<T>[];
  fields: FieldDef[];
  searchKeys: (keyof T)[];
  singular: string;
  defaultValues?: Partial<T>;
  onCreate: (data: Partial<T>) => Promise<unknown>;
  onUpdate: (id: number, data: Partial<T>) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
  loadingCreate?: boolean;
  loadingUpdate?: boolean;
  loadingDelete?: boolean;
  transformCreate?: (data: Partial<T>) => Partial<T>;
  transformUpdate?: (data: Partial<T>) => Partial<T>;
  filters?: ReactNode;
  filterFn?: (item: T) => boolean;
  module?: string;
  extraActions?: (row: T) => ReactNode;
}

export function ResourcePage<T>({
  title,
  subtitle,
  data,
  isLoading,
  idKey,
  columns,
  fields,
  searchKeys,
  singular,
  defaultValues,
  onCreate,
  onUpdate,
  onDelete,
  loadingCreate,
  loadingUpdate,
  loadingDelete,
  transformCreate,
  transformUpdate,
  filters,
  filterFn,
  module,
  extraActions,
}: ResourcePageProps<T>) {
  const { can, user } = useAuth();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [editing, setEditing] = useState<T | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<T | null>(null);
  const [viewing, setViewing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [editReason, setEditReason] = useState("");
  const [editReasonOpen, setEditReasonOpen] = useState(false);
  const [pendingEditRow, setPendingEditRow] = useState<T | null>(null);

  const filtered = useMemo(() => {
    let result = data;
    if (filterFn) {
      result = result.filter(filterFn);
    }
    if (!query.trim()) return result;
    const q = query.toLowerCase();
    return result.filter((r) =>
      searchKeys.some((k) =>
        String(r[k] ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [data, query, searchKeys, filterFn]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [query]);

  const openCreate = () => {
    const initial: Record<string, unknown> = { ...(defaultValues ?? {}) };
    fields.forEach((f) => {
      if (!(f.key in initial)) initial[f.key] = f.type === "number" ? 0 : "";
    });
    setForm(initial);
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (row: T) => {
    if (user?.role === "coordinador") {
      setEditReason("");
      setPendingEditRow(row);
      setEditReasonOpen(true);
      return;
    }
    setForm({ ...(row as unknown as Record<string, unknown>) });
    setEditing(row);
    setOpen(true);
  };

  const confirmEditReason = () => {
    if (!pendingEditRow) return;
    const row = pendingEditRow;
    setForm((prev) => ({ ...(row as unknown as Record<string, unknown>), motivoEdicion: editReason }));
    setEditing(row);
    setEditReasonOpen(false);
    setPendingEditRow(null);
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const f of fields) {
      if (f.required && (form[f.key] === "" || form[f.key] === undefined || form[f.key] === null)) {
        toast.error(`${f.label} es obligatorio`);
        return;
      }
    }
    setSubmitting(true);
    try {
      if (editing) {
        const payload = transformUpdate ? transformUpdate(form as Partial<T>) : (form as Partial<T>);
        await onUpdate(editing[idKey] as unknown as number, payload);
        toast.success(`${singular} actualizado`);
      } else {
        const payload = transformCreate ? transformCreate(form as Partial<T>) : (form as Partial<T>);
        await onCreate(payload);
        toast.success(`${singular} creado`);
      }
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setSubmitting(true);
    try {
      await onDelete(toDelete[idKey] as unknown as number);
      toast.success(`${singular} eliminado`);
      setToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const canCreate = can("create", module);
  const canEdit = can("edit", module);
  const canDelete = can("delete", module);

  return (
    <>
      <AppHeader
        title={title}
        subtitle={subtitle}
        actions={
          canCreate && (
            <Button onClick={openCreate} variant="brand" size="sm">
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
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="pl-9"
              />
            </div>
            {filters && (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {filters}
              </div>
            )}
            <span className="text-xs text-muted-foreground sm:ml-auto whitespace-nowrap">
              {filtered.length} registro{filtered.length === 1 ? "" : "s"}
            </span>
          </div>
        </Card>

        {/* Desktop: table view */}
        <Card className="overflow-hidden hidden sm:block">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  {columns.map((c, i) => (
                    <TableHead key={i} className={cn(c.className, c.hideOnMobile && "hidden md:table-cell")}>
                      {c.header}
                    </TableHead>
                  ))}
                  <TableHead className="w-24 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + 1} className="text-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 1}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      Sin registros
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((row) => (
                    <TableRow key={String(row[idKey])} className="hover:bg-muted/30">
                      {columns.map((c, i) => (
                        <TableCell key={i} className={cn(c.className, c.hideOnMobile && "hidden md:table-cell")}>
                          {c.render ? c.render(row) : String(row[c.key as keyof T] ?? "")}
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setViewing(row)}
                            aria-label="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {extraActions?.(row)}
                          {canEdit && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEdit(row)}
                              aria-label="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setToDelete(row)}
                              aria-label="Eliminar"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
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
          ) : filtered.length === 0 ? (
            <Card className="p-6">
              <p className="text-center text-sm text-muted-foreground">Sin registros</p>
            </Card>
          ) : (
            paginated.map((row) => (
              <Card key={String(row[idKey])} className="p-3">
                <div className="space-y-2">
                  {columns.filter((c) => !c.hideOnMobile).map((c) => (
                    <div key={String(c.key ?? c.header)} className="flex items-start justify-between gap-2">
                      <span className="text-xs text-muted-foreground font-medium shrink-0 w-28 leading-5">
                        {c.header}
                      </span>
                      <span className="text-sm text-right leading-5">
                        {c.render ? c.render(row) : String(row[c.key as keyof T] ?? "—")}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-1 pt-3 mt-3 border-t">
                  <Button size="sm" variant="ghost" onClick={() => setViewing(row)}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                  </Button>
                  {extraActions?.(row)}
                  {canEdit && (
                    <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                  )}
                  {canDelete && (
                    <Button size="sm" variant="ghost" onClick={() => setToDelete(row)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Filas por página:</span>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Editar ${singular}` : `Nuevo ${singular}`}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Actualiza los datos del registro."
                : "Completa el formulario para crear un registro."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map((f) => (
                <div
                  key={f.key}
                  className={f.type === "textarea" ? "sm:col-span-2 space-y-2" : "space-y-2"}
                >
                  <Label htmlFor={f.key}>
                    {f.label}
                    {f.required && <span className="text-destructive"> *</span>}
                  </Label>
                  {f.type === "textarea" ? (
                    <Textarea
                      id={f.key}
                      value={String(form[f.key] ?? "")}
                      onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      rows={3}
                    />
                  ) : f.type === "select" ? (
                    <Select
                      value={
                        form[f.key] !== undefined && form[f.key] !== ""
                          ? String(form[f.key])
                          : undefined
                      }
                      onValueChange={(v) => {
                        const opt = f.options.find((o) => String(o.value) === v);
                        setForm((s) => ({ ...s, [f.key]: opt ? opt.value : v }));
                      }}
                    >
                      <SelectTrigger id={f.key}>
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                      <SelectContent>
                        {f.options.map((o) => (
                          <SelectItem key={String(o.value)} value={String(o.value)}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={f.key}
                      type={f.type}
                      value={String(form[f.key] ?? "")}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value,
                        }))
                      }
                      placeholder={f.placeholder}
                    />
                  )}
                </div>
              ))}
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
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {singular}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El registro se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit reason dialog (coordinador) */}
      <Dialog open={editReasonOpen} onOpenChange={(o) => { if (!o) { setEditReasonOpen(false); setPendingEditRow(null); } }}>
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
            <Button variant="outline" onClick={() => { setEditReasonOpen(false); setPendingEditRow(null); }}>
              Cancelar
            </Button>
            <Button variant="brand" onClick={confirmEditReason} disabled={!editReason.trim()}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View details dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles del {singular}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              {columns.map((c) => (
                <div key={String(c.key ?? c.header)}>
                  <Label className="text-muted-foreground text-xs font-medium">{c.header}</Label>
                  <div className="text-sm mt-0.5">
                    {c.render ? c.render(viewing) : String(viewing[c.key as keyof T] ?? "—")}
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
