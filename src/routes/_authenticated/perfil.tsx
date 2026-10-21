import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Save, ShieldCheck, MessageCircle, BriefcaseBusiness, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, RouteError } from "@/components/site-shell";
import { accountOptions, pageHead } from "@/lib/network";
import { supabase } from "@/integrations/supabase/client";
import { FileDropzone } from "@/components/file-dropzone";
import { INSTITUTION_TYPES } from "@/components/onboarding-wizard";
import { JobAlertsForm } from "@/components/job-alerts-form";
import { InteractiveCv, TimelineEditor, toTimeline } from "@/components/interactive-cv";
import { ProfileAnalytics } from "@/components/profile-analytics";
export const Route = createFileRoute("/_authenticated/perfil")({
  loader: ({ context }) => context.queryClient.ensureQueryData(accountOptions),
  head: () =>
    pageHead(
      "Mi perfil",
      "Administrá tu perfil profesional o familiar y tus datos de acompañamiento.",
    ),
  component: Profile,
  errorComponent: RouteError,
  notFoundComponent: RouteError,
});
function Profile() {
  const { data } = useSuspenseQuery(accountOptions);
  const p = data.profile;
  const qc = useQueryClient();
  const [name, setName] = useState(p?.name ?? "");
  const [zone, setZone] = useState(p?.zone ?? "");
  const [bio, setBio] = useState(p?.bio ?? "");
  const [skills, setSkills] = useState(p?.skills ? p.skills.join(", ") : "");
  const [available, setAvailable] = useState(p?.available ?? true);
  const [billing, setBilling] = useState(p?.billing ?? "");
  const [education, setEducation] = useState(toTimeline(p?.education));
  const [experience, setExperience] = useState(toTimeline(p?.experience));
  const [needs, setNeeds] = useState(data.needs);
  const [years, setYears] = useState(String(p?.years_experience ?? 0));
  const [institution, setInstitution] = useState(p?.institution_type ?? "");
  const [contact, setContact] = useState(p?.contact ?? "");
  const [age, setAge] = useState(data.family?.child_age == null ? "" : String(data.family.child_age));
  const [schooling, setSchooling] = useState(data.family?.schooling ?? "");
  const [supports, setSupports] = useState(data.family?.supports ?? "");
  const [shifts, setShifts] = useState(data.family?.shifts ?? "");
  const [phone, setPhone] = useState(p?.phone ?? "");
  const [dni, setDni] = useState(p?.dni ?? "");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(data.role !== 'aie');
  const [changingAvailability, setChangingAvailability] = useState(false);
  async function changeAvailability(value: boolean) {
    if (!p) return;
    setChangingAvailability(true);
    const { error } = await supabase.from('profiles').update({ available: value }).eq('id', p.id);
    if (error) toast.error('No pudimos cambiar tu disponibilidad.');
    else { setAvailable(value); await qc.invalidateQueries(); }
    setChangingAvailability(false);
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!p) return;
    setBusy(true);
    const r = await supabase
      .from("profiles")
      .update({
        name,
        zone,
        bio,
        skills: skills
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean),
        available,
        ...(data.role === "aie" ? { billing, education, experience, years_experience: Number(years) || 0, phone, dni } : {}),
        ...(data.role === "centro" ? { institution_type: institution, contact } : {}),
      })
      .eq("id", p.id);
    const n =
      data.role === "familia"
        ? await supabase.from("family_needs").upsert({ user_id: p.id, needs, child_age: age === "" ? null : Number(age), schooling, supports, shifts })
        : null;
    if (r.error || n?.error) toast.error(r.error?.message ?? n?.error?.message);
    else {
      toast.success("Tu perfil se guardó");
      await qc.invalidateQueries();
    }
    setBusy(false);
  }
  return (
    <main className="page">
      <div className="page-title no-print">
        <div>
          <div className="eyebrow">Mi espacio en la red</div>
          <h1>Mi perfil</h1>
          <p className="page-description">
            {data.role === "familia"
              ? "Tu perfil y las necesidades de tu familia son privados."
              : "Cada experiencia cuenta. Compartí la tuya."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/configuracion-privacidad">
              <ShieldCheck />
              Privacidad
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/mensajes">
              <MessageCircle />
              Mensajes
            </Link>
          </Button>
        </div>
      </div>
      {data.role === 'aie' && p && <>
        <InteractiveCv
          profile={p}
          available={available}
          onAvailability={changeAvailability}
          availabilityBusy={changingAvailability}
          endorsements={data.endorsements}
          reviews={data.reviews}
          recommendations={(data as any).recommendations ?? []}
          isOwner={true}
          currentUserId={p.id}
          currentUserRole={data.role}
        />
        <ProfileAnalytics className="mt-8 mb-6 no-print" />
        <JobAlertsForm userId={p.id} />
        <div className="no-print mt-6"><Button type="button" variant="outline" onClick={() => setEditing(!editing)}><Pencil />{editing ? 'Cerrar edición' : 'Editar CV'}</Button></div>
      </>}
      {editing && <form className="form-grid profile-form no-print" onSubmit={save}>
        <div className="flex items-center gap-4">
          <Avatar name={name} path={p?.avatar_path} />
          <div>
            <span className="tag">
              {data.role === "aie"
                ? "Acompañante externo"
                : data.role === "centro"
                  ? "Centro educativo"
                  : "Familia"}
            </span>
            {p?.verified && (
              <p className="meta mt-2">
                <ShieldCheck />
                Perfil verificado
              </p>
            )}
          </div>
        </div>
        <label>
          Nombre
          <input
            required
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Zona / ubicación
          <input
            className="field"
            placeholder="Ej. Palermo, CABA"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
          />
        </label>
        <label>
          Sobre mí
          <textarea className="field" value={bio} onChange={(e) => setBio(e.target.value)} />
        </label>
        {data.role === "aie" && (
          <>
            <label>
              Habilidades
              <input
                className="field"
                placeholder="Pictogramas, Primer Grado, Comunicación"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
              <small>Separadas por comas.</small>
            </label>
            <label>
              Situación de facturación (AFIP)
              <select className="field" value={billing} onChange={(e) => setBilling(e.target.value)}>
                <option value="">Sin especificar</option>
                <option>Monotributista</option>
                <option>Responsable inscripto</option>
                <option>En trámite</option>
              </select>
            </label>
            <label>
              Años de experiencia
              <input className="field" type="number" min={0} max={60} value={years} onChange={(e) => setYears(e.target.value)} />
            </label>
            <label>
              Teléfono de contacto
              <input className="field" placeholder="Ej. +54 9 11 1234-5678" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <small>Podés configurar su visibilidad en Privacidad.</small>
            </label>
            <label>
              DNI / Matrícula profesional
              <input className="field" placeholder="Ej. DNI / Matrícula" value={dni} onChange={(e) => setDni(e.target.value)} />
              <small>Podés configurar su visibilidad en Privacidad.</small>
            </label>
            <TimelineEditor label="Formación académica" items={education} onChange={setEducation} />
            <TimelineEditor label="Experiencia en aula" items={experience} onChange={setExperience} />
          </>
        )}
        {data.role === "centro" && (
          <>
            <label>
              Tipo de institución
              <select className="field" value={institution} onChange={(e) => setInstitution(e.target.value)}>
                <option value="">Sin especificar</option>
                {INSTITUTION_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label>
              Contacto
              <input className="field" value={contact} onChange={(e) => setContact(e.target.value)} />
            </label>
          </>
        )}
        {data.role === "familia" && (
          <>
            <label>
              Edad del niño/a
              <input className="field" type="number" min={0} max={25} value={age} onChange={(e) => setAge(e.target.value)} />
            </label>
            <label>
              Tipo de escolaridad
              <input className="field" value={schooling} onChange={(e) => setSchooling(e.target.value)} />
            </label>
            <label>
              Diagnóstico / apoyos
              <textarea className="field" value={supports} onChange={(e) => setSupports(e.target.value)} />
            </label>
            <label>
              Turnos
              <input className="field" value={shifts} onChange={(e) => setShifts(e.target.value)} />
            </label>
          </>
        )}
        {data.role === "familia" && (
          <label>
            Necesidades de acompañamiento — privado
            <textarea
              className="field"
              value={needs}
              onChange={(e) => setNeeds(e.target.value)}
              placeholder="Contanos las necesidades y el contexto escolar, sin incluir información sensible innecesaria."
            />
          </label>
        )}
        {p && <FileDropzone userId={p.id} kind="avatar" currentPath={p.avatar_path} />}
        {p && data.role === "aie" && <FileDropzone userId={p.id} kind="cv" currentPath={p.cv_path} />}
        <Button type="submit" disabled={busy} variant="cta">
          <Save />
          {busy ? "Guardando…" : "Guardar perfil"}
        </Button>
        {data.role === "centro" && (
          <Button asChild variant="outline">
            <Link to="/busquedas">
              <BriefcaseBusiness />
              Búsquedas activas
            </Link>
          </Button>
        )}
      </form>}
    </main>
  );
}
