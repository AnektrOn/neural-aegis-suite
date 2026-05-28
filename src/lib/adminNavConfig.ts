import type { LucideIcon } from "lucide-react";
import {
  Phone,
  Factory,
  Users,
  BarChart3,
  Building2,
  Package,
  Target,
  MessageSquare,
  Trophy,
  Bell,
  Map,
  Sparkles,
  AlertTriangle,
  Download,
  Video,
  Mail,
  LayoutDashboard,
  MapPin,
  FileText,
  Home,
  Zap,
  Eye,
} from "lucide-react";
import type { TranslationKey } from "@/i18n/translations";

export type AdminHubTabId =
  | "manage"
  | "stats"
  | "waiting"
  | "program"
  | "tags"
  | "userPlaces"
  | "report"
  | "scores"
  | "reportV2"
  | "analytics"
  | "executive"
  | "import"
  | "runes";

export type AdminNavLinkItem = {
  kind: "link";
  to: string;
  icon: LucideIcon;
  labelKey: TranslationKey;
};

export type AdminNavHubItem = {
  kind: "hub";
  to: string;
  icon: LucideIcon;
  labelKey: TranslationKey;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  defaultTab: AdminHubTabId;
  tabs: { id: AdminHubTabId; labelKey: TranslationKey }[];
};

export type AdminNavItem = AdminNavLinkItem | AdminNavHubItem;

export type AdminNavSection = {
  id: string;
  labelKey: TranslationKey;
  overviewKey: TranslationKey;
  overviewDescKey: TranslationKey;
  icon: LucideIcon;
  items: AdminNavItem[];
};

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    id: "overview",
    labelKey: "admin.nav.section.overview",
    overviewKey: "admin.overview.card.overview",
    overviewDescKey: "admin.overview.card.overviewDesc",
    icon: Home,
    items: [
      { kind: "link", to: "/admin", icon: Home, labelKey: "admin.nav.home" },
    ],
  },
  {
    id: "operations",
    labelKey: "admin.nav.section.operations",
    overviewKey: "admin.overview.card.operations",
    overviewDescKey: "admin.overview.card.operationsDesc",
    icon: Phone,
    items: [
      { kind: "link", to: "/admin/calls", icon: Phone, labelKey: "admin.nav.calls" },
      { kind: "link", to: "/admin/users", icon: Users, labelKey: "admin.nav.users" },
      { kind: "link", to: "/admin/companies", icon: Building2, labelKey: "admin.nav.companies" },
      { kind: "link", to: "/admin/habits", icon: Factory, labelKey: "admin.nav.habits" },
      { kind: "link", to: "/admin/alerts", icon: AlertTriangle, labelKey: "admin.nav.alerts" },
      { kind: "link", to: "/admin/export", icon: Download, labelKey: "admin.nav.export" },
    ],
  },
  {
    id: "programs",
    labelKey: "admin.nav.section.programs",
    overviewKey: "admin.overview.card.programs",
    overviewDescKey: "admin.overview.card.programsDesc",
    icon: Package,
    items: [
      {
        kind: "hub",
        to: "/admin/toolbox",
        icon: Package,
        labelKey: "admin.nav.toolbox",
        titleKey: "admin.hub.toolbox.title",
        descriptionKey: "admin.hub.toolbox.description",
        defaultTab: "manage",
        tabs: [
          { id: "manage", labelKey: "admin.hub.tab.toolboxManage" },
          { id: "waiting", labelKey: "admin.hub.tab.toolboxWaiting" },
          { id: "program", labelKey: "admin.hub.tab.toolboxProgram" },
        ],
      },
      {
        kind: "hub",
        to: "/admin/pulse",
        icon: Zap,
        labelKey: "admin.nav.pulse",
        titleKey: "admin.hub.pulse.title",
        descriptionKey: "admin.hub.pulse.description",
        defaultTab: "manage",
        tabs: [
          { id: "manage", labelKey: "admin.hub.tab.pulseManage" },
          { id: "stats", labelKey: "admin.hub.tab.pulseStats" },
          { id: "import", labelKey: "admin.hub.tab.pulseImport" },
          { id: "runes", labelKey: "admin.hub.tab.pulseRunes" },
        ],
      },
      { kind: "link", to: "/admin/video-library", icon: Video, labelKey: "admin.nav.videoLibrary" },
      { kind: "link", to: "/admin/cartography", icon: Map, labelKey: "admin.nav.cartography" },
      { kind: "link", to: "/admin/assessments", icon: Sparkles, labelKey: "admin.nav.assessments" },
      { kind: "link", to: "/admin/guest-preview", icon: Eye, labelKey: "admin.nav.guestPreview" },
    ],
  },
  {
    id: "deepDive",
    labelKey: "admin.nav.section.deepDive",
    overviewKey: "admin.overview.card.deepDive",
    overviewDescKey: "admin.overview.card.deepDiveDesc",
    icon: FileText,
    items: [
      {
        kind: "hub",
        to: "/admin/deep-dive",
        icon: FileText,
        labelKey: "admin.nav.deepDiveHub",
        titleKey: "admin.hub.deepDive.title",
        descriptionKey: "admin.hub.deepDive.description",
        defaultTab: "report",
        tabs: [
          { id: "report", labelKey: "admin.hub.tab.deepDiveReport" },
          { id: "scores", labelKey: "admin.hub.tab.deepDiveScores" },
          { id: "reportV2", labelKey: "admin.hub.tab.deepDiveReportV2" },
        ],
      },
    ],
  },
  {
    id: "engagement",
    labelKey: "admin.nav.section.engagement",
    overviewKey: "admin.overview.card.engagement",
    overviewDescKey: "admin.overview.card.engagementDesc",
    icon: MessageSquare,
    items: [
      { kind: "link", to: "/admin/decisions", icon: Target, labelKey: "admin.nav.decisions" },
      { kind: "link", to: "/admin/messages", icon: MessageSquare, labelKey: "admin.nav.messages" },
      { kind: "link", to: "/admin/newsletter", icon: Mail, labelKey: "admin.nav.newsletter" },
      { kind: "link", to: "/admin/scoreboard", icon: Trophy, labelKey: "admin.nav.scoreboard" },
    ],
  },
  {
    id: "insights",
    labelKey: "admin.nav.section.insights",
    overviewKey: "admin.overview.card.insights",
    overviewDescKey: "admin.overview.card.insightsDesc",
    icon: BarChart3,
    items: [
      {
        kind: "hub",
        to: "/admin/insights",
        icon: BarChart3,
        labelKey: "admin.nav.insights",
        titleKey: "admin.hub.insights.title",
        descriptionKey: "admin.hub.insights.description",
        defaultTab: "analytics",
        tabs: [
          { id: "analytics", labelKey: "admin.hub.tab.insightsAnalytics" },
          { id: "executive", labelKey: "admin.hub.tab.insightsExecutive" },
        ],
      },
    ],
  },
  {
    id: "settings",
    labelKey: "admin.nav.section.settings",
    overviewKey: "admin.overview.card.settings",
    overviewDescKey: "admin.overview.card.settingsDesc",
    icon: MapPin,
    items: [
      {
        kind: "hub",
        to: "/admin/places",
        icon: MapPin,
        labelKey: "admin.nav.places",
        titleKey: "admin.hub.places.title",
        descriptionKey: "admin.hub.places.description",
        defaultTab: "tags",
        tabs: [
          { id: "tags", labelKey: "admin.hub.tab.placesTags" },
          { id: "userPlaces", labelKey: "admin.hub.tab.placesUsers" },
        ],
      },
      { kind: "link", to: "/admin/notification-registry", icon: Bell, labelKey: "admin.nav.notificationRegistry" },
    ],
  },
];

/** Legacy paths → new hub URLs (query tab preserved where applicable). */
export const ADMIN_LEGACY_REDIRECTS: Record<string, string> = {
  "/admin/toolbox-waiting-confirmation": "/admin/toolbox?tab=waiting",
  "/admin/program-builder": "/admin/toolbox?tab=program",
  "/admin/place-tags": "/admin/places?tab=tags",
  "/admin/user-places": "/admin/places?tab=userPlaces",
  "/admin/deep-dive-sample": "/admin/deep-dive?tab=report",
  "/admin/deep-dive-v2": "/admin/deep-dive?tab=reportV2",
  "/admin/analytics": "/admin/insights?tab=analytics",
  "/admin/executive": "/admin/insights?tab=executive",
};

export const ADMIN_OVERVIEW_SECTIONS = ADMIN_NAV_SECTIONS.filter((s) => s.id !== "overview");

export function getHubItemByPath(pathname: string): AdminNavHubItem | undefined {
  for (const section of ADMIN_NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.kind === "hub" && pathname === item.to) return item;
    }
  }
  return undefined;
}

export function getNavItemByPath(pathname: string): AdminNavItem | undefined {
  for (const section of ADMIN_NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.to === pathname) return item;
    }
  }
  return undefined;
}

export function resolveHubTab(hub: AdminNavHubItem, tabParam: string | null): AdminHubTabId {
  const valid = hub.tabs.some((t) => t.id === tabParam);
  if (tabParam && valid) return tabParam as AdminHubTabId;
  return hub.defaultTab;
}

export function isAdminPathActive(pathname: string, item: AdminNavItem): boolean {
  if (item.kind === "link") {
    if (item.to === "/admin") return pathname === "/admin" || pathname === "/admin/";
    return pathname === item.to;
  }
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function getAdminPageMeta(
  pathname: string,
  search: string,
  t: (key: TranslationKey) => string,
): { title: string; subtitle?: string } {
  const params = new URLSearchParams(search);
  const tabParam = params.get("tab");

  const hub = getHubItemByPath(pathname);
  if (hub) {
    const tab = resolveHubTab(hub, tabParam);
    const tabDef = hub.tabs.find((x) => x.id === tab);
    return {
      title: t(hub.labelKey),
      subtitle: tabDef ? t(tabDef.labelKey) : undefined,
    };
  }

  const item = getNavItemByPath(pathname);
  if (item) {
    return { title: t(item.labelKey) };
  }

  if (pathname === "/admin" || pathname === "/admin/") {
    return { title: t("admin.nav.home") };
  }

  return { title: t("admin.nav.adminLabel") };
}

export function filterAdminNavSections(
  sections: AdminNavSection[],
  query: string,
  t: (key: TranslationKey) => string,
): AdminNavSection[] {
  const q = query.trim().toLowerCase();
  if (!q) return sections;

  return sections
    .map((section) => {
      const sectionLabel = t(section.labelKey).toLowerCase();
      const items = section.items.filter((item) => {
        const label = t(item.labelKey).toLowerCase();
        if (label.includes(q) || sectionLabel.includes(q)) return true;
        if (item.kind === "hub") {
          return item.tabs.some((tab) => t(tab.labelKey).toLowerCase().includes(q));
        }
        return false;
      });
      return items.length ? { ...section, items } : null;
    })
    .filter((s): s is AdminNavSection => s !== null);
}

export function firstRouteInSection(section: AdminNavSection): string {
  const first = section.items[0];
  if (!first) return "/admin";
  if (first.kind === "hub") return `${first.to}?tab=${first.defaultTab}`;
  return first.to;
}
