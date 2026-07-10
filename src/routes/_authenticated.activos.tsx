import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { History, Loader2 } from "lucide-react";
import { ResourcePage } from "@/components/resource-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  useActivos,
  useCreateActivo,
  useUpdateActivo,
  useDeleteActivo,
  useAsignacionesPorActivo,
  useCategorias,
  useOrdenesCompra,
} from "@/lib/queries";
import type { Activo } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/activos")({
  head: () => ({ meta: [{ title: "Activos TI — Indigo" }] }),
  component: ActivosPage,
});

const estadoTint: Record<string, string> = {
  Disponible: "bg-success/15 text-success border-success/30",
  Asignado: "bg-primary/15 text-primary border-primary/30",
  EnMantenimiento: "bg-warning/15 text-warning border-warning/30",
  DadoDeBaja: "bg-destructive/15 text-destructive border-destructive/30",
};

const ESTADOS_ACTIVO = ["Disponible", "Asignado", "EnMantenimiento", "DadoDeBaja"] as const;

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
                  <SelectItem key={e} value={e}>{e}</SelectItem>
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
                {r.estadoActivo}
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
              { value: "EnMantenimiento", label: "En mantenimiento" },
              { value: "DadoDeBaja", label: "Dado de baja" },
            ],
          },
          { key: "observaciones", label: "Observaciones", type: "textarea" },
        ]}
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
