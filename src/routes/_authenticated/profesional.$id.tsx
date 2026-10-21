import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { MessageCircle, ThumbsUp, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Empty, RouteError } from "@/components/site-shell";
import { SaveProfileButton } from "@/components/save-profile-button";
import { ConnectButton } from "@/components/connect-button";
import { InteractiveCv } from "@/components/interactive-cv";
import { getProfessionalCv } from "@/lib/network.functions";
import { pageHead } from "@/lib/network";
import { supabase } from "@/integrations/supabase/client";

const cvOptions = (id: string) =>
  queryOptions({ queryKey: ["cv", id], queryFn: () => getProfessionalCv({ data: { id } }) });

export const Route = createFileRoute("/_authenticated/profesional/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(cvOptions(params.id)),
  head: () => pageHead("CV del acompañante", "CV interactivo de un acompañante externo con formación, experiencia y validaciones."),
  component: ProfessionalCv,
  errorComponent: RouteError,
  notFoundComponent: RouteError,
});

function ProfessionalCv() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(cvOptions(id));
  const qc = useQueryClient();
  const [review, setReview] = useState("");
  const p = data.profile;
  if (!p) return <main className="page"><Empty title="Perfil no disponible" description="Este perfil no es público o no existe." /></main>;
  const isOwner = data.myId === p.id;
  const canEndorse = data.myId !== p.id;
  const canReview = !isOwner && !data.reviews.some((r: any) => r.author_id === data.myId);
  async function toggle(skill: string) {
    const has = data.mine.includes(skill);
    const r = has
      ? await supabase.from("skill_endorsements").delete().match({ profile_id: id, endorser_id: data.myId, skill })
      : await supabase.from("skill_endorsements").insert({ profile_id: id, endorser_id: data.myId, skill });
    if (r.error) toast.error("No pudimos registrar tu validación.");
    await qc.invalidateQueries({ queryKey: ["cv", id] });
  }
  async function sendReview(e: FormEvent) {
    e.preventDefault();
    const { data: me } = await supabase.from("profiles").select("name").eq("id", data.myId).single();
    const r = await supabase.from("family_reviews").insert({ profile_id: id, author_id: data.myId, author_name: me?.name ?? "", content: review.trim() });
    if (r.error) toast.error("No pudimos publicar tu reseña.");
    else { toast.success("Gracias por tu reseña"); setReview(""); await qc.invalidateQueries({ queryKey: ["cv", id] }); }
  }
  return (
    <main className="page">
      <div className="page-title no-print">
        <div><div className="eyebrow">Directorio de profesionales</div><h1>CV interactivo</h1></div>
        <div className="flex flex-wrap gap-2 items-center">
          <ConnectButton targetUserId={p.id} targetName={p.name} label="Chat Privado" />
          <SaveProfileButton profileId={p.id} />
        </div>
      </div>
      <InteractiveCv
        profile={p}
        available={p.available}
        readOnly
        endorsements={data.endorsements}
        mineEndorsements={data.mine}
        reviews={data.reviews}
        recommendations={(data as any).recommendations ?? []}
        isOwner={isOwner}
        currentUserId={data.myId}
        currentUserRole={data.myRole}
        onToggleEndorsement={toggle}
      />
      {canEndorse && (
        <section className="cv-card mt-5 no-print"><h3><ThumbsUp />Validá sus aptitudes</h3><div className="tags">
          {p.skills.map((s: string) => <Button key={s} type="button" size="sm" variant={data.mine.includes(s) ? "default" : "outline"} onClick={() => toggle(s)}><ThumbsUp />{s}</Button>)}
        </div></section>
      )}
      {canReview && (
        <form className="cv-card mt-5 form-grid no-print" onSubmit={sendReview}>
          <h3>Dejá una reseña como familia</h3>
          <textarea required maxLength={1500} className="field" value={review} onChange={(e) => setReview(e.target.value)} placeholder="Contá cómo fue el acompañamiento." />
          <Button type="submit" variant="cta" disabled={!review.trim()}><Send />Publicar reseña</Button>
        </form>
      )}
    </main>
  );
}
