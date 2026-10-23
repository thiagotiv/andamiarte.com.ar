import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { ArrowRight, ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { useSession } from "@/components/session";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/network";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({
    ...(typeof s["redirect"] === "string" ? { redirect: s["redirect"] } : {}),
  }),
  head: () =>
    pageHead(
      "Iniciar Sesión",
      "Ingresá a tu cuenta en Andamiarte y conectate con familias, profesionales y centros inclusivos.",
    ),
  component: Login,
});

function Login() {
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { user } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const destination = search.redirect || "/comunidad";
      void navigate({ to: destination as any });
    }
  }, [user, navigate, search.redirect]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setUnconfirmedEmail(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const result = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (result.error) {
        const errorMsg = result.error.message.toLowerCase();
        if (errorMsg.includes("email not confirmed")) {
          setUnconfirmedEmail(cleanEmail);
          setError("Tu correo aún no fue verificado. Ingresá el código de 6 dígitos enviado a tu casilla.");
          toast.info("Por favor verificá tu cuenta para poder ingresar.");
          return;
        }
        if (errorMsg.includes("invalid login credentials")) {
          setError("El correo o la contraseña ingresados no son correctos.");
          return;
        }
        throw result.error;
      }

      toast.success("¡Bienvenido/a de nuevo!");
      const target = search.redirect || "/comunidad";
      await navigate({ to: target as any });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión. Intentá nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="eyebrow mb-2">
        <ShieldCheck size={16} /> Acceso Seguro
      </div>
      <h1>Qué bueno encontrarte.</h1>
      <p>
        Ingresá con tus credenciales para continuar acompañando y construyendo inclusión escolar en equipo.
      </p>

      {error && (
        <div
          role="alert"
          className="my-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div className="flex-1">
              <p className="font-medium">{error}</p>
              {unconfirmedEmail && (
                <div className="mt-2.5">
                  <Link
                    to="/verificacion"
                    search={{ email: unconfirmedEmail }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-900 hover:bg-red-200"
                  >
                    Ingresar código de verificación <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <form className="form-grid mt-6" onSubmit={handleLogin}>
        <label>
          Correo electrónico
          <div className="relative mt-1">
            <input
              className="field field-icon-left w-full"
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          </div>
        </label>

        <label>
          <div className="flex items-center justify-between">
            <span>Contraseña</span>
            <Link to="/reset-password" className="text-xs text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative mt-1">
            <input
              className="field field-icon-left field-icon-right w-full"
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <button
              type="button"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10 p-1"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <Button variant="cta" size="lg" type="submit" disabled={busy} className="mt-2 w-full">
          {busy ? "Iniciando sesión…" : "Ingresar a mi cuenta"}
          <ArrowRight className="ml-1" size={18} />
        </Button>
      </form>

      <div className="divider">o continuá con</div>

      <GoogleAuthButton
        text="continue_with"
        disabled={busy}
        onSuccess={async () => {
          const target = search.redirect || "/comunidad";
          await navigate({ to: target as any });
        }}
        onError={(err) => setError(err.message)}
      />

      <div className="mt-8 rounded-xl border border-border/60 bg-muted/30 p-4 text-center text-sm text-muted-foreground">
        ¿Aún no tenés una cuenta en Andamiarte?{" "}
        <Link to="/registro" className="font-semibold text-primary hover:underline">
          Registrate acá
        </Link>
      </div>
    </main>
  );
}
