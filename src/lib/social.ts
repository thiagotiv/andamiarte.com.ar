export type ConnectionState = "none" | "pending_sent" | "pending_received" | "connected";

export type ConnectionRecord = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected" | string;
  created_at: string;
  updated_at?: string;
};

export type RecommendationRecord = {
  id: string;
  professional_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  relationship_context: string;
  content: string;
  highlighted_skills: string[];
  status: "pending_request" | "published" | "declined" | string;
  created_at: string;
};

export function getConnectionState(
  connections: ConnectionRecord[] | null | undefined,
  currentUserId: string | null | undefined,
  targetUserId: string,
): ConnectionState {
  if (!currentUserId || currentUserId === targetUserId || !connections) {
    return "none";
  }

  const match = connections.find(
    (c) =>
      (c.requester_id === currentUserId && c.receiver_id === targetUserId) ||
      (c.receiver_id === currentUserId && c.requester_id === targetUserId),
  );

  if (!match) return "none";
  if (match.status === "accepted") return "connected";
  if (match.status === "pending") {
    return match.requester_id === currentUserId ? "pending_sent" : "pending_received";
  }
  return "none";
}

export function filterAcceptedConnections(
  connections: ConnectionRecord[],
  currentUserId: string,
): ConnectionRecord[] {
  return connections.filter(
    (c) =>
      c.status === "accepted" &&
      (c.requester_id === currentUserId || c.receiver_id === currentUserId),
  );
}

export function filterPendingReceived(
  connections: ConnectionRecord[],
  currentUserId: string,
): ConnectionRecord[] {
  return connections.filter((c) => c.status === "pending" && c.receiver_id === currentUserId);
}

export function filterPendingSent(
  connections: ConnectionRecord[],
  currentUserId: string,
): ConnectionRecord[] {
  return connections.filter((c) => c.status === "pending" && c.requester_id === currentUserId);
}

export function countEndorsements(
  endorsements: { skill: string }[] | null | undefined,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of endorsements ?? []) {
    if (item.skill) {
      counts[item.skill] = (counts[item.skill] ?? 0) + 1;
    }
  }
  return counts;
}
