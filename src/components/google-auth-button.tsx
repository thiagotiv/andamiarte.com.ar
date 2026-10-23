import { useEffect, useRef, useState, memo } from "react";
import { mongoAuth } from "@/lib/mongo-client-adapter";
import { loadGoogleScript, getGoogleClientId } from "@/lib/google-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GoogleAuthButtonProps {
  role?: string | undefined;
  text?: "continue_with" | "signin_with" | "signup_with";
  onSuccess?: (res: { user: any; isNewUser: boolean }) => void;
  onError?: (err: Error) => void;
  className?: string;
  disabled?: boolean;
}

export const GoogleAuthButton = memo(function GoogleAuthButton({
  role = "aie",
  text = "continue_with",
  onSuccess,
  onError,
  className = "",
  disabled = false,
}: GoogleAuthButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef<boolean>(false);
  const roleRef = useRef(role);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // Mantener los refs actualizados con las props más recientes
  useEffect(() => {
    roleRef.current = role;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [role, onSuccess, onError]);

  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [clientId, setClientId] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function init() {
      // Evitar re-inicialización si ya fue montado y renderizado
      if (initializedRef.current) return;

      try {
        const id = await getGoogleClientId();
        if (!isMounted || initializedRef.current) return;
        setClientId(id);

        if (!id) {
          console.warn("[Google Auth] GOOGLE_CLIENT_ID no configurado todavía en .env.");
          return;
        }

        await loadGoogleScript();
        if (!isMounted || initializedRef.current) return;

        if (window.google?.accounts?.id && containerRef.current) {
          try {
            window.google.accounts.id.initialize({
              client_id: id,
              callback: async (response) => {
                if (!response?.credential) {
                  const err = new Error("No se recibió credencial de Google");
                  onErrorRef.current?.(err);
                  return;
                }
                setLoading(true);
                try {
                  const res = await mongoAuth.signInWithGoogle({
                    credential: response.credential,
                    role: roleRef.current,
                  });

                  if (res.error) {
                    throw new Error(res.error.message);
                  }

                  toast.success(
                    res.data?.isNewUser
                      ? "¡Bienvenido/a a Andamiarte!"
                      : "¡Sesión iniciada con Google!"
                  );

                  onSuccessRef.current?.({
                    user: res.data?.user,
                    isNewUser: Boolean(res.data?.isNewUser),
                  });
                } catch (err: any) {
                  const e = err instanceof Error ? err : new Error(String(err));
                  toast.error(e.message || "Error al autenticarse con Google");
                  onErrorRef.current?.(e);
                } finally {
                  setLoading(false);
                }
              },
              auto_select: false,
              cancel_on_tap_outside: true,
            });

            // Renderizar botón oficial de Google con diseño nativo y adaptado
            if (containerRef.current) {
              containerRef.current.innerHTML = "";
              window.google.accounts.id.renderButton(containerRef.current, {
                type: "standard",
                theme: "outline",
                size: "large",
                text,
                shape: "rectangular",
                logo_alignment: "left",
                width: 320,
                locale: "es",
              });
            }

            initializedRef.current = true;
            if (isMounted) {
              setSdkReady(true);
            }
          } catch (initErr: any) {
            console.warn("[Google Auth] Error al inicializar renderButton de Google:", initErr);
          }
        }
      } catch (err: any) {
        console.warn("[Google Auth] Error cargando SDK de Google:", err);
      }
    }

    void init();

    return () => {
      isMounted = false;
    };
  }, [text]);

  // Click manual en caso de que el iframe de Google no se haya renderizado o en desarrollo
  async function handleManualClick() {
    if (loading || disabled) return;

    if (!clientId) {
      if (import.meta.env.DEV) {
        // Modo desarrollo: permitir inicio simulado para verificar la sincronización con MongoDB
        setLoading(true);
        try {
          const mockToken = `dev-mock-google-token:google-test-sub-${Date.now()}:test.google@andamiarte.com:Usuario Google Test`;
          const res = await mongoAuth.signInWithGoogle({
            credential: mockToken,
            role: roleRef.current,
          });
          if (res.error) throw new Error(res.error.message);

          toast.success("Autenticación de prueba con Google exitosa (Modo Dev)");
          onSuccessRef.current?.({
            user: res.data?.user,
            isNewUser: Boolean(res.data?.isNewUser),
          });
        } catch (err: any) {
          toast.error(err.message);
          onErrorRef.current?.(err);
        } finally {
          setLoading(false);
        }
        return;
      }

      toast.info(
        "Por favor configura GOOGLE_CLIENT_ID y VITE_GOOGLE_CLIENT_ID en tu archivo .env para habilitar Google OAuth."
      );
      return;
    }

    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt();
      } catch (promptErr) {
        console.warn("[Google Auth] Error en prompt():", promptErr);
      }
    } else {
      toast.info("Cargando servicios de Google, intentá en un instante...");
    }
  }

  return (
    <div className={`w-full flex flex-col items-center justify-center ${className}`}>
      {/* Contenedor oficial del botón de Google */}
      <div
        ref={containerRef}
        className={`w-full flex justify-center min-h-[44px] ${sdkReady ? "block" : "hidden"}`}
      />

      {/* Botón visual alternativo mientras carga el SDK o como fallback */}
      {!sdkReady && (
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2.5 h-11 border-border/80 bg-background hover:bg-muted/50 font-medium"
          onClick={handleManualClick}
          disabled={loading || disabled}
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>
            {loading
              ? "Conectando con Google…"
              : text === "signup_with"
              ? "Registrarse con Google"
              : "Continuar con Google"}
          </span>
        </Button>
      )}
    </div>
  );
});
