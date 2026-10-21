import { useEffect, useState, type KeyboardEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { alertsOptions } from "@/lib/network";
import { supabase } from "@/integrations/supabase/client";

const SUGGEST = {
  zones: ["CABA", "Zona Norte", "Zona Sur", "Zona Oeste", "La Plata"],
  levels: ["Nivel Inicial", "Nivel Primario", "Nivel Secundario"],
  tools: ["Pictogramas", "Adaptaciones pedagógicas", "Comunicación aumentativa", "LSA", "ABA"],
};
type Key = keyof typeof SUGGEST;
const LABELS: Record<Key, string> = { zones: "Zona", levels: "Nivel escolar", tools: "Herramientas" };

function TagField({ k, value, onChange }: { k: Key; value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = (t: string) => {
    const v = t.trim();
    if (v && !value.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...value, v]);
    setDraft("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(draft); }
  };
  return (
    <div className="alert-field">
      <label htmlFor={`alert-${k}`}>{LABELS[k]}</label>
      <div className="tags">
        {value.map((t) => (
          <span className="tag alert-tag" key={t}>{t}<button type="button" aria-label={`Quitar ${t}`} onClick={() => onChange(value.filter((x) => x !== t))}><X size={12} /></button></span>
        ))}
      </div>
      <input id={`alert-${k}`} className="field" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKey} onBlur={() => add(draft)} placeholder="Escribí y presioná Enter" />
      <div className="alert-suggest">
        {SUGGEST[k].filter((s) => !value.includes(s)).map((s) => (
          <button type="button" key={s} onClick={() => add(s)}>+ {s}</button>
        ))}
      </div>
    </div>
  );
}

export function JobAlertsForm({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data } = useQuery(alertsOptions);
  const [prefs, setPrefs] = useState({ zones: [] as string[], levels: [] as string[], tools: [] as string[] });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setPrefs({ zones: data.zones, levels: data.levels, tools: data.tools }); }, [data]);
  async function save() {
    setBusy(true);
    const r = await supabase.from("job_alerts").upsert({ user_id: userId, ...prefs, updated_at: new Date().toISOString() });
    setBusy(false);
    if (r.error) { toast.error("No pudimos guardar tus alertas."); return; }
    toast.success("Alertas guardadas. Te avisamos en la campanita cuando haya match.");
    await qc.invalidateQueries({ queryKey: ["alerts"] });
  }
  return (
    <section className="cv-card job-alerts no-print">
      <h3><BellRing />Alertas de empleo</h3>
      <p className="meta">Elegí tus preferencias y te avisamos cuando un centro publique una búsqueda que coincida.</p>
      <div className="alert-grid">
        {(Object.keys(SUGGEST) as Key[]).map((k) => (
          <TagField key={k} k={k} value={prefs[k]} onChange={(v) => setPrefs({ ...prefs, [k]: v })} />
        ))}
      </div>
      <Button variant="cta" onClick={save} disabled={busy}>{busy ? "Guardando…" : "Guardar alertas"}</Button>
    </section>
  );
}
