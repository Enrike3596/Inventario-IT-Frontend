import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Recuperar contraseña — SICOT" },
      { name: "description", content: "Solicita el restablecimiento de tu contraseña." },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success("Enlace enviado si el correo existe en el sistema");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar el enlace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-background">
      <Card className="w-full max-w-md shadow-elegant">
        <CardContent className="p-8">
          <Link to="/auth" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Volver al login
          </Link>
          <h1 className="font-display text-2xl font-semibold">Recuperar contraseña</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Te enviaremos un enlace para restablecerla.
          </p>

          {sent ? (
            <div className="mt-6 rounded-md border bg-muted/40 p-4 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <Mail className="h-4 w-4 text-primary" /> Correo enviado
              </div>
              <p className="mt-1 text-muted-foreground">
                Si <strong>{email}</strong> está registrado, recibirás un enlace en los próximos minutos.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                />
              </div>
              <Button type="submit" variant="brand" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Enviar enlace
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
