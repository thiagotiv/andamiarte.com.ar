import { describe, expect, it } from "vitest";
import { alertMatches, unreadCount } from "@/lib/job-alerts";
const job = { zone: "CABA", title: "AIE para Nivel Primario", description: "Turno mañana", skills: ["Pictogramas"] };
describe("job alerts", () => {
  it("matches zone, level and tool", () => {
    expect(alertMatches({ zones: ["caba"], levels: ["Nivel Primario"], tools: ["Pictogramas"] }, job)).toBe(true);
  });
  it("rejects another zone", () => {
    expect(alertMatches({ zones: ["Zona Norte"], levels: [], tools: [] }, job)).toBe(false);
  });
  it("rejects missing tool", () => {
    expect(alertMatches({ zones: [], levels: [], tools: ["LSA"] }, job)).toBe(false);
  });
  it("empty alert never matches", () => {
    expect(alertMatches({ zones: [], levels: [], tools: [] }, job)).toBe(false);
  });
  it("counts unread", () => {
    expect(unreadCount([{ read_at: null }, { read_at: "2026-01-01" }])).toBe(1);
  });
});
