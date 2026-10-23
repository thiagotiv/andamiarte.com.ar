import { useState, useEffect } from "react";
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

interface BannerSlide {
  id: number;
  image: string;
  alt: string;
}

const BANNER_SLIDES: BannerSlide[] = [
  { id: 1, image: "/banner-hero.png", alt: "Bienvenida a Andamiarte" },
  { id: 2, image: "/banner-2.png", alt: "Comunidad de acompañantes" },
  { id: 3, image: "/banner-3.png", alt: "Inclusión escolar en equipo" },
  { id: 4, image: "/banner-4.png", alt: "Red de apoyo y recursos educativos" },
];

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Red de Inclusión Escolar",
      "Conectamos acompañantes externos, centros educativos y familias para construir una inclusión escolar con más oportunidades.",
    ),
  component: Home,
});

function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Autoplay con temporizador cíclico de 5 segundos y pausa al hacer hover
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, currentSlide]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <main className="w-full overflow-x-hidden">
      {/* 1. Hero Carousel Panorámico Full Bleed con Indicadores Estilo Disney+ */}
      <section
        className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] max-w-none bg-[#fbf5ee] border-b border-border/30 overflow-hidden flex flex-col justify-center items-center pt-2 md:pt-4 pb-6 md:pb-8"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        aria-label="Carrusel de bienvenida e inclusión"
      >
        {/* Contenedor apilado para transición fade suave sin saltos de altura */}
        <div className="relative w-full max-w-7xl mx-auto grid grid-cols-1 grid-rows-1">
          {BANNER_SLIDES.map((slide, index) => (
            <div
              key={slide.id}
              className={`col-start-1 row-start-1 w-full flex items-center justify-center transition-opacity duration-700 ease-in-out ${
                index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <img
                src={slide.image}
                alt={slide.alt}
                className="w-full h-auto max-h-[380px] lg:max-h-[420px] object-contain block mx-auto drop-shadow-sm select-none"
                fetchPriority={index === 0 ? "high" : "low"}
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>

        {/* Indicadores de Paginación ("Pelotitas" / Dots estilo Disney+) */}
        <div
          className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/15 backdrop-blur-xs px-3.5 py-1.5 rounded-full shadow-sm"
          role="tablist"
          aria-label="Controles de navegación del carrusel"
        >
          {BANNER_SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 focus:outline-none ${
                index === currentSlide
                  ? "w-6 h-2.5 rounded-full bg-white shadow-md"
                  : "w-2.5 h-2.5 rounded-full bg-white/50 hover:bg-white/80 cursor-pointer"
              }`}
              aria-label={`Ir al slide ${index + 1}: ${slide.alt}`}
              aria-selected={index === currentSlide}
              role="tab"
            />
          ))}
        </div>
      </section>

      {/* 2. Tarjeta Interactiva CTA (Above the fold, solapada sutilmente con el banner) */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 -mt-4 md:-mt-6 relative z-20 pb-6 md:pb-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-xl backdrop-blur-sm">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="eyebrow inline-flex items-center gap-1.5 text-primary font-bold text-xs uppercase tracking-wider">
              <Sprout size={15} /> Juntos, la inclusión escolar es posible
            </div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
              Construyamos inclusión en equipo<span className="text-cta">.</span>
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground max-w-xl">
              Conectamos acompañantes de inclusión escolar (AIE), centros educativos y familias en una red segura y colaborativa.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
            <Button
              variant="cta"
              size="lg"
              asChild
              className="w-full sm:w-auto font-bold text-sm md:text-base px-7 py-6 shadow-md hover:shadow-xl transition-all"
            >
              <Link to="/registro">
                ¡COMENZAR AHORA! Unite a la comunidad <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="w-full sm:w-auto font-medium text-sm md:text-base px-6 py-6 hover:bg-muted/50 transition-colors"
            >
              <Link to="/comunidad">
                Conocer la comunidad
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 3. Franja de Valores (3 columnas limpias y consistentes) */}
      <div className="values-bar border-y border-border/60 bg-card">
        <div className="max-w-7xl mx-auto px-4 md:px-6 values-inner py-6 md:py-8">
          <div className="value-item flex items-center justify-center gap-3 text-center md:text-left">
            <ShieldCheck size={24} className="text-primary shrink-0" />
            <div>
              <strong className="block text-sm font-bold text-foreground">Confianza en cada encuentro</strong>
              <span className="text-xs text-muted-foreground">Perfiles profesionales y vínculos cuidados</span>
            </div>
          </div>
          <div className="value-item flex items-center justify-center gap-3 text-center md:text-left">
            <Users size={24} className="text-primary shrink-0" />
            <div>
              <strong className="block text-sm font-bold text-foreground">Una comunidad que te sostiene</strong>
              <span className="text-xs text-muted-foreground">Experiencias, recursos y aprendizaje compartido</span>
            </div>
          </div>
          <div className="value-item flex items-center justify-center gap-3 text-center md:text-left">
            <Sprout size={24} className="text-primary shrink-0" />
            <div>
              <strong className="block text-sm font-bold text-foreground">Oportunidades con propósito</strong>
              <span className="text-xs text-muted-foreground">El acompañamiento que cada escuela necesita</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Sección de Roles ("Distintos caminos. Un mismo propósito") */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="section-top mb-8 md:mb-10 text-center md:text-left">
          <div>
            <div className="eyebrow inline-flex items-center gap-1.5 text-primary font-bold text-xs uppercase tracking-wider mb-2">
              Un lugar para cada rol
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
              Distintos caminos. Un mismo propósito.
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mt-1.5">
              La inclusión se construye en equipo. Encontrá tu lugar en nuestra red.
            </p>
          </div>
        </div>

        <div className="role-grid grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <article
              className="role-card flex flex-col justify-between h-full rounded-2xl border border-border/80 bg-card p-6 md:p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 group"
              key={r.role}
            >
              <div>
                <div className="role-icon mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <r.icon size={24} />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-foreground mb-2.5">{r.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{r.text}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/50">
                <Link
                  to="/registro"
                  search={{ role: r.role }}
                  className="inline-flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-primary group-hover:text-cta transition-colors"
                >
                  {r.cta}
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 5. Invitación a la Comunidad (Contraste armonioso y espacioso) */}
      <section className="community-band border-y border-border/60 py-12 md:py-16 bg-secondary/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 community-invitation flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-2">
            <div className="eyebrow inline-flex items-center gap-1.5 text-primary font-bold text-xs uppercase tracking-wider">
              <BookOpen size={16} /> Nos encontramos para crecer
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight max-w-2xl">
              Tu experiencia puede ser el impulso que alguien más necesita.
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl">
              Compartí pequeños logros, recursos y nuevas miradas en nuestra comunidad colaborativa.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="font-bold text-sm md:text-base px-8 py-6 shadow-md hover:shadow-xl shrink-0 transition-all"
          >
            <Link to="/comunidad">
              Conocer la comunidad <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
