// Mirrors public.notify_job_alerts() so the app and the database agree on a match.
export type AlertPrefs = { zones: string[]; levels: string[]; tools: string[] };
export type AlertJob = { zone: string; title: string; description: string; skills: string[] };
const low = (s: string) => s.trim().toLowerCase();
export function alertMatches(a: AlertPrefs, job: AlertJob): boolean {
  if (!a.zones.length && !a.levels.length && !a.tools.length) return false;
  const text = low([job.title, job.description, ...job.skills].join(" "));
  const skills = job.skills.map(low);
  return (
    (!a.zones.length || a.zones.some((z) => low(z) === low(job.zone))) &&
    (!a.levels.length || a.levels.some((l) => text.includes(low(l)))) &&
    (!a.tools.length || a.tools.some((t) => skills.includes(low(t))))
  );
}
export const unreadCount = (items: { read_at: string | null }[]) => items.filter((n) => !n.read_at).length;
