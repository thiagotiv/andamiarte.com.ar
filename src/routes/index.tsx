import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  HeartHandshake,
  School,
  ShieldCheck,
  Sprout,
  Users,
  Check,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/network";
import classroom from "@/assets/classroom.jpg";
export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "La red profesional de inclusión escolar",
      "Conectamos acompañantes externos, centros educativos y familias para construir una inclusión escolar con más oportunidades.",
    ),
  component: Home,
});
function Home() {
  return (
    <main>
      <section className="hero">
        <img
          className="hero-photo"
          src={classroom}
          width={1920}
          height={1024}
          alt="Una acompañante y un niño aprendiendo juntos en el aula"
        />
        <div className="container-wide hero-inner">
          <div className="eyebrow">
            <Sprout size={15} /> Juntos, la inclusión es posible
          </div>
          <h1>
            La red profesional
            <br />
            de inclusión escolar<span className="text-cta">.</span>
          </h1>
          <p className="hero-copy">
            Conectamos acompañantes, centros educativos y familias.
            <br className="hidden lg:block" /> Dignificamos el rol de quienes acompañan y
            construimos oportunidades para una escuela más inclusiva.
          </p>
          <div className="hero-buttons">
            <Button variant="cta" size="lg" asChild>
              <Link to="/registro" search={{ role: "aie" }}>
                Soy acompañante <ArrowRight />
              </Link>
            </Button>
            <Button variant="cta" size="lg" asChild>
              <Link to="/registro" search={{ role: "familia" }}>
                Busco acompañamiento <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="hero-note">
            <ShieldCheck size={15} />
            Un espacio seguro. Conexiones con propósito.
          </div>
        </div>
        <div className="photo-label">
          <HeartHandshake size={28} />
          <div>
            <strong>Cada vínculo hace la diferencia</strong>
            <span className="text-muted-foreground">Acompañar también es transformar.</span>
          </div>
        </div>
      </section>
      <div className="values-bar">
        <div className="container-wide values-inner">
          <div className="value-item">
            <ShieldCheck />
            <div>
              <strong>Confianza en cada encuentro</strong>Perfiles profesionales y vínculos cuidados
            </div>
          </div>
          <div className="value-item">
            <Users />
            <div>
              <strong>Una comunidad que te sostiene</strong>Experiencias, recursos y aprendizaje
              compartido
            </div>
          </div>
          <div className="value-item">
            <Sprout />
            <div>
              <strong>Oportunidades con propósito</strong>El acompañamiento que cada escuela
              necesita
            </div>
          </div>
        </div>
      </div>
      <section className="container-wide section">
        <div className="section-top">
          <div>
            <div className="eyebrow">Un lugar para cada rol</div>
            <h2>Distintos caminos. Un mismo propósito.</h2>
            <p className="section-sub">
              La inclusión se construye en equipo. Encontrá tu lugar en nuestra red.
            </p>
          </div>
        </div>
        <div className="role-grid">
          {[
            {
              icon: BriefcaseBusiness,
              title: "Soy acompañante",
              text: "Dale visibilidad a tu experiencia, encontrá nuevas oportunidades y conectá con colegas que comparten tu vocación.",
              role: "aie",
              cta: "Quiero ser parte",
            },
            {
              icon: School,
              title: "Soy un centro educativo",
              text: "Encontrá profesionales para tu equipo y publicá búsquedas que impulsen una inclusión real en tu institución.",
              role: "centro",
              cta: "Sumar mi institución",
            },
            {
              icon: HeartHandshake,
              title: "Soy una familia",
              text: "Encontrá el acompañamiento que necesitás, con profesionales que entienden que cada trayectoria es única.",
              role: "familia",
              cta: "Encontrar acompañamiento",
            },
          ].map((r) => (
            <article className="role-card" key={r.role}>
              <div className="role-icon">
                <r.icon size={25} />
              </div>
              <h3>{r.title}</h3>
              <p>{r.text}</p>
              <Link to="/registro" search={{ role: r.role }}>
                {r.cta}
                <ArrowRight size={15} />
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="community-band">
        <div className="container-wide section community-invitation">
          <div>
            <div className="eyebrow">
              <BookOpen size={15} /> Nos encontramos para crecer
            </div>
            <h2>Tu experiencia puede ser el impulso que alguien más necesita.</h2>
            <p className="section-sub">
              Compartí pequeños logros, recursos y nuevas miradas en nuestra comunidad.
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/comunidad">
              Conocer la comunidad <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
