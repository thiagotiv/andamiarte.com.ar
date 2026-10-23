import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { SessionProvider } from "@/components/session";
import { Header, Footer } from "@/components/site-shell";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Andamiarte | Red de Inclusión Escolar" },
      {
        name: "description",
        content:
          "Plataforma colaborativa y red profesional de inclusión escolar en Argentina. Conectamos Acompañantes de Integración Escolar (AIE/APND/AT), centros educativos y familias.",
      },
      {
        name: "keywords",
        content:
          "AIE, APND, acompañante de integración escolar, inclusión escolar, educación inclusiva, acompañante terapéutico, discapacidad, educación especial, Argentina",
      },
      { name: "theme-color", content: "#1d3d29" },
      { name: "robots", content: "index, follow" },

      // OpenGraph (WhatsApp, Facebook, LinkedIn, Telegram)
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "es_AR" },
      { property: "og:site_name", content: "Andamiarte" },
      { property: "og:title", content: "Andamiarte | Red de Inclusión Escolar" },
      {
        property: "og:description",
        content:
          "Conectando acompañantes de integración escolar (AIE), centros educativos y familias para fortalecer trayectorias pedagógicas inclusivas.",
      },
      { property: "og:url", content: "https://andamiarte.com.ar" },
      { property: "og:image", content: "https://andamiarte.com.ar/og-image.png" },
      { property: "og:image:secure_url", content: "https://andamiarte.com.ar/og-image.png" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Andamiarte - Red de Inclusión Escolar" },

      // Twitter / X Cards
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Andamiarte | Red de Inclusión Escolar" },
      {
        name: "twitter:description",
        content:
          "Espacio de vinculación profesional y comunitaria para la inclusión educativa en Argentina.",
      },
      { name: "twitter:image", content: "https://andamiarte.com.ar/og-image.png" },
    ],
    links: [
      { rel: "canonical", href: "https://andamiarte.com.ar" },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <SessionProvider><Header /><Outlet /><Footer /><Toaster /></SessionProvider> breaks all child routes. */}
      <SessionProvider>
        <Header />
        <Outlet />
        <Footer />
        <Toaster />
      </SessionProvider>
    </QueryClientProvider>
  );
}
