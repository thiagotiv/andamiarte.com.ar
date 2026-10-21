export type ProfileViewItem = {
  id: string;
  profile_id: string;
  viewer_id?: string | null;
  viewer_role: string;
  viewer_name?: string | null;
  created_at: string;
};

export type SearchAppearanceItem = {
  id: string;
  profile_id: string;
  tag: string;
  query?: string | null;
  created_at: string;
};

export type ApplicationItem = {
  id: string;
  stage: string;
  seen_at: string | null;
  created_at: string;
};

export function calculateAtsFunnel(applications: ApplicationItem[]) {
  const totalApplied = applications.length;
  if (totalApplied === 0) {
    return {
      totalApplied: 0,
      totalSeen: 0,
      totalShortlisted: 0,
      seenRate: 0,
      shortlistRate: 0,
    };
  }

  const totalSeen = applications.filter((a) => a.seen_at !== null || a.stage !== "nuevo").length;
  const totalShortlisted = applications.filter((a) => a.stage === "preseleccionado").length;

  const seenRate = Math.round((totalSeen / totalApplied) * 100);
  const shortlistRate = Math.round((totalShortlisted / totalApplied) * 100);

  return {
    totalApplied,
    totalSeen,
    totalShortlisted,
    seenRate,
    shortlistRate,
  };
}

export function aggregateViewsBreakdown(views: ProfileViewItem[]) {
  const breakdown = {
    centros: 0,
    familias: 0,
    colegas: 0,
    otros: 0,
  };

  for (const v of views) {
    if (v.viewer_role === "centro") breakdown.centros++;
    else if (v.viewer_role === "familia") breakdown.familias++;
    else if (v.viewer_role === "aie") breakdown.colegas++;
    else breakdown.otros++;
  }

  return breakdown;
}

export function aggregateTopTags(appearances: SearchAppearanceItem[], limit = 4) {
  const counts: Record<string, number> = {};
  for (const item of appearances) {
    if (item.tag) {
      counts[item.tag] = (counts[item.tag] ?? 0) + 1;
    }
  }

  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function formatTimeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffHours = Math.floor(diffMs / (3600 * 1000));
  if (diffHours < 1) return "hace unos minutos";
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "hace 1 día";
  return `hace ${diffDays} días`;
}

