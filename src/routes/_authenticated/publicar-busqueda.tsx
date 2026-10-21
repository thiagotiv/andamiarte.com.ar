import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, BriefcaseBusiness, Sparkles, School, Heart, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RouteError } from "@/components/site-shell";
import { accountOptions, pageHead, publishJob } from "@/lib/network";

export const Route = createFileRoute("/_authenticated/publicar-busqueda")({
  loader: ({ context }) => context.queryClient.ensureQueryData(accountOptions),
  head: () =>
    pageHead(
      "Buscar Acompañante · Publicar Búsqueda",
      "Publicá una oportunidad de acompañamiento escolar para tu centro educativo o familia.",
    ),
  component: PublishJob,
  errorComponent: RouteError,
  notFoundComponent: RouteError,
});

function PublishJob() {
  const { data } = useSuspenseQuery(accountOptions);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!data.profile) return;
    setBusy(true);

    const f = new FormData(e.currentTarget);
    const title = String(f.get("title") || "").trim();
    const zone = String(f.get("zone") || "").trim();
    const schedule = String(f.get("schedule") || "").trim();
    const skillsRaw = String(f.get("skills") || "");
    const skills = skillsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const patientContext = String(f.get("patientContext") || "").trim();
    const description = String(f.get("description") || "").trim();

    try {
      await publishJob({
        data: {
          title,
          zone,
          schedule,
          skills,
          patientContext: patientContext || null,
          description,
        },
      });

      await qc.invalidateQueries({ queryKey: ["network"] });
      await qc.invalidateQueries({ queryKey: ["candidate-board"] });
      toast.success("Tu búsqueda ya está publicada en la red");
      await navigate({ to: "/candidatos" });
    } catch (err: any) {
      toast.error(err?.message || "No se pudo publicar la búsqueda");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <div className="page-title">
        <div>
          <div className="eyebrow flex items-center gap-1.5">
            {data.role === "familia" ? <Heart size={16} /> : <School size={16} />}
            {data.role === "familia" ? "Búsqueda Familiar" : "Búsqueda Institucional"}
          </div>
          <h1>Buscar Acompañante</h1>
          <p className="page-description">
            Publicá una oportunidad laboral para conectar con Acompañantes de Inclusión Escolar (AIE) certificados.
          </p>
        </div>
      </div>

      {data.role === "aie" ? (
        <div className="surface p-8 rounded-2xl border border-border text-center max-w-xl mx-auto my-12 space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            <BriefcaseBusiness size={28} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground">
            Espacio exclusivo para Familias e Instituciones
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Como profesional AIE, podés explorar todas las ofertas disponibles y postularte con tu CV interactivo directamente desde el tablón de búsquedas laborales.
          </p>
          <div className="pt-2">
            <Button asChild variant="cta">
              <Link to="/busquedas">
                Ir a Búsquedas Laborales <ArrowRight className="ml-1.5" size={16} />
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl">
          <form className="form-grid profile-form mt-4" onSubmit={submit}>
            <label>
              Título del puesto
              <input
                className="field"
                name="title"
                required
                placeholder="Ej. Acompañante para alumno en 2° grado de primaria"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label>
                Ubicación / Zona
                <input
                  className="field"
                  name="zone"
                  required
                  placeholder="Ej. Belgrano, CABA"
                />
              </label>

              <label>
                Turno y Horario
                <select className="field" name="schedule" defaultValue="Turno mañana (08:00 a 12:00)">
                  <option value="Turno mañana (08:00 a 12:00)">Turno mañana (08:00 a 12:00)</option>
                  <option value="Turno tarde (13:00 a 17:00)">Turno tarde (13:00 a 17:00)</option>
                  <option value="Jornada completa">Jornada completa</option>
                  <option value="Horario a convenir">Horario a convenir</option>
                </select>
              </label>
            </div>

            <label>
              Requisitos y herramientas valoradas (separadas por comas)
              <input
                className="field"
                name="skills"
                placeholder="Ej. Pictogramas, TEACCH, Reducción de sobrecarga sensorial, Primer ciclo"
              />
            </label>

            <label>
              Contexto del alumno/a o paciente
              <textarea
                className="field"
                name="patientContext"
                rows={3}
                placeholder="Describí brevemente las necesidades de apoyo del estudiante (ej. Niño de 7 años, requiere anticipación visual y mediación en el recreo). Por privacidad y seguridad, NO incluyas apellidos, DNI ni datos sensibles."
              />
              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ShieldCheck size={14} className="text-primary" /> Los datos personales están protegidos por nuestras políticas de privacidad.
              </span>
            </label>

            <label>
              Descripción de la oportunidad y condiciones
              <textarea
                className="field"
                name="description"
                required
                rows={4}
                placeholder="Contanos sobre las condiciones de la propuesta, dinámica con el equipo docente, obra social o modalidad de contratación."
              />
            </label>

            <div className="pt-2">
              <Button type="submit" disabled={busy} variant="cta">
                <Plus />
                {busy ? "Publicando en la red…" : "Publicar Búsqueda Laboral"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
