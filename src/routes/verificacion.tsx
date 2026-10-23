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

  // Si ya tiene sesión activa validada, redirigir
  useEffect(() => {
    if (!user || busy || !user.email) {
      return undefined;
    }
    // Si el usuario ya está autenticado con sesión válida
    const timer = setTimeout(() => {
      void navigate({ to: "/comunidad" });
    }, 1200);
    return () => clearTimeout(timer);
  }, [user, navigate, busy]);

  // Manejo de temporizador de cooldown (60s)
  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
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
      const result = await supabase.auth.verifyOtp({
        email: targetEmail,
        token: code,
        type: "signup",
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      setSuccess(true);
      toast.success("¡Cuenta activada con éxito!");
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
      });

      if (result.error) throw new Error(result.error.message);

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
    <main className="w-full min-h-screen bg-[#fbf5ee] py-12 md:py-16 px-4 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto">
        <article className="bg-white/90 backdrop-blur-sm border border-stone-200/70 rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm space-y-6">
          {/* Encabezado */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300/60 text-[#1d3d29] text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={14} /> Verificación de Cuenta
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d3d29] tracking-tight">
              Verificá tu correo electrónico
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Ingresá el código de 6 dígitos que enviamos a{" "}
              <strong className="text-[#1d3d29] font-semibold break-all">
                {email || "tu correo"}
              </strong>{" "}
              para activar tu cuenta.
            </p>
          </div>

          {/* Tarjeta de visualización y edición del correo */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <MailCheck className="h-5 w-5 shrink-0 text-[#1d3d29]" />
                {isEditingEmail ? (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full text-xs sm:text-sm rounded-lg border border-stone-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1d3d29]"
                    autoFocus
                  />
                ) : (
                  <div className="min-w-0">
                    <span className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                      Destinatario:
                    </span>
                    <span className="block text-xs sm:text-sm font-semibold text-stone-800 truncate">
                      {email || "Sin correo especificado"}
                    </span>
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingEmail(!isEditingEmail)}
                className="text-xs shrink-0 text-[#1d3d29] hover:bg-stone-200/50 rounded-lg px-2.5 h-8"
              >
                {isEditingEmail ? (
                  "Listo"
                ) : (
                  <>
                    <Edit3 size={13} className="mr-1" /> Cambiar
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs sm:text-sm text-red-800 flex items-start gap-2.5"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <p className="font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Estado de éxito */}
          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-6 text-center text-emerald-950 space-y-2">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 animate-bounce" />
              <h3 className="text-lg font-bold">¡Cuenta verificada exitosamente!</h3>
              <p className="text-xs sm:text-sm text-emerald-800">
                Iniciando sesión de forma segura y redirigiéndote a la comunidad de Andamiarte...
              </p>
            </div>
          ) : (
            <form
              className="space-y-6"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void handleVerify();
              }}
            >
              {/* Input OTP segmentado */}
              <div className="flex flex-col items-center gap-2.5">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Código de 6 dígitos
                </label>
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
                    <InputOTPSlot index={0} className="w-10 h-12 text-lg font-bold text-[#1d3d29]" />
                    <InputOTPSlot index={1} className="w-10 h-12 text-lg font-bold text-[#1d3d29]" />
                    <InputOTPSlot index={2} className="w-10 h-12 text-lg font-bold text-[#1d3d29]" />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} className="w-10 h-12 text-lg font-bold text-[#1d3d29]" />
                    <InputOTPSlot index={4} className="w-10 h-12 text-lg font-bold text-[#1d3d29]" />
                    <InputOTPSlot index={5} className="w-10 h-12 text-lg font-bold text-[#1d3d29]" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {/* Botón principal */}
              <Button
                variant="cta"
                size="lg"
                type="submit"
                disabled={busy || otp.length !== 6}
                className="w-full h-11 text-sm font-bold bg-[#1d3d29] hover:bg-[#142b1d] text-white rounded-xl shadow-xs"
              >
                {busy && <RotateCw className="mr-2 h-4 w-4 animate-spin" />}
                {busy ? "Verificando código…" : "Verificar y Activar Cuenta"}
                {!busy && <ArrowRight className="ml-1.5" size={17} />}
              </Button>

              {/* Reenvío de código y ayuda */}
              <div className="flex flex-col items-center gap-2 text-center text-xs text-stone-500 pt-2 border-t border-stone-200/80">
                <p>¿No recibiste el correo? Revisá también en la carpeta de Spam o Correo no deseado.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={resendBusy || resendCooldown > 0}
                  onClick={handleResendCode}
                  className="rounded-xl text-xs font-semibold text-stone-700 hover:text-[#1d3d29] h-8 px-3"
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

          {/* Pie de navegación */}
          <footer className="pt-2 text-center text-xs text-stone-500">
            ¿Querés usar otra cuenta?{" "}
            <Link to="/login" className="font-semibold text-[#1d3d29] hover:underline">
              Volver al inicio de sesión
            </Link>
          </footer>
        </article>
      </div>
    </main>
  );
}
