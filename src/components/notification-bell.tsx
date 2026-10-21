import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { notificationsOptions } from "@/lib/network";
import { unreadCount } from "@/lib/job-alerts";
import { supabase } from "@/integrations/supabase/client";

export function NotificationBell({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery(notificationsOptions);
  const unread = unreadCount(data);
  useEffect(() => {
    const ch = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [userId, qc]);
  async function markAll() {
    if (!unread) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null).eq("user_id", userId);
    await qc.invalidateQueries({ queryKey: ["notifications"] });
  }
  return (
    <Popover onOpenChange={(o) => { if (!o) void markAll(); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="bell" title="Notificaciones" aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ""}`}>
          <Bell />
          {unread > 0 && <span className="bell-count">{unread > 9 ? "9+" : unread}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="notif-panel">
        <div className="notif-head"><strong>Notificaciones</strong>{unread > 0 && <button type="button" onClick={markAll}>Marcar como leídas</button>}</div>
        {data.length ? (
          <ul>
            {data.map((n: any) => (
              <li key={n.id} className={n.read_at ? "" : "unread"}>
                <Link to={("link" in n && typeof n.link === "string" && n.link) ? n.link : "/busquedas"}>
                  <strong>{n.title}</strong>
                  <span>{n.body}</span>
                  <small>{new Date(n.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}</small>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="notif-empty">Todavía no tenés avisos. Configurá tus alertas de empleo en Mi perfil.</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
