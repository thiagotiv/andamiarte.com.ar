import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/file-dropzone";
import { SkillTags } from "@/components/skill-tags";
import { TimelineEditor, toTimeline, type TimelineItem } from "@/components/interactive-cv";
import { supabase } from "@/integrations/supabase/client";
import {
  BILLING_OPTIONS,
  INSTITUTION_KINDS,
  PEDAGOGICAL_SKILLS,
  SCHOOLING_TYPES,
  SHIFT_OPTIONS,
  composeFamilyNeeds,
  emptyFamilyNeeds,
  type AppRole,
  type FamilyNeedsForm,
} from "@/lib/onboarding";
import type { Tables, Database, Json } from "@/integrations/supabase/types";

export type AccountProfile = {
  profile: Tables<"profiles">;
  role: AppRole;
  familyNeeds: FamilyNeedsForm;
};

export function ProfileEditor({ account }: { account: AccountProfile }) {
  const p = account.profile;
  const qc = useQueryClient();
  const [name, setName] = useState(p.name);
  const [zone, setZone] = useState(p.zone);
  const [bio, setBio] = useState(p.bio);
  const [skills, setSkills] = useState(p.skills);
  const [available, setAvailable] = useState(p.available);
  const [billing, setBilling] = useState(p.billing);
  const [years, setYears] = useState(String(p.years_experience || ""));
  const [institutionKind, setInstitutionKind] = useState(p.institution_type);
  const [contact, setContact] = useState(p.contact);
  const [education, setEducation] = useState<TimelineItem[]>(toTimeline(p.education));
  const [experience, setExperience] = useState<TimelineItem[]>(toTimeline(p.experience));
  const [family, setFamily] = useState(account.familyNeeds ?? emptyFamilyNeeds());
  useEffect(() => {
    setName(p.name);
    setZone(p.zone);
    setBio(p.bio);
    setSkills(p.skills);
    setAvailable(p.available);
    setBilling(p.billing);
    setYears(String(p.years_experience || ""));
    setInstitutionKind(p.institution_type);
    setContact(p.contact);
    setEducation(toTimeline(p.education));
    setExperience(toTimeline(p.experience));
    setFamily(account.familyNeeds ?? emptyFamilyNeeds());
  }, [p, account.familyNeeds]);
  const save = useMutation({
    mutationFn: async () => {
      const experienceYears = Math.max(0, Math.min(60, Number.parseInt(years, 10) || 0));
      const profileUpdate: Database["public"]["Tables"]["profiles"]["Update"] = {
        name,
        zone,
        bio,
        available,
        ...(account.role === "aie"
          ? { skills, billing, education: education as unknown as Json, experience: experience as unknown as Json, years_experience: experienceYears }
          : {}),
        ...(account.role === "centro" ? { institution_type: institutionKind, contact } : {}),
      };
      const profile = await supabase.from("profiles").update(profileUpdate).eq("id", p.id);
      if (profile.error) throw profile.error;
      if (account.role === "familia") {
        const needs = await supabase.from("family_needs").upsert({
          user_id: p.id,
          child_age: family.child_age ? Number(family.child_age) : null,
          schooling: family.schooling,
          supports: family.supports,
          shifts: family.schedule,
          needs: composeFamilyNeeds(family),
        });
        if (needs.error) throw needs.error;
      }
    },
    onSuccess: async () => {
      toast.success("Tu perfil se guardó");
      await qc.invalidateQueries({ queryKey: ["account"] });
      await qc.invalidateQueries({ queryKey: ["network"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos guardar tu perfil");
    },
  });
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }
  return (
    <form className="form-grid profile-form no-print" onSubmit={onSubmit}>
      <FileDropzone userId={p.id} kind="avatar" currentPath={p.avatar_path} />
      {account.role === "aie" ? (
        <FileDropzone userId={p.id} kind="cv" currentPath={p.cv_path} />
      ) : null}
      <label>
        {account.role === "centro" ? "Nombre institucional" : "Nombre"}
        <input required className="field" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      {account.role === "centro" ? (
        <label>
          Tipo de institución
          <select className="field" value={institutionKind} onChange={(e) => setInstitutionKind(e.target.value)}>
            <option value="">Elegí una opción</option>
            {INSTITUTION_KINDS.map((kind) => (
              <option key={kind}>{kind}</option>
            ))}
          </select>
        </label>
      ) : null}
      <label>
        Zona / ubicación
        <input className="field" placeholder="Ej. Palermo, CABA" value={zone} onChange={(e) => setZone(e.target.value)} />
      </label>
      {account.role === "centro" ? (
        <label>
          Contacto
          <input
            className="field"
            placeholder="Teléfono o correo institucional"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </label>
      ) : null}
      <label>
        {account.role === "centro" ? "Descripción" : "Sobre mí"}
        <textarea className="field" value={bio} onChange={(e) => setBio(e.target.value)} />
      </label>
      {account.role === "aie" ? (
        <>
          <label>
            Habilidades pedagógicas y terapéuticas
            <SkillTags value={skills} onChange={setSkills} suggestions={PEDAGOGICAL_SKILLS} />
          </label>
          <label>
            Situación de facturación (AFIP)
            <select className="field" value={billing} onChange={(e) => setBilling(e.target.value)}>
              <option value="">Sin especificar</option>
              {BILLING_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            Años de experiencia
            <input
              className="field"
              type="number"
              min={0}
              max={60}
              value={years}
              onChange={(e) => setYears(e.target.value)}
            />
          </label>
          <label className="availability-control">
            Disponible para propuestas
            <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
          </label>
          <TimelineEditor label="Formación académica" items={education} onChange={setEducation} />
          <TimelineEditor label="Experiencia en aula" items={experience} onChange={setExperience} />
        </>
      ) : null}
      {account.role === "familia" ? <FamilyNeedsFields value={family} onChange={setFamily} /> : null}
      <Button type="submit" disabled={save.isPending} variant="cta">
        <Save />
        {save.isPending ? "Guardando…" : "Guardar perfil"}
      </Button>
    </form>
  );
}

type FamilyField = keyof FamilyNeedsForm;

export function FamilyNeedsFields({
  value,
  onChange,
  include = ["child_age", "schooling", "supports", "schedule"],
}: {
  value: FamilyNeedsForm;
  onChange: (next: FamilyNeedsForm) => void;
  include?: FamilyField[];
}) {
  const show = (field: FamilyField) => include.includes(field);
  return (
    <fieldset className="family-needs-fields">
      <legend>Ficha pedagógica — privada</legend>
      {show("child_age") ? (
        <label>
          Edad del niño, niña o adolescente
          <input
            className="field"
            inputMode="numeric"
            placeholder="Ej. 8"
            value={value.child_age}
            onChange={(e) => onChange({ ...value, child_age: e.target.value })}
          />
        </label>
      ) : null}
      {show("schooling") ? (
        <label>
          Tipo de escolaridad
          <select className="field" value={value.schooling} onChange={(e) => onChange({ ...value, schooling: e.target.value })}>
            <option value="">Elegí una opción</option>
            {SCHOOLING_TYPES.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      ) : null}
      {show("supports") ? (
        <label>
          Diagnóstico / apoyos
          <textarea
            className="field"
            value={value.supports}
            onChange={(e) => onChange({ ...value, supports: e.target.value })}
            placeholder="Contá los apoyos que necesita, sin incluir información sensible innecesaria."
          />
        </label>
      ) : null}
      {show("schedule") ? (
        <label>
          Turnos
          <select className="field" value={value.schedule} onChange={(e) => onChange({ ...value, schedule: e.target.value })}>
            <option value="">Elegí una opción</option>
            {SHIFT_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      ) : null}
    </fieldset>
  );
}
