import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { accountOptions } from "@/lib/network";
import { FileDropzone } from "./file-dropzone";

export const SKILL_OPTIONS = ["Pictogramas", "Comunicación aumentativa", "Adaptaciones pedagógicas", "Lengua de señas", "Regulación emocional", "Integración sensorial", "Nivel inicial", "Nivel primario", "Nivel secundario", "TEA", "TDAH"];
export const INSTITUTION_TYPES = ["Escuela", "Centro de Día", "Equipo Terapéutico"];

export function OnboardingGate({ enabled }: { enabled: boolean }) {
  const { data } = useQuery({ ...accountOptions, enabled });
  if (!data?.profile || data.profile.onboarded) return null;
  return <OnboardingWizard key={data.profile.id} />;
}

function OnboardingWizard() {
  const qc = useQueryClient();
  const { data } = useQuery(accountOptions);
  const p = data!.profile!;
  const role = data!.role;
  const f = data!.family;
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [v, setV] = useState({
    name: p.name, zone: p.zone, bio: p.bio, billing: p.billing, years: p.years_experience,
    skills: p.skills, institution: p.institution_type, contact: p.contact,
    age: f?.child_age ?? "", schooling: f?.schooling ?? "", supports: f?.supports ?? "", shifts: f?.shifts ?? "", needs: f?.needs ?? "",
  });
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });
  const steps = role === "aie" ? ["Sobre vos", "Tu trabajo", "Foto y CV"] : role === "centro" ? ["Institución", "Contacto", "Logo"] : ["Tu familia", "Necesidades"];
  const last = step === steps.length - 1;

  async function finish() {
    setBusy(true);
    const r = await supabase.from("profiles").update({
      name: v.name, zone: v.zone, bio: v.bio, onboarded: true,
      ...(role === "aie" ? { billing: v.billing, years_experience: Number(v.years) || 0, skills: v.skills } : {}),
      ...(role === "centro" ? { institution_type: v.institution, contact: v.contact } : {}),
    }).eq("id", p.id);
    const n = role === "familia" ? await supabase.from("family_needs").upsert({
      user_id: p.id, needs: v.needs, child_age: v.age === "" ? null : Number(v.age), schooling: v.schooling, supports: v.supports, shifts: v.shifts,
    }) : null;
    setBusy(false);
    if (r.error || n?.error) { toast.error("No pudimos guardar tus datos. Revisalos e intentá de nuevo."); return; }
    toast.success("¡Listo! Tu perfil quedó armado.");
    await qc.invalidateQueries();
  }

  return (
    <Dialog open>
      <DialogContent className="onboarding" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <div className="eyebrow"><Sparkles /> Paso {step + 1} de {steps.length} · {steps[step]}</div>
        <DialogTitle>Armemos tu perfil</DialogTitle>
        <DialogDescription>Podés cambiar todo después desde Mi perfil.</DialogDescription>
        <Progress value={((step + 1) / steps.length) * 100} />
        <div className="form-grid">
          {role === "aie" && step === 0 && <>
            <label>Nombre<input className="field" value={v.name} onChange={set("name")} /></label>
            <label>Zona geográfica<input className="field" placeholder="Ej. Palermo, CABA" value={v.zone} onChange={set("zone")} /></label>
            <label>Biografía<textarea className="field" value={v.bio} onChange={set("bio")} /></label>
          </>}
          {role === "aie" && step === 1 && <>
            <label>Condición fiscal<select className="field" value={v.billing} onChange={set("billing")}>
              <option value="">Sin especificar</option><option>Monotributista</option><option>Responsable inscripto</option><option>En trámite</option>
            </select></label>
            <label>Años de experiencia<input className="field" type="number" min={0} max={60} value={v.years} onChange={set("years")} /></label>
            <div className="alert-field">Habilidades pedagógicas y terapéuticas
              <div className="chip-picker">{SKILL_OPTIONS.map((s) => {
                const on = v.skills.includes(s);
                return <button type="button" key={s} aria-pressed={on} className={on ? "on" : ""}
                  onClick={() => setV({ ...v, skills: on ? v.skills.filter((x: string) => x !== s) : [...v.skills, s] })}>{on && <Check />}{s}</button>;
              })}</div>
            </div>
          </>}
          {role !== "familia" && last && <>
            <FileDropzone userId={p.id} kind="avatar" currentPath={p.avatar_path} />
            {role === "aie" && <FileDropzone userId={p.id} kind="cv" currentPath={p.cv_path} />}
          </>}
          {role === "centro" && step === 0 && <>
            <label>Nombre institucional<input className="field" value={v.name} onChange={set("name")} /></label>
            <label>Tipo de institución<select className="field" value={v.institution} onChange={set("institution")}>
              <option value="">Elegí una opción</option>{INSTITUTION_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select></label>
            <label>Zona<input className="field" value={v.zone} onChange={set("zone")} /></label>
          </>}
          {role === "centro" && step === 1 && <>
            <label>Contacto (mail o teléfono)<input className="field" value={v.contact} onChange={set("contact")} /></label>
            <label>Breve descripción<textarea className="field" value={v.bio} onChange={set("bio")} /></label>
          </>}
          {role === "familia" && step === 0 && <>
            <label>Tu nombre<input className="field" value={v.name} onChange={set("name")} /></label>
            <label>Zona<input className="field" value={v.zone} onChange={set("zone")} /></label>
            <label>Edad del niño/a<input className="field" type="number" min={0} max={25} value={v.age} onChange={set("age")} /></label>
          </>}
          {role === "familia" && step === 1 && <>
            <label>Tipo de escolaridad<select className="field" value={v.schooling} onChange={set("schooling")}>
              <option value="">Elegí una opción</option><option>Escuela común</option><option>Escuela especial</option><option>Modalidad mixta</option>
            </select></label>
            <label>Diagnóstico / apoyos que necesita<textarea className="field" value={v.supports} onChange={set("supports")} /></label>
            <label>Turnos<select className="field" value={v.shifts} onChange={set("shifts")}>
              <option value="">Elegí una opción</option><option>Mañana</option><option>Tarde</option><option>Jornada completa</option>
            </select></label>
            <label>Otras necesidades (privado)<textarea className="field" value={v.needs} onChange={set("needs")} /></label>
          </>}
        </div>
        <div className="onboarding-actions">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft /> Atrás</Button>
          {last ? <Button variant="cta" disabled={busy || !v.name.trim()} onClick={finish}><Check /> {busy ? "Guardando…" : "Terminar"}</Button>
            : <Button onClick={() => setStep(step + 1)}>Siguiente <ArrowRight /></Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
