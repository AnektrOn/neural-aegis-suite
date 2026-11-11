import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/use-admin";
import type { Json } from "@/integrations/supabase/types";
import {
  applyMemberOverflowBaseline,
  cacheUserMenuPrefs,
  MEMBER_OVERFLOW_BASELINE,
  normalizeUserMenuPrefs,
  parseStoredMenuPrefs,
  readCachedUserMenuPrefs,
  USER_MENU_PREFS_EVENT,
  type UserMenuPrefsV2,
} from "@/lib/userMenuPreferences";

export function useUserMenuPrefs() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [prefs, setPrefs] = useState<UserMenuPrefsV2>(() => readCachedUserMenuPrefs());

  const load = useCallback(async () => {
    if (!user || adminLoading) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("mobile_radial_menu, sidebar_items")
      .eq("id", user.id)
      .maybeSingle();
    if (error) return;
    const row = data as { mobile_radial_menu?: unknown; sidebar_items?: unknown } | null;
    const parsed = parseStoredMenuPrefs(row?.mobile_radial_menu, row?.sidebar_items);
    const { prefs: next, migrated } = applyMemberOverflowBaseline(parsed, isAdmin);
    cacheUserMenuPrefs(next);
    setPrefs(next);
    if (!migrated) return;
    await supabase
      .from("profiles")
      .update({ mobile_radial_menu: next as unknown as Json })
      .eq("id", user.id);
  }, [user, isAdmin, adminLoading]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onUpdate = () => setPrefs(readCachedUserMenuPrefs());
    window.addEventListener(USER_MENU_PREFS_EVENT, onUpdate);
    return () => window.removeEventListener(USER_MENU_PREFS_EVENT, onUpdate);
  }, []);

  const savePrefs = useCallback(
    async (next: UserMenuPrefsV2) => {
      const normalized = normalizeUserMenuPrefs({
        ...next,
        overflowBaseline: MEMBER_OVERFLOW_BASELINE,
      });
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .update({ mobile_radial_menu: normalized as unknown as Json })
        .eq("id", user.id)
        .select("id")
        .single();
      if (error) throw error;
      cacheUserMenuPrefs(normalized);
      setPrefs(normalized);
      window.dispatchEvent(new Event(USER_MENU_PREFS_EVENT));
      return normalized;
    },
    [user],
  );

  return { prefs, savePrefs, reload: load };
}
