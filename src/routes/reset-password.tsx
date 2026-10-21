import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/network";
export const Route = createFileRoute("/reset-password")({
  head: () => pageHead("Recuperar contraseña", "Recuperá el acceso seguro a tu cuenta ACOMPAÑAME."),
  component: Reset,
});
function Reset() {
  const [recovery, setRecovery] = useState(false);
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setRecovery(new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery");
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = recovery
      ? await supabase.auth.updateUser({ password: value })
      : await supabase.auth.resetPasswordForEmail(value, {
          redirectTo: window.location.origin + "/reset-password",
        });
    setMessage(
      r.error
        ? r.error.message
        : recovery
          ? "Tu contraseña se actualizó. Ya podés ingresar."
          : "Revisá tu correo para recuperar tu contraseña.",
    );
    setBusy(false);
  }
  return (
    <main className="auth-page">
      <h1>{recovery ? "Nueva contraseña" : "Recuperá tu cuenta"}</h1>
      <form className="form-grid" onSubmit={submit}>
        <label>
          {recovery ? "Nueva contraseña" : "Correo electrónico"}
          <input
            required
            minLength={recovery ? 8 : undefined}
            type={recovery ? "password" : "email"}
            className="field"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
        <Button disabled={busy} type="submit">
          {recovery ? "Guardar contraseña" : "Enviar enlace"}
        </Button>
        {message && <p role="status">{message}</p>}
      </form>
    </main>
  );
}
