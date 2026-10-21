import { describe, it, expect } from "vitest";
import {
  calculateAtsFunnel,
  aggregateViewsBreakdown,
  aggregateTopTags,
} from "@/lib/analytics";

describe("Profile Analytics & ATS Funnel", () => {
  it("calculates ATS funnel metrics accurately", () => {
    const apps = [
      { id: "1", stage: "nuevo", seen_at: null, created_at: "2026-01-01" },
      { id: "2", stage: "nuevo", seen_at: "2026-01-02", created_at: "2026-01-01" },
      { id: "3", stage: "preseleccionado", seen_at: "2026-01-02", created_at: "2026-01-01" },
      { id: "4", stage: "preseleccionado", seen_at: "2026-01-03", created_at: "2026-01-01" },
    ];

    const funnel = calculateAtsFunnel(apps);
    expect(funnel.totalApplied).toBe(4);
    expect(funnel.totalSeen).toBe(3); // 2, 3, 4
    expect(funnel.totalShortlisted).toBe(2); // 3, 4
    expect(funnel.seenRate).toBe(75);
    expect(funnel.shortlistRate).toBe(50);
  });

  it("handles zero applications gracefully", () => {
    const funnel = calculateAtsFunnel([]);
    expect(funnel.totalApplied).toBe(0);
    expect(funnel.seenRate).toBe(0);
    expect(funnel.shortlistRate).toBe(0);
  });

  it("aggregates views breakdown by role correctly", () => {
    const views = [
      { id: "1", profile_id: "p1", viewer_role: "centro", created_at: "2026-01-01" },
      { id: "2", profile_id: "p1", viewer_role: "centro", created_at: "2026-01-02" },
      { id: "3", profile_id: "p1", viewer_role: "familia", created_at: "2026-01-03" },
      { id: "4", profile_id: "p1", viewer_role: "aie", created_at: "2026-01-04" },
      { id: "5", profile_id: "p1", viewer_role: "anon", created_at: "2026-01-05" },
    ];

    const breakdown = aggregateViewsBreakdown(views);
    expect(breakdown.centros).toBe(2);
    expect(breakdown.familias).toBe(1);
    expect(breakdown.colegas).toBe(1);
    expect(breakdown.otros).toBe(1);
  });

  it("extracts and sorts top search appearance tags", () => {
    const appearances = [
      { id: "1", profile_id: "p1", tag: "Pictogramas", created_at: "2026-01-01" },
      { id: "2", profile_id: "p1", tag: "CABA", created_at: "2026-01-01" },
      { id: "3", profile_id: "p1", tag: "Pictogramas", created_at: "2026-01-02" },
      { id: "4", profile_id: "p1", tag: "Adaptaciones", created_at: "2026-01-03" },
      { id: "5", profile_id: "p1", tag: "Pictogramas", created_at: "2026-01-04" },
    ];

    const top = aggregateTopTags(appearances, 2);
    expect(top).toHaveLength(2);
    expect(top[0]?.tag).toBe("Pictogramas");
    expect(top[0]?.count).toBe(3);
  });
});
