import { createFileRoute, Navigate } from "@tanstack/react-router";
import { pageHead } from "@/lib/network";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: string; role?: string } => ({
    ...(typeof s["mode"] === "string" ? { mode: s["mode"] } : {}),
    ...(typeof s["role"] === "string" ? { role: s["role"] } : {}),
  }),
  head: () =>
    pageHead(
      "Ingresar a la red",
      "Creá tu cuenta de acompañante, centro educativo o familia y sumate a la comunidad de inclusión escolar.",
    ),
  component: AuthRedirect,
});

function AuthRedirect() {
  const search = Route.useSearch();
  if (search.mode === "registro") {
    return <Navigate to="/registro" search={search.role ? { role: search.role } : {}} replace />;
  }
  return <Navigate to="/login" replace />;
}
