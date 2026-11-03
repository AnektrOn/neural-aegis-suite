import { useEffect, useState } from "react";
import {
  isPanelVisible,
  readCachedUserMenuPrefs,
  USER_MENU_PREFS_EVENT,
} from "@/lib/userMenuPreferences";
import { getAllMenuPanels } from "@/lib/userMenuCatalog";

/** Enabled panel routes (legacy shape for components migrating to useUserMenuPrefs). */
export function useSidebarItems(): string[] {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onUpdate = () => setTick((n) => n + 1);
    window.addEventListener(USER_MENU_PREFS_EVENT, onUpdate);
    return () => window.removeEventListener(USER_MENU_PREFS_EVENT, onUpdate);
  }, []);

  void tick;
  const prefs = readCachedUserMenuPrefs();
  return getAllMenuPanels()
    .filter((p) => !p.navExcluded && isPanelVisible(prefs, p.id))
    .map((p) => p.to);
}
