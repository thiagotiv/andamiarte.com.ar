import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { ShieldCheck, MailCheck, ArrowRight, RotateCw, CheckCircle2, AlertCircle, Edit3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/session";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { pageHead } from "@/lib/network";
import { toast } from "sonner";

export const Route = createFileRoute("/verificacion")({
  validateSearch: (s: Record<string, unknown>): { email?: string; role?: string; token?: string } => ({
    ...(typeof s["email"] === "string" ? { email: s["email"] } : {}),
    ...(typeof s["role"] === "string" ? { role: s["role"] } : {}),
    ...(typeof s["token"] === "string" ? { token: s["token"] } : {}),
  }),
  head: () =>
    pageHead(
      "Verificación de Correo",
      "Confirmá tu dirección de correo electrónico con el código de 6 dígitos para habilitar tu cuenta en Andamiarte.",
    ),
  component: Verificacion,
});

function Verificacion() {
  const search = Route.useSearch();
  const [email, setEmail] = useState(search.email || "");
  const [isEditingEmail, setIsEditingEmail] = useState(!search.email);
  const [otp, setOtp] = useState(search.token || "");
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { user } = useSession();
  const navigate = useNavigate();

  // If already logged in (e.g. clicked confirmation link directly), redirect to feed
  useEffect(() => {
    if (!user || busy) {
      return undefined;
    }
    toast.success("¡Tu sesión se encuentra activa!");
    const timer = setTimeout(() => {
      void navigate({ to: "/comunidad" });
    }, 1000);
    return () => clearTimeout(timer);
  }, [user, navigate, busy]);

  // Handle URL token_hash or hash fragment if present (magic link click)
  useEffect(() => {
    const handleUrlHash = async () => {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const tokenHash = hashParams.get("token_hash") || new URLSearchParams(window.location.search).get("token_hash");
      const type = (hashParams.get("type") || "signup") as any;

      if (tokenHash) {
        setBusy(true);
        try {
          const { error: verifyErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          });
          if (verifyErr) throw verifyErr;
          setSuccess(true);
          toast.success("¡Correo verificado con éxito!");
          setTimeout(() => void navigate({ to: "/comunidad" }), 1500);
        } catch (e) {
          setError(e instanceof Error ? e.message : "El enlace de verificación ha expirado o no es válido.");
        } finally {
          setBusy(false);
        }
      }
    };

    void handleUrlHash();
  }, [navigate]);

  // Cooldown countdown effect
  useEffect(() => {
    if (resendCooldown <= 0) {
      return undefined;
    }
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleVerify(codeToVerify?: string) {
    const code = (codeToVerify || otp).trim();
    const targetEmail = email.trim().toLowerCase();

    if (!targetEmail) {
      setError("Por favor ingresá tu correo electrónico.");
      setIsEditingEmail(true);
      return;
    }

    if (code.length !== 6) {
      setError("Ingresá los 6 dígitos del código de verificación.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      // First attempt with type 'signup'
      let result = await supabase.auth.verifyOtp({
        email: targetEmail,
        token: code,
        type: "signup",
      });

      // If 'signup' fails because it might be 'email' OTP or email_change
      if (result.error && (result.error.message.includes("type") || result.error.message.includes("Token is invalid"))) {
        const fallback = await supabase.auth.verifyOtp({
          email: targetEmail,
          token: code,
          type: "email",
        });
        if (!fallback.error) {
          result = fallback;
        }
      }

      if (result.error) throw result.error;

      setSuccess(true);
      toast.success("¡Tu cuenta ha sido activada!");
      setTimeout(() => {
        void navigate({ to: "/comunidad" });
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "El código ingresado es incorrecto o ha expirado. Por favor solicitá uno nuevo.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleResendCode() {
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) {
      setError("Por favor ingresá tu correo para reenviarte el código.");
      setIsEditingEmail(true);
      return;
    }

    setResendBusy(true);
    setError("");

    try {
      const result = await supabase.auth.resend({
        type: "signup",
        email: targetEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/verificacion`,
        },
      });

      if (result.error) throw result.error;

      setResendCooldown(60);
      toast.success(`Nuevo código enviado a ${targetEmail}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos reenviar el código. Aguardá unos segundos e intentá nuevamente.",
      );
    } finally {
      setResendBusy(false);
    }
  }

  return (
    <main className="auth-page max-w-md mx-auto">
      <div className="eyebrow mb-2">
        <ShieldCheck size={16} /> Verificación Segura
      </div>
      <h1>Verificá tu correo electrónico</h1>
      <p>
        Te enviamos un código de 6 dígitos para validar tu identidad y activar todas las funciones de la red.
      </p>

      {/* Email Indicator Card */}
      <div className="mt-6 mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <MailCheck className="h-5 w-5 shrink-0 text-primary" />
            {isEditingEmail ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="field text-sm py-1.5 px-2.5 w-full"
                autoFocus
              />
            ) : (
              <div className="min-w-0">
                <span className="block text-xs text-muted-foreground">Enviado a:</span>
                <span className="block text-sm font-semibold text-foreground truncate">{email || "Sin correo"}</span>
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsEditingEmail(!isEditingEmail)}
            className="text-xs shrink-0 text-primary"
          >
            {isEditingEmail ? "Guardar" : <><Edit3 size={13} className="mr-1" /> Cambiar</>}
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}

      {success ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center text-green-900">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-600 mb-2" />
          <h3 className="text-lg font-bold">¡Cuenta verificada exitosamente!</h3>
          <p className="mt-1 text-sm text-green-800">
            Te estamos redirigiendo a la comunidad de Andamiarte...
          </p>
        </div>
      ) : (
        <form
          className="flex flex-col items-center gap-6"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void handleVerify();
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Código de 6 dígitos
            </span>
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(val) => {
                setOtp(val);
                if (val.length === 6) {
                  void handleVerify(val);
                }
              }}
              disabled={busy}
              autoFocus
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            variant="cta"
            size="lg"
            type="submit"
            disabled={busy || otp.length !== 6}
            className="w-full"
          >
            {busy ? "Verificando código…" : "Verificar y Activar Cuenta"}
            <ArrowRight className="ml-1" size={18} />
          </Button>

          <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
            <p>¿No recibiste el correo? Revisá la carpeta de Spam o Correo no deseado.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={resendBusy || resendCooldown > 0}
              onClick={handleResendCode}
              className="mt-1"
            >
              <RotateCw className={`mr-1.5 h-3.5 w-3.5 ${resendBusy ? "animate-spin" : ""}`} />
              {resendCooldown > 0
                ? `Reenviar código en ${resendCooldown}s`
                : resendBusy
                  ? "Enviando…"
                  : "Reenviar código por correo"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-8 rounded-xl border border-border/60 bg-muted/30 p-4 text-center text-xs text-muted-foreground">
        ¿Querés ingresar con otra cuenta?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Volver al Inicio de Sesión
        </Link>
      </div>
    </main>
  );
}
