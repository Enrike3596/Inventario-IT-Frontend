import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { toast } from "sonner";
import {
  Loader2,
  Check,
  ChevronsUpDown,
  Plus,
  Search,
  Eye,
  Undo2,
  ChevronLeft,
  ChevronRight,
  Building2,
  UserRound,
  ArrowRightLeft,
  FileText,
  Trash2,
  X,
} from "lucide-react";
import {
  useAsignaciones,
  useCreateAsignacion,
  useUpdateAsignacion,
  useDevolverAsignacion,
  useUpdateActivo,
  useUsuarios,
  useActivos,
  useParqueaderos,
  useCanales,
  useGenerarActa,
  useEnviarActa,
  useActaPorDestino,
  useEliminarActa,
  useRoles,
} from "@/lib/queries";
import type { AsignacionUsuario, Activo, Usuario, Parqueadero, EstadoActivo } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/asignaciones")({
  head: () => ({ meta: [{ title: "Asignaciones — Indigo" }] }),
  component: Page,
});

const PAGE_SIZES = [10, 20, 30, 50, 100] as const;

const DEVOLUCION_MOTIVOS = [
  "Finalización de contrato",
  "Cambio de equipo",
  "Devolución por dano del equipo",
  "Devolución voluntaria",
  "Devolución por baja del activo",
  "Otros",
] as const;

const DEVOLUCION_FORMAS = [
  "Entregado",
  "Entregado a bodega",
  "Enviado por mensajería/correo",
  "Pendiente de entrega",
  "Otro",
] as const;

const DEVOLUCION_ESTADOS = [
  "En buen estado",
  "Dañado",
  "Incompleto/faltante",
  "Otro",
] as const;

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
    () =>
      activosDisponibles.filter((a) => {
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
                  <span className="truncate">
                    {a.serial} — {a.marca} {a.modelo}
                  </span>
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
  const { data: roles } = useRoles();
  const { data: activos } = useActivos();
  const { data: parqueaderos } = useParqueaderos();
  const { data: canales } = useCanales();
  const createMutation = useCreateAsignacion();
  const updateMutation = useUpdateAsignacion();
  const devolverMutation = useDevolverAsignacion();
  const updateActivo = useUpdateActivo();
  const generarActa = useGenerarActa();
  const enviarActa = useEnviarActa();
  const { can } = useAuth();

  const canCreate = can("create", "asignaciones");
  const canEdit = can("edit", "asignaciones");

  const usuariosEntrega = useMemo(() => {
    const allowedRoleTypes = new Set(["coordinador", "agente_soporte", "super_admin"]);
    const allowedRoleIds = new Set(
      (roles ?? []).filter((r) => allowedRoleTypes.has(r.tipo)).map((r) => r.idRol),
    );
    return (usuarios ?? []).filter((u) => allowedRoleIds.has(u.idRol));
  }, [usuarios, roles]);

  const [tipoFilter, setTipoFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const hasActiveFilters = tipoFilter !== "all";

  const clearFilters = () => {
    setTipoFilter("all");
    setSearchQuery("");
  };

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [viewGroup, setViewGroup] = useState<AsignacionGroup | null>(null);
  const [actaGroup, setActaGroup] = useState<AsignacionGroup | null>(null);
  const [returnGroup, setReturnGroup] = useState<AsignacionGroup | null>(null);
  const [returningId, setReturningId] = useState<number | null>(null);
  const [returnActive, setReturnActive] = useState<AsignacionUsuario[]>([]);
  const [returnConfirmTarget, setReturnConfirmTarget] = useState<AsignacionUsuario | null>(null);
  const [returnConfirmForm, setReturnConfirmForm] = useState({
    motivo: "",
    forma: "",
    estado: "",
    observacion: "",
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<Record<string, unknown>>({});
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [asignacionTipo, setAsignacionTipo] = useState<"Usuario" | "Parqueadero">("Usuario");

  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [reassignSource, setReassignSource] = useState<AsignacionUsuario | null>(null);
  const [reassignTipo, setReassignTipo] = useState<"Usuario" | "Parqueadero">("Usuario");
  const [reassignDestino, setReassignDestino] = useState<number | string>("");
  const [reassignUsuarioDestino, setReassignUsuarioDestino] = useState<number | string>("");
  const [reassignMotivo, setReassignMotivo] = useState("");
  const [reassignSubmitting, setReassignSubmitting] = useState(false);

  const activoAsignadoIds = useMemo(
    () =>
      new Set(
        (asignaciones ?? []).filter((a) => a.estadoAsignacion === "Activa").map((a) => a.idActivo),
      ),
    [asignaciones],
  );

  const activosDisponibles = useMemo(
    () =>
      (activos ?? []).filter(
        (a) => a.estadoActivo === "Disponible" && !activoAsignadoIds.has(a.idActivo),
      ),
    [activos, activoAsignadoIds],
  );

  const activosMap = useMemo(() => new Map((activos ?? []).map((a) => [a.idActivo, a])), [activos]);

  const usuariosMap = useMemo(
    () => new Map((usuarios ?? []).map((u) => [u.idUsuario, u])),
    [usuarios],
  );

  const parqueaderosMap = useMemo(
    () => new Map((parqueaderos ?? []).map((p) => [p.idParqueadero, p])),
    [parqueaderos],
  );

  const esSistemaTicket = useMemo(() => {
    if (!createForm.idCanal || !canales) return false;
    const selected = canales.find((c) => c.idCanal === Number(createForm.idCanal));
    return selected?.nombre === "Sistema de Tickets";
  }, [createForm.idCanal, canales]);

  const groups = useMemo(() => {
    const map = new Map<string, AsignacionUsuario[]>();
    (asignaciones ?? []).forEach((a) => {
      const { idUsuarioDestino, nombreUsuarioDestino, idParqueadero, nombreParqueadero } = a;
      let key: string;
      if (idParqueadero && nombreParqueadero) {
        key = `park-${idParqueadero}`;
      } else if (idUsuarioDestino && nombreUsuarioDestino) {
        key = `user-${idUsuarioDestino}`;
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
        nombre: isUser ? (first.nombreUsuarioDestino ?? "—") : (first.nombreParqueadero ?? "—"),
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
    if (tipoFilter !== "all") {
      result = result.filter((g) => g.tipo === tipoFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.nombre.toLowerCase().includes(q) ||
          g.asignaciones.some(
            (a) => a.serial?.toLowerCase().includes(q) || a.codigoActivo?.toLowerCase().includes(q),
          ),
      );
    }
    return result;
  }, [groups, tipoFilter, searchQuery]);

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
    setAsignacionTipo("Usuario");
    setCreateOpen(true);
  }, []);

  const syncActivoEstado = useCallback(
    async (idActivo: number, estadoActivo: EstadoActivo) => {
      const activo = activosMap.get(idActivo);
      if (!activo) {
        toast.warning("La asignación se guardó, pero no se pudo sincronizar el estado del activo.");
        return;
      }
      try {
        await updateActivo.mutateAsync({
          id: idActivo,
          data: {
            idCategoria: activo.idCategoria,
            idRemision: activo.idRemision,
            idItemRemision: activo.idItemRemision,
            idDetalleItemRemision: activo.idDetalleItemRemision,
            codigoActivo: activo.codigoActivo,
            serial: activo.serial,
            marca: activo.marca,
            modelo: activo.modelo,
            estadoActivo,
            observaciones: activo.observaciones,
          },
        });
      } catch {
        toast.warning("La asignación se guardó, pero no se pudo sincronizar el estado del activo.");
      }
    },
    [updateActivo, activosMap],
  );

  const handleCreateSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const selectedCanal = canales?.find((c) => c.idCanal === Number(createForm.idCanal));
      const esSistemaTicket = selectedCanal?.nombre === "Sistema de Tickets";
      const required = [
        "idActivo",
        "idUsuarioDestino",
        "idCanal",
        "idUsuarioEntrega",
        "registroSalida",
      ];
      if (asignacionTipo === "Parqueadero") required.push("idParqueadero");
      if (esSistemaTicket) required.push("numeroTicket");
      for (const k of required) {
        if (createForm[k] === "" || createForm[k] === undefined || createForm[k] === null) {
          const labels: Record<string, string> = {
            idUsuarioDestino: "Usuario destino",
            idActivo: "Activo",
            idCanal: "Canal",
            idUsuarioEntrega: "Usuario entrega",
            registroSalida: "Registro de salida",
            numeroTicket: "N° Ticket",
            idParqueadero: "Parqueadero destino",
          };
          toast.error(`${labels[k] ?? k} es obligatorio`);
          return;
        }
      }
      setCreateSubmitting(true);
      try {
        const payload: Record<string, unknown> = {
          ...createForm,
          idUsuarioDestino: createForm.idUsuarioDestino,
          idParqueadero: asignacionTipo === "Parqueadero" ? createForm.idParqueadero : null,
        };
        await createMutation.mutateAsync(payload as Partial<AsignacionUsuario>);
        toast.success("Asignación creada");
        setCreateOpen(false);
        if (payload.estadoAsignacion === "Activa") {
          await syncActivoEstado(Number(createForm.idActivo), "Asignado");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
      } finally {
        setCreateSubmitting(false);
      }
    },
    [createForm, createMutation, canales, asignacionTipo, syncActivoEstado],
  );

  const openReturn = useCallback((group: AsignacionGroup) => {
    setReturnGroup(group);
    setReturnActive(group.asignaciones.filter((a) => a.estadoAsignacion === "Activa"));
    setReturningId(null);
  }, []);

  const openReturnConfirm = useCallback((asignacion: AsignacionUsuario) => {
    setReturnConfirmTarget(asignacion);
    setReturnConfirmForm({
      motivo: "",
      forma: "",
      estado: "",
      observacion: "",
    });
  }, []);

  const confirmarDevolucion = useCallback(async () => {
    const asignacion = returnConfirmTarget;
    if (!asignacion) return;
    const f = returnConfirmForm;
    if (!f.motivo.trim()) {
      toast.error("Debes indicar el motivo de la devolución");
      return;
    }
    if (!f.forma) {
      toast.error("Debes indicar la forma de entrega de la devolución");
      return;
    }
    if (!f.estado) {
      toast.error("Debes indicar el estado del activo devuelto");
      return;
    }
    setReturningId(asignacion.idAsignacion);
    try {
      await devolverMutation.mutateAsync({
        id: asignacion.idAsignacion,
        data: {
          motivoEdicion: f.motivo.trim(),
          formaEntregaDevolucion: f.forma,
          estadoDevolucion: f.estado,
          observacionDevolucion: f.observacion.trim() || undefined,
        },
      });
      toast.success(`Devolución de ${asignacion.serial ?? "activo"} confirmada`);
      setReturnActive((prev) => prev.filter((a) => a.idAsignacion !== asignacion.idAsignacion));
      setReturnConfirmTarget(null);
      await syncActivoEstado(asignacion.idActivo, "Disponible");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al devolver el activo");
    } finally {
      setReturningId(null);
    }
  }, [returnConfirmTarget, returnConfirmForm, devolverMutation, syncActivoEstado]);

  const handleReassign = useCallback(async () => {
    if (!reassignSource || !reassignMotivo.trim()) {
      toast.error("Debes indicar el motivo de la reasignación");
      return;
    }
    if (!reassignDestino) {
      toast.error("Selecciona un destino");
      return;
    }
    setReassignSubmitting(true);
    try {
      await updateMutation.mutateAsync({
        id: reassignSource.idAsignacion,
        data: { estadoAsignacion: "Finalizada", motivoEdicion: reassignMotivo },
      });
      const newPayload: Record<string, unknown> = {
        idActivo: reassignSource.idActivo,
        idCanal: reassignSource.idCanal,
        idUsuarioEntrega: reassignSource.idUsuarioEntrega,
        registroSalida: reassignSource.registroSalida,
        numeroTicket: reassignSource.numeroTicket,
        estadoAsignacion: "Activa",
      };
      if (reassignTipo === "Usuario") {
        newPayload.idUsuarioDestino = reassignDestino;
        newPayload.idParqueadero = null;
      } else {
        newPayload.idUsuarioDestino = reassignUsuarioDestino || reassignSource.idUsuarioDestino;
        newPayload.idParqueadero = reassignDestino;
      }
      await createMutation.mutateAsync(newPayload as Partial<AsignacionUsuario>);
      toast.success("Activo reasignado correctamente");
      setReassignDialogOpen(false);
      setReturnActive((prev) => prev.filter((a) => a.idAsignacion !== reassignSource.idAsignacion));
      await syncActivoEstado(reassignSource.idActivo, "Asignado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al reasignar");
    } finally {
      setReassignSubmitting(false);
    }
  }, [
    reassignSource,
    reassignMotivo,
    reassignTipo,
    reassignDestino,
    updateMutation,
    createMutation,
    syncActivoEstado,
  ]);

  const getCargo = useCallback(
    (idDestino: number): string => {
      const u = usuariosMap.get(idDestino);
      return u?.cargo ?? "";
    },
    [usuariosMap],
  );

  const getUbicacion = useCallback(
    (idDestino: number): string => {
      const p = parqueaderosMap.get(idDestino);
      return p?.ubicacion ?? "";
    },
    [parqueaderosMap],
  );

  const formatDate = (d: string) => new Date(d).toLocaleDateString("es-CO");

  const tipoAsignacionTint: Record<string, string> = {
    Usuario: "bg-primary/15 text-primary border-primary/30",
    Parqueadero: "bg-brand-teal/15 text-brand-teal border-brand-teal/30",
  };

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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por nombre, serial o código..."
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Tipo:</span>
              <Select
                value={tipoFilter}
                onValueChange={(v) => {
                  setTipoFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Usuario">Usuario</SelectItem>
                  <SelectItem value="Parqueadero">Parqueadero</SelectItem>
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
              {filteredGroups.length} grupo{filteredGroups.length === 1 ? "" : "s"}
            </span>
          </div>
        </Card>

        {/* Desktop: table view */}
        <Card className="overflow-hidden hidden sm:block">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Destino</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Activos</TableHead>
                  <TableHead className="hidden md:table-cell">Detalle</TableHead>
                  <TableHead className="hidden lg:table-cell">Última asignación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-20">Acta</TableHead>
                  <TableHead className="w-28 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredGroups.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      Sin registros
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((g) => (
                    <TableRow key={g.key} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {g.tipo === "Usuario" ? (
                            <UserRound className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : (
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium truncate max-w-40">{g.nombre}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-40">
                              {g.tipo === "Usuario"
                                ? getCargo(g.idDestino) || "—"
                                : getUbicacion(g.idDestino) || "—"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${tipoAsignacionTint[g.tipo]} whitespace-nowrap`}
                        >
                          {g.tipo === "Usuario" ? (
                            <>
                              <UserRound className="h-3 w-3 mr-1 inline" /> Usuario
                            </>
                          ) : (
                            <>
                              <Building2 className="h-3 w-3 mr-1 inline" /> Parqueadero
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>{g.asignaciones.length}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-xs max-w-32 truncate">
                        {g.tipo === "Usuario"
                          ? (usuariosMap.get(g.idDestino)?.cargo ?? "—")
                          : (parqueaderosMap.get(g.idDestino)?.ubicacion ?? "—")}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {formatDate(
                          g.asignaciones.reduce(
                            (latest, a) =>
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
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setActaGroup(g)}
                          aria-label="Gestionar acta"
                          title="Gestionar acta"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setViewGroup(g)}
                            aria-label="Ver activos"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canEdit && (
                            <Button
                              size="icon"
                              variant="ghost"
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

        {/* Mobile: card view */}
        <div className="sm:hidden space-y-3">
          {isLoading ? (
            <Card className="p-6">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            </Card>
          ) : filteredGroups.length === 0 ? (
            <Card className="p-6">
              <p className="text-center text-sm text-muted-foreground">Sin registros</p>
            </Card>
          ) : (
            paginated.map((g) => (
              <Card key={g.key} className="p-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {g.tipo === "Usuario" ? (
                        <UserRound className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{g.nombre}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {g.tipo === "Usuario"
                            ? getCargo(g.idDestino) || "—"
                            : getUbicacion(g.idDestino) || "—"}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${tipoAsignacionTint[g.tipo]} shrink-0 text-[10px] h-5`}
                    >
                      {g.tipo === "Usuario" ? "Usuario" : "Parqueadero"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {g.asignaciones.length} activo{g.asignaciones.length !== 1 ? "s" : ""}
                    </span>
                    <span>
                      {formatDate(
                        g.asignaciones.reduce(
                          (latest, a) => (a.fechaAsignacion > latest ? a.fechaAsignacion : latest),
                          g.asignaciones[0].fechaAsignacion,
                        ),
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {g.allFinalizadas ? (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        Finalizada
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-[10px] h-5">
                        Activa
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {g.tipo === "Usuario"
                        ? (usuariosMap.get(g.idDestino)?.cargo ?? "—")
                        : (parqueaderosMap.get(g.idDestino)?.ubicacion ?? "—")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1 pt-3 mt-3 border-t">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs"
                    onClick={() => setActaGroup(g)}
                  >
                    <FileText className="h-3.5 w-3.5 mr-1" /> Acta
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs"
                    onClick={() => setViewGroup(g)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                  </Button>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs"
                      onClick={() => openReturn(g)}
                    >
                      <Undo2 className="h-3.5 w-3.5 mr-1" /> Devolver
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        {filteredGroups.length > 0 && (
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

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva asignación</DialogTitle>
            <DialogDescription>Completa el formulario para crear una asignación.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>
                Tipo de asignación <span className="text-destructive"> *</span>
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={asignacionTipo === "Usuario" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    setAsignacionTipo("Usuario");
                    setCreateForm((s) => ({ ...s, idUsuarioDestino: "", idParqueadero: "" }));
                  }}
                >
                  <UserRound className="h-4 w-4 mr-2" />
                  Usuario
                </Button>
                <Button
                  type="button"
                  variant={asignacionTipo === "Parqueadero" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    setAsignacionTipo("Parqueadero");
                    setCreateForm((s) => ({ ...s, idUsuarioDestino: "", idParqueadero: "" }));
                  }}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Parqueadero
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idUsuarioDestino">
                  {asignacionTipo === "Usuario" ? "Usuario destino" : "Responsable"}
                  <span className="text-destructive"> *</span>
                </Label>
                <Select
                  value={
                    createForm.idUsuarioDestino !== ""
                      ? String(createForm.idUsuarioDestino)
                      : undefined
                  }
                  onValueChange={(v) =>
                    setCreateForm((s) => ({ ...s, idUsuarioDestino: Number(v) }))
                  }
                >
                  <SelectTrigger id="idUsuarioDestino">
                    <SelectValue placeholder="Selecciona un usuario..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(usuarios ?? []).map((u) => (
                      <SelectItem key={u.idUsuario} value={String(u.idUsuario)}>
                        {u.nombre} — {u.cargo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {asignacionTipo === "Parqueadero" && (
                <div className="space-y-2">
                  <Label htmlFor="idParqueadero">
                    Parqueadero destino <span className="text-destructive"> *</span>
                  </Label>
                  <Select
                    value={
                      createForm.idParqueadero !== "" ? String(createForm.idParqueadero) : undefined
                    }
                    onValueChange={(v) =>
                      setCreateForm((s) => ({ ...s, idParqueadero: Number(v) }))
                    }
                  >
                    <SelectTrigger id="idParqueadero">
                      <SelectValue placeholder="Selecciona un parqueadero..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(parqueaderos ?? []).map((p) => (
                        <SelectItem key={p.idParqueadero} value={String(p.idParqueadero)}>
                          {p.nombre} — {p.ubicacion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="idActivo">
                  Activo <span className="text-destructive"> *</span>
                </Label>
                <ActivoCombobox
                  value={createForm.idActivo as number | undefined}
                  onChange={(v) => setCreateForm((s) => ({ ...s, idActivo: v }))}
                  activosDisponibles={activosDisponibles}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idCanal">
                  Canal <span className="text-destructive"> *</span>
                </Label>
                <Select
                  value={createForm.idCanal !== "" ? String(createForm.idCanal) : undefined}
                  onValueChange={(v) => {
                    const isTicket =
                      canales?.find((c) => c.idCanal === Number(v))?.nombre ===
                      "Sistema de Tickets";
                    setCreateForm((s) => ({
                      ...s,
                      idCanal: Number(v),
                      numeroTicket: isTicket ? s.numeroTicket : "",
                    }));
                  }}
                >
                  <SelectTrigger id="idCanal">
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(canales ?? []).map((c) => (
                      <SelectItem key={c.idCanal} value={String(c.idCanal)}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idUsuarioEntrega">
                  Usuario entrega <span className="text-destructive"> *</span>
                </Label>
                <Select
                  value={
                    createForm.idUsuarioEntrega !== ""
                      ? String(createForm.idUsuarioEntrega)
                      : undefined
                  }
                  onValueChange={(v) =>
                    setCreateForm((s) => ({ ...s, idUsuarioEntrega: Number(v) }))
                  }
                >
                  <SelectTrigger id="idUsuarioEntrega">
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(usuariosEntrega ?? []).map((u) => (
                      <SelectItem key={u.idUsuario} value={String(u.idUsuario)}>
                        {u.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registroSalida">
                  Registro de salida <span className="text-destructive"> *</span>
                </Label>
                <Input
                  id="registroSalida"
                  value={String(createForm.registroSalida ?? "")}
                  onChange={(e) => setCreateForm((s) => ({ ...s, registroSalida: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroTicket">
                  N° Ticket{esSistemaTicket && <span className="text-destructive"> *</span>}
                </Label>
                <Input
                  id="numeroTicket"
                  value={String(createForm.numeroTicket ?? "")}
                  onChange={(e) => setCreateForm((s) => ({ ...s, numeroTicket: e.target.value }))}
                  disabled={!esSistemaTicket}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estadoAsignacion">
                  Estado <span className="text-destructive"> *</span>
                </Label>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={createSubmitting}
              >
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
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {viewGroup?.tipo === "Usuario" ? (
                <>
                  <UserRound className="h-4 w-4 sm:h-5 sm:w-5 inline mr-2" />
                  {viewGroup?.nombre}
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 inline mr-2" />
                  {viewGroup?.nombre}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              <Badge
                variant="outline"
                className={`${tipoAsignacionTint[viewGroup?.tipo ?? "Usuario"]} mr-2`}
              >
                {viewGroup?.tipo === "Usuario" ? "Usuario" : "Parqueadero"}
              </Badge>
              {viewGroup?.asignaciones.length} activo
              {viewGroup?.asignaciones.length !== 1 ? "s" : ""}
              {viewGroup && viewGroup.tipo === "Parqueadero" && (
                <> &middot; {getUbicacion(viewGroup.idDestino) || "—"}</>
              )}
            </DialogDescription>
          </DialogHeader>
          {viewGroup && (
            <div className="space-y-3">
              {viewGroup.asignaciones.map((a) => {
                const activo = activosMap.get(a.idActivo);
                const esTicket = a.nombreCanal === "Sistema de Tickets";
                return (
                  <Card key={a.idAsignacion} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{a.serial ?? "—"}</span>
                          <Badge
                            variant={a.estadoAsignacion === "Activa" ? "default" : "secondary"}
                            className="text-[10px] h-5"
                          >
                            {a.estadoAsignacion}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground block mt-0.5">
                          {a.codigoActivo ?? "—"}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground block">Marca</span>
                        <span className="font-medium">{activo?.marca ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Modelo</span>
                        <span className="font-medium">{activo?.modelo ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Categoría</span>
                        <span className="font-medium">{activo?.nombreCategoria ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Asignación</span>
                        <span className="font-medium">{formatDate(a.fechaAsignacion)}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Reg. salida</span>
                        <span className="font-medium">{a.registroSalida}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Canal</span>
                        <span className="font-medium">{a.nombreCanal ?? "—"}</span>
                      </div>
                      {viewGroup.tipo === "Parqueadero" && (
                        <div>
                          <span className="text-xs text-muted-foreground block">Responsable</span>
                          <span className="font-medium flex items-center gap-1">
                            <UserRound className="h-3 w-3 text-muted-foreground" />
                            {a.nombreUsuarioDestino ?? "—"}
                          </span>
                        </div>
                      )}
                      {esTicket && a.numeroTicket && (
                        <div>
                          <span className="text-xs text-muted-foreground block">N° Ticket</span>
                          <span className="font-medium">{a.numeroTicket}</span>
                        </div>
                      )}
                    </div>
                    {a.estadoAsignacion === "Finalizada" &&
                      (a.formaEntregaDevolucion || a.estadoDevolucion || a.motivoEdicion) && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Devolución
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                            {a.motivoEdicion && (
                              <div>
                                <span className="text-xs text-muted-foreground block">Motivo</span>
                                <span className="font-medium">{a.motivoEdicion}</span>
                              </div>
                            )}
                            {a.formaEntregaDevolucion && (
                              <div>
                                <span className="text-xs text-muted-foreground block">
                                  Forma de entrega
                                </span>
                                <span className="font-medium">{a.formaEntregaDevolucion}</span>
                              </div>
                            )}
                            {a.estadoDevolucion && (
                              <div>
                                <span className="text-xs text-muted-foreground block">
                                  Estado del activo
                                </span>
                                <span className="font-medium">{a.estadoDevolucion}</span>
                              </div>
                            )}
                          </div>
                          {a.observacionDevolucion && (
                            <div>
                              <span className="text-xs text-muted-foreground block">
                                Observación
                              </span>
                              <span className="font-medium text-sm">{a.observacionDevolucion}</span>
                            </div>
                          )}
                        </div>
                      )}
                  </Card>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewGroup(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Acta dialog */}
      <Dialog open={!!actaGroup} onOpenChange={(o) => !o && setActaGroup(null)}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {actaGroup?.tipo === "Usuario" ? (
                <>
                  <UserRound className="h-4 w-4 sm:h-5 sm:w-5 inline mr-2" />
                  Acta electrónica — {actaGroup?.nombre}
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 inline mr-2" />
                  Acta electrónica — {actaGroup?.nombre}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              <Badge
                variant="outline"
                className={`${tipoAsignacionTint[actaGroup?.tipo ?? "Usuario"]} mr-2`}
              >
                {actaGroup?.tipo === "Usuario" ? "Usuario" : "Parqueadero"}
              </Badge>
              {actaGroup?.asignaciones.length} activo
              {actaGroup?.asignaciones.length !== 1 ? "s" : ""}
              {actaGroup && actaGroup.tipo === "Parqueadero" && (
                <> &middot; {getUbicacion(actaGroup.idDestino) || "—"}</>
              )}
            </DialogDescription>
          </DialogHeader>
          {actaGroup && (
            <div className="space-y-3">
              <ActaGroupActions
                tipo={actaGroup.tipo}
                idDestino={actaGroup.idDestino}
                onDelete={() => setActaGroup(null)}
              />
              <div className="text-xs text-muted-foreground font-medium pt-1">
                Activos incluidos en el acta:
              </div>
              {actaGroup.asignaciones.map((a) => {
                const activo = activosMap.get(a.idActivo);
                return (
                  <Card key={a.idAsignacion} className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{a.serial ?? "—"}</span>
                      <span className="text-xs text-muted-foreground">
                        {activo?.marca ?? ""} {activo?.modelo ?? ""}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActaGroup(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return / devolucion dialog */}
      <Dialog open={!!returnGroup} onOpenChange={(o) => !o && setReturnGroup(null)}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {returnGroup?.tipo === "Parqueadero"
                ? "Devolución / Reasignación de activos"
                : "Devolución de activos"}
              — {returnGroup?.nombre}
            </DialogTitle>
            <DialogDescription>
              {returnGroup?.tipo === "Parqueadero"
                ? "Selecciona un activo para devolverlo o reasignarlo a otro destino."
                : "Selecciona los activos que deseas devolver y confirma uno por uno."}
            </DialogDescription>
          </DialogHeader>
          {returnGroup && (
            <div className="space-y-4">
              {returnActive.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay activos activos pendientes de devolución.
                </p>
              ) : (
                <>
                  {/* Desktop: table view */}
                  <div className="hidden sm:block overflow-x-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead>Serial</TableHead>
                          <TableHead className="hidden md:table-cell">Código</TableHead>
                          <TableHead className="hidden md:table-cell">Marca</TableHead>
                          <TableHead className="hidden md:table-cell">Modelo</TableHead>
                          <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {returnActive.map((a) => {
                          const activo = activosMap.get(a.idActivo);
                          const esParqueadero = returnGroup.tipo === "Parqueadero";
                          return (
                            <TableRow key={a.idAsignacion}>
                              <TableCell className="font-medium">{a.serial ?? "—"}</TableCell>
                              <TableCell className="hidden md:table-cell">
                                {a.codigoActivo ?? "—"}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {activo?.marca ?? "—"}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {activo?.modelo ?? "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="inline-flex gap-1.5">
                                  {esParqueadero && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={returningId === a.idAsignacion}
                                      onClick={() => {
                                        setReassignSource(a);
                                        setReassignTipo("Usuario");
                                        setReassignDestino("");
                                        setReassignUsuarioDestino("");
                                        setReassignMotivo("");
                                        setReassignDialogOpen(true);
                                      }}
                                    >
                                      <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
                                      Reasignar
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant={esParqueadero ? "secondary" : "destructive"}
                                    disabled={returningId === a.idAsignacion}
                                    onClick={() => openReturnConfirm(a)}
                                  >
                                    {returningId === a.idAsignacion ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Undo2 className="h-3.5 w-3.5 mr-1" />
                                    )}
                                    Devolver
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile: card view */}
                  <div className="sm:hidden space-y-3">
                    {returnActive.map((a) => {
                      const activo = activosMap.get(a.idActivo);
                      const esParqueadero = returnGroup.tipo === "Parqueadero";
                      return (
                        <Card key={a.idAsignacion} className="p-3">
                          <div className="space-y-2">
                            <div className="font-medium text-sm">{a.serial ?? "—"}</div>
                            <div className="text-xs text-muted-foreground">
                              {activo?.marca} {activo?.modelo} · {a.codigoActivo ?? "—"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-3 mt-3 border-t">
                            {esParqueadero && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-8 text-xs"
                                disabled={returningId === a.idAsignacion}
                                onClick={() => {
                                  setReassignSource(a);
                                  setReassignTipo("Usuario");
                                  setReassignDestino("");
                                  setReassignUsuarioDestino("");
                                  setReassignMotivo("");
                                  setReassignDialogOpen(true);
                                }}
                              >
                                <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
                                Reasignar
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant={esParqueadero ? "secondary" : "destructive"}
                              className="flex-1 h-8 text-xs"
                              disabled={returningId === a.idAsignacion}
                              onClick={() => openReturnConfirm(a)}
                            >
                              {returningId === a.idAsignacion ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Undo2 className="h-3.5 w-3.5 mr-1" />
                              )}
                              Devolver
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnGroup(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar devolución (por activo) */}
      <Dialog
        open={!!returnConfirmTarget}
        onOpenChange={(o) => !o && setReturnConfirmTarget(null)}
      >
        <DialogContent className="w-full max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmar devolución</DialogTitle>
            <DialogDescription>
              {returnConfirmTarget && (
                <>
                  Serial: <strong>{returnConfirmTarget.serial ?? "—"}</strong> &middot; Código:{" "}
                  <strong>{returnConfirmTarget.codigoActivo ?? "—"}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rcMotivo">
                Motivo <span className="text-destructive"> *</span>
              </Label>
              <Select
                value={returnConfirmForm.motivo || undefined}
                onValueChange={(v) => setReturnConfirmForm((s) => ({ ...s, motivo: v }))}
              >
                <SelectTrigger id="rcMotivo">
                  <SelectValue placeholder="Selecciona el motivo de la devolución..." />
                </SelectTrigger>
                <SelectContent>
                  {DEVOLUCION_MOTIVOS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rcForma">
                Forma de entrega <span className="text-destructive"> *</span>
              </Label>
              <Select
                value={returnConfirmForm.forma || undefined}
                onValueChange={(v) => setReturnConfirmForm((s) => ({ ...s, forma: v }))}
              >
                <SelectTrigger id="rcForma">
                  <SelectValue placeholder="¿Cómo se devuelve el activo?" />
                </SelectTrigger>
                <SelectContent>
                  {DEVOLUCION_FORMAS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rcEstado">
                Estado del activo <span className="text-destructive"> *</span>
              </Label>
              <Select
                value={returnConfirmForm.estado || undefined}
                onValueChange={(v) => setReturnConfirmForm((s) => ({ ...s, estado: v }))}
              >
                <SelectTrigger id="rcEstado">
                  <SelectValue placeholder="¿En qué estado se devuelve?" />
                </SelectTrigger>
                <SelectContent>
                  {DEVOLUCION_ESTADOS.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rcObservacion">Observación</Label>
              <Textarea
                id="rcObservacion"
                value={returnConfirmForm.observacion}
                onChange={(e) =>
                  setReturnConfirmForm((s) => ({ ...s, observacion: e.target.value }))
                }
                placeholder="Detalle adicional (opcional)..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReturnConfirmTarget(null)}
              disabled={returningId !== null}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={returningId !== null || !returnConfirmForm.forma || !returnConfirmForm.estado}
              onClick={confirmarDevolucion}
            >
              {returningId !== null ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Undo2 className="h-4 w-4 mr-1" />
              )}
              Confirmar devolución
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign dialog (only for parqueadero assignments) */}
      <Dialog open={reassignDialogOpen} onOpenChange={(o) => !o && setReassignDialogOpen(false)}>
        <DialogContent className="w-full max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reasignar activo</DialogTitle>
            <DialogDescription>
              {reassignSource && (
                <>
                  Serial: <strong>{reassignSource.serial}</strong> &middot; Actual:{" "}
                  <strong>{returnGroup?.nombre}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Tipo de destino <span className="text-destructive"> *</span>
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={reassignTipo === "Usuario" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    setReassignTipo("Usuario");
                    setReassignDestino("");
                  }}
                >
                  <UserRound className="h-4 w-4 mr-2" />
                  Usuario
                </Button>
                <Button
                  type="button"
                  variant={reassignTipo === "Parqueadero" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    setReassignTipo("Parqueadero");
                    setReassignDestino("");
                  }}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Parqueadero
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reassignDestino">
                {reassignTipo === "Usuario" ? "Usuario destino" : "Parqueadero destino"}
                <span className="text-destructive"> *</span>
              </Label>
              {reassignTipo === "Usuario" ? (
                <Select
                  value={reassignDestino !== "" ? String(reassignDestino) : undefined}
                  onValueChange={(v) => setReassignDestino(Number(v))}
                >
                  <SelectTrigger id="reassignDestino">
                    <SelectValue placeholder="Selecciona un usuario..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(usuarios ?? []).map((u) => (
                      <SelectItem key={u.idUsuario} value={String(u.idUsuario)}>
                        {u.nombre} — {u.cargo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={reassignDestino !== "" ? String(reassignDestino) : undefined}
                  onValueChange={(v) => setReassignDestino(Number(v))}
                >
                  <SelectTrigger id="reassignDestino">
                    <SelectValue placeholder="Selecciona un parqueadero..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(parqueaderos ?? []).map((p) => (
                      <SelectItem key={p.idParqueadero} value={String(p.idParqueadero)}>
                        {p.nombre} — {p.ubicacion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {reassignTipo === "Parqueadero" && (
              <div className="space-y-2">
                <Label htmlFor="reassignUsuario">
                  Responsable <span className="text-destructive"> *</span>
                </Label>
                <Select
                  value={reassignUsuarioDestino !== "" ? String(reassignUsuarioDestino) : undefined}
                  onValueChange={(v) => setReassignUsuarioDestino(Number(v))}
                >
                  <SelectTrigger id="reassignUsuario">
                    <SelectValue placeholder="Selecciona el responsable..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(usuarios ?? []).map((u) => (
                      <SelectItem key={u.idUsuario} value={String(u.idUsuario)}>
                        {u.nombre} — {u.cargo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reassignMotivo">
                Motivo de la reasignación <span className="text-destructive"> *</span>
              </Label>
              <Textarea
                id="reassignMotivo"
                value={reassignMotivo}
                onChange={(e) => setReassignMotivo(e.target.value)}
                placeholder="Describe el motivo de la reasignación..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReassignDialogOpen(false)}
              disabled={reassignSubmitting}
            >
              Cancelar
            </Button>
            <Button variant="brand" onClick={handleReassign} disabled={reassignSubmitting}>
              {reassignSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <ArrowRightLeft className="h-4 w-4 mr-1" />
              )}
              Confirmar reasignación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ActaGroupActions({
  tipo,
  idDestino,
  onDelete,
}: {
  tipo: string;
  idDestino: number;
  onDelete?: () => void;
}) {
  const { data: acta, isLoading: loadingActa } = useActaPorDestino(tipo, idDestino);
  const generarActa = useGenerarActa();
  const enviarActa = useEnviarActa();
  const eliminarActa = useEliminarActa();
  const [generando, setGenerando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleGenerar = useCallback(async () => {
    setGenerando(true);
    try {
      await generarActa.mutateAsync({ tipoDestino: tipo, idDestino });
      toast.success("Acta generada exitosamente.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al generar acta");
    } finally {
      setGenerando(false);
    }
  }, [tipo, idDestino, generarActa]);

  const handleEnviar = useCallback(async () => {
    setEnviando(true);
    try {
      await enviarActa.mutateAsync({ tipoDestino: tipo, idDestino });
      toast.success("Acta enviada para firma.");
      onDelete?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar acta");
    } finally {
      setEnviando(false);
    }
  }, [tipo, idDestino, enviarActa, onDelete]);

  const confirmEliminar = useCallback(async () => {
    setEliminando(true);
    try {
      await eliminarActa.mutateAsync({ tipoDestino: tipo, idDestino });
      toast.success("Acta eliminada.");
      setShowDeleteDialog(false);
      onDelete?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar acta");
    } finally {
      setEliminando(false);
    }
  }, [tipo, idDestino, eliminarActa, onDelete]);

  if (loadingActa) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Cargando acta...</span>
      </div>
    );
  }

  const estado = acta?.estado;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {estado === "Firmada" ? (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700 gap-1">
          <span>Firmada ✓</span>
          {acta?.fechaFirma && (
            <span className="text-[10px] opacity-80">
              {new Date(acta.fechaFirma).toLocaleDateString("es-CO")}
            </span>
          )}
        </Badge>
      ) : estado === "Enviada" ? (
        <Badge variant="secondary" className="gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
          Pendiente de firma
        </Badge>
      ) : estado === "Vencida" ? (
        <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200 gap-1">
          <span>Vencida</span>
        </Badge>
      ) : estado === "Pendiente" ? (
        <Badge variant="outline" className="gap-1">
          <span>Acta generada</span>
        </Badge>
      ) : null}

      {estado === "Pendiente" && acta?.urlPdf && (
        <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
          <a href={acta.urlPdf} target="_blank" rel="noopener noreferrer">
            Ver PDF
          </a>
        </Button>
      )}

      {estado === "Enviada" && acta?.urlPdf && (
        <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
          <a href={acta.urlPdf} target="_blank" rel="noopener noreferrer">
            Ver PDF
          </a>
        </Button>
      )}

      {(!estado || estado === "Vencida") && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={handleGenerar}
          disabled={generando}
        >
          {generando ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Generar acta
        </Button>
      )}

      {estado === "Pendiente" && (
        <Button
          size="sm"
          variant="brand"
          className="h-7 text-xs"
          onClick={handleEnviar}
          disabled={enviando}
        >
          {enviando ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Enviar para firma
        </Button>
      )}

      {estado === "Enviada" && (
        <Button
          size="sm"
          variant="brand"
          className="h-7 text-xs"
          onClick={handleEnviar}
          disabled={enviando}
        >
          {enviando ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Reenviar
        </Button>
      )}

      {estado && estado !== "Firmada" && (
        <Button
          size="sm"
          variant="destructive"
          className="h-7 text-xs"
          onClick={() => setShowDeleteDialog(true)}
          disabled={eliminando}
        >
          {eliminando ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
          Eliminar acta
        </Button>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar acta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el acta y el PDF generado. Deberás
              generar uno nuevo si lo necesitas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEliminar}
              disabled={eliminando}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
