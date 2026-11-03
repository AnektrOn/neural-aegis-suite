import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/i18n/translations";
import {
  DEFAULT_DOCK_PANEL_IDS,
  DEFAULT_OVERFLOW_PANEL_IDS,
  getMenuPanel,
  isMenuPanelId,
  panelPathIsActive,
  type MenuPanelId,
} from "@/lib/userMenuCatalog";

/** @deprecated Use MenuPanelId from userMenuCatalog. Kept for gradual migration. */
export type MobileRadialMenuId = MenuPanelId;

export const MOBILE_RADIAL_CATALOG_ORDER = [
  "home",
  "capture_hub",
  "mood",
  "habits",
  "journal",
  "decisions",
  "people",
  "portrait_hub",
  "persona",
  "analytics",
  "calendar",
  "pratiques_hub",
  "toolbox",
  "pulse",
  "bibliotheque",
  "dien_chan",
  "messages_hub",
  "messages",
  "newsletter",
  "ambassadeur",
  "install",
  "settings",
  "profile",
] as const satisfies readonly MenuPanelId[];

export const DEFAULT_MOBILE_RADIAL_MENU_IDS: MenuPanelId[] = [
  ...DEFAULT_DOCK_PANEL_IDS,
  ...DEFAULT_OVERFLOW_PANEL_IDS,
];

export const RADIAL_CATALOG: Record<
  MenuPanelId,
  { to: string; icon: LucideIcon; labelKey: TranslationKey }
> = Object.fromEntries(
  MOBILE_RADIAL_CATALOG_ORDER.map((id) => {
    const p = getMenuPanel(id);
    return [id, { to: p.to, icon: p.icon, labelKey: p.labelKey }];
  }),
) as Record<MenuPanelId, { to: string; icon: LucideIcon; labelKey: TranslationKey }>;

const ALLOWED = new Set<string>(MOBILE_RADIAL_CATALOG_ORDER);

/** @deprecated Use normalizeUserMenuPrefs. */
export function orderSelectedRadialIds(saved: unknown): MenuPanelId[] {
  if (!Array.isArray(saved) || saved.length === 0) return [...DEFAULT_MOBILE_RADIAL_MENU_IDS];
  const out: MenuPanelId[] = [];
  const seen = new Set<string>();
  for (const raw of saved) {
    if (typeof raw !== "string") continue;
    const id = raw === "home" || raw === "/" ? "home" : raw;
    if (!ALLOWED.has(id) || seen.has(id)) continue;
    if (id === "meditation" || id === "deep_dive" || id === "deep_dive_scores") continue;
    seen.add(id);
    out.push(id as MenuPanelId);
  }
  if (out.length < 1) return [...DEFAULT_MOBILE_RADIAL_MENU_IDS];
  return out;
}

export function radialPathIsActive(pathname: string, to: string): boolean {
  return panelPathIsActive(pathname, to);
}

export { isMenuPanelId };
