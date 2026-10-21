import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  TrendingUp,
  Eye,
  Search,
  BriefcaseBusiness,
  Building2,
  Users,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { analyticsOptions } from "@/lib/network";

export function ProfileAnalytics({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  const { data: analytics, isLoading } = useQuery(analyticsOptions);

  if (isLoading || !analytics) {
    return (
      <div className={`surface p-6 rounded-2xl animate-pulse space-y-4 ${className}`}>
        <div className="h-5 bg-muted rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-muted/60 rounded-xl" />
          <div className="h-32 bg-muted/60 rounded-xl" />
          <div className="h-32 bg-muted/60 rounded-xl" />
        </div>
      </div>
    );
  }

  const { views, searches, atsFunnel } = analytics;

  if (compact) {
    return (
      <div className={`surface p-4 rounded-xl space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <TrendingUp size={16} className="text-primary" />
            Tus estadísticas
          </h4>
          <span className="text-xs text-primary font-bold">
            +{views.variationPercent}%
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/50">
            <span className="text-xl font-bold block">{views.totalLast7Days}</span>
            <span className="text-[11px] text-muted-foreground">Vistas al perfil</span>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <span className="text-xl font-bold block">{searches.totalAppearances}</span>
            <span className="text-[11px] text-muted-foreground">Búsquedas</span>
          </div>
        </div>
        <div className="pt-1 border-t border-border/60">
          <p className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Tasa de lectura ATS</span>
            <strong className="text-foreground">{atsFunnel.seenRate}%</strong>
          </p>
        </div>
        <Link
          to="/perfil"
          className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline pt-1 block text-center"
        >
          Ver panel completo de analíticas <ArrowRight size={12} className="inline" />
        </Link>
      </div>
    );
  }

  return (
    <section className={`surface p-6 rounded-2xl space-y-6 ${className}`} aria-label="Estadísticas de perfil">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="eyebrow flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            <TrendingUp size={14} className="text-primary" />
            Solo para ti · Métricas y rendimiento
          </div>
          <h2 className="text-xl font-bold mt-1">Tu alcance e impacto en la red</h2>
          <p className="text-sm text-muted-foreground">
            Datos consolidados de visitas, visibilidad en el directorio y conversión de postulaciones.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* KPI 1: Vistas al Perfil */}
        <div className="p-4 rounded-xl border border-border/80 bg-card/60 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <Eye size={15} className="text-primary" />
                Vistas al perfil
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                +{views.variationPercent}% esta semana
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-foreground tracking-tight">
                {views.totalLast7Days}
              </span>
              <span className="text-xs text-muted-foreground ml-2">en los últimos 7 días</span>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 space-y-1.5 text-xs">
              <p className="font-semibold text-foreground">Desglose de visitantes:</p>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5"><Building2 size={13} className="text-primary" /> Centros educativos</span>
                <strong>{views.breakdown.centros}</strong>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5"><Users size={13} className="text-cta" /> Familias</span>
                <strong>{views.breakdown.familias}</strong>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5"><GraduationCap size={13} /> Colegas AIE</span>
                <strong>{views.breakdown.colegas}</strong>
              </div>
            </div>
          </div>

          {views.recentViewers.length > 0 && (
            <div className="pt-2 border-t border-border/40 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1 flex items-center gap-1">
                <Clock size={12} /> Visitas recientes:
              </p>
              <ul className="space-y-1">
                {views.recentViewers.slice(0, 2).map((rv) => (
                  <li key={rv.id} className="truncate">
                    • <strong>{rv.name}</strong> <span className="opacity-75">({rv.timeAgo})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* KPI 2: Apariciones en Búsquedas */}
        <div className="p-4 rounded-xl border border-border/80 bg-card/60 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <Search size={15} className="text-cta" />
                Apariciones en directorio
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                Directorio
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-foreground tracking-tight">
                {searches.totalAppearances}
              </span>
              <span className="text-xs text-muted-foreground ml-2">búsquedas</span>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60">
              <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                <Sparkles size={13} className="text-cta" />
                Etiquetas más encontradas:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {searches.topTags.map((t) => (
                  <span
                    key={t.tag}
                    className="tag tag-sm text-xs bg-muted/80 text-foreground flex items-center gap-1 font-medium"
                  >
                    <span>{t.tag}</span>
                    <strong className="text-primary text-[10px]">({t.count})</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-muted/40 text-[11px] text-muted-foreground">
            💡 Mantener actualizada tu zona y habilidades aumenta hasta un <strong>40%</strong> tus apariciones en búsquedas institucionales.
          </div>
        </div>

        {/* KPI 3: Embudo ATS de Postulaciones */}
        <div className="p-4 rounded-xl border border-border/80 bg-card/60 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <BriefcaseBusiness size={15} className="text-primary" />
                Embudo ATS
              </span>
              <span className="text-xs font-bold text-foreground">
                {atsFunnel.totalApplied} postulaciones
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <div>
                <span className="text-3xl font-extrabold text-foreground tracking-tight">
                  {atsFunnel.seenRate}%
                </span>
                <span className="text-[11px] text-muted-foreground block">Tasa de apertura</span>
              </div>
              <div className="border-l border-border/60 pl-3">
                <span className="text-2xl font-bold text-primary tracking-tight">
                  {atsFunnel.shortlistRate}%
                </span>
                <span className="text-[11px] text-muted-foreground block">En evaluación</span>
              </div>
            </div>

            {/* Funnel visual bars */}
            <div className="mt-4 pt-3 border-t border-border/60 space-y-2 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Enviadas</span>
                  <strong>{atsFunnel.totalApplied}</strong>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-muted-foreground/40 rounded-full w-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Vistas por la institución</span>
                  <strong>{atsFunnel.totalSeen}</strong>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(100, atsFunnel.seenRate)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Pre-seleccionadas / En evaluación</span>
                  <strong>{atsFunnel.totalShortlisted}</strong>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cta rounded-full transition-all"
                    style={{ width: `${Math.min(100, atsFunnel.shortlistRate)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/mis-postulaciones"
            className="text-xs font-semibold text-primary flex items-center justify-between hover:underline pt-2 border-t border-border/40"
          >
            <span>Ver mis postulaciones activas</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}
