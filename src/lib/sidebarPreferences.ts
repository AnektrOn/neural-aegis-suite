import { APP_NAV_SECTIONS } from "@/lib/appNavConfig";

/** Sidebar item ids are the route paths declared in APP_NAV_SECTIONS. */
export const SIDEBAR_ITEM_IDS: string[] = APP_NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.to));

/** Routes the user can never hide (needed to reach settings / account). */
export const SIDEBAR_LOCKED_IDS: string[] = ["/dashboard", "/settings"];

export const DEFAULT_SIDEBAR_ITEMS: string[] = [...SIDEBAR_ITEM_IDS];

const ALLOWED = new Set(SIDEBAR_ITEM_IDS);

export function normalizeSidebarItems(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_SIDEBAR_ITEMS];
  const set = new Set(raw.filter((v): v is string => typeof v === "string" && ALLOWED.has(v)));
  SIDEBAR_LOCKED_IDS.forEach((id) => set.add(id));
  const ordered = SIDEBAR_ITEM_IDS.filter((id) => set.has(id));
  return ordered.length ? ordered : [...DEFAULT_SIDEBAR_ITEMS];
}

export const SIDEBAR_PREFS_EVENT = "aegis:sidebar-items-updated";
export const SIDEBAR_PREFS_STORAGE_KEY = "aegis-sidebar-items";

export function readCachedSidebarItems(): string[] {
  try {
    const raw = localStorage.getItem(SIDEBAR_PREFS_STORAGE_KEY);
    if (raw) return normalizeSidebarItems(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return [...DEFAULT_SIDEBAR_ITEMS];
}

export function cacheSidebarItems(items: string[]) {
  try {
    localStorage.setItem(SIDEBAR_PREFS_STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}
