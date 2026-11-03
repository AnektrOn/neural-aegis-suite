import { getAllMenuPanels } from "@/lib/userMenuCatalog";

/** Legacy sidebar paths (migration from sidebar_items). */
export const SIDEBAR_ITEM_IDS: string[] = getAllMenuPanels()
  .filter((p) => !p.navExcluded && !p.accountUtility && !p.isHubIndex)
  .map((p) => p.to);

/** Routes the user could hide in legacy sidebar (dashboard + settings locked). */
export const SIDEBAR_LOCKED_IDS: string[] = ["/dashboard", "/settings"];

export const DEFAULT_SIDEBAR_ITEMS: string[] = [...SIDEBAR_ITEM_IDS];

const ALLOWED = new Set(SIDEBAR_ITEM_IDS);

/** @deprecated Use userMenuPreferences hidden panels. */
export function normalizeSidebarItems(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_SIDEBAR_ITEMS];
  const set = new Set(raw.filter((v): v is string => typeof v === "string" && ALLOWED.has(v)));
  SIDEBAR_LOCKED_IDS.forEach((id) => set.add(id));
  const ordered = SIDEBAR_ITEM_IDS.filter((id) => set.has(id));
  return ordered.length ? ordered : [...DEFAULT_SIDEBAR_ITEMS];
}

export const SIDEBAR_PREFS_EVENT = "aegis:sidebar-items-updated";
export const SIDEBAR_PREFS_STORAGE_KEY = "aegis-sidebar-items";

/** @deprecated */
export function readCachedSidebarItems(): string[] {
  try {
    const raw = localStorage.getItem(SIDEBAR_PREFS_STORAGE_KEY);
    if (raw) return normalizeSidebarItems(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return [...DEFAULT_SIDEBAR_ITEMS];
}

/** @deprecated */
export function cacheSidebarItems(items: string[]) {
  try {
    localStorage.setItem(SIDEBAR_PREFS_STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}
