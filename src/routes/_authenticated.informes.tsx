import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpDown,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Database,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  Search,
  Settings2,
  SlidersHorizontal,
  Table2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { sanitizeError } from "@/lib/api";
import {
  REPORTE_COLUMNAS,
  REPORTE_ESTADOS,
  useActivos,
  useAreas,
  useAsignaciones,
  useCategorias,
  useExportarReporte,
  useReportePreview,
  useSedes,
  useUsuarios,
} from "@/lib/queries";
import type { FiltrosInventario, ReporteInventarioRequest } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/informes")({
  head: () => ({ meta: [{ title: "Informes — Indigo" }] }),
  component: InformesPage,
});

const ESTADO_LABELS: Record<string, string> = {
  Disponible: "Disponible",
  Asignado: "Asignado",
  EnReparacion: "En reparación",
  DadoDeBaja: "Dado de baja",
  Venta: "Venta",
};

const ESTADO_KEY_BY_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(ESTADO_LABELS).map(([key, label]) => [label, key]),
);

const ESTADO_TINT: Record<string, string> = {
  Disponible: "bg-success/15 text-success border-success/30",
  Asignado: "bg-primary/15 text-primary border-primary/30",
  EnReparacion: "bg-warning/15 text-warning border-warning/30",
  DadoDeBaja: "bg-destructive/15 text-destructive border-destructive/30",
  Venta: "bg-muted/50 text-muted-foreground border-border",
};

const ESTADO_DOT: Record<string, string> = {
  Disponible: "bg-success",
  Asignado: "bg-primary",
  EnReparacion: "bg-warning",
  DadoDeBaja: "bg-destructive",
  Venta: "bg-muted-foreground",
};

const ESTADO_TEXT: Record<string, string> = {
  Disponible: "text-success",
  Asignado: "text-primary",
  EnReparacion: "text-warning",
  DadoDeBaja: "text-destructive",
  Venta: "text-muted-foreground",
};

const PAGE_SIZES = [10, 25, 50, 100] as const;

const FILTROS_INICIALES: FiltrosInventario = {
  categoria: [],
  estado: [],
  sede: [],
  area: [],
  responsableId: [],
};

function SectionHeader({
  icon: Icon,
  title,
  badge,
}: {
  icon: LucideIcon;
  title: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">{title}</h3>
      {badge && <span className="ml-auto shrink-0">{badge}</span>}
    </div>
  );
}

function MultiCheckboxGroup({
  label,
  options,
  selected,
  onToggle,
  emptyText = "Sin opciones",
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  emptyText?: string;
}) {
  const selectedCount = options.filter((o) => selected.includes(o.value)).length;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {selectedCount > 0 && (
          <span className="text-[11px] font-medium text-primary">
            {selectedCount} seleccionados
          </span>
        )}
      </div>
      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground/70">{emptyText}</p>
      ) : (
        <div className="max-h-40 space-y-0.5 overflow-y-auto pr-1">
          {options.map((opt) => {
            const checked = selected.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer select-none transition-colors",
                  checked ? "bg-primary/5" : "hover:bg-muted/60",
                )}
              >
                <Checkbox checked={checked} onCheckedChange={() => onToggle(opt.value)} />
                <span className="truncate">{opt.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EstadoFilterGroup({
  selected,
  onToggle,
  counts,
}: {
  selected: string[];
  onToggle: (value: string) => void;
  counts?: Record<string, number>;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">Estados</p>
        {selected.length > 0 && (
          <span className="text-[11px] font-medium text-primary">
            {selected.length} seleccionados
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {REPORTE_ESTADOS.map((estado) => {
          const checked = selected.includes(estado);
          const count = counts?.[estado];
          return (
            <button
              key={estado}
              type="button"
              onClick={() => onToggle(estado)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[13px] font-medium cursor-pointer select-none transition-all",
                checked
                  ? cn(ESTADO_TINT[estado], "shadow-sm ring-1 ring-ring/30")
                  : cn("border-input bg-background hover:bg-muted/50", ESTADO_TEXT[estado]),
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  ESTADO_DOT[estado],
                  !checked && "opacity-60",
                )}
              />
              <span className="min-w-0 flex-1 truncate text-left">
                {ESTADO_LABELS[estado] ?? estado}
              </span>
              {checked ? (
                <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />
              ) : (
                count !== undefined && (
                  <span className="shrink-0 rounded bg-muted/70 px-1 text-[10px] font-semibold tabular-nums text-muted-foreground">
                    {count}
                  </span>
                )
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InformesPage() {
  const { data: categorias } = useCategorias();
  const { data: sedes } = useSedes();
  const { data: areas } = useAreas();
  const { data: usuarios } = useUsuarios();
  const { data: activos } = useActivos();
  const { data: asignaciones } = useAsignaciones();

  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [colBusqueda, setColBusqueda] = useState("");
  const [filtros, setFiltros] = useState<FiltrosInventario>({ ...FILTROS_INICIALES });
  const [agrupadoPor, setAgrupadoPor] = useState<string>("");
  const [ordenadoPor, setOrdenadoPor] = useState<string>("");
  const [ordenDescendente, setOrdenDescendente] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [tamPagina, setTamPagina] = useState<number>(10);
  const [previewRequest, setPreviewRequest] = useState<ReporteInventarioRequest | null>(null);

  const exportarMutation = useExportarReporte();
  const preview = useReportePreview(previewRequest);

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key],
    );
  };

  const toggleIn = (field: keyof FiltrosInventario, value: string) => {
    setFiltros((prev) => {
      const current = (prev[field] ?? []) as string[];
      return {
        ...prev,
        [field]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
      };
    });
  };

  const toggleResponsable = (id: number) => {
    setFiltros((prev) => {
      const current = prev.responsableId ?? [];
      return {
        ...prev,
        responsableId: current.includes(id) ? current.filter((v) => v !== id) : [...current, id],
      };
    });
  };

  const buildRequest = (page: number): ReporteInventarioRequest => ({
    columnas: selectedColumns,
    filtros: {
      categoria: filtros.categoria?.length ? filtros.categoria : undefined,
      estado: filtros.estado?.length ? filtros.estado : undefined,
      sede: filtros.sede?.length ? filtros.sede : undefined,
      area: filtros.area?.length ? filtros.area : undefined,
      responsableId: filtros.responsableId?.length ? filtros.responsableId : undefined,
      fechaAdquisicionDesde: filtros.fechaAdquisicionDesde || null,
      fechaAdquisicionHasta: filtros.fechaAdquisicionHasta || null,
      proveedor: filtros.proveedor?.trim() ? filtros.proveedor.trim() : null,
      numeroOC: filtros.numeroOC?.trim() ? filtros.numeroOC.trim() : null,
    },
    agrupadoPor: agrupadoPor && agrupadoPor !== "__none" ? agrupadoPor : null,
    ordenadoPor: ordenadoPor && ordenadoPor !== "__none" ? ordenadoPor : null,
    ordenDescendente,
    paginaPreview: page,
    tamPaginaPreview: tamPagina,
  });

  const generarPreview = () => {
    if (selectedColumns.length === 0) {
      toast.error("Selecciona al menos una columna.");
      return;
    }
    setPagina(1);
    setPreviewRequest(buildRequest(1));
  };

  const irAPagina = (page: number) => {
    const totalPaginas = Math.max(1, preview.data?.totalPaginas ?? 1);
    const safe = Math.min(Math.max(1, page), totalPaginas);
    setPagina(safe);
    setPreviewRequest(buildRequest(safe));
  };

  const exportar = async (formato: "pdf" | "excel") => {
    if (selectedColumns.length === 0) {
      toast.error("Selecciona al menos una columna.");
      return;
    }
    const request = previewRequest ?? buildRequest(1);
    try {
      await exportarMutation.mutateAsync({ request, formato });
      toast.success(formato === "pdf" ? "Informe PDF exportado" : "Informe Excel exportado");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al exportar el informe";
      toast.error(sanitizeError(message));
    }
  };

  const columnOptions = useMemo(
    () => REPORTE_COLUMNAS.map((c) => ({ value: c.key, label: c.label })),
    [],
  );

  const columnOptionsFiltradas = useMemo(() => {
    const q = colBusqueda.trim().toLowerCase();
    if (!q) return columnOptions;
    return columnOptions.filter((c) => c.label.toLowerCase().includes(q));
  }, [columnOptions, colBusqueda]);

  const filtroColumnasOptions = columnOptions;

  const filtrosActivosCount = useMemo(() => {
    let n = 0;
    if (filtros.categoria?.length) n++;
    if (filtros.estado?.length) n++;
    if (filtros.sede?.length) n++;
    if (filtros.area?.length) n++;
    if (filtros.responsableId?.length) n++;
    if (filtros.fechaAdquisicionDesde || filtros.fechaAdquisicionHasta) n++;
    if (filtros.proveedor?.trim()) n++;
    if (filtros.numeroOC?.trim()) n++;
    return n;
  }, [filtros]);

  const clearAllFilters = () => {
    setFiltros({ ...FILTROS_INICIALES });
    setAgrupadoPor("");
    setOrdenadoPor("");
    setOrdenDescendente(false);
  };

  const estadoEfectivoPorActivo = useMemo(() => {
    const asignados = new Set(
      (asignaciones ?? []).filter((a) => a.estadoAsignacion === "Activa").map((a) => a.idActivo),
    );
    const porCodigo = new Map<string, string>();
    const porSerial = new Map<string, string>();
    for (const activo of activos ?? []) {
      const efectivo =
        activo.estadoActivo === "Disponible" && asignados.has(activo.idActivo)
          ? "Asignado"
          : activo.estadoActivo;
      if (activo.codigoActivo) porCodigo.set(activo.codigoActivo, efectivo);
      if (activo.serial) porSerial.set(activo.serial, efectivo);
    }
    return { porCodigo, porSerial };
  }, [activos, asignaciones]);

  const estadoCounts = useMemo(() => {
    const asignados = new Set(
      (asignaciones ?? []).filter((a) => a.estadoAsignacion === "Activa").map((a) => a.idActivo),
    );
    const counts: Record<string, number> = {
      Disponible: 0,
      Asignado: 0,
      EnReparacion: 0,
      DadoDeBaja: 0,
      Venta: 0,
    };
    for (const activo of activos ?? []) {
      const efectivo =
        activo.estadoActivo === "Disponible" && asignados.has(activo.idActivo)
          ? "Asignado"
          : activo.estadoActivo;
      counts[efectivo] = (counts[efectivo] ?? 0) + 1;
    }
    return counts;
  }, [activos, asignaciones]);

  const getEstadoEfectivo = useCallback(
    (fila: Record<string, string | number | null>): string | null => {
      const codigo = fila["Código activo"];
      if (codigo != null) {
        const hit = estadoEfectivoPorActivo.porCodigo.get(String(codigo));
        if (hit) return hit;
      }
      const serial = fila["Serial"];
      if (serial != null) {
        const hit = estadoEfectivoPorActivo.porSerial.get(String(serial));
        if (hit) return hit;
      }
      return null;
    },
    [estadoEfectivoPorActivo],
  );

  const renderEstadoCell = (fila: Record<string, string | number | null>): React.ReactNode => {
    const desdeModulos = getEstadoEfectivo(fila);
    const crudo = String(fila["Estado"] ?? "");
    const key = desdeModulos ?? ESTADO_KEY_BY_LABEL[crudo] ?? crudo;
    return (
      <Badge variant="outline" className={cn("whitespace-nowrap", ESTADO_TINT[key])}>
        {ESTADO_LABELS[key] ?? key}
      </Badge>
    );
  };

  const colCount = useMemo(
    () => Math.max(1, preview.data?.columnas.length ?? selectedColumns.length ?? 1),
    [preview.data, selectedColumns],
  );

  const registrosDesde = preview.data
    ? (preview.data.paginaActual - 1) * tamPagina + (preview.data.filas.length > 0 ? 1 : 0)
    : 0;
  const registrosHasta = preview.data
    ? (preview.data.paginaActual - 1) * tamPagina + preview.data.filas.length
    : 0;

  return (
    <>
      <AppHeader title="Informes" subtitle="Genera y exporta informes del inventario de activos" />

      <main className="flex-1 p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 gap-5 items-start lg:grid-cols-[380px_minmax(0,1fr)]">
          {/* Panel lateral de configuración */}
          <Card className="overflow-hidden lg:sticky lg:top-4">
            <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Settings2 className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold leading-tight">Configuración</h2>
                <p className="truncate text-[11px] text-muted-foreground">
                  Personaliza columnas, filtros y orden
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {selectedColumns.length} columnas
              </Badge>
            </div>

            <ScrollArea className="max-h-[calc(100vh-17rem)]">
              <div className="space-y-6 p-4">
                {/* Columnas */}
                <section className="space-y-3">
                  <SectionHeader icon={Columns3} title="Columnas" />
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={colBusqueda}
                      onChange={(e) => setColBusqueda(e.target.value)}
                      placeholder="Buscar columna..."
                      className="h-8 pl-8 text-sm"
                    />
                  </div>
                  <div className="max-h-44 space-y-0.5 overflow-y-auto pr-1">
                    {columnOptionsFiltradas.map((opt) => {
                      const checked = selectedColumns.includes(opt.value);
                      return (
                        <label
                          key={opt.value}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer select-none transition-colors",
                            checked ? "bg-primary/5" : "hover:bg-muted/60",
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleColumn(opt.value)}
                          />
                          <span className="truncate">{opt.label}</span>
                        </label>
                      );
                    })}
                    {columnOptionsFiltradas.length === 0 && (
                      <p className="px-2 py-1 text-xs text-muted-foreground/70">
                        Sin columnas para "{colBusqueda}".
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setSelectedColumns(REPORTE_COLUMNAS.map((c) => c.key))}
                    >
                      Seleccionar todas
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setSelectedColumns([])}
                    >
                      Limpiar
                    </Button>
                    <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
                      {selectedColumns.length}/{REPORTE_COLUMNAS.length}
                    </span>
                  </div>
                </section>

                <Separator />

                {/* Filtros */}
                <section className="space-y-3">
                  <SectionHeader
                    icon={SlidersHorizontal}
                    title="Filtros"
                    badge={
                      filtrosActivosCount > 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 gap-1 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                          onClick={clearAllFilters}
                        >
                          <X className="h-3 w-3" /> Limpiar ({filtrosActivosCount})
                        </Button>
                      ) : undefined
                    }
                  />

                  <MultiCheckboxGroup
                    label="Categorías"
                    options={(categorias ?? []).map((c) => ({ value: c.nombre, label: c.nombre }))}
                    selected={filtros.categoria ?? []}
                    onToggle={(v) => toggleIn("categoria", v)}
                  />

                  <EstadoFilterGroup
                    selected={filtros.estado ?? []}
                    onToggle={(v) => toggleIn("estado", v)}
                    counts={estadoCounts}
                  />

                  <MultiCheckboxGroup
                    label="Sedes"
                    options={(sedes ?? []).map((s) => ({ value: s.nombre, label: s.nombre }))}
                    selected={filtros.sede ?? []}
                    onToggle={(v) => toggleIn("sede", v)}
                  />

                  <MultiCheckboxGroup
                    label="Áreas"
                    options={(areas ?? []).map((a) => ({
                      value: a.nombreArea,
                      label: a.nombreArea,
                    }))}
                    selected={filtros.area ?? []}
                    onToggle={(v) => toggleIn("area", v)}
                  />

                  <MultiCheckboxGroup
                    label="Responsables"
                    options={(usuarios ?? []).map((u) => ({
                      value: String(u.idUsuario),
                      label: u.nombre,
                    }))}
                    selected={(filtros.responsableId ?? []).map(String)}
                    onToggle={(v) => toggleResponsable(Number(v))}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="fechaDesde"
                        className="text-xs text-muted-foreground font-medium"
                      >
                        Adquisición desde
                      </Label>
                      <Input
                        id="fechaDesde"
                        type="date"
                        className="h-8 text-sm"
                        value={filtros.fechaAdquisicionDesde ?? ""}
                        onChange={(e) =>
                          setFiltros((prev) => ({
                            ...prev,
                            fechaAdquisicionDesde: e.target.value || null,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="fechaHasta"
                        className="text-xs text-muted-foreground font-medium"
                      >
                        Adquisición hasta
                      </Label>
                      <Input
                        id="fechaHasta"
                        type="date"
                        className="h-8 text-sm"
                        value={filtros.fechaAdquisicionHasta ?? ""}
                        onChange={(e) =>
                          setFiltros((prev) => ({
                            ...prev,
                            fechaAdquisicionHasta: e.target.value || null,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="proveedor"
                      className="text-xs text-muted-foreground font-medium"
                    >
                      Proveedor
                    </Label>
                    <Input
                      id="proveedor"
                      className="h-8 text-sm"
                      value={filtros.proveedor ?? ""}
                      onChange={(e) =>
                        setFiltros((prev) => ({ ...prev, proveedor: e.target.value }))
                      }
                      placeholder="Buscar por proveedor..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="numeroOC" className="text-xs text-muted-foreground font-medium">
                      N° orden de compra
                    </Label>
                    <Input
                      id="numeroOC"
                      className="h-8 text-sm"
                      value={filtros.numeroOC ?? ""}
                      onChange={(e) =>
                        setFiltros((prev) => ({ ...prev, numeroOC: e.target.value }))
                      }
                      placeholder="Ej: OC-2024-001"
                    />
                  </div>
                </section>

                <Separator />

                {/* Ordenamiento */}
                <section className="space-y-3">
                  <SectionHeader icon={ArrowUpDown} title="Ordenamiento" />
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="agrupadoPor"
                      className="text-xs text-muted-foreground font-medium"
                    >
                      Agrupar por
                    </Label>
                    <Select value={agrupadoPor || undefined} onValueChange={setAgrupadoPor}>
                      <SelectTrigger id="agrupadoPor" className="h-8">
                        <SelectValue placeholder="Sin agrupar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">Sin agrupar</SelectItem>
                        {filtroColumnasOptions.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="ordenadoPor"
                      className="text-xs text-muted-foreground font-medium"
                    >
                      Ordenar por
                    </Label>
                    <Select value={ordenadoPor || undefined} onValueChange={setOrdenadoPor}>
                      <SelectTrigger id="ordenadoPor" className="h-8">
                        <SelectValue placeholder="Sin ordenar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">Sin ordenar</SelectItem>
                        {filtroColumnasOptions.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <label className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm cursor-pointer select-none">
                    <span className="flex items-center gap-2">
                      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                      Descendente
                    </span>
                    <Switch
                      checked={ordenDescendente}
                      onCheckedChange={setOrdenDescendente}
                      disabled={!ordenadoPor && !agrupadoPor}
                    />
                  </label>
                </section>
              </div>
            </ScrollArea>

            <div className="border-t p-4">
              <Button
                variant="brand"
                className="w-full"
                onClick={generarPreview}
                disabled={preview.isFetching}
              >
                {preview.isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                Generar vista previa
              </Button>
            </div>
          </Card>

          {/* Vista previa */}
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Table2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold leading-tight">Vista previa</h2>
                  <p className="truncate text-[11px] text-muted-foreground">
                    Inventario general de activos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {preview.data && (
                  <Badge variant="secondary" className="gap-1">
                    <Database className="h-3 w-3" />
                    {preview.data.totalRegistros} registros
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportar("excel")}
                  disabled={exportarMutation.isPending}
                >
                  {exportarMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                  )}
                  Excel
                </Button>
                <Button
                  size="sm"
                  variant="brand"
                  onClick={() => exportar("pdf")}
                  disabled={exportarMutation.isPending}
                >
                  {exportarMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  PDF
                </Button>
              </div>
            </div>

            {preview.data && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b bg-background px-4 py-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Database className="h-3 w-3" />
                  {preview.data.totalRegistros} registros
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Columns3 className="h-3 w-3" />
                  {preview.data.columnas.length} columnas
                </span>
                {filtrosActivosCount > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Filter className="h-3 w-3" />
                    {filtrosActivosCount} filtros activos
                  </span>
                )}
                <span className="ml-auto inline-flex items-center gap-1.5 tabular-nums">
                  Mostrando {registrosDesde}–{registrosHasta}
                </span>
              </div>
            )}

            <div className="overflow-x-auto max-h-[calc(100vh-24rem)]">
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="bg-muted/60 hover:bg-muted/60">
                    {preview.data?.columnas.map((col) => (
                      <TableHead
                        key={col}
                        className={cn(
                          "whitespace-nowrap text-[11px] uppercase tracking-wide",
                          col === "Costo" && "text-right",
                        )}
                      >
                        {col}
                      </TableHead>
                    ))}
                    {(!preview.data || preview.data.columnas.length === 0) && (
                      <TableHead className="text-muted-foreground">Columnas</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRequest && preview.isPending ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: colCount }).map((_, j) => (
                          <TableCell key={j} className="py-3">
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : preview.error ? (
                    <TableRow>
                      <TableCell
                        colSpan={colCount}
                        className="text-center text-sm text-destructive py-12"
                      >
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                          <BarChart3 className="h-6 w-6" />
                        </div>
                        {preview.error instanceof Error
                          ? sanitizeError(preview.error.message)
                          : "Error al cargar la vista previa"}
                      </TableCell>
                    </TableRow>
                  ) : preview.data ? (
                    preview.data.filas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={colCount} className="text-center py-12">
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Filter className="h-6 w-6" />
                          </div>
                          <p className="text-sm font-medium text-foreground">Sin resultados</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            No hay activos que coincidan con los filtros seleccionados.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={clearAllFilters}
                          >
                            <X className="h-4 w-4" /> Limpiar filtros
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      preview.data.filas.map((fila, i) => (
                        <TableRow
                          key={i}
                          className={cn(
                            "transition-colors hover:bg-muted/40",
                            i % 2 === 1 && "bg-muted/20",
                          )}
                        >
                          {preview.data.columnas.map((col) =>
                            col === "Estado" ? (
                              <TableCell key={col} className="whitespace-nowrap">
                                {renderEstadoCell(fila)}
                              </TableCell>
                            ) : (
                              <TableCell
                                key={col}
                                className={cn(
                                  "whitespace-nowrap text-sm",
                                  col === "Costo" && "text-right tabular-nums",
                                )}
                              >
                                {fila[col] ?? "-"}
                              </TableCell>
                            ),
                          )}
                        </TableRow>
                      ))
                    )
                  ) : (
                    <TableRow>
                      <TableCell colSpan={colCount} className="text-center py-14">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <BarChart3 className="h-7 w-7" />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          Aún no hay vista previa
                        </p>
                        <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                          Selecciona las columnas del informe y configura los filtros, luego pulsa
                          "Generar vista previa" para ver los resultados.
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {preview.data && preview.data.totalPaginas > 0 && (
              <div className="flex flex-col gap-3 border-t bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Filas por página:
                  </span>
                  <Select
                    value={String(tamPagina)}
                    onValueChange={(v) => {
                      setTamPagina(Number(v));
                      irAPagina(1);
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
                  <span className="ml-1 hidden text-xs tabular-nums text-muted-foreground sm:inline">
                    {preview.data.totalRegistros} en total
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                    Página {preview.data.paginaActual} de {Math.max(1, preview.data.totalPaginas)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={preview.data.paginaActual <= 1 || preview.isFetching}
                      onClick={() => irAPagina(preview.data!.paginaActual - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={
                        preview.data.paginaActual >= preview.data.totalPaginas || preview.isFetching
                      }
                      onClick={() => irAPagina(preview.data!.paginaActual + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </>
  );
}
