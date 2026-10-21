import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MessageCircle, MapPin, ShieldCheck, Users, Search, ArrowRight, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, Empty, RouteError } from "@/components/site-shell";
import { useSession } from "@/components/session";
import { SaveProfileButton } from "@/components/save-profile-button";
import { ConnectButton } from "@/components/connect-button";
import { networkOptions, accountOptions, pageHead } from "@/lib/network";
import { cardSkills, matchesProfessional } from "@/lib/professional-match";
import { parsePrivacySettings, isPublicProfileVisible } from "@/lib/privacy";

export const Route = createFileRoute("/profesionales")({
  loader: ({ context }) => context.queryClient.ensureQueryData(networkOptions),
  head: () =>
    pageHead(
      "Directorio de profesionales · Acompañamiento Escolar",
      "Encontrá profesionales de acompañamiento escolar por zona, habilidades y disponibilidad.",
    ),
  component: Directory,
  errorComponent: RouteError,
  notFoundComponent: RouteError,
});

function Directory() {
  const { data } = useSuspenseQuery(networkOptions);
  const { user } = useSession();
  const { data: account } = useQuery({ ...accountOptions, enabled: !!user });
  const [query, setQuery] = useState("");
  const [zone, setZone] = useState("");
  const [availability, setAvailability] = useState("");
  const [tool, setTool] = useState("");

  // Role Gate: If active session is an AIE, show friendly gate redirecting to Job Board
  if (user && account?.role === "aie") {
    return (
      <main className="page">
        <div className="surface p-8 rounded-2xl border border-border text-center max-w-xl mx-auto my-12 space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            <Users size={28} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground">
            Directorio exclusivo para Familias y Centros Educativos
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Este directorio está diseñado para que las familias y centros educativos descubran y contacten a acompañantes para sus búsquedas de inclusión. Como profesional AIE, podés explorar las ofertas laborales activas y postularte con tu perfil interactivo.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Button asChild variant="cta">
              <Link to="/busquedas">
                Ir a Búsquedas Laborales <ArrowRight className="ml-1.5" size={16} />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/perfil">
                Ver mi perfil profesional
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const people = data.professionals.filter((p) => {
    const s = parsePrivacySettings(p.privacy_settings);
    const visible = isPublicProfileVisible(s, p.id === user?.id, p.public_profile);
    return (
      visible &&
      p.id !== user?.id &&
      matchesProfessional(p, { query, zone, availability, tool })
    );
  });

  return (
    <main className="page">
      <div className="eyebrow flex items-center gap-1.5">
        <Users size={15} /> Conexiones que hacen la diferencia
      </div>
      <h1>Directorio de profesionales</h1>
      <p className="page-description">
        Acompañantes de Inclusión Escolar (AIE), terapeutas y profesionales certificados para cada trayectoria educativa.
      </p>

      <div className="filters match-filters">
        <label className="match-search">
          <Search size={18} aria-hidden="true" />
          <input
            className="field"
            aria-label="Buscar profesionales"
            placeholder="Buscar por nombre o habilidad (ej. TEACCH, Pictogramas)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Zona profesional"
          className="field"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
        >
          <option value="">Todas las zonas</option>
          {[...new Set(data.professionals.map((p) => p.zone).filter(Boolean))].map((z) => (
            <option key={z}>{z}</option>
          ))}
        </select>
        <select
          aria-label="Disponibilidad"
          className="field"
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
        >
          <option value="">Toda disponibilidad</option>
          <option value="disponible">Disponibles</option>
          <option value="no-disponible">No disponibles</option>
        </select>
        <select
          aria-label="Herramientas"
          className="field"
          value={tool}
          onChange={(e) => setTool(e.target.value)}
        >
          <option value="">Todas las herramientas</option>
          {[...new Set(data.professionals.flatMap((p) => p.skills))].sort().map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <p className="meta mb-6">{people.length} profesionales AIE disponibles</p>

      <div className="directory-grid">
        {people.map((p) => (
          <article className="surface person-card" key={p.id}>
            <Avatar name={p.name} path={p.avatar_path} />
            <h3 className="text-lg font-semibold">{p.name || "Profesional de la red"}</h3>
            {p.verified && (
              <p className="meta justify-center mt-2 text-primary font-medium">
                <ShieldCheck size={16} />
                Perfil verificado
              </p>
            )}
            <p className="meta justify-center mt-3">
              <MapPin size={15} />
              {parsePrivacySettings(p.privacy_settings).show_exact_location && p.exact_location
                ? `${p.exact_location} (${p.zone})`
                : p.zone || "Zona sin especificar"}
            </p>
            <p className={`availability ${p.available ? "" : "text-muted-foreground"}`}>
              {p.available ? "Disponible para tomar casos" : "Actualmente no disponible"}
            </p>
            <div className="tags">
              {cardSkills(p.skills).map((s) => (
                <span className="tag" key={s}>
                  {s}
                </span>
              ))}
            </div>
            <ConnectButton
              targetUserId={p.id}
              targetName={p.name}
              className="w-full"
              label="Enviar Mensaje"
            />
            <Button asChild variant="outline" className="w-full">
              <Link to={user ? "/profesional/$id" : "/login"} params={{ id: p.id }}>
                <UserCheck size={16} className="mr-1.5" />
                Ver CV interactivo
              </Link>
            </Button>
            <SaveProfileButton profileId={p.id} className="w-full" />
          </article>
        ))}
      </div>

      {!people.length && (
        <Empty
          title={
            data.professionals.length
              ? "No encontramos coincidencias"
              : "Tu próximo vínculo está por llegar"
          }
          description={
            data.professionals.length
              ? "Probá con otra zona o herramienta pedagógica."
              : "Los profesionales de la red aparecerán acá cuando completen sus perfiles."
          }
        />
      )}
    </main>
  );
}
