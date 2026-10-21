export type AppRole = "aie" | "centro" | "familia";

export type FamilyNeedsForm = {
  child_age: string;
  schooling: string;
  supports: string;
  schedule: string;
};

export type ProfileBase = {
  name: string;
  zone: string;
  bio: string;
  billing: string;
  skills: string[];
  experience_years: number;
  institution_kind: string;
  contact: string;
};

export const PEDAGOGICAL_SKILLS = [
  "Pictogramas",
  "Adaptaciones pedagógicas",
  "Comunicación aumentativa",
  "LSA",
  "ABA",
  "Apoyo terapéutico",
  "Integración escolar",
  "Regulación emocional",
] as const;

export const BILLING_OPTIONS = ["Monotributista", "Responsable inscripto", "En trámite"] as const;

export const INSTITUTION_KINDS = ["Escuela", "Centro de Día", "Equipo Terapéutico"] as const;

export const SCHOOLING_TYPES = [
  "Nivel Inicial",
  "Nivel Primario",
  "Nivel Secundario",
  "Educación especial",
  "Homeschooling",
] as const;

export const SHIFT_OPTIONS = ["Turno mañana", "Turno tarde", "Jornada completa", "Flexible"] as const;

export function emptyFamilyNeeds(): FamilyNeedsForm {
  return { child_age: "", schooling: "", supports: "", schedule: "" };
}

export function composeFamilyNeeds(form: FamilyNeedsForm): string {
  return [
    form.child_age.trim() && `Edad: ${form.child_age.trim()}`,
    form.schooling.trim() && `Escolaridad: ${form.schooling.trim()}`,
    form.supports.trim() && `Apoyos: ${form.supports.trim()}`,
    form.schedule.trim() && `Turnos: ${form.schedule.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function isProfileBaseComplete(
  role: AppRole | undefined,
  profile: ProfileBase | null | undefined,
  family: FamilyNeedsForm,
): boolean {
  if (!role || !profile) return false;
  if (!profile.name.trim() || !profile.zone.trim()) return false;
  if (role === "aie") {
    return Boolean(profile.bio.trim() && profile.billing.trim() && profile.skills.length);
  }
  if (role === "centro") {
    return Boolean(profile.institution_kind.trim() && profile.bio.trim() && profile.contact.trim());
  }
  return Boolean(family.child_age.trim() && family.schooling.trim() && family.schedule.trim());
}

export function onboardingSteps(role: AppRole): { id: string; title: string }[] {
  if (role === "aie") {
    return [
      { id: "presentacion", title: "Presentación" },
      { id: "fiscal", title: "Situación profesional" },
      { id: "habilidades", title: "Habilidades" },
      { id: "archivos", title: "Foto y CV" },
    ];
  }
  if (role === "centro") {
    return [
      { id: "institucion", title: "Institución" },
      { id: "contacto", title: "Zona y contacto" },
      { id: "descripcion", title: "Descripción" },
      { id: "archivos", title: "Logo o foto" },
    ];
  }
  return [
    { id: "familia", title: "Tu familia" },
    { id: "escolaridad", title: "Escolaridad" },
    { id: "apoyos", title: "Apoyos y turnos" },
    { id: "archivos", title: "Foto de perfil" },
  ];
}
