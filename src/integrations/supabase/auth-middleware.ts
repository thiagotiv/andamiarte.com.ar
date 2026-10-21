import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { verifyToken } from "@/lib/auth-mongo";
import { createMongoServerClient } from "@/lib/mongo-server-adapter";

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();

    if (!request?.headers) {
      throw new Error("Unauthorized: No request headers available");
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      throw new Error("Unauthorized: No authorization header provided");
    }

    if (!authHeader.startsWith("Bearer ")) {
      throw new Error("Unauthorized: Only Bearer tokens are supported");
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      throw new Error("Unauthorized: No token provided");
    }

    // Validar token JWT de MongoDB
    const mongoClaims = verifyToken(token);
    if (!mongoClaims || !mongoClaims.id) {
      throw new Error("Unauthorized: Invalid or expired token");
    }

    const serverMongo = createMongoServerClient();
    return next({
      context: {
        supabase: serverMongo as any,
        userId: mongoClaims.id,
        claims: { sub: mongoClaims.id, email: mongoClaims.email, role: mongoClaims.role } as any,
      },
    });
  },
);
