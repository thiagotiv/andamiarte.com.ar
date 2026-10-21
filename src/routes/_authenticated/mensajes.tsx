import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Empty, RouteError } from "@/components/site-shell";
import { messageOptions, networkOptions, accountOptions, pageHead } from "@/lib/network";
import { supabase } from "@/integrations/supabase/client";
export const Route = createFileRoute("/_authenticated/mensajes")({
  validateSearch: (s: Record<string, unknown>): { recipient?: string; user?: string } => {
    const target =
      typeof s["user"] === "string"
        ? s["user"]
        : typeof s["recipient"] === "string"
          ? s["recipient"]
          : undefined;
    return {
      ...(target ? { user: target, recipient: target } : {}),
    };
  },
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(messageOptions),
      context.queryClient.ensureQueryData(accountOptions),
      context.queryClient.ensureQueryData(networkOptions),
    ]);
  },
  head: () =>
    pageHead(
      "Mensajes privados",
      "Conversaciones seguras entre profesionales, centros y familias de ACOMPAÑAME.",
    ),
  component: Messages,
  errorComponent: RouteError,
  notFoundComponent: RouteError,
});
function Messages() {
  const search = Route.useSearch();
  const { data: messages } = useSuspenseQuery(messageOptions);
  const { data: network } = useSuspenseQuery(networkOptions);
  const { data: account } = useSuspenseQuery(accountOptions);
  const id = account.profile?.id;
  const initialRecipient = search.user || search.recipient || "";
  const [recipient, setRecipient] = useState(initialRecipient);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const contacts = [
    ...new Set([
      ...messages.map((m: any) => (m.sender_id === id ? m.recipient_id : m.sender_id)),
      ...(initialRecipient ? [initialRecipient] : []),
    ]),
  ].filter((c) => c !== id);
  const name = (c: string) => network.profiles.find((p) => p.id === c)?.name || "Miembro de la red";
  async function send(e: FormEvent) {
    e.preventDefault();
    if (!id || !recipient || !content.trim()) return;
    setBusy(true);
    const r = await supabase
      .from("messages")
      .insert({ sender_id: id, recipient_id: recipient, content: content.trim() });
    if (r.error) toast.error(r.error.message);
    else {
      setContent("");
      await qc.invalidateQueries({ queryKey: ["messages"] });
    }
    setBusy(false);
  }
  return (
    <main className="page">
      <div className="eyebrow">
        <MessageCircle size={15} /> Vínculos cuidados
      </div>
      <h1>Mis mensajes</h1>
      <p className="page-description mb-8">Un espacio privado para conocerse y acompañar.</p>
      {!contacts.length ? (
        <Empty
          title="Cada conversación puede ser un comienzo"
          description="Encontrá un profesional en el directorio para iniciar un chat privado."
        />
      ) : (
        <div className="chat-layout">
          <aside className="chat-contacts">
            {contacts.map((c) => (
              <Button
                variant={recipient === c ? "secondary" : "ghost"}
                className="justify-start"
                key={c}
                onClick={() => setRecipient(c)}
              >
                {name(c)}
              </Button>
            ))}
          </aside>
          <div className="chat-main">
            {recipient ? (
              <>
                <h3 className="font-semibold mb-6">{name(recipient)}</h3>
                <div className="chat-content">
                  {messages
                    .filter(
                      (m: any) =>
                        (m.sender_id === id && m.recipient_id === recipient) ||
                        (m.sender_id === recipient && m.recipient_id === id),
                    )
                    .map((m: any) => (
                      <div key={m.id} className={`bubble ${m.sender_id === id ? "mine" : ""}`}>
                        {m.content}
                      </div>
                    ))}
                </div>
                <form className="chat-form" onSubmit={send}>
                  <input
                    className="field"
                    aria-label="Mensaje privado"
                    placeholder="Escribí un mensaje…"
                    maxLength={5000}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <Button
                    type="submit"
                    disabled={busy || !content.trim()}
                    title="Enviar mensaje"
                    size="icon"
                  >
                    <Send />
                  </Button>
                </form>
              </>
            ) : (
              <Empty
                title="Elegí una conversación"
                description="Tus mensajes solo son visibles para las personas de esta conversación."
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
