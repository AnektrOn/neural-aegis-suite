import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";
import {
  cacheUserMenuPrefs,
  mergeLegacySidebarHidden,
  migrateLegacyRadialArray,
  normalizeUserMenuPrefs,
  readCachedUserMenuPrefs,
  USER_MENU_PREFS_EVENT,
  type UserMenuPrefsV2,
} from "@/lib/userMenuPreferences";

function parseStoredMenuPrefs(
  mobileRadial: unknown,
  sidebarItems: unknown,
): UserMenuPrefsV2 {
  if (mobileRadial && typeof mobileRadial === "object" && !Array.isArray(mobileRadial)) {
    const prefs = normalizeUserMenuPrefs(mobileRadial);
    return mergeLegacySidebarHidden(prefs, sidebarItems);
  }
  if (Array.isArray(mobileRadial)) {
    const prefs = migrateLegacyRadialArray(mobileRadial);
    return mergeLegacySidebarHidden(prefs, sidebarItems);
  }
  const base = readCachedUserMenuPrefs();
  return mergeLegacySidebarHidden(base, sidebarItems);
}

export function useUserMenuPrefs() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<UserMenuPrefsV2>(() => readCachedUserMenuPrefs());

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("mobile_radial_menu, sidebar_items")
      .eq("id", user.id)
      .maybeSingle();
    if (error) return;
    const row = data as { mobile_radial_menu?: unknown; sidebar_items?: unknown } | null;
    const next = parseStoredMenuPrefs(row?.mobile_radial_menu, row?.sidebar_items);
    cacheUserMenuPrefs(next);
    setPrefs(next);
  }, [user]);

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
      const normalized = normalizeUserMenuPrefs(next);
      cacheUserMenuPrefs(normalized);
      setPrefs(normalized);
      window.dispatchEvent(new Event(USER_MENU_PREFS_EVENT));
      if (!user) return normalized;
      await supabase
        .from("profiles")
        .update({ mobile_radial_menu: normalized as unknown as Json })
        .eq("id", user.id);
      return normalized;
    },
    [user],
  );

  return { prefs, savePrefs, reload: load };
}
