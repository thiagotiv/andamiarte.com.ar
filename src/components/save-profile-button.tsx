import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "./ui/button";
import { useSession } from "./session";
import { accountOptions, savedOptions } from "@/lib/network";
import { supabase } from "@/integrations/supabase/client";

export function SaveProfileButton({ profileId, className }: { profileId: string; className?: string }) {
  const { user } = useSession();
  const qc = useQueryClient();
  const { data: account } = useQuery({ ...accountOptions, enabled: !!user });
  const canSave = account?.role === "centro" || account?.role === "familia";
  const { data: saved } = useQuery({ ...savedOptions, enabled: !!user && canSave });
  const [busy, setBusy] = useState(false);
  if (!user || !canSave) return null;
  const isSaved = !!saved?.some((p: any) => p.id === profileId);
  async function toggle() {
    if (!user) return;
    setBusy(true);
    const r = isSaved
      ? await supabase.from("saved_profiles").delete().match({ owner_id: user.id, profile_id: profileId })
      : await supabase.from("saved_profiles").insert({ owner_id: user.id, profile_id: profileId });
    setBusy(false);
    if (r.error) { toast.error("No pudimos actualizar tu red."); return; }
    toast.success(isSaved ? "Quitado de Mi red" : "Guardado en Mi red");
    await qc.invalidateQueries({ queryKey: ["saved"] });
  }
  return (
    <Button variant="outline" className={className} onClick={toggle} disabled={busy} aria-pressed={isSaved}>
      {isSaved ? <BookmarkCheck /> : <Bookmark />}
      {isSaved ? "Guardado" : "Guardar perfil"}
    </Button>
  );
}
