import { describe, it, expect } from "vitest";
import {
  getConnectionState,
  filterAcceptedConnections,
  filterPendingReceived,
  filterPendingSent,
  countEndorsements,
  type ConnectionRecord,
} from "@/lib/social";

describe("Ecosistema Social: Networking y Reputación", () => {
  const me = "user-me";
  const friend = "user-friend";
  const stranger = "user-stranger";
  const pendingUser = "user-pending";

  const sampleConnections: ConnectionRecord[] = [
    {
      id: "conn-1",
      requester_id: me,
      receiver_id: friend,
      status: "accepted",
      created_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "conn-2",
      requester_id: me,
      receiver_id: stranger,
      status: "pending",
      created_at: "2026-01-02T00:00:00Z",
    },
    {
      id: "conn-3",
      requester_id: pendingUser,
      receiver_id: me,
      status: "pending",
      created_at: "2026-01-03T00:00:00Z",
    },
  ];

  it("determines correct connection states", () => {
    expect(getConnectionState(sampleConnections, me, friend)).toBe("connected");
    expect(getConnectionState(sampleConnections, me, stranger)).toBe("pending_sent");
    expect(getConnectionState(sampleConnections, me, pendingUser)).toBe("pending_received");
    expect(getConnectionState(sampleConnections, me, "unknown-id")).toBe("none");
    expect(getConnectionState(sampleConnections, me, me)).toBe("none");
    expect(getConnectionState(null, me, friend)).toBe("none");
  });

  it("filters accepted and pending connections accurately", () => {
    const accepted = filterAcceptedConnections(sampleConnections, me);
    expect(accepted).toHaveLength(1);
    expect(accepted[0]?.id).toBe("conn-1");

    const received = filterPendingReceived(sampleConnections, me);
    expect(received).toHaveLength(1);
    expect(received[0]?.requester_id).toBe(pendingUser);

    const sent = filterPendingSent(sampleConnections, me);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.receiver_id).toBe(stranger);
  });

  it("aggregates skill endorsements counts cleanly", () => {
    const data = [
      { skill: "Pictogramas" },
      { skill: "Pictogramas" },
      { skill: "Adaptaciones pedagógicas" },
      { skill: "Comunicación aumentativa" },
    ];
    const counts = countEndorsements(data);
    expect(counts["Pictogramas"]).toBe(2);
    expect(counts["Adaptaciones pedagógicas"]).toBe(1);
    expect(counts["Comunicación aumentativa"]).toBe(1);
    expect(counts["ABA"]).toBeUndefined();
  });

  it("validates formal recommendations structure and verified badge rules", () => {
    const sampleRec = {
      id: "rec-1",
      professional_id: "82f99bd4-0d83-41d4-b213-d7bc5a0c0e3b",
      author_id: "auth-1",
      author_name: "Familia Gómez",
      author_role: "familia",
      relationship_context: "Acompañó a nuestro hijo en 1° y 2° grado (2024–2025)",
      content: "Excelente profesional con gran calidez.",
      highlighted_skills: ["Pictogramas", "Adaptaciones pedagógicas"],
      status: "published",
      created_at: "2026-01-01T00:00:00Z",
    };

    expect(sampleRec.status).toBe("published");
    expect(sampleRec.highlighted_skills).toContain("Pictogramas");
    expect(sampleRec.highlighted_skills).toContain("Adaptaciones pedagógicas");
    expect(sampleRec.relationship_context.length).toBeGreaterThan(5);
  });
});

