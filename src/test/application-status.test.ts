import { describe, expect, it } from "vitest";
import { applicantStatus } from "@/lib/application-status";

describe("applicantStatus", () => {
  it("new and unseen is Enviada", () => expect(applicantStatus({ stage: "nuevo", seen_at: null }).label).toBe("Enviada"));
  it("opened by institution is Vista", () => expect(applicantStatus({ stage: "nuevo", seen_at: "2026-10-10" }).label).toBe("Vista por la institución"));
  it("shortlisted is En evaluación", () => expect(applicantStatus({ stage: "preseleccionado", seen_at: "x" }).label).toBe("En evaluación"));
});
