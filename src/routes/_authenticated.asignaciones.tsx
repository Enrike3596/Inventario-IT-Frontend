import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { toast } from "sonner";
import {
  Loader2, Check, ChevronsUpDown, Plus, Search, Eye, Undo2, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  useAsignaciones,
  useCreateAsignacion,
  useUpdateAsignacion,
  useUsuarios,
  useActivos,
  useParqueaderos,
  useCanales,
} from "@/lib/queries";
import type { AsignacionUsuario, Activo } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/asignaciones")({
  head: () => ({ meta: [{ title: "Asignaciones — Indigo" }] }),
  component: Page,
});

const PAGE_SIZES = [10, 20, 30, 50, 100] as const;

interface AsignacionGroup {
  key: string;
  nombre: string;
  tipo: "Usuario" | "Parqueadero";
  idDestino: number;
  asignaciones: AsignacionUsuario[];
  allFinalizadas: boolean;
}

function ActivoCombobox({
  value,
  onChange,
  activosDisponibles,
}: {
  value: number | undefined;
  onChange: (value: number) => void;
  activosDisponibles: Activo[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setSearch("");
    }
  }, [open]);

  const filtered = useMemo(
    () => activosDisponibles.filter((a) => {
      const q = search.toLowerCase();
      return (
        a.serial.toLowerCase().includes(q) ||
        a.marca.toLowerCase().includes(q) ||
        a.modelo.toLowerCase().includes(q) ||
        (a.codigoActivo ?? "").toLowerCase().includes(q)
      );
    }),
    [activosDisponibles, search],
  );

  const selected = activosDisponibles.find((a) => a.idActivo === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate flex-1 min-w-0">
            {selected
              ? `${selected.serial} — ${selected.marca} ${selected.modelo}`
              : "Selecciona un activo..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 max-h-[380px]"
        onWheel={(e) => e.stopPropagation()}
      >
        <Command className="w-full" shouldFilter={false}>
          <CommandInput
            ref={inputRef}
            placeholder="Buscar activo..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[340px]">
            <CommandEmpty>No se encontraron activos.</CommandEmpty>
            <CommandGroup>
              {filtered.map((a) => (
                <CommandItem
                  key={a.idActivo}
                  value={`${a.serial} ${a.marca} ${a.modelo} ${a.codigoActivo}`}
                  onSelect={() => {
                    onChange(a.idActivo);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === a.idActivo ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{a.serial} — {a.marca} {a.modelo}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function Page() {
  const { data: asignaciones, isLoading } = useAsignaciones();
  const { data: usuarios } = useUsuarios();
  const { data: activos } = useActivos();
  const { data: parqueaderos } = useParqueaderos();
  const { data: canales } = useCanales();
  const createMutation = useCreateAsignacion();
  const updateMutation = useUpdateAsignacion();
  const { can } = useAuth();

  const canCreate = can("create", "asignaciones");
  const canEdit = can("edit", "asignaciones");

  const [estadoFilter, setEstadoFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [viewGroup, setViewGroup] = useState<AsignacionGroup | null>(null);
  const [returnGroup, setReturnGroup] = useState<AsignacionGroup | null>(null);
  const [returnMotivo, setReturnMotivo] = useState("");
  const [returningId, setReturningId] = useState<number | null>(null);
  const [returnActive, setReturnActive] = useState<AsignacionUsuario[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<Record<string, unknown>>({});
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const activosDisponibles = useMemo(
    () => (activos ?? []).filter((a) => a.estadoActivo === "Disponible"),
    [activos],
  );

  const activosMap = useMemo(
    () => new Map((activos ?? []).map((a) => [a.idActivo, a])),
    [activos],
  );

  const groups = useMemo(() => {
    const map = new Map<string, AsignacionUsuario[]>();
    (asignaciones ?? []).forEach((a) => {
      const { idUsuarioDestino, nombreUsuarioDestino, idParqueadero, nombreParqueadero } = a;
      let key: string;
      if (idUsuarioDestino && nombreUsuarioDestino) {
        key = `user-${idUsuarioDestino}`;
      } else if (idParqueadero && nombreParqueadero) {
        key = `park-${idParqueadero}`;
      } else {
        key = `unknown-${a.idAsignacion}`;
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });

    const result: AsignacionGroup[] = [];
    map.forEach((asignaciones, key) => {
      const first = asignaciones[0];
      const isUser = key.startsWith("user-");
      result.push({
        key,
        nombre: isUser ? first.nombreUsuarioDestino ?? "—" : first.nombreParqueadero ?? "—",
        tipo: isUser ? "Usuario" : "Parqueadero",
        idDestino: isUser ? first.idUsuarioDestino : (first.idParqueadero ?? 0),
        asignaciones,
        allFinalizadas: asignaciones.every((a) => a.estadoAsignacion === "Finalizada"),
      });
    });

    return result.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [asignaciones]);

  const filteredGroups = useMemo(() => {
    let result = groups;
    if (estadoFilter !== "all") {
      const filterFinalizada = estadoFilter === "Finalizada";
      result = result.filter((g) => g.allFinalizadas === filterFinalizada);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.nombre.toLowerCase().includes(q) ||
          g.asignaciones.some(
            (a) =>
              a.serial?.toLowerCase().includes(q) ||
              a.codigoActivo?.toLowerCase().includes(q),
          ),
      );
    }
    return result;
  }, [groups, estadoFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filteredGroups.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredGroups, safePage, pageSize],
  );

  const openCreate = useCallback(() => {
    const initial: Record<string, unknown> = {
      idUsuarioDestino: "",
      idActivo: "",
      idParqueadero: "",
      idCanal: "",
      idUsuarioEntrega: "",
      registroSalida: "",
      numeroTicket: "",
      estadoAsignacion: "Activa",
    };
    setCreateForm(initial);
    setCreateOpen(true);
  }, []);

  const handleCreateSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const required = ["idUsuarioDestino", "idActivo", "idCanal", "idUsuarioEntrega", "registroSalida"];
    for (const k of required) {
      if (createForm[k] === "" || createForm[k] === undefined || createForm[k] === null) {
        const labels: Record<string, string> = {
          idUsuarioDestino: "Usuario destino",
          idActivo: "Activo",
          idCanal: "Canal",
          idUsuarioEntrega: "Usuario entrega",
          registroSalida: "Registro de salida",
        };
        toast.error(`${labels[k] ?? k} es obligatorio`);
        return;
      }
    }
    setCreateSubmitting(true);
    try {
      const payload = {
        ...createForm,
        idParqueadero: createForm.idParqueadero === "" ? null : createForm.idParqueadero,
      } as Partial<AsignacionUsuario>;
      await createMutation.mutateAsync(payload);
      toast.success("Asignación creada");
      setCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setCreateSubmitting(false);
    }
  }, [createForm, createMutation]);

  const openReturn = useCallback((group: AsignacionGroup) => {
    setReturnGroup(group);
    setReturnMotivo("");
    setReturnActive(group.asignaciones.filter((a) => a.estadoAsignacion === "Activa"));
    setReturningId(null);
  }, []);

  const handleReturn = useCallback(async (asignacion: AsignacionUsuario) => {
    if (!returnMotivo.trim()) {
      toast.error("Debes indicar el motivo de la devolución");
      return;
    }
    setReturningId(asignacion.idAsignacion);
    try {
      await updateMutation.mutateAsync({
        id: asignacion.idAsignacion,
        data: { estadoAsignacion: "Finalizada", motivoEdicion: returnMotivo },
      });
      toast.success(`Devolución de ${asignacion.serial ?? "activo"} confirmada`);
      setReturnActive((prev) => prev.filter((a) => a.idAsignacion !== asignacion.idAsignacion));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al devolver el activo");
    } finally {
      setReturningId(null);
    }
  }, [returnMotivo, updateMutation]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("es-CO");

  return (
    <>
      <AppHeader
        title="Asignaciones"
        subtitle="Entrega de activos a usuarios"
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
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                placeholder="Buscar por nombre, serial o código..."
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Estado:</span>
              <Select value={estadoFilter} onValueChange={(v) => { setEstadoFilter(v); setPage(1); }}>
                <SelectTrigger className="h-9 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Activa">Activa</SelectItem>
                  <SelectItem value="Finalizada">Finalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-xs text-muted-foreground sm:ml-auto whitespace-nowrap">
              {filteredGroups.length} grupo{filteredGroups.length === 1 ? "" : "s"}
            </span>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Activos</TableHead>
                  <TableHead className="hidden sm:table-cell">Última asignación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-24 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                      Sin registros
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((g) => (
                    <TableRow key={g.key} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{g.nombre}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{g.tipo}</Badge>
                      </TableCell>
                      <TableCell>{g.asignaciones.length}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {formatDate(
                          g.asignaciones.reduce((latest, a) =>
                            a.fechaAsignacion > latest ? a.fechaAsignacion : latest,
                            g.asignaciones[0].fechaAsignacion,
                          ),
                        )}
                      </TableCell>
                      <TableCell>
                        {g.allFinalizadas ? (
                          <Badge variant="secondary">Finalizada</Badge>
                        ) : (
                          <Badge variant="default">Activa</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button
                            size="icon" variant="ghost"
                            onClick={() => setViewGroup(g)}
                            aria-label="Ver activos"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canEdit && (
                            <Button
                              size="icon" variant="ghost"
                              onClick={() => openReturn(g)}
                              aria-label="Devolución"
                            >
                              <Undo2 className="h-4 w-4" />
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

        {filteredGroups.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Filas por página:</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-8 w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((s) => (
                    <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Página {safePage} de {totalPages}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva asignación</DialogTitle>
            <DialogDescription>Completa el formulario para crear una asignación.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idUsuarioDestino">Usuario destino <span className="text-destructive"> *</span></Label>
                <Select
                  value={createForm.idUsuarioDestino !== "" ? String(createForm.idUsuarioDestino) : undefined}
                  onValueChange={(v) => setCreateForm((s) => ({ ...s, idUsuarioDestino: Number(v) }))}
                >
                  <SelectTrigger id="idUsuarioDestino">
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(usuarios ?? []).map((u) => (
                      <SelectItem key={u.idUsuario} value={String(u.idUsuario)}>{u.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idActivo">Activo <span className="text-destructive"> *</span></Label>
                <ActivoCombobox
                  value={createForm.idActivo as number | undefined}
                  onChange={(v) => setCreateForm((s) => ({ ...s, idActivo: v }))}
                  activosDisponibles={activosDisponibles}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idParqueadero">Parqueadero destino</Label>
                <Select
                  value={createForm.idParqueadero !== "" ? String(createForm.idParqueadero) : undefined}
                  onValueChange={(v) => setCreateForm((s) => ({ ...s, idParqueadero: Number(v) }))}
                >
                  <SelectTrigger id="idParqueadero">
                    <SelectValue placeholder="— Ninguno —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— Ninguno —</SelectItem>
                    {(parqueaderos ?? []).map((p) => (
                      <SelectItem key={p.idParqueadero} value={String(p.idParqueadero)}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idCanal">Canal <span className="text-destructive"> *</span></Label>
                <Select
                  value={createForm.idCanal !== "" ? String(createForm.idCanal) : undefined}
                  onValueChange={(v) => setCreateForm((s) => ({ ...s, idCanal: Number(v) }))}
                >
                  <SelectTrigger id="idCanal">
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(canales ?? []).map((c) => (
                      <SelectItem key={c.idCanal} value={String(c.idCanal)}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idUsuarioEntrega">Usuario entrega <span className="text-destructive"> *</span></Label>
                <Select
                  value={createForm.idUsuarioEntrega !== "" ? String(createForm.idUsuarioEntrega) : undefined}
                  onValueChange={(v) => setCreateForm((s) => ({ ...s, idUsuarioEntrega: Number(v) }))}
                >
                  <SelectTrigger id="idUsuarioEntrega">
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(usuarios ?? []).map((u) => (
                      <SelectItem key={u.idUsuario} value={String(u.idUsuario)}>{u.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registroSalida">Registro de salida <span className="text-destructive"> *</span></Label>
                <Input
                  id="registroSalida"
                  value={String(createForm.registroSalida ?? "")}
                  onChange={(e) => setCreateForm((s) => ({ ...s, registroSalida: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroTicket">N° Ticket</Label>
                <Input
                  id="numeroTicket"
                  value={String(createForm.numeroTicket ?? "")}
                  onChange={(e) => setCreateForm((s) => ({ ...s, numeroTicket: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estadoAsignacion">Estado <span className="text-destructive"> *</span></Label>
                <Select
                  value={String(createForm.estadoAsignacion ?? "Activa")}
                  onValueChange={(v) => setCreateForm((s) => ({ ...s, estadoAsignacion: v }))}
                >
                  <SelectTrigger id="estadoAsignacion">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activa">Activa</SelectItem>
                    <SelectItem value="Finalizada">Finalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={createSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" variant="brand" disabled={createSubmitting}>
                {createSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View details dialog */}
      <Dialog open={!!viewGroup} onOpenChange={(o) => !o && setViewGroup(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Activos asignados — {viewGroup?.nombre}</DialogTitle>
            <DialogDescription>
              {viewGroup?.tipo}: {viewGroup?.asignaciones.length} activo{viewGroup?.asignaciones.length !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>
          {viewGroup && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Serial</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Asignación</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewGroup.asignaciones.map((a) => {
                    const activo = activosMap.get(a.idActivo);
                    return (
                      <TableRow key={a.idAsignacion}>
                        <TableCell className="font-medium">{a.serial ?? "—"}</TableCell>
                        <TableCell>{a.codigoActivo ?? "—"}</TableCell>
                        <TableCell>{activo?.marca ?? "—"}</TableCell>
                        <TableCell>{activo?.modelo ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(a.fechaAsignacion)}</TableCell>
                        <TableCell>
                          <Badge variant={a.estadoAsignacion === "Activa" ? "default" : "secondary"}>
                            {a.estadoAsignacion}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewGroup(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return / devolucion dialog */}
      <Dialog open={!!returnGroup} onOpenChange={(o) => !o && setReturnGroup(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Devolución de activos — {returnGroup?.nombre}</DialogTitle>
            <DialogDescription>
              Selecciona los activos que deseas devolver y confirma uno por uno.
            </DialogDescription>
          </DialogHeader>
          {returnGroup && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="returnMotivo">Motivo de la devolución <span className="text-destructive"> *</span></Label>
                <Textarea
                  id="returnMotivo"
                  value={returnMotivo}
                  onChange={(e) => setReturnMotivo(e.target.value)}
                  placeholder="Describe el motivo de la devolución..."
                  rows={2}
                />
              </div>

              {returnActive.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay activos activos pendientes de devolución.
                </p>
              ) : (
                <div className="overflow-x-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Serial</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {returnActive.map((a) => {
                        const activo = activosMap.get(a.idActivo);
                        return (
                          <TableRow key={a.idAsignacion}>
                            <TableCell className="font-medium">{a.serial ?? "—"}</TableCell>
                            <TableCell>{a.codigoActivo ?? "—"}</TableCell>
                            <TableCell>{activo?.marca ?? "—"}</TableCell>
                            <TableCell>{activo?.modelo ?? "—"}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={returningId === a.idAsignacion}
                                onClick={() => handleReturn(a)}
                              >
                                {returningId === a.idAsignacion ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Undo2 className="h-3.5 w-3.5 mr-1" />
                                )}
                                Devolver
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnGroup(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
