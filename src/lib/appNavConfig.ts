import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/i18n/translations";
import {
  getAllMenuPanels,
  getMenuPanel,
  hubSidebarNavItems,
  panelPathIsActive,
  type AppHubId,
  type MenuPanelId,
} from "@/lib/userMenuCatalog";

export type AppNavItem = {
  to: string;
  icon: LucideIcon;
  labelKey: TranslationKey;
  panelId?: MenuPanelId;
};

export type AppNavSection = {
  id: AppHubId;
  labelKey: TranslationKey;
  items: AppNavItem[];
};

const HUB_LABEL: Record<AppHubId, TranslationKey> = {
  capture: "menu.hub.capture",
  portrait: "menu.hub.portrait",
  pratiques: "menu.hub.pratiques",
  messages: "menu.hub.messages",
};

/** Desktop sidebar: exactly 4 hub index routes. */
export const APP_NAV_SECTIONS: AppNavSection[] = (["capture", "portrait", "pratiques", "messages"] as AppHubId[]).map(
  (hub) => {
    const hubPanel = hubSidebarNavItems().find((p) => p.hub === hub && p.isHubIndex)!;
    return {
      id: hub,
      labelKey: HUB_LABEL[hub],
      items: [
        {
          to: hubPanel.to,
          icon: hubPanel.icon,
          labelKey: hubPanel.labelKey,
          panelId: hubPanel.id,
        },
      ],
    };
  },
);

const EXTRA_ROUTES: { prefix: string; labelKey: TranslationKey; sectionKey?: TranslationKey; hub?: AppHubId }[] = [
  { prefix: "/dashboard", labelKey: "nav.dashboard" },
  { prefix: "/capture", labelKey: "menu.hub.capture", sectionKey: "menu.hub.capture", hub: "capture" },
  { prefix: "/meditation", labelKey: "nav.meditation", hub: "pratiques" },
  { prefix: "/pratiques/dien-chan", labelKey: "hub.feature.dienchan", sectionKey: "menu.hub.pratiques", hub: "pratiques" },
  { prefix: "/onboarding/assessment", labelKey: "nav.profile", sectionKey: "menu.hub.portrait", hub: "portrait" },
  { prefix: "/onboarding/results", labelKey: "nav.profile", sectionKey: "menu.hub.portrait", hub: "portrait" },
  { prefix: "/cartographie", labelKey: "cartography.defaultTitle", sectionKey: "menu.hub.portrait", hub: "portrait" },
  { prefix: "/deep-dive", labelKey: "nav.deepDive", hub: "portrait" },
  { prefix: "/settings", labelKey: "nav.settings" },
  { prefix: "/profile", labelKey: "nav.account" },
];

export type AppPageMeta = {
  titleKey: TranslationKey;
  sectionKey?: TranslationKey;
};

export function getNavItemByPath(pathname: string): { item: AppNavItem; section: AppNavSection } | null {
  for (const section of APP_NAV_SECTIONS) {
    const item = section.items.find((i) => i.to === pathname);
    if (item) return { item, section };
  }
  return null;
}

function metaForPanelPath(pathname: string): AppPageMeta | null {
  for (const panel of getAllMenuPanels()) {
    if (panel.navExcluded) continue;
    if (panelPathIsActive(pathname, panel.to)) {
      const sectionKey = panel.hub ? HUB_LABEL[panel.hub] : undefined;
      return { titleKey: panel.labelKey, sectionKey };
    }
  }
  return null;
}

export function getAppPageMeta(pathname: string): AppPageMeta {
  const exact = getNavItemByPath(pathname);
  if (exact) {
    return { titleKey: exact.item.labelKey, sectionKey: exact.section.labelKey };
  }

  const fromPanel = metaForPanelPath(pathname);
  if (fromPanel) return fromPanel;

  const extra = EXTRA_ROUTES.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  if (extra) {
    return {
      titleKey: extra.labelKey,
      sectionKey: extra.sectionKey ?? (extra.hub ? HUB_LABEL[extra.hub] : undefined),
    };
  }

  return { titleKey: "nav.dashboard" };
}

export function filterAppNavSections(
  sections: AppNavSection[],
  query: string,
  t: (key: TranslationKey) => string,
): AppNavSection[] {
  const q = query.trim().toLowerCase();
  if (!q) return sections;

  return sections
    .map((section) => {
      const sectionLabel = t(section.labelKey).toLowerCase();
      const items = section.items.filter((item) => {
        const label = t(item.labelKey).toLowerCase();
        return label.includes(q) || sectionLabel.includes(q);
      });
      return items.length ? { ...section, items } : null;
    })
    .filter((s): s is AppNavSection => s !== null);
}

/** Command palette entries (panels only, respects visibility elsewhere). */
export function commandPalettePanels(hidden: MenuPanelId[]): AppNavItem[] {
  const hiddenSet = new Set(hidden);
  return getAllMenuPanels()
    .filter((p) => p.commandPaletteEligible && !p.navExcluded && !hiddenSet.has(p.id))
    .map((p) => ({
      to: p.to,
      icon: p.icon,
      labelKey: p.labelKey,
      panelId: p.id,
    }));
}

export { getMenuPanel, panelPathIsActive };
