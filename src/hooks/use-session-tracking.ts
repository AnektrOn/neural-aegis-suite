import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds

export function useSessionTracking() {
  const { user } = useAuth();
  const location = useLocation();
  const sessionId = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const startSession = async () => {
      const { data } = await supabase
        .from("user_sessions" as any)
        .insert({ user_id: user.id, page: location.pathname } as any)
        .select("id")
        .single();
      if (data) sessionId.current = (data as any).id;
    };

    startSession();

    const interval = setInterval(async () => {
      if (!sessionId.current) return;
      const now = new Date().toISOString();
      await supabase
        .from("user_sessions" as any)
        .update({ last_heartbeat: now, page: location.pathname } as any)
        .eq("id", sessionId.current);
    }, HEARTBEAT_INTERVAL);

    const endSession = async () => {
      if (!sessionId.current) return;
      const now = new Date().toISOString();
      await supabase
        .from("user_sessions" as any)
        .update({ ended_at: now, last_heartbeat: now } as any)
        .eq("id", sessionId.current);
      sessionId.current = null;
    };

    window.addEventListener("beforeunload", endSession);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", endSession);
      endSession();
    };
  }, [user]);

  // Update page on route change
  useEffect(() => {
    if (!sessionId.current || !user) return;
    supabase
      .from("user_sessions" as any)
      .update({ page: location.pathname } as any)
      .eq("id", sessionId.current);
  }, [location.pathname, user]);
}
