import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { accountOptions } from "@/lib/network";
import { Users, ArrowUpRight, Menu, LogOut, UserRound, MessageCircle, X, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { useSession } from "./session";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "./notification-bell";
import { OnboardingGate } from "./onboarding-wizard";
export function Brand() {
  return (
    <Link to="/" className="brand flex items-center gap-2 group" aria-label="Andamiarte">
      <img
        src="/logo.png"
        alt="Andamiarte"
        className="h-10 md:h-11 w-auto object-contain transition-transform group-hover:scale-105"
      />
    </Link>
  );
}
export function Header() {
  const { user } = useSession();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: account } = useQuery({ ...accountOptions, enabled: !!user });
  const role = user ? account?.role : undefined;
  async function logout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/login", replace: true });
  }
  return (
    <>
      <header className="site-header">
        <div className="container-wide header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Navegación principal">
            <Link to={user ? "/comunidad" : "/"} activeOptions={{ exact: true }}>
              Inicio
            </Link>
            {!user ? (
              <>
                <Link to="/comunidad">Comunidad</Link>
                <Link to="/busquedas">Búsquedas laborales</Link>
                <Link to="/profesionales">Directorio</Link>
              </>
            ) : role === "aie" ? (
              <>
                <Link to="/busquedas">Búsquedas Laborales</Link>
                <Link to="/mis-postulaciones">Mis Postulaciones</Link>
                <Link to="/mi-red">Mi Red</Link>
                <Link to="/mensajes">Mensajes</Link>
              </>
            ) : (
              <>
                <Link to="/publicar-busqueda">Buscar Acompañante</Link>
                <Link to="/candidatos">Postulaciones</Link>
                <Link to="/profesionales">Directorio</Link>
                <Link to="/mi-red">Mi Red</Link>
                <Link to="/mensajes">Mensajes</Link>
              </>
            )}
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <OnboardingGate enabled />
                <NotificationBell userId={user.id} />
                <Button variant="ghost" size="icon" asChild title="Mensajes (Chat)">
                  <Link to="/mensajes">
                    <MessageCircle />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild title="Mi perfil">
                  <Link to="/perfil">
                    <UserRound />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild title="Seguridad y privacidad">
                  <Link to="/configuracion-privacidad">
                    <ShieldCheck />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={logout} title="Cerrar sesión">
                  <LogOut />
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="login-link">
                  <Link to="/login">Ingresar</Link>
                </Button>
                <Button asChild variant="cta">
                  <Link to="/registro">
                    Sumarme <ArrowUpRight />
                  </Link>
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="mobile-menu"
              onClick={() => setOpen(!open)}
              title="Menú"
              aria-expanded={open}
              aria-controls="mobile-navigation"
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </header>
      {open && (
        <nav
          className="flex flex-col gap-3 border-b border-border bg-card p-5 text-sm shadow-md"
          aria-label="Menú móvil"
          id="mobile-navigation"
          onClick={() => setOpen(false)}
        >
          <Link to={user ? "/comunidad" : "/"}>Inicio</Link>
          {!user ? (
            <>
              <Link to="/comunidad">Comunidad</Link>
              <Link to="/busquedas">Búsquedas laborales</Link>
              <Link to="/profesionales">Directorio</Link>
              <div className="pt-2 border-t border-border flex flex-col gap-2">
                <Link to="/login" className="font-semibold text-primary">Ingresar</Link>
                <Link to="/registro" className="font-semibold text-cta">Sumarme</Link>
              </div>
            </>
          ) : role === "aie" ? (
            <>
              <Link to="/busquedas">Búsquedas Laborales</Link>
              <Link to="/mis-postulaciones">Mis Postulaciones</Link>
              <Link to="/mi-red">Mi Red</Link>
              <Link to="/mensajes">Mensajes (Chat)</Link>
              <Link to="/perfil">Mi Perfil</Link>
              <Link to="/configuracion-privacidad">Seguridad</Link>
            </>
          ) : (
            <>
              <Link to="/publicar-busqueda">Buscar Acompañante</Link>
              <Link to="/candidatos">Postulaciones (Candidatos)</Link>
              <Link to="/profesionales">Directorio (AIEs)</Link>
              <Link to="/mi-red">Mi Red</Link>
              <Link to="/mensajes">Mensajes (Chat)</Link>
              <Link to="/perfil">Mi Perfil</Link>
              <Link to="/configuracion-privacidad">Seguridad</Link>
            </>
          )}
          {user && (
            <button
              onClick={logout}
              className="text-left text-sm text-red-600 mt-2 pt-2 border-t border-border font-medium flex items-center gap-1.5"
            >
              <LogOut size={16} /> Cerrar sesión
            </button>
          )}
        </nav>
      )}
    </>
  );
}
export function Footer() {
  return (
    <footer className="footer bg-card border-t border-border py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Brand />
          <span className="text-xs text-muted-foreground hidden sm:inline">|</span>
          <span className="text-xs text-muted-foreground">
            Una red que conecta. Una comunidad que acompaña.
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-medium">
          <Link to="/comunidad" className="hover:text-primary transition-colors">
            Comunidad
          </Link>
          <Link to="/busquedas" className="hover:text-primary transition-colors">
            Búsquedas Laborales
          </Link>
          <Link to="/profesionales" className="hover:text-primary transition-colors">
            Directorio AIE
          </Link>
          <Link to="/configuracion-privacidad" className="hover:text-primary transition-colors">
            Privacidad
          </Link>
        </div>
        <span className="text-xs font-semibold text-muted-foreground/80">
          © 2026 ANDAMIARTE
        </span>
      </div>
    </footer>
  );
}
export function Empty({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty">
      <Users size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function RouteError() {
  return (
    <div className="page">
      <Empty
        title="No pudimos cargar esta información"
        description="Volvé a intentarlo en unos momentos."
      />
      <Button className="mt-5" onClick={() => window.location.reload()}>
        Volver a intentar
      </Button>
    </div>
  );
}
export function Avatar({
  name,
  path,
  small = false,
}: {
  name: string;
  path?: string | null | undefined;
  small?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useAvatar(path, setUrl);
  return url ? (
    <img className={`avatar ${small ? "small" : ""}`} src={url} alt={name} />
  ) : (
    <div className={`avatar ${small ? "small" : ""}`}>
      {name
        .trim()
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("") || "A"}
    </div>
  );
}
import { useEffect } from "react";
function useAvatar(path: string | null | undefined, setUrl: (url: string | null) => void) {
  useEffect(() => {
    let live = true;
    if (!path) {
      setUrl(null);
      return;
    }
    supabase.storage
      .from("profile-files")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (live) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      live = false;
    };
  }, [path, setUrl]);
}
