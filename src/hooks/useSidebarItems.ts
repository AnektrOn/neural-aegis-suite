import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  cacheSidebarItems,
  normalizeSidebarItems,
  readCachedSidebarItems,
  SIDEBAR_PREFS_EVENT,
} from "@/lib/sidebarPreferences";

/** User preference for which sidebar entries are visible (desktop & tablet). */
export function useSidebarItems() {
  const { user } = useAuth();
  const [items, setItems] = useState<string[]>(() => readCachedSidebarItems());

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("sidebar_items")
      .eq("id", user.id)
      .maybeSingle();
    if (error) return;
    const raw = (data as { sidebar_items?: unknown } | null)?.sidebar_items;
    if (raw == null) return;
    const next = normalizeSidebarItems(raw);
    cacheSidebarItems(next);
    setItems(next);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onUpdate = () => setItems(readCachedSidebarItems());
    window.addEventListener(SIDEBAR_PREFS_EVENT, onUpdate);
    return () => window.removeEventListener(SIDEBAR_PREFS_EVENT, onUpdate);
  }, []);

  return items;
}
