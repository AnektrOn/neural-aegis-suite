import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/** Features épinglables depuis le hub Pratiques vers le menu latéral. */
export type HubFeatureId = "habits" | "toolbox" | "pulse";

export const HUB_FEATURES: HubFeatureId[] = ["habits", "toolbox", "pulse"];

const STORAGE_KEY = "aegis-hub-menu-feature";
export const HUB_FEATURE_EVENT = "aegis:hub-menu-feature-updated";

export function readCachedHubFeature(): HubFeatureId | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw && (HUB_FEATURES as string[]).includes(raw) ? (raw as HubFeatureId) : null;
  } catch {
    return null;
  }
}

function cacheHubFeature(next: HubFeatureId | null) {
  try {
    if (next) localStorage.setItem(STORAGE_KEY, next);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Préférence utilisateur : quelle pratique du hub est épinglée dans le menu. */
export function useHubMenuFeature() {
  const { user } = useAuth();
  const [feature, setFeatureState] = useState<HubFeatureId | null>(() => readCachedHubFeature());

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("hub_menu_feature")
        .eq("id", user.id)
        .maybeSingle();
      const raw = (data as { hub_menu_feature?: unknown } | null)?.hub_menu_feature;
      const next =
        typeof raw === "string" && (HUB_FEATURES as string[]).includes(raw)
          ? (raw as HubFeatureId)
          : null;
      cacheHubFeature(next);
      setFeatureState(next);
    })();
  }, [user]);

  useEffect(() => {
    const onUpdate = () => setFeatureState(readCachedHubFeature());
    window.addEventListener(HUB_FEATURE_EVENT, onUpdate);
    return () => window.removeEventListener(HUB_FEATURE_EVENT, onUpdate);
  }, []);

  const setFeature = useCallback(
    async (next: HubFeatureId | null) => {
      cacheHubFeature(next);
      setFeatureState(next);
      window.dispatchEvent(new Event(HUB_FEATURE_EVENT));
      if (!user) return;
      await supabase
        .from("profiles")
        .update({ hub_menu_feature: next } as never)
        .eq("id", user.id);
    },
    [user],
  );

  return { feature, setFeature };
}
