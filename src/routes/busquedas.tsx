import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  MapPin,
  Clock,
  Plus,
  ArrowRight,
  BriefcaseBusiness,
  Zap,
  Check,
  Users,
  School,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Empty, RouteError } from "@/components/site-shell";
import { useSession } from "@/components/session";
import {
  networkOptions,
  accountOptions,
  applicationOptions,
  pageHead,
  applyToJob,
  closeJob,
} from "@/lib/network";

export const Route = createFileRoute("/busquedas")({
  loader: ({ context }) => context.queryClient.ensureQueryData(networkOptions),
  head: () =>
    pageHead(
      "Búsquedas laborales · Acompañamiento Escolar",
      "Encontrá oportunidades de acompañamiento escolar y conectá con familias y centros educativos.",
    ),
  component: Jobs,
  errorComponent: RouteError,
  notFoundComponent: RouteError,
});

function Jobs() {
  const { data } = useSuspenseQuery(networkOptions);
  const { user } = useSession();
  const { data: account } = useQuery({ ...accountOptions, enabled: !!user });
  const { data: applications } = useQuery({ ...applicationOptions, enabled: !!user });
  const [query, setQuery] = useState("");
  const [zone, setZone] = useState("");
  const [schedule, setSchedule] = useState("");
  const [busy, setBusy] = useState("");
  const qc = useQueryClient();

  const jobs = data.jobs.filter(
    (j) =>
      (j.title + " " + j.organization + " " + j.skills.join(" "))
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!zone || j.zone === zone) &&
      (!schedule || j.schedule === schedule),
  );

  async function apply(id: string) {
    if (!user) return;
    setBusy(id);
    try {
      await applyToJob({ data: { jobId: id } });
      toast.success("Enviamos tu CV interactivo a la institución", {
        description: "Podés seguir el estado en Mis postulaciones.",
      });
      await qc.invalidateQueries({ queryKey: ["applications"] });
      await qc.invalidateQueries({ queryKey: ["my-applications"] });
      await qc.invalidateQueries({ queryKey: ["network"] });
    } catch (err: any) {
      toast.error(err?.message || "No se pudo registrar la postulación");
    } finally {
      setBusy("");
    }
  }

  async function handleCloseJob(id: string) {
    try {
      await closeJob({ data: { jobId: id } });
      toast.success("Búsqueda finalizada");
      await qc.invalidateQueries({ queryKey: ["network"] });
      await qc.invalidateQueries({ queryKey: ["candidate-board"] });
    } catch (err: any) {
      toast.error(err?.message || "No se pudo cerrar la búsqueda");
    }
  }

  return (
    <main className="page">
      <div className="page-title">
        <div>
          <div className="eyebrow flex items-center gap-1.5">
            <BriefcaseBusiness size={15} /> Oportunidades con propósito
          </div>
          <h1>Búsquedas laborales</h1>
          <p className="page-description">
            Oportunidades activas de inclusión y acompañamiento escolar en escuelas comunes y especiales.
          </p>
        </div>
        {(account?.role === "centro" || account?.role === "familia") && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/candidatos">
                <Users size={16} className="mr-1.5" />
                Postulaciones Recibidas
              </Link>
            </Button>
            <Button variant="cta" asChild>
              <Link to="/publicar-busqueda">
                <Plus size={16} className="mr-1.5" />
                Publicar Búsqueda
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="filters">
        <input
          aria-label="Buscar oportunidades"
          className="field"
          placeholder="Buscar por puesto o habilidad (ej. Primer ciclo, Pictogramas)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Filtrar por zona"
          className="field"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
        >
          <option value="">Todas las zonas</option>
          {[...new Set(data.jobs.map((j) => j.zone))].map((z) => (
            <option key={z}>{z}</option>
          ))}
        </select>
        <select
          aria-label="Filtrar por turno"
          className="field"
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
        >
          <option value="">Todos los turnos</option>
          {[...new Set(data.jobs.map((j) => j.schedule))].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <p className="meta mb-5">{jobs.length} búsquedas laborales activas</p>

      <div className="jobs-list">
        {jobs.map((j) => {
          const isOwner = j.owner_id === user?.id;
          const hasApplied = applications?.some((a) => a.job_id === j.id);

          return (
            <article className="surface job-card" key={j.id}>
              <div>
                <div className="eyebrow">
                  <Link
                    to="/centro/$id"
                    params={{ id: j.owner_id }}
                    className="hover:underline inline-flex items-center gap-1.5 text-primary font-medium"
                    title={`Ver perfil institucional de ${j.organization}`}
                  >
                    <School size={14} />
                    {j.organization}
                  </Link>
                </div>
                <h3>{j.title}</h3>
                <div className="meta">
                  <span>
                    <MapPin />
                    {j.zone}
                  </span>
                  <span>
                    <Clock />
                    {j.schedule}
                  </span>
                </div>

                {(j as any).patient_context && (
                  <div className="mt-3 p-3 bg-secondary/50 rounded-xl text-xs text-foreground/80 border border-border/50">
                    <strong className="text-foreground font-semibold block mb-1">
                      Contexto de apoyo:
                    </strong>
                    <span>{(j as any).patient_context}</span>
                  </div>
                )}

                <p className="page-description mt-3">{j.description}</p>

                <div className="tags">
                  {j.skills.map((s) => (
                    <span className="tag" key={s}>
                      {s}
                    </span>
                  ))}
                </div>

                {isOwner && (
                  <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center gap-3">
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/candidatos">
                        <Users size={14} className="mr-1.5" />
                        Ver candidatos recibidos
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleCloseJob(j.id)}
                    >
                      Cerrar búsqueda
                    </Button>
                  </div>
                )}
              </div>

              {!user ? (
                <Button asChild variant="cta">
                  <Link to="/login">
                    Ingresar para Postularme <ArrowRight className="ml-1.5" size={16} />
                  </Link>
                </Button>
              ) : account?.role === "aie" ? (
                <Button
                  variant={hasApplied ? "outline" : "cta"}
                  disabled={busy === j.id || hasApplied}
                  onClick={() => apply(j.id)}
                >
                  {hasApplied ? (
                    <>
                      <Check size={16} className="text-primary mr-1.5" />
                      Postulación enviada
                    </>
                  ) : busy === j.id ? (
                    "Enviando tu CV…"
                  ) : (
                    <>
                      <Zap size={16} className="mr-1.5" />
                      Postularse
                    </>
                  )}
                </Button>
              ) : isOwner ? (
                <span className="text-xs text-muted-foreground font-medium bg-secondary px-3 py-1.5 rounded-full self-start">
                  Tu publicación
                </span>
              ) : null}
            </article>
          );
        })}
      </div>

      {!jobs.length && (
        <Empty
          title={
            data.jobs.length
              ? "No encontramos coincidencias"
              : "Las próximas oportunidades empiezan acá"
          }
          description={
            data.jobs.length
              ? "Probá con otra zona o habilidad."
              : "Todavía no hay búsquedas publicadas. Los centros educativos y las familias pueden publicar su primera oportunidad."
          }
        />
      )}
    </main>
  );
}
