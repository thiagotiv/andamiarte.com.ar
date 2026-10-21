import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useState, type DragEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Users,
  Eye,
  CheckCircle2,
  XCircle,
  BriefcaseBusiness,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Avatar, Empty, RouteError } from "@/components/site-shell";
import { InteractiveCv } from "@/components/interactive-cv";
import { candidateBoardOptions, accountOptions, pageHead, updateApplicationStage } from "@/lib/network";
import { STAGES, type Stage } from "@/lib/application-status";
import { cardSkills } from "@/lib/professional-match";

export const Route = createFileRoute("/_authenticated/candidatos")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(candidateBoardOptions),
      context.queryClient.ensureQueryData(accountOptions),
    ]);
  },
  head: () =>
    pageHead(
      "Postulaciones Recibidas · Gestión de Candidatos",
      "Organizá y evaluá a los profesionales AIE postulados a tus búsquedas.",
    ),
  component: Board,
  errorComponent: RouteError,
  notFoundComponent: RouteError,
});

function Board() {
  const { data } = useSuspenseQuery(candidateBoardOptions);
  const { data: account } = useQuery(accountOptions);
  const qc = useQueryClient();
  const [jobId, setJobId] = useState(data.jobs[0]?.id ?? "");
  const [openId, setOpenId] = useState<string | null>(null);

  // Rol gate: AIEs should not view this panel
  if (account?.role === "aie") {
    return (
      <main className="page">
        <div className="surface p-8 rounded-2xl border border-border text-center max-w-xl mx-auto my-12 space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            <Users size={28} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground">
            Espacio exclusivo para Familias e Instituciones
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Este panel permite a los centros educativos y familias gestionar a los acompañantes que se postularon a sus anuncios.
            Para hacer seguimiento de tus propias postulaciones, ingresá a Mis Postulaciones.
          </p>
          <div className="pt-2">
            <Button asChild variant="cta">
              <Link to="/mis-postulaciones">
                Ir a Mis Postulaciones <ArrowRight className="ml-1.5" size={16} />
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const selectedJob = data.jobs.find((j) => j.id === jobId) || data.jobs[0];
  const activeJobId = selectedJob?.id ?? "";
  const apps = data.applications.filter((a) => a.job_id === activeJobId);
  const open = apps.find((a) => a.id === openId);

  async function update(id: string, patch: { stage?: Stage; seen_at?: string | null }) {
    try {
      const payload: { applicationId: string; stage?: string; seenAt?: string | null } = {
        applicationId: id,
      };
      if (patch.stage !== undefined) payload.stage = patch.stage;
      if (patch.seen_at !== undefined) payload.seenAt = patch.seen_at;

      await updateApplicationStage({
        data: payload,
      });
      await qc.invalidateQueries({ queryKey: ["candidate-board"] });
    } catch (err: any) {
      toast.error(err?.message || "No pudimos actualizar la postulación.");
    }
  }

  function openCard(a: (typeof apps)[number]) {
    setOpenId(a.id);
    if (!a.seen_at) {
      void update(a.id, { seen_at: new Date().toISOString() });
    }
  }

  function drop(e: DragEvent, stage: Stage) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) void update(id, { stage });
  }

  if (!data.jobs.length) {
    return (
      <main className="page">
        <div className="page-title">
          <div>
            <div className="eyebrow flex items-center gap-1.5">
              <BriefcaseBusiness size={15} /> Panel de Selección
            </div>
            <h1>Postulaciones Recibidas</h1>
            <p className="page-description">
              Acá vas a ver a los acompañantes que se postulen a tus búsquedas laborales activas.
            </p>
          </div>
        </div>
        <Empty
          title="Todavía no publicaste búsquedas laborales"
          description="Publicá una búsqueda de acompañamiento escolar para empezar a recibir postulaciones de AIEs certificados."
        />
        <div className="mt-6 text-center">
          <Button asChild variant="cta">
            <Link to="/publicar-busqueda">Publicar Búsqueda</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page-title">
        <div>
          <div className="eyebrow flex items-center gap-1.5">
            <Users size={15} /> Panel de Reclutamiento
          </div>
          <h1>Postulaciones Recibidas</h1>
          <p className="page-description">
            Gestioná a los candidatos de tus búsquedas. Evaluá sus perfiles interactivos y contactalos por chat directo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="ats-job-select" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Búsqueda:
          </label>
          <select
            id="ats-job-select"
            aria-label="Búsqueda laboral"
            className="field ats-job-select"
            value={activeJobId}
            onChange={(e) => setJobId(e.target.value)}
          >
            {data.jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} {!j.active ? "(Cerrada)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ats-board">
        {STAGES.map((col, ci) => {
          const items = apps.filter((a) => a.stage === col.id);
          return (
            <section
              key={col.id}
              className={`ats-column ats-${col.id}`}
              aria-label={col.label}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => drop(e, col.id)}
            >
              <header className="flex items-center justify-between pb-2 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  {col.id === "nuevo" && <Eye size={15} className="text-amber-600" />}
                  {col.id === "preseleccionado" && <CheckCircle2 size={15} className="text-primary" />}
                  {col.id === "descartado" && <XCircle size={15} className="text-muted-foreground" />}
                  {col.label}
                </h2>
                <span className="ats-count bg-background/80 px-2 py-0.5 rounded-full text-xs font-bold border border-border">
                  {items.length}
                </span>
              </header>

              <div className="space-y-3 mt-3">
                {items.map(
                  (a) =>
                    a.profiles && (
                      <article
                        key={a.id}
                        className="ats-card bg-card border border-border rounded-xl p-3 shadow-xs hover:shadow-md transition-shadow"
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", a.id)}
                      >
                        <button
                          type="button"
                          className="ats-card-main text-left w-full cursor-pointer flex gap-3 items-start"
                          onClick={() => openCard(a)}
                        >
                          <Avatar name={a.profiles.name} path={a.profiles.avatar_path} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong className="text-sm text-foreground truncate block">
                                {a.profiles.name}
                              </strong>
                              {!a.seen_at && (
                                <span className="ats-new bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                                  Nuevo
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{a.profiles.zone || "Zona no especificada"}</p>
                            <div className="tags mt-2">
                              {cardSkills(a.profiles.skills).map((s) => (
                                <span className="tag text-[10px]" key={s}>
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        </button>

                        <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-2"
                              onClick={() => openCard(a)}
                            >
                              Ver Perfil
                            </Button>
                            <Button
                              asChild
                              size="sm"
                              variant="ghost"
                              className="text-xs h-7 px-2 text-primary hover:text-primary"
                            >
                              <Link to="/mensajes" search={{ user: a.profiles.id, recipient: a.profiles.id }}>
                                <MessageCircle size={13} className="mr-1" />
                                Mensaje
                              </Link>
                            </Button>
                          </div>

                          <div className="ats-moves flex items-center">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              disabled={ci === 0}
                              aria-label="Mover a columna anterior"
                              onClick={() => update(a.id, { stage: STAGES[ci - 1]!.id })}
                            >
                              <ChevronLeft size={14} />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              disabled={ci === STAGES.length - 1}
                              aria-label="Mover a columna siguiente"
                              onClick={() => update(a.id, { stage: STAGES[ci + 1]!.id })}
                            >
                              <ChevronRight size={14} />
                            </Button>
                          </div>
                        </div>
                      </article>
                    ),
                )}
                {!items.length && <p className="meta ats-empty text-center py-6 text-xs text-muted-foreground">Sin postulantes en esta etapa</p>}
              </div>
            </section>
          );
        })}
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="ats-dialog max-w-2xl max-h-[85vh] overflow-y-auto">
          {open?.profiles && (
            <>
              <DialogTitle className="sr-only">CV interactivo de {open.profiles.name}</DialogTitle>
              <InteractiveCv
                profile={open.profiles}
                available={open.profiles.available}
                readOnly
                endorsements={data.endorsements[open.profiles.id] ?? {}}
                reviews={data.reviews.filter((r) => r.profile_id === open.profiles?.id)}
              />
              <div className="ats-dialog-actions pt-4 border-t border-border flex flex-wrap items-center justify-between gap-2 mt-4">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => {
                      void update(open.id, { stage: "preseleccionado" });
                      setOpenId(null);
                      toast.success(`Candidato ${open.profiles.name} preseleccionado`);
                    }}
                  >
                    <CheckCircle2 size={16} className="mr-1.5" />
                    Pre-seleccionar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      void update(open.id, { stage: "descartado" });
                      setOpenId(null);
                      toast.info(`Candidato ${open.profiles.name} descartado`);
                    }}
                  >
                    <XCircle size={16} className="mr-1.5" />
                    Descartar
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline">
                    <Link to="/profesional/$id" params={{ id: open.profiles.id }}>
                      <UserCheck size={16} className="mr-1.5" />
                      Ver Perfil Completo
                    </Link>
                  </Button>
                  <Button asChild variant="cta">
                    <Link to="/mensajes" search={{ user: open.profiles.id, recipient: open.profiles.id }}>
                      <MessageCircle size={16} className="mr-1.5" />
                      Enviar Mensaje
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
