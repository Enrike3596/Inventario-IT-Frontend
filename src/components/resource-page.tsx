import { useMemo, useState, type ReactNode } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
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
import { Resource, useResource } from "@/lib/store";

export type FieldDef =
  | { key: string; label: string; type: "text" | "email" | "number" | "date"; required?: boolean; placeholder?: string }
  | { key: string; label: string; type: "textarea"; required?: boolean; placeholder?: string }
  | { key: string; label: string; type: "select"; options: { value: string | number; label: string }[]; required?: boolean };

export interface Column<T> {
  header: string;
  key?: keyof T;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface ResourcePageProps<T> {
  title: string;
  subtitle?: string;
  resource: Resource<T>;
  idKey: keyof T;
  columns: Column<T>[];
  fields: FieldDef[];
  searchKeys: (keyof T)[];
  singular: string;
  defaultValues?: Partial<T>;
}

export function ResourcePage<T>({
  title,
  subtitle,
  resource,
  idKey,
  columns,
  fields,
  searchKeys,
  singular,
  defaultValues,
}: ResourcePageProps<T>) {
  const rows = useResource(resource);
  const { can } = useAuth();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<T | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q)),
    );
  }, [rows, query, searchKeys]);

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
    setForm({ ...(row as unknown as Record<string, unknown>) });
    setEditing(row);
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const f of fields) {
      if (f.required && (form[f.key] === "" || form[f.key] === undefined || form[f.key] === null)) {
        toast.error(`${f.label} es obligatorio`);
        return;
      }
    }
    if (editing) {
      resource.update(editing[idKey] as unknown as number, form as Partial<T>);
      toast.success(`${singular} actualizado`);
    } else {
      resource.create(form as Partial<T>);
      toast.success(`${singular} creado`);
    }
    setOpen(false);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    resource.remove(toDelete[idKey] as unknown as number);
    toast.success(`${singular} eliminado`);
    setToDelete(null);
  };

  const canCreate = can("create");
  const canEdit = can("edit");
  const canDelete = can("delete");

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
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="pl-9"
              />
            </div>
            <span className="text-xs text-muted-foreground ml-auto">
              {filtered.length} registro{filtered.length === 1 ? "" : "s"}
            </span>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  {columns.map((c, i) => (
                    <TableHead key={i} className={c.className}>
                      {c.header}
                    </TableHead>
                  ))}
                  <TableHead className="w-24 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + 1} className="text-center text-sm text-muted-foreground py-10">
                      Sin registros
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
                    <TableRow key={String(row[idKey])} className="hover:bg-muted/30">
                      {columns.map((c, i) => (
                        <TableCell key={i} className={c.className}>
                          {c.render ? c.render(row) : String(row[c.key as keyof T] ?? "")}
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          {canEdit && (
                            <Button size="icon" variant="ghost" onClick={() => openEdit(row)} aria-label="Editar">
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
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Editar ${singular}` : `Nuevo ${singular}`}</DialogTitle>
            <DialogDescription>
              {editing ? "Actualiza los datos del registro." : "Completa el formulario para crear un registro."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map((f) => (
                <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2 space-y-2" : "space-y-2"}>
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
                      value={form[f.key] !== undefined && form[f.key] !== "" ? String(form[f.key]) : undefined}
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="brand">
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
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
