import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Users,
  MessageCircle,
  Bookmark,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, Empty, RouteError } from "@/components/site-shell";
import { SaveProfileButton } from "@/components/save-profile-button";
import { pageHead, savedOptions, myConnectionsOptions } from "@/lib/network";
import { cardSkills } from "@/lib/professional-match";

export const Route = createFileRoute("/_authenticated/mi-red")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(myConnectionsOptions),
      context.queryClient.ensureQueryData(savedOptions),
    ]);
  },
  head: () =>
    pageHead(
      "Mi red",
      "Tu red activa de conversaciones y contactos en Andamiarte.",
    ),
  component: MyNetwork,
  errorComponent: RouteError,
});

function MyNetwork() {
  const { data: networkData } = useSuspenseQuery(myConnectionsOptions);
  const { data: savedData } = useSuspenseQuery(savedOptions);

  const activeContacts = networkData.accepted;

  const roleLabel = (r?: string) => {
    if (r === "centro") return "Centro educativo";
    if (r === "familia") return "Familia";
    return "Acompañante de inclusión";
  };

  return (
    <main className="page">
      <div className="eyebrow">
        <Users size={15} /> Ecosistema de Contactos Directos
      </div>
      <h1>Mi red</h1>
      <p className="page-description">
        Tu círculo activo de profesionales, centros y familias con quienes mantenés conversaciones y perfiles guardados.
      </p>

      <Tabs defaultValue="conversaciones" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto h-11 mb-8">
          <TabsTrigger value="conversaciones" className="flex items-center gap-2">
            <MessageCircle size={16} />
            <span>Chats Activos</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
              {activeContacts.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="guardados" className="flex items-center gap-2">
            <Bookmark size={16} />
            <span>Guardados</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
              {savedData.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CHATS ACTIVOS / RED CONVERSACIONAL */}
        <TabsContent value="conversaciones">
          <div className="mb-4 flex items-center justify-between">
            <p className="meta">
              {activeContacts.length} contacto{activeContacts.length === 1 ? "" : "s"} con conversación activa en MongoDB
            </p>
          </div>
          {activeContacts.length ? (
            <div className="directory-grid">
              {activeContacts.map((c) => {
                const p = c.partner;
                return (
                  <article className="surface person-card" key={c.id}>
                    <Avatar name={p.name} path={p.avatar_path} />
                    <h3 className="text-lg font-semibold">{p.name || "Contacto de la red"}</h3>
                    <div className="flex flex-wrap gap-1 justify-center mt-1">
                      <span className="tag text-xs">{roleLabel(p.role)}</span>
                      {p.verified && (
                        <span className="meta text-xs flex items-center gap-1 text-primary">
                          <ShieldCheck size={14} /> Verificado
                        </span>
                      )}
                    </div>
                    <p className="meta justify-center mt-2">
                      <MapPin size={14} />
                      {p.zone || "Zona sin especificar"}
                    </p>
                    {p.role === "aie" && (
                      <p className={`availability ${p.available ? "" : "text-muted-foreground"}`}>
                        {p.available ? "Disponible para propuestas" : "No disponible"}
                      </p>
                    )}
                    {p.skills && p.skills.length > 0 && (
                      <div className="tags">
                        {cardSkills(p.skills).map((s) => (
                          <span className="tag" key={s}>
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    <Button asChild className="w-full">
                      <Link to="/mensajes" search={{ user: p.id, recipient: p.id }}>
                        <MessageCircle size={16} />
                        Abrir chat privado
                      </Link>
                    </Button>
                    {p.role === "aie" && (
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/profesional/$id" params={{ id: p.id }}>
                          Ver CV interactivo
                        </Link>
                      </Button>
                    )}
                    {p.role === "centro" && (
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/centro/$id" params={{ id: p.id }}>
                          Ver institución
                        </Link>
                      </Button>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6">
              <Empty
                title="Aún no tenés conversaciones abiertas en tu red"
                description="Iniciá un chat privado con profesionales, familias o centros desde el Directorio o el Feed de Comunidad para que formen parte de tu red activa."
              />
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild variant="cta">
                  <Link to="/profesionales">
                    <Compass size={16} /> Explorar Directorio
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/comunidad">
                    Ir al Feed de Comunidad <ArrowRight size={16} />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: PERFILES GUARDADOS */}
        <TabsContent value="guardados">
          <div className="mb-4 flex items-center justify-between">
            <p className="meta">{savedData.length} perfiles guardados como favoritos</p>
          </div>
          {savedData.length ? (
            <div className="directory-grid">
              {savedData.map((p: any) => (
                <article className="surface person-card" key={p.id}>
                  <Avatar name={p.name} path={p.avatar_path} />
                  <h3 className="text-lg font-semibold">{p.name || "Profesional de la red"}</h3>
                  {p.verified && (
                    <p className="meta justify-center mt-2">
                      <ShieldCheck /> Perfil verificado
                    </p>
                  )}
                  <p className="meta justify-center mt-3">
                    <MapPin />
                    {p.zone || "Zona sin especificar"}
                  </p>
                  <p className={`availability ${p.available ? "" : "text-muted-foreground"}`}>
                    {p.available ? "Disponible" : "No disponible"}
                  </p>
                  <div className="tags">
                    {cardSkills(p.skills).map((s) => (
                      <span className="tag" key={s}>
                        {s}
                      </span>
                    ))}
                  </div>
                  <Button asChild className="w-full">
                    <Link to="/mensajes" search={{ user: p.id, recipient: p.id }}>
                      <MessageCircle /> Abrir chat privado
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full">
                    <Link to="/profesional/$id" params={{ id: p.id }}>
                      Ver CV interactivo
                    </Link>
                  </Button>
                  <SaveProfileButton profileId={p.id} className="w-full" />
                </article>
              ))}
            </div>
          ) : (
            <Empty
              title="Tu lista de guardados está vacía"
              description="Guardá perfiles desde el Directorio de profesionales para armar tu base de talentos favoritos."
            />
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
