import { useState } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, CheckCircle2, AlertCircle, UserRound } from "lucide-react";
import { useActaPublica, useFirmarActa } from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/firmar/$token")({
  head: () => ({ meta: [{ title: "Firma electrónica — Indigo" }] }),
  component: FirmaPage,
});

function FirmaPage() {
  const { token } = useParams({ from: "/firmar/$token" });
  const { data: acta, isLoading, error } = useActaPublica(token);
  const firmarMutation = useFirmarActa();

  const [nombre, setNombre] = useState("");
  const [documento, setDocumento] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-purple/[0.04] via-brand-magenta/[0.04] to-brand-navy/[0.04] p-4">
        <Card className="p-8 flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-brand-magenta" />
          <span className="text-muted-foreground">Cargando acta...</span>
        </Card>
      </div>
    );
  }

  if (error || !acta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-purple/[0.04] via-brand-magenta/[0.04] to-brand-navy/[0.04] p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Enlace inválido o expirado</h2>
          <p className="text-muted-foreground text-sm">
            El enlace que has utilizado no es válido o ha expirado. Contacta al área de soporte para
            obtener un nuevo enlace.
          </p>
        </Card>
      </div>
    );
  }

  if (acta.yaFirmada) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-purple/[0.04] via-brand-magenta/[0.04] to-brand-navy/[0.04] p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Acta ya firmada</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Esta acta ya fue firmada electrónicamente.
          </p>
          {acta.nombreFirmante && (
            <div className="bg-muted rounded-lg p-3 text-sm">
              <p>
                <strong>Firmante:</strong> {acta.nombreFirmante}
              </p>
              {acta.fechaFirma && (
                <p>
                  <strong>Fecha:</strong> {new Date(acta.fechaFirma).toLocaleString("es-CO")}
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (acta.estado === "Vencida") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-purple/[0.04] via-brand-magenta/[0.04] to-brand-navy/[0.04] p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Enlace expirado</h2>
          <p className="text-muted-foreground text-sm">
            El plazo para firmar este documento ha vencido. Solicita un nuevo enlace al área de
            soporte.
          </p>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !documento.trim()) {
      toast.error("Completa todos los campos.");
      return;
    }
    try {
      await firmarMutation.mutateAsync({
        token,
        data: { nombre: nombre.trim(), documento: documento.trim() },
      });
      setSubmitted(true);
      toast.success("Acta firmada exitosamente.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al firmar");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-purple/[0.04] via-brand-magenta/[0.04] to-brand-navy/[0.04] p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">¡Firma exitosa!</h2>
          <p className="text-muted-foreground text-sm">
            El acta ha sido firmada electrónicamente. Puedes cerrar esta ventana.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-purple/[0.04] via-brand-magenta/[0.04] to-brand-navy/[0.04] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="p-0 space-y-0 overflow-hidden">
          <div className="h-1.5 bg-gradient-brand" />
          <div className="p-6 space-y-6">
            <div className="text-center pb-4 border-b border-brand-magenta/10">
              <img
                src="/Logo INDIGO ORG. 2.png"
                alt="Indigo ORG"
                className="h-14 mx-auto mb-3 object-contain"
              />
              <h1 className="text-xl font-bold text-brand-magenta">Acta de asignación de activo</h1>
              <p className="text-sm text-muted-foreground">
                Revisa los detalles y firma electrónicamente para confirmar la recepción
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">Asignado a</span>
                <span className="font-medium flex items-center gap-1">
                  <UserRound className="h-3.5 w-3.5 text-brand-magenta" />
                  {acta.nombreDestino ?? "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Entregado por</span>
                <span className="font-medium">{acta.nombreUsuarioEntrega ?? "—"}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Fecha de asignación</span>
                <span className="font-medium">
                  {new Date(acta.fechaAsignacion).toLocaleDateString("es-CO")}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Registro de salida</span>
                <span className="font-medium">{acta.registroSalida}</span>
              </div>
            </div>

            <div className="border-t border-brand-magenta/10 pt-4">
              <h3 className="text-sm font-semibold mb-2 text-brand-magenta">
                Activos asignados ({acta.activos.length})
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Serial</TableHead>
                    <TableHead className="text-xs">Marca</TableHead>
                    <TableHead className="text-xs">Modelo</TableHead>
                    <TableHead className="text-xs">Categoría</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acta.activos.map((a) => (
                    <TableRow key={a.idActivo}>
                      <TableCell className="font-medium text-xs">{a.serial ?? "—"}</TableCell>
                      <TableCell className="text-xs">{a.marca ?? "—"}</TableCell>
                      <TableCell className="text-xs">{a.modelo ?? "—"}</TableCell>
                      <TableCell className="text-xs">{a.nombreCategoria ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="border-t border-brand-magenta/10 pt-6">
              <h2 className="text-base font-semibold mb-4 text-brand-magenta">Firma electrónica</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">
                    Nombre completo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre completo"
                    disabled={firmarMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documento">
                    Documento de identidad <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="documento"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    placeholder="N° de documento"
                    disabled={firmarMutation.isPending}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-brand hover:opacity-90 transition-opacity"
                  size="lg"
                  disabled={firmarMutation.isPending}
                >
                  {firmarMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                  )}
                  Firmar acta
                </Button>
              </form>
            </div>

            <div className="text-center text-xs text-muted-foreground border-t border-brand-magenta/10 pt-4">
              Al hacer clic en "Firmar acta", confirmas que has recibido el activo descrito y
              aceptas los términos de la asignación.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
