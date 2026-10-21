import { createMongoServerClient } from "@/lib/mongo-server-adapter";

// Server-side MongoDB client adapter
export function createSupabaseAdminClient() {
  return createMongoServerClient() as any;
}
