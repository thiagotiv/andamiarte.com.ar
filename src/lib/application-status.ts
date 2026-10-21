export type Stage = "nuevo" | "preseleccionado" | "descartado";

export const STAGES: { id: Stage; label: string }[] = [
  { id: "nuevo", label: "Nuevos" },
  { id: "preseleccionado", label: "Pre-seleccionados" },
  { id: "descartado", label: "Descartados" },
];

/** Estado visible para el AIE, derivado de la etapa interna del ATS. */
export function applicantStatus(a: { stage: string; seen_at: string | null }) {
  if (a.stage === "preseleccionado") return { label: "En evaluación", tone: "progress" as const };
  if (a.stage === "descartado") return { label: "No seleccionada", tone: "closed" as const };
  if (a.seen_at) return { label: "Vista por la institución", tone: "seen" as const };
  return { label: "Enviada", tone: "sent" as const };
}
