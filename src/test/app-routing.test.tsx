import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
  it.each([
    "/auth",
    "/login",
    "/registro",
    "/verificacion",
    "/comunidad",
    "/busquedas",
    "/profesionales",
    "/perfil",
    "/mensajes",
    "/publicar-busqueda",
    "/reset-password",
    "/configuracion-privacidad",
    "/centro/82f99bd4-0d83-41d4-b213-d7bc5a0c0e3b",
  ])("matches %s", (path) => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes(path);
    expect(matches.at(-1)?.pathname).toBe(path);
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});
