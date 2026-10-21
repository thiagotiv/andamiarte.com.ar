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
    let token = "";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "").trim();
    } else {
      // Fallback a cookie de sesión httpOnly si no hay cabecera Authorization
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const match = cookieHeader.match(/(?:^|;\s*)(?:auth_token|sb-access-token)=([^;]+)/);
        if (match && match[1]) {
          token = decodeURIComponent(match[1]);
        }
      }
    }

    if (!token) {
      throw new Error("Unauthorized: No authorization token provided in headers or cookies");
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
