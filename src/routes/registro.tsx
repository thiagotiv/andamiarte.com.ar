import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback, type FormEvent } from "react";
import { ArrowRight, ShieldCheck, Mail, Lock, User, MapPin, Building2, HeartHandshake, GraduationCap, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { useSession } from "@/components/session";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/network";
import { toast } from "sonner";

export const Route = createFileRoute("/registro")({
  validateSearch: (s: Record<string, unknown>): { role?: string } => ({
    ...(typeof s["role"] === "string" ? { role: s["role"] } : {}),
  }),
  head: () =>
    pageHead(
      "Crear Cuenta",
      "Registrate como acompañante externo (AIE), familia o centro educativo y sumate a la red de inclusión escolar.",
    ),
  component: Registro,
});

function Registro() {
  const search = Route.useSearch();
  const [role, setRole] = useState<"aie" | "centro" | "familia">(
    (search.role as "aie" | "centro" | "familia") || "aie",
  );
  const [name, setName] = useState("");
  const [zone, setZone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) void navigate({ to: "/comunidad" });
  }, [user, navigate]);

  const handleGoogleSuccess = useCallback(async () => {
    await navigate({ to: "/comunidad" });
  }, [navigate]);

  const handleGoogleError = useCallback((err: Error) => {
    setError(err.message);
  }, []);

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanZone = zone.trim();

    console.log("Iniciando registro manual para:", cleanEmail || email);

    if (!role) {
      toast.error("Por favor, selecciona tu rol");
      setError("Por favor, selecciona tu rol.");
      return;
    }

    if (!cleanEmail) {
      toast.error("Por favor, ingresa tu correo electrónico");
      setError("Por favor, ingresa tu correo electrónico.");
      return;
    }

    if (!acceptedTerms) {
      toast.error("Debes aceptar los Términos y la Política de Privacidad");
      setError("Debes aceptar los Términos y la Política de Privacidad.");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setBusy(true);

    try {
      const result = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: cleanName,
            role,
            zone: cleanZone,
          },
          emailRedirectTo: `${window.location.origin}/verificacion`,
        },
      });

      if (result.error) throw result.error;

      // If Supabase has email confirmation enabled (standard), session is null until OTP/email confirmation
      if (result.data.user && !result.data.session) {
        toast.success("¡Registro inicial exitoso! Te enviamos un código de verificación.");
        await navigate({
          to: "/verificacion",
          search: { email: cleanEmail, role },
        });
      } else {
        toast.success("¡Cuenta creada con éxito!");
        await navigate({ to: "/comunidad" });
      }
    } catch (err: any) {
      console.error("Error en registro manual:", err);
      const msg = err instanceof Error ? err.message : "No se pudo registrar la cuenta";
      if (msg.toLowerCase().includes("user already registered") || msg.toLowerCase().includes("ya existe una cuenta")) {
        setError("Ya existe un usuario registrado con este correo. Podés iniciar sesión.");
        toast.error("Ya existe una cuenta con este correo. Podés iniciar sesión.");
      } else {
        setError(msg);
        toast.error(msg || "No se pudo registrar la cuenta");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="eyebrow mb-2">
        <ShieldCheck size={16} /> Una red de confianza
      </div>
      <h1>Tu próximo vínculo empieza acá.</h1>
      <p>Sumate a una comunidad comprometida con una escuela para todas y todos.</p>

      {error && (
        <div
          role="alert"
          className="my-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Role Selection Tabs */}
      <div className="mt-6 mb-5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
          ¿Cómo vas a participar en la red?
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setRole("aie")}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all ${
              role === "aie"
                ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/50"
            }`}
          >
            <GraduationCap className="h-5 w-5" />
            <span>Acompañante (AIE)</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("familia")}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all ${
              role === "familia"
                ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/50"
            }`}
          >
            <HeartHandshake className="h-5 w-5" />
            <span>Familia</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("centro")}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all ${
              role === "centro"
                ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/50"
            }`}
          >
            <Building2 className="h-5 w-5" />
            <span>Centro / Escuela</span>
          </button>
        </div>
      </div>

      <form className="form-grid" onSubmit={handleRegister}>
        <label>
          {role === "centro" ? "Nombre de la institución o equipo" : "Nombre y apellido"}
          <div className="relative mt-1">
            <input
              className="field field-icon-left w-full"
              required
              placeholder={
                role === "centro"
                  ? "Ej: Colegio San Martín o Equipo Interdisciplinario"
                  : "Ej: Lic. Sofía Gómez"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
            {role === "centro" ? (
              <Building2 className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            ) : (
              <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            )}
          </div>
        </label>

        <label>
          Zona o localidad
          <div className="relative mt-1">
            <input
              className="field field-icon-left w-full"
              placeholder="Ej: CABA - Palermo, Zona Norte, Córdoba"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              autoComplete="address-level2"
            />
            <MapPin className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          </div>
        </label>

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
            />
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          </div>
        </label>

        <label>
          Contraseña
          <div className="relative mt-1">
            <input
              className="field field-icon-left field-icon-right w-full"
              type={showPassword ? "text" : "password"}
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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
          <small className="text-xs text-muted-foreground">
            Al menos 6 caracteres para mantener segura tu cuenta.
          </small>
        </label>

        <div className="flex items-start gap-2.5 pt-1">
          <input
            id="terms-checkbox"
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary shrink-0"
          />
          <label htmlFor="terms-checkbox" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
            Acepto los{" "}
            <Link to="/terminos" target="_blank" className="font-semibold text-primary underline hover:text-foreground">
              Términos y Condiciones
            </Link>{" "}
            y la{" "}
            <Link to="/privacidad" target="_blank" className="font-semibold text-primary underline hover:text-foreground">
              Política de Privacidad
            </Link>{" "}
            de Andamiarte.
          </label>
        </div>

        <Button variant="cta" size="lg" type="submit" disabled={busy} className="mt-3 w-full">
          {busy ? "Creando cuenta…" : "Registrarme y recibir código"}
          <ArrowRight className="ml-1" size={18} />
        </Button>
      </form>

      <div className="divider">o continuá con</div>

      <GoogleAuthButton
        role={role}
        text="signup_with"
        disabled={busy}
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
      />

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Al registrarte con Google tu cuenta se creará como{" "}
        <strong className="text-foreground">
          {role === "centro" ? "Institución / Centro" : role === "familia" ? "Familia" : "Acompañante (AIE)"}
        </strong>
        .
      </p>

      <div className="mt-8 rounded-xl border border-border/60 bg-muted/30 p-4 text-center text-sm text-muted-foreground">
        ¿Ya tenés una cuenta registrada?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Iniciá sesión acá
        </Link>
      </div>
    </main>
  );
}
