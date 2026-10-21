import { getGoogleClientIdFn } from "./api-mongo";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: number | string;
              locale?: string;
            }
          ) => void;
          prompt: (momentListener?: (moment: any) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

let cachedClientId: string | null = null;
let scriptLoadingPromise: Promise<void> | null = null;

export async function getGoogleClientId(): Promise<string> {
  if (cachedClientId) return cachedClientId;

  // 1. Intentar leer desde variables Vite cliente
  const viteClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
  if (viteClientId && typeof viteClientId === "string" && !viteClientId.includes("<")) {
    cachedClientId = viteClientId.trim();
    return cachedClientId;
  }

  // 2. Fallback a Server Function
  try {
    const res = await getGoogleClientIdFn();
    if (res?.clientId && !res.clientId.includes("<")) {
      cachedClientId = res.clientId.trim();
      return cachedClientId;
    }
  } catch (err) {
    console.warn("[Google Auth] No se pudo obtener client_id desde el servidor:", err);
  }

  return "";
}

export function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();

  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve, reject) => {
    // Si ya existe el tag script
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar el SDK de Google.")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Error al descargar el script de Google Identity Services."));
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}
