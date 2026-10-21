import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useSession } from "./session";

export interface ConnectButtonProps {
  targetUserId: string;
  targetName?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost" | "cta";
  label?: string;
}

export function ConnectButton({
  targetUserId,
  targetName,
  className,
  size = "default",
  variant = "default",
  label = "Enviar Mensaje",
}: ConnectButtonProps) {
  const { user } = useSession();

  if (user?.id === targetUserId) {
    return null;
  }

  const destination = user
    ? { to: "/mensajes" as const, search: { user: targetUserId, recipient: targetUserId } }
    : { to: "/login" as const };

  return (
    <Button
      asChild
      size={size}
      variant={variant}
      className={className}
      title={targetName ? `Chatear con ${targetName}` : "Enviar mensaje privado"}
    >
      <Link {...destination}>
        <MessageCircle size={15} className="mr-1.5 shrink-0" />
        <span>{label}</span>
      </Link>
    </Button>
  );
}

// Alias export para máxima compatibilidad
export const ChatButton = ConnectButton;
export const SendMessageButton = ConnectButton;
