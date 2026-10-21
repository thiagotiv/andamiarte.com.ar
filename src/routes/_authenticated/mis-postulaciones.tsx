import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { MapPin, Clock, Send, Eye, Hourglass, XCircle, ArrowRight, MessageCircle, BriefcaseBusiness, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, RouteError } from "@/components/site-shell";
import { myApplicationsOptions, accountOptions, pageHead } from "@/lib/network";
import { applicantStatus } from "@/lib/application-status";

export const Route = createFileRoute("/_authenticated/mis-postulaciones")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(myApplicationsOptions),
      context.queryClient.ensureQueryData(accountOptions),
    ]);
  },
  head: () =>
    pageHead(
      "Mis postulaciones · Acompañamiento Escolar",
      "Seguí en tiempo real el estado de tus postulaciones a búsquedas de inclusión.",
    ),
  component: MyApplications,
  errorComponent: RouteError,
  notFoundComponent: RouteError,
});

const icons = {
  sent: Send,
  seen: Eye,
  progress: Hourglass,
  closed: XCircle,
};

function MyApplications() {
  const { data } = useSuspenseQuery(myApplicationsOptions);
  const { data: account } = useQuery(accountOptions);

  if (account?.role && account.role !== "aie") {
    return (
      <main className="page">
        <div className="surface p-8 rounded-2xl border border-border text-center max-w-xl mx-auto my-12 space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            <BriefcaseBusiness size={28} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground">
            Espacio exclusivo para Acompañantes (AIE)
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Esta sección te permite hacer seguimiento a tus postulaciones laborales. Como familia o centro educativo, podés consultar y gestionar a los postulantes de tus anuncios en el panel de reclutamiento.
          </p>
          <div className="pt-2">
            <Button asChild variant="cta">
              <Link to="/candidatos">
                Ir a Postulaciones Recibidas <ArrowRight className="ml-1.5" size={16} />
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page-title">
        <div>
          <div className="eyebrow flex items-center gap-1.5">
            <Send size={15} /> Tu trayectoria laboral
          </div>
          <h1>Mis postulaciones</h1>
          <p className="page-description">
            Hacé seguimiento del estado de tus postulaciones. Sabrás cuando la institución o familia revise tu CV interactivo.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/busquedas">Explorar más búsquedas</Link>
        </Button>
      </div>

      {data.length ? (
        <ul className="jobs-list">
          {data.map((a) => {
            const s = applicantStatus(a);
            const Icon = icons[s.tone];
            return (
              <li className="surface application-row p-5 rounded-2xl border border-border" key={a.id}>
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="eyebrow flex items-center gap-1.5 text-primary">
                    <School size={14} />
                    {a.jobs?.organization || "Institución"}
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    {a.jobs?.title ?? "Búsqueda finalizada"}
                  </h3>
                  <div className="meta flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {a.jobs?.zone && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {a.jobs.zone}
                      </span>
                    )}
                    {a.jobs?.schedule && (
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {a.jobs.schedule}
                      </span>
                    )}
                  </div>

                  {a.jobs?.patient_context && (
                    <div className="p-2.5 bg-secondary/50 rounded-lg text-xs text-foreground/80 border border-border/40 mt-2">
                      <strong className="block text-foreground font-medium mb-0.5">Apoyos requeridos:</strong>
                      <span>{a.jobs.patient_context}</span>
                    </div>
                  )}

                  <p className="meta text-xs text-muted-foreground pt-1">
                    Postulado el{" "}
                    {new Date(a.created_at).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0">
                  <span className={`status-pill status-${s.tone}`}>
                    <Icon size={14} className="mr-1" />
                    {s.label}
                  </span>

                  {a.jobs?.id && (
                    <Button asChild variant="ghost" size="sm" className="text-xs text-primary hover:text-primary">
                      <Link to="/busquedas">
                        Ver anuncio
                      </Link>
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty
          title="Todavía no te postulaste a ninguna búsqueda"
          description="Usá la Postulación Rápida en el tablón de búsquedas laborales para enviar tu CV interactivo con un clic."
        />
      )}
    </main>
  );
}
