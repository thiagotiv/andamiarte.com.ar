import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  School,
  MapPin,
  ShieldCheck,
  MessageCircle,
  BriefcaseBusiness,
  Clock,
  Zap,
  Check,
  ArrowRight,
  Mail,
  HeartHandshake,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, Empty, RouteError } from "@/components/site-shell";
import { useSession } from "@/components/session";
import {
  institutionalProfileOptions,
  accountOptions,
  applicationOptions,
  pageHead,
  applyToJob,
} from "@/lib/network";

export const Route = createFileRoute("/centro/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(institutionalProfileOptions(params.id)),
  head: ({ loaderData }) => {
    const org = loaderData?.profile?.name || "Institución Educativa";
    return pageHead(
      `${org} · Perfil Institucional`,
      `Conocé la propuesta inclusiva, equipo y búsquedas activas de ${org} en Andamiarte.`,
    );
  },
  component: InstitutionalProfile,
  errorComponent: RouteError,
  notFoundComponent: RouteError,
});

function InstitutionalProfile() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(institutionalProfileOptions(id));
  const { user } = useSession();
  const { data: account } = useQuery({ ...accountOptions, enabled: !!user });
  const { data: applications } = useQuery({ ...applicationOptions, enabled: !!user });
  const [busy, setBusy] = useState("");
  const qc = useQueryClient();

  const profile = data.profile;

  if (!profile) {
    return (
      <main className="page">
        <Empty
          title="Institución no encontrada"
          description="Este perfil institucional no existe o no se encuentra disponible públicamente."
        />
        <div className="mt-6 text-center">
          <Button variant="outline" asChild>
            <Link to="/busquedas">
              <ArrowLeft /> Volver a búsquedas laborales
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  async function apply(jobId: string) {
    if (!user) return;
    setBusy(jobId);
    try {
      await applyToJob({ data: { jobId } });
      toast.success("Enviamos tu CV interactivo a la institución", {
        description: "Podés hacer el seguimiento en Mis postulaciones.",
      });
      await qc.invalidateQueries({ queryKey: ["my-applications"] });
      await qc.invalidateQueries({ queryKey: ["applications"] });
    } catch (err: any) {
      toast.error(err?.message || "No se pudo registrar la postulación");
    } finally {
      setBusy("");
    }
  }

  const institutionType = profile.institution_type || "Centro Educativo / Institución";
  const activeJobs = data.jobs;

  return (
    <main className="page">
      <div className="mb-4 no-print">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link to="/busquedas">
            <ArrowLeft size={16} /> Volver a búsquedas laborales
          </Link>
        </Button>
      </div>

      {/* Cabecera institucional */}
      <section className="surface p-6 sm:p-8 rounded-xl border border-border shadow-sm mb-8" aria-label="Cabecera institucional">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="shrink-0 flex items-center justify-center">
              <Avatar name={profile.name || "Institución"} path={profile.avatar_path} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="eyebrow flex items-center gap-1.5 text-primary">
                  <School size={15} /> {institutionType}
                </span>
                {profile.verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    <ShieldCheck size={14} /> Institución Verificada
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {profile.name || "Institución Educativa"}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                {profile.zone && (
                  <span className="flex items-center gap-1">
                    <MapPin size={15} /> {profile.zone}
                  </span>
                )}
                {profile.contact && (
                  <span className="flex items-center gap-1">
                    <Mail size={15} /> {profile.contact}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button asChild variant="cta" className="w-full sm:w-auto">
              <Link to={user ? "/mensajes" : "/auth"} search={user ? { recipient: profile.id } : {}}>
                <MessageCircle size={16} /> Contactar por Chat Privado
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Sección Filosofía y Enfoque Inclusivo */}
      <section className="surface p-6 sm:p-8 rounded-xl border border-border shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-3 text-primary">
          <HeartHandshake size={20} />
          <h2 className="text-xl font-bold text-foreground">Nuestra Filosofía Inclusiva y Enfoque</h2>
        </div>
        <p className="page-description text-base whitespace-pre-wrap leading-relaxed text-foreground/90">
          {profile.bio?.trim()
            ? profile.bio
            : "Somos una institución educativa comprometida con la integración y el respeto por los tiempos y singularidades de cada estudiante. Trabajamos en articulación continua con los Acompañantes de Integración Escolar (AIE), los equipos terapéuticos externos y las familias para garantizar trayectorias escolares significativas y participativas."}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
          <div className="p-3 rounded-lg bg-card border border-border/60">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
              Tipo de espacio
            </span>
            <span className="text-sm font-semibold text-foreground">{institutionType}</span>
          </div>
          <div className="p-3 rounded-lg bg-card border border-border/60">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
              Zona geográfica
            </span>
            <span className="text-sm font-semibold text-foreground">
              {profile.zone || "Zona no informada"}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-card border border-border/60">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
              Contacto directo
            </span>
            <span className="text-sm font-semibold text-foreground">
              {profile.contact || "Por mensajería interna"}
            </span>
          </div>
        </div>
      </section>

      {/* Sección Búsquedas Laborales Activas */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="eyebrow flex items-center gap-1.5">
              <BriefcaseBusiness size={15} /> Vacantes abiertas
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Búsquedas Laborales Activas en esta Institución
            </h2>
          </div>
          <span className="meta">{activeJobs.length} vacantes</span>
        </div>

        {activeJobs.length > 0 ? (
          <div className="jobs-list">
            {activeJobs.map((j: any) => (
              <article className="surface job-card" key={j.id}>
                <div>
                  <div className="eyebrow">{j.organization || profile.name}</div>
                  <h3>{j.title}</h3>
                  <div className="meta">
                    <span>
                      <MapPin size={14} /> {j.zone}
                    </span>
                    <span>
                      <Clock size={14} /> {j.schedule}
                    </span>
                  </div>
                  <p className="page-description mt-3">{j.description}</p>
                  <div className="tags">
                    {j.skills.map((s: string) => (
                      <span className="tag" key={s}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {!user ? (
                  <Button asChild variant="cta">
                    <Link to="/login">
                      Ingresar para Postulación Rápida <ArrowRight />
                    </Link>
                  </Button>
                ) : (
                  account?.role === "aie" && (
                    <Button
                      variant="cta"
                      disabled={
                        busy === j.id ||
                        applications?.some((a) => a.job_id === j.id && a.user_id === user.id)
                      }
                      onClick={() => apply(j.id)}
                    >
                      {applications?.some((a) => a.job_id === j.id && a.user_id === user.id)
                        ? "Postulación enviada"
                        : busy === j.id
                          ? "Enviando tu CV…"
                          : "Postulación Rápida"}
                      {applications?.some((a) => a.job_id === j.id && a.user_id === user.id) ? (
                        <Check />
                      ) : (
                        <Zap />
                      )}
                    </Button>
                  )
                )}
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="Sin búsquedas activas en este momento"
            description="Esta institución no tiene convocatorias laborales abiertas actualmente. Podés iniciar un chat privado para presentar tu perfil espontáneamente."
          />
        )}
      </section>
    </main>
  );
}
