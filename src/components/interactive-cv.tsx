import { useState, useOptimistic, startTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  FileDown,
  GraduationCap,
  MapPin,
  Receipt,
  School,
  Sparkles,
  ThumbsUp,
  MessageSquareQuote,
  Plus,
  Trash2,
  Phone,
  FileText,
  Send,
  PenSquare,
  Loader2,
  Check,
} from "lucide-react";
import type { Json } from "@/integrations/supabase/types";
import { Avatar } from "./site-shell";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "./ui/dialog";
import {
  parsePrivacySettings,
  canViewPhone,
  canViewDni,
  canViewExactLocation,
} from "@/lib/privacy";
import { myConnectionsOptions } from "@/lib/network";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type TimelineItem = { period: string; title: string; place: string };

export function toTimeline(value: Json | null | undefined): TimelineItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? [{ period: String(v["period"] ?? ""), title: String(v["title"] ?? ""), place: String(v["place"] ?? "") }]
      : [],
  );
}

type Profile = {
  id: string;
  name: string;
  zone: string;
  billing: string;
  bio: string;
  avatar_path: string | null;
  verified: boolean;
  skills: string[];
  education: Json;
  experience: Json;
  phone?: string;
  dni?: string;
  exact_location?: string;
  privacy_settings?: Json;
};

export type RecommendationItem = {
  id: string;
  professional_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  relationship_context: string;
  content: string;
  highlighted_skills: string[];
  status: string;
  created_at: string;
};

export function InteractiveCv({
  profile,
  available,
  onAvailability,
  availabilityBusy,
  endorsements: initialEndorsements,
  mineEndorsements = [],
  reviews = [],
  recommendations: initialRecommendations = [],
  readOnly = false,
  isOwner = false,
  currentUserId,
  currentUserRole,
  onToggleEndorsement,
}: {
  profile: Profile;
  available: boolean;
  onAvailability?: ((v: boolean) => void) | undefined;
  availabilityBusy?: boolean | undefined;
  readOnly?: boolean | undefined;
  endorsements: Record<string, number>;
  mineEndorsements?: string[] | undefined;
  reviews?: { id: string; author_name: string; content: string }[] | undefined;
  recommendations?: RecommendationItem[] | undefined;
  isOwner?: boolean | undefined;
  currentUserId?: string | undefined;
  currentUserRole?: string | undefined;
  onToggleEndorsement?: ((skill: string) => Promise<void>) | undefined;
}) {
  const qc = useQueryClient();
  const education = toTimeline(profile.education);
  const experience = toTimeline(profile.experience);
  const privacy = parsePrivacySettings(profile.privacy_settings);
  const showPhone = canViewPhone(privacy, isOwner);
  const showDni = canViewDni(privacy, isOwner);
  const showLocation = canViewExactLocation(privacy, isOwner);

  // Optimistic endorsements state
  const [localEndorsements, setLocalEndorsements] = useState<Record<string, number>>(initialEndorsements);
  const [myVotedSkills, setMyVotedSkills] = useState<string[]>(mineEndorsements);
  const [endorseBusy, setEndorseBusy] = useState<string | null>(null);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>(initialRecommendations);

  // Modals state
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [writeModalOpen, setWriteModalOpen] = useState(false);

  // Request Recommendation Form
  const { data: networkData } = useQuery({
    ...myConnectionsOptions,
    enabled: isOwner,
  });
  const acceptedConnections = networkData?.accepted ?? [];
  const [selectedContactId, setSelectedContactId] = useState("");
  const [requestMessage, setRequestMessage] = useState(
    "Hola, ¿podrías dejarme una recomendación formal en mi CV interactivo de Andamiarte sobre el trabajo que realizamos juntos?",
  );
  const [requestingBusy, setRequestingBusy] = useState(false);

  // Write Recommendation Form
  const [writeContext, setWriteContext] = useState("");
  const [writeContent, setWriteContent] = useState("");
  const [writeHighlightedSkills, setWriteHighlightedSkills] = useState<string[]>([]);
  const [writingBusy, setWritingBusy] = useState(false);

  // Interactive +1 toggle handler with optimistic update
  async function handleToggleEndorsement(skill: string) {
    if (!currentUserId || isOwner) return;
    const isVoted = myVotedSkills.includes(skill);
    const prevCount = localEndorsements[skill] ?? 0;
    const newCount = isVoted ? Math.max(0, prevCount - 1) : prevCount + 1;

    // Optimistic state
    setMyVotedSkills(isVoted ? myVotedSkills.filter((s) => s !== skill) : [...myVotedSkills, skill]);
    setLocalEndorsements({ ...localEndorsements, [skill]: newCount });
    setEndorseBusy(skill);

    try {
      if (onToggleEndorsement) {
        await onToggleEndorsement(skill);
      } else {
        if (isVoted) {
          await supabase
            .from("skill_endorsements")
            .delete()
            .match({ profile_id: profile.id, endorser_id: currentUserId, skill });
        } else {
          await supabase
            .from("skill_endorsements")
            .insert({ profile_id: profile.id, endorser_id: currentUserId, skill });
        }
        await qc.invalidateQueries({ queryKey: ["cv", profile.id] });
      }
    } catch {
      // Rollback on error
      setMyVotedSkills(mineEndorsements);
      setLocalEndorsements(initialEndorsements);
      toast.error("No se pudo actualizar la validación.");
    } finally {
      setEndorseBusy(null);
    }
  }

  // Submit recommendation request (owner view)
  async function submitRequestRecommendation() {
    if (!currentUserId) return;
    setRequestingBusy(true);

    const contact = acceptedConnections.find((c) => c.partner.id === selectedContactId)?.partner;
    const recipientId = contact ? contact.id : selectedContactId;
    const contactName = contact ? contact.name : "Contacto";
    const contactRole = contact ? contact.role : "familia";

    if (!recipientId) {
      toast.error("Seleccioná un contacto de tu red.");
      setRequestingBusy(false);
      return;
    }

    // Insert pending request into recommendations table
    const { error: recError } = await supabase.from("recommendations").insert({
      professional_id: profile.id,
      author_id: recipientId,
      author_name: contactName,
      author_role: contactRole,
      relationship_context: "",
      content: requestMessage.trim(),
      highlighted_skills: [],
      status: "pending_request",
    });

    if (recError) {
      toast.error("No se pudo registrar la solicitud.");
      setRequestingBusy(false);
      return;
    }

    // Send notification to the recipient
    await supabase.from("notifications").insert({
      user_id: recipientId,
      title: "Solicitud de recomendación",
      body: `${profile.name || "Un profesional"} te solicitó una recomendación para su CV interactivo.`,
      link: `/profesional/${profile.id}`,
    });

    toast.success(`Solicitud de recomendación enviada a ${contactName}`);
    setRequestingBusy(false);
    setRequestModalOpen(false);
  }

  // Submit written recommendation (visitor view)
  async function submitWriteRecommendation(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId || !writeContent.trim() || !writeContext.trim()) {
      toast.error("Completá todos los campos requeridos.");
      return;
    }

    setWritingBusy(true);
    const { data: me } = await supabase.from("profiles").select("name").eq("id", currentUserId).maybeSingle();
    const authorName = me?.name || "Usuario de la red";
    const authorRole = currentUserRole || "familia";

    const newRecommendation: RecommendationItem = {
      id: `temp-${Date.now()}`,
      professional_id: profile.id,
      author_id: currentUserId,
      author_name: authorName,
      author_role: authorRole,
      relationship_context: writeContext.trim(),
      content: writeContent.trim(),
      highlighted_skills: writeHighlightedSkills,
      status: "published",
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    setRecommendations([newRecommendation, ...recommendations]);

    const { error } = await supabase.from("recommendations").insert({
      professional_id: profile.id,
      author_id: currentUserId,
      author_name: authorName,
      author_role: authorRole,
      relationship_context: writeContext.trim(),
      content: writeContent.trim(),
      highlighted_skills: writeHighlightedSkills,
      status: "published",
    });

    if (error) {
      toast.error("No pudimos publicar tu recomendación.");
      setWritingBusy(false);
      return;
    }

    // Send notification to the professional
    await supabase.from("notifications").insert({
      user_id: profile.id,
      title: "Nueva recomendación verificada",
      body: `${authorName} te dejó una recomendación con insignia verificada en tu CV interactivo.`,
      link: `/profesional/${profile.id}`,
    });

    toast.success("¡Recomendación verificada publicada!");
    setWritingBusy(false);
    setWriteModalOpen(false);
    setWriteContext("");
    setWriteContent("");
    setWriteHighlightedSkills([]);
    await qc.invalidateQueries({ queryKey: ["cv", profile.id] });
  }

  const roleLabel = (r?: string) => {
    if (r === "centro") return "Centro educativo";
    if (r === "familia") return "Familia";
    return "Colega AIE";
  };

  const publishedRecs = recommendations.filter((r) => r.status === "published");
  const canEndorse = !!currentUserId && !isOwner;
  const canReview = !!currentUserId && !isOwner && !recommendations.some((r) => r.author_id === currentUserId);

  return (
    <div className="cv">
      <section className="cv-header" aria-label="Cabecera del perfil">
        <Avatar name={profile.name || "Mi perfil"} path={profile.avatar_path} />
        <div className="cv-header-text">
          <span className="eyebrow">Acompañante externo · AIE</span>
          <h2>{profile.name || "Mi perfil profesional"}</h2>
          {profile.verified ? (
            <span className="verified-badge">
              <BadgeCheck /> Perfil Verificado
            </span>
          ) : (
            <span className="tag">Verificación pendiente</span>
          )}
        </div>
        {readOnly ? (
          <span className="tag">{available ? "Disponible para propuestas" : "No disponible"}</span>
        ) : (
          <div className="availability-control no-print">
            <label htmlFor="profile-availability" className="text-sm font-semibold">
              Disponible para propuestas
            </label>
            <Switch
              id="profile-availability"
              checked={available}
              disabled={!!availabilityBusy}
              onCheckedChange={(v) => onAvailability?.(v)}
            />
          </div>
        )}
        <p className="print-only meta">{available ? "Disponible para propuestas" : "Sin disponibilidad actual"}</p>
      </section>

      <Button
        type="button"
        variant="cta"
        size="lg"
        className="cv-export no-print"
        onClick={() => window.print()}
      >
        <FileDown /> Exportar perfil a PDF
      </Button>

      <div className="cv-grid">
        <section className="cv-card">
          <h3>
            <MapPin /> Datos generales
          </h3>
          <dl className="cv-data">
            <div>
              <dt>Zona de cobertura</dt>
              <dd>
                {showLocation && profile.exact_location
                  ? `${profile.exact_location} (${profile.zone || "Zona general"})`
                  : profile.zone || "Sin especificar"}
              </dd>
            </div>
            {showPhone && profile.phone ? (
              <div>
                <dt>
                  <Phone size={14} /> Teléfono de contacto
                </dt>
                <dd>{profile.phone}</dd>
              </div>
            ) : !isOwner && profile.phone ? (
              <div>
                <dt>
                  <Phone size={14} /> Teléfono
                </dt>
                <dd className="text-xs text-muted-foreground italic">
                  Oculto por privacidad (contactar por Chat)
                </dd>
              </div>
            ) : null}
            {showDni && profile.dni ? (
              <div>
                <dt>
                  <FileText size={14} /> DNI / Matrícula
                </dt>
                <dd>{profile.dni}</dd>
              </div>
            ) : null}
            <div>
              <dt>
                <Receipt /> Situación de facturación
              </dt>
              <dd>{profile.billing ? `Alta en AFIP · ${profile.billing}` : "Sin especificar"}</dd>
            </div>
          </dl>
          {profile.bio && <p className="page-description mt-4 whitespace-pre-wrap">{profile.bio}</p>}
        </section>

        <section className="cv-card">
          <h3>
            <Sparkles /> Herramientas y especialidades
          </h3>
          <div className="tags">
            {profile.skills.length ? (
              profile.skills.map((s) => (
                <span className="pill" key={s}>
                  {s}
                </span>
              ))
            ) : (
              <p className="page-description">Sin especialidades cargadas.</p>
            )}
          </div>
        </section>

        <Timeline
          title="Formación académica"
          icon={<GraduationCap />}
          items={education}
          empty="Todavía no cargaste estudios."
        />
        <Timeline
          title="Experiencia en aula"
          icon={<School />}
          items={experience}
          empty="Todavía no cargaste experiencia."
        />

        {/* VALIDACIONES Y RECOMENDACIONES FORMALES */}
        <section className="cv-card cv-wide">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <h3 className="m-0">
              <ThumbsUp /> Validaciones y recomendaciones
            </h3>
            <div className="flex items-center gap-2 no-print">
              {isOwner && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setRequestModalOpen(true)}
                  className="gap-1.5"
                >
                  <Send size={14} /> Solicitar recomendación
                </Button>
              )}
              {canReview && (
                <Button
                  type="button"
                  size="sm"
                  variant="cta"
                  onClick={() => setWriteModalOpen(true)}
                  className="gap-1.5"
                >
                  <PenSquare size={14} /> Dejar recomendación
                </Button>
              )}
            </div>
          </div>

          <div className="cv-dual">
            <div>
              <h4 className="text-base font-semibold mb-3">Aptitudes validadas (+1)</h4>
              <p className="text-xs text-muted-foreground mb-3">
                {canEndorse
                  ? "Hacé clic en el botón +1 para validar las herramientas pedagógicas de este profesional."
                  : "Validaciones profesionales acumuladas en la red."}
              </p>
              <ul className="endorse-list">
                {profile.skills.map((s) => {
                  const count = localEndorsements[s] ?? 0;
                  const isVoted = myVotedSkills.includes(s);
                  const isBusy = endorseBusy === s;
                  return (
                    <li key={s} className="flex justify-between items-center p-2.5 rounded-xl border border-border">
                      <span className="font-medium text-sm">{s}</span>
                      {canEndorse ? (
                        <Button
                          type="button"
                          size="sm"
                          variant={isVoted ? "cta" : "outline"}
                          disabled={isBusy}
                          onClick={() => handleToggleEndorsement(s)}
                          className="h-8 px-2.5 text-xs font-bold gap-1.5 transition-all"
                          aria-label={`Validar aptitud ${s}`}
                          title={isVoted ? "Quitar mi validación" : "Validar aptitud (+1)"}
                        >
                          {isBusy ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <ThumbsUp size={13} className={isVoted ? "fill-current" : ""} />
                          )}
                          <span>+{count}</span>
                        </Button>
                      ) : (
                        <span className="endorse-count font-bold text-primary flex items-center gap-1 text-sm" aria-label={`${count} validaciones`}>
                          <ThumbsUp size={14} /> +{count}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <h4 className="text-base font-semibold mb-3">Reseñas y Recomendaciones Verificadas</h4>
              {publishedRecs.length > 0 ? (
                <div className="space-y-4">
                  {publishedRecs.map((r) => (
                    <article key={r.id} className="p-4 rounded-xl border bg-card/60 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-semibold">{r.author_name}</strong>
                          <span className="tag text-xs">{roleLabel(r.author_role)}</span>
                        </div>
                        <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          <BadgeCheck size={14} className="text-primary" /> Reseña Verificada
                        </span>
                      </div>
                      {r.relationship_context && (
                        <p className="text-xs text-muted-foreground italic">
                          {r.relationship_context}
                        </p>
                      )}
                      <blockquote className="text-sm italic pl-3 border-l-2 border-primary/40 text-foreground/90 my-2">
                        "{r.content}"
                      </blockquote>
                      {r.highlighted_skills && r.highlighted_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1 items-center">
                          <span className="text-xs text-muted-foreground font-medium mr-1 flex items-center gap-1">
                            <Sparkles size={12} className="text-cta" /> Aptitudes destacadas:
                          </span>
                          {r.highlighted_skills.map((skill) => (
                            <span key={skill} className="tag tag-sm text-xs bg-muted/80">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <blockquote className="review" key={r.id}>
                      <MessageSquareQuote />
                      <p>{r.content}</p>
                      <cite>— {r.author_name || "Familia"}</cite>
                    </blockquote>
                  ))}
                </div>
              ) : (
                <p className="page-description text-sm">
                  Todavía no hay recomendaciones verificadas cargadas para este perfil.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* MODAL 1: SOLICITAR RECOMENDACIÓN (VISTA DUEÑO DEL PERFIL) */}
      <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send size={18} className="text-primary" />
              Solicitar Recomendación Formal
            </DialogTitle>
            <DialogDescription>
              Pedile a una familia o institución de tu red confirmada que certifique tu desempeño profesional.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {acceptedConnections.length > 0 ? (
              <div>
                <label className="text-sm font-semibold mb-1 block">
                  Contacto de tu red
                </label>
                <select
                  className="field w-full"
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                >
                  <option value="">Seleccionar un contacto confirmado...</option>
                  {acceptedConnections.map((c) => (
                    <option key={c.partner.id} value={c.partner.id}>
                      {c.partner.name} ({roleLabel(c.partner.role)} · {c.partner.zone || "Sin zona"})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground">
                <p className="font-semibold text-foreground mb-1">Tu red no tiene contactos con chat abierto aún</p>
                <p>Podés iniciar un chat privado desde el Directorio o compartir tu CV para que tus familias y centros de referencia se sumen.</p>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold mb-1 block">
                Mensaje personalizado
              </label>
              <textarea
                className="field w-full text-sm"
                rows={3}
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Escribí un mensaje breve para tu contacto..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRequestModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="cta"
              disabled={requestingBusy || !selectedContactId}
              onClick={submitRequestRecommendation}
            >
              {requestingBusy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Enviar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: DEJAR RECOMENDACIÓN FORMAL (VISTA FAMILIA / CENTRO / COLEGA) */}
      <Dialog open={writeModalOpen} onOpenChange={setWriteModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgeCheck size={18} className="text-primary" />
              Recomendar a {profile.name}
            </DialogTitle>
            <DialogDescription>
              Tu recomendación se mostrará en su CV interactivo con el sello de Reseña Verificada.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitWriteRecommendation} className="space-y-4 py-2">
            <div>
              <label className="text-sm font-semibold mb-1 block">
                Vínculo laboral o escolar <span className="text-destructive">*</span>
              </label>
              <input
                required
                className="field w-full text-sm"
                placeholder="Ej. Acompañó a nuestro hijo en 1° y 2° grado (2024–2025) / Directora en Colegio San Martín"
                value={writeContext}
                onChange={(e) => setWriteContext(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-1 block">
                Recomendación y experiencia <span className="text-destructive">*</span>
              </label>
              <textarea
                required
                rows={4}
                maxLength={2000}
                className="field w-full text-sm"
                placeholder="Detallá cómo fue el acompañamiento escolar, su compromiso, calidez y resultados alcanzados..."
                value={writeContent}
                onChange={(e) => setWriteContent(e.target.value)}
              />
            </div>

            {profile.skills.length > 0 && (
              <div>
                <label className="text-sm font-semibold mb-1.5 block">
                  Aptitudes y herramientas que demostró
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s) => {
                    const isSelected = writeHighlightedSkills.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setWriteHighlightedSkills(
                            isSelected
                              ? writeHighlightedSkills.filter((x) => x !== s)
                              : [...writeHighlightedSkills, s],
                          )
                        }
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                            : "bg-muted/70 text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {isSelected ? <Check size={12} /> : <Sparkles size={12} />}
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setWriteModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="cta"
                disabled={writingBusy || !writeContext.trim() || !writeContent.trim()}
              >
                {writingBusy ? <Loader2 size={16} className="animate-spin" /> : <BadgeCheck size={16} />}
                Publicar recomendación verificada
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Timeline({
  title,
  icon,
  items,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  items: TimelineItem[];
  empty: string;
}) {
  return (
    <section className="cv-card">
      <h3>
        {icon}
        {title}
      </h3>
      {items.length ? (
        <ol className="timeline">
          {items.map((i, n) => (
            <li key={n}>
              <span className="timeline-period">{i.period}</span>
              <strong>{i.title}</strong>
              <span className="meta">{i.place}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="page-description">{empty}</p>
      )}
    </section>
  );
}

export function TimelineEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: TimelineItem[];
  onChange: (v: TimelineItem[]) => void;
}) {
  const [draft, setDraft] = useState<TimelineItem>({ period: "", title: "", place: "" });
  return (
    <fieldset className="timeline-editor">
      <legend>{label}</legend>
      {items.map((i, n) => (
        <div key={n} className="timeline-editor-row">
          <span>
            <strong>{i.title}</strong> · {i.place} <small>{i.period}</small>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Quitar ${i.title}`}
            onClick={() => onChange(items.filter((_, k) => k !== n))}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <div className="timeline-editor-new">
        <input
          className="field"
          placeholder="Título o puesto"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        <input
          className="field"
          placeholder="Institución"
          value={draft.place}
          onChange={(e) => setDraft({ ...draft, place: e.target.value })}
        />
        <input
          className="field"
          placeholder="Período (ej. 2024 – Actualidad)"
          value={draft.period}
          onChange={(e) => setDraft({ ...draft, period: e.target.value })}
        />
        <Button
          type="button"
          variant="outline"
          disabled={!draft.title.trim()}
          onClick={() => {
            onChange([...items, draft]);
            setDraft({ period: "", title: "", place: "" });
          }}
        >
          <Plus />
          Agregar
        </Button>
      </div>
    </fieldset>
  );
}
