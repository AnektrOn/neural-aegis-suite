import {
  DEFAULT_DOCK_PANEL_IDS,
  DEFAULT_OVERFLOW_PANEL_IDS,
  getMenuPanel,
  isMenuPanelId,
  LEGACY_RADIAL_TO_PANEL,
  MENU_PANELS_LOCKED,
  type MenuPanelId,
} from "@/lib/userMenuCatalog";

export type UserMenuPrefsV2 = {
  v: 2;
  dock: MenuPanelId[];
  overflow: MenuPanelId[];
  hidden: MenuPanelId[];
};

export const USER_MENU_PREFS_EVENT = "aegis:user-menu-updated";
export const USER_MENU_PREFS_STORAGE_KEY = "aegis-user-menu-prefs";

const MAX_DOCK = 4;
const MAX_OVERFLOW = 20;

export function defaultUserMenuPrefs(): UserMenuPrefsV2 {
  return {
    v: 2,
    dock: [...DEFAULT_DOCK_PANEL_IDS],
    overflow: [...DEFAULT_OVERFLOW_PANEL_IDS],
    hidden: [],
  };
}

function dedupe(ids: MenuPanelId[]): MenuPanelId[] {
  const out: MenuPanelId[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function stripLockedHidden(hidden: MenuPanelId[]): MenuPanelId[] {
  const locked = new Set(MENU_PANELS_LOCKED);
  return hidden.filter((id) => !locked.has(id));
}

function normalizeDock(raw: unknown): MenuPanelId[] {
  if (!Array.isArray(raw)) return [...DEFAULT_DOCK_PANEL_IDS];
  const out: MenuPanelId[] = [];
  for (const item of raw) {
    if (typeof item !== "string" || !isMenuPanelId(item)) continue;
    const def = getMenuPanel(item);
    if (!def.dockEligible || def.navExcluded) continue;
    out.push(item);
    if (out.length >= MAX_DOCK) break;
  }
  if (out.length < 1) return [...DEFAULT_DOCK_PANEL_IDS];
  while (out.length < MAX_DOCK) {
    const next = DEFAULT_DOCK_PANEL_IDS.find((id) => !out.includes(id));
    if (!next) break;
    out.push(next);
  }
  return out.slice(0, MAX_DOCK);
}

function normalizeOverflow(raw: unknown, dock: MenuPanelId[]): MenuPanelId[] {
  const dockSet = new Set(dock);
  if (!Array.isArray(raw)) return DEFAULT_OVERFLOW_PANEL_IDS.filter((id) => !dockSet.has(id));
  const out: MenuPanelId[] = [];
  for (const item of raw) {
    if (typeof item !== "string" || !isMenuPanelId(item)) continue;
    const def = getMenuPanel(item);
    if (!def.overflowEligible || def.navExcluded || dockSet.has(item)) continue;
    out.push(item);
    if (out.length >= MAX_OVERFLOW) break;
  }
  if (out.length < 1) {
    return DEFAULT_OVERFLOW_PANEL_IDS.filter((id) => !dockSet.has(id));
  }
  return out;
}

function normalizeHidden(raw: unknown): MenuPanelId[] {
  if (!Array.isArray(raw)) return [];
  const out: MenuPanelId[] = [];
  for (const item of raw) {
    if (typeof item !== "string" || !isMenuPanelId(item)) continue;
    const def = getMenuPanel(item);
    if (!def.hideable) continue;
    out.push(item);
  }
  return stripLockedHidden(dedupe(out));
}

export function normalizeUserMenuPrefs(raw: unknown): UserMenuPrefsV2 {
  if (raw && typeof raw === "object" && !Array.isArray(raw) && (raw as UserMenuPrefsV2).v === 2) {
    const o = raw as UserMenuPrefsV2;
    const dock = normalizeDock(o.dock);
    return {
      v: 2,
      dock,
      overflow: normalizeOverflow(o.overflow, dock),
      hidden: normalizeHidden(o.hidden),
    };
  }

  if (Array.isArray(raw)) {
    return migrateLegacyRadialArray(raw);
  }

  return defaultUserMenuPrefs();
}

/** `mobile_radial_menu` legacy: string[] of radial ids. */
export function migrateLegacyRadialArray(saved: unknown[]): UserMenuPrefsV2 {
  const overflow: MenuPanelId[] = [];
  for (const raw of saved) {
    if (typeof raw !== "string") continue;
    const mapped = LEGACY_RADIAL_TO_PANEL[raw];
    if (mapped) overflow.push(mapped);
  }
  const dock = normalizeDock(DEFAULT_DOCK_PANEL_IDS);
  const dockSet = new Set(dock);
  const mergedOverflow = dedupe([
    ...overflow.filter((id) => !dockSet.has(id)),
    ...DEFAULT_OVERFLOW_PANEL_IDS.filter((id) => !dockSet.has(id) && !overflow.includes(id)),
  ]);
  return {
    v: 2,
    dock,
    overflow: normalizeOverflow(mergedOverflow, dock),
    hidden: [],
  };
}

/** Only routes offered by the old sidebar can represent legacy exclusions. */
const LEGACY_SIDEBAR_PATHS = [
  "/dashboard", "/mood", "/habits", "/journal", "/decisions", "/persona",
  "/analytics", "/pulse", "/deep-dive", "/deep-dive/scores", "/people",
  "/calendar", "/pratiques", "/toolbox", "/meditation", "/bibliotheque",
  "/messages", "/newsletter", "/install-android", "/settings", "/ambassadeur", "/profile",
];

/** V2 is authoritative; legacy exclusions are applied only during migration. */
export function parseStoredMenuPrefs(mobileRadial: unknown, sidebarItems: unknown): UserMenuPrefsV2 {
  if (mobileRadial && typeof mobileRadial === "object" && !Array.isArray(mobileRadial) &&
      "v" in mobileRadial && mobileRadial.v === 2) {
    return normalizeUserMenuPrefs(mobileRadial);
  }
  const base = Array.isArray(mobileRadial)
    ? migrateLegacyRadialArray(mobileRadial)
    : readCachedUserMenuPrefs();
  return mergeLegacySidebarHidden(base, sidebarItems);
}

/** Merge legacy `sidebar_items` (route paths) into hidden panels. */
export function mergeLegacySidebarHidden(
  prefs: UserMenuPrefsV2,
  sidebarItems: unknown,
): UserMenuPrefsV2 {
  if (!Array.isArray(sidebarItems)) return prefs;
  const enabledPaths = new Set(
    sidebarItems.filter((v): v is string => typeof v === "string"),
  );
  const hiddenFromSidebar: MenuPanelId[] = [];
  for (const path of LEGACY_SIDEBAR_PATHS) {
    if (enabledPaths.has(path)) continue;
    const panel = pathToPanelId(path);
    if (panel && getMenuPanel(panel).hideable) hiddenFromSidebar.push(panel);
  }
  if (hiddenFromSidebar.length === 0) return prefs;
  return {
    ...prefs,
    hidden: dedupe([...prefs.hidden, ...hiddenFromSidebar]),
  };
}

function pathToPanelId(path: string): MenuPanelId | null {
  const map: Record<string, MenuPanelId> = {
    "/dashboard": "home",
    "/capture": "capture_hub",
    "/mood": "mood",
    "/habits": "habits",
    "/journal": "journal",
    "/decisions": "decisions",
    "/people": "people",
    "/persona": "persona",
    "/analytics": "analytics",
    "/calendar": "calendar",
    "/pratiques": "pratiques_hub",
    "/toolbox": "toolbox",
    "/pulse": "pulse",
    "/bibliotheque": "bibliotheque",
    "/pratiques/dien-chan": "dien_chan",
    "/messages": "messages",
    "/newsletter": "newsletter",
    "/ambassadeur": "ambassadeur",
    "/install-android": "install",
  };
  return map[path] ?? null;
}

export function isPanelVisible(prefs: UserMenuPrefsV2, id: MenuPanelId): boolean {
  if (MENU_PANELS_LOCKED.includes(id)) return true;
  return !prefs.hidden.includes(id);
}

export function visibleDockPanels(prefs: UserMenuPrefsV2): MenuPanelId[] {
  return prefs.dock.filter((id) => isPanelVisible(prefs, id));
}

export function visibleOverflowPanels(prefs: UserMenuPrefsV2): MenuPanelId[] {
  return prefs.overflow.filter((id) => isPanelVisible(prefs, id));
}

export function readCachedUserMenuPrefs(): UserMenuPrefsV2 {
  try {
    const raw = localStorage.getItem(USER_MENU_PREFS_STORAGE_KEY);
    if (raw) return normalizeUserMenuPrefs(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return defaultUserMenuPrefs();
}

export function cacheUserMenuPrefs(prefs: UserMenuPrefsV2) {
  try {
    localStorage.setItem(USER_MENU_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}
