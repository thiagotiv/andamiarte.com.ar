import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type User = {
  id: string;
  email?: string;
  role?: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
  created_at?: string;
};

const SessionContext = createContext<{ user: User | null; ready: boolean }>({
  user: null,
  ready: false,
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: any) => {
      setUser(data?.user ?? null);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      setUser(session?.user ?? null);
      setReady(true);
      if (["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED"].includes(event)) {
        void router.invalidate();
        if (event !== "SIGNED_OUT") void qc.invalidateQueries();
      }
    });

    return () => subscription.unsubscribe();
  }, [router, qc]);

  return <SessionContext.Provider value={{ user, ready }}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
