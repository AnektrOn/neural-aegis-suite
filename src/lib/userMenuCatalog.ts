import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Brain,
  Target,
  ListChecks,
  Headphones,
  Users,
  PenLine,
  Library,
  BarChart3,
  CalendarDays,
  Smartphone,
  UserCircle,
  Settings2,
  Sparkles,
  Mail,
  Handshake,
  MessageSquare,
  Compass,
  ScanFace,
  Inbox,
  ClipboardList,
  Orbit,
} from "lucide-react";
import type { TranslationKey } from "@/i18n/translations";

export type AppHubId = "capture" | "portrait" | "pratiques" | "messages";

export const MENU_PANEL_ORDER = [
  "welcome",
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
] as const;

export type MenuPanelId = (typeof MENU_PANEL_ORDER)[number];

export type MenuPanelDef = {
  id: MenuPanelId;
  to: string;
  icon: LucideIcon;
  labelKey: TranslationKey;
  hub?: AppHubId;
  /** Hub index route (sidebar desktop). */
  isHubIndex?: boolean;
  accountUtility?: boolean;
  dockEligible?: boolean;
  overflowEligible?: boolean;
  hideable?: boolean;
  /** Not in dock/overflow/catalog editors; route may still exist. */
  navExcluded?: boolean;
  commandPaletteEligible?: boolean;
};

const PANELS: Record<MenuPanelId, MenuPanelDef> = {
  welcome: {
    id: "welcome",
    to: "/welcome",
    icon: Orbit,
    labelKey: "nav.welcome",
    dockEligible: true,
    overflowEligible: true,
    hideable: true,
    commandPaletteEligible: true,
  },
  home: {
    id: "home",
    to: "/dashboard",
    icon: LayoutDashboard,
    labelKey: "nav.dashboard",
    dockEligible: true,
    overflowEligible: true,
    hideable: false,
    commandPaletteEligible: true,
  },
  capture_hub: {
    id: "capture_hub",
    to: "/capture",
    icon: ClipboardList,
    labelKey: "menu.hub.capture",
    hub: "capture",
    isHubIndex: true,
    dockEligible: false,
    overflowEligible: true,
    hideable: false,
    commandPaletteEligible: true,
  },
  mood: {
    id: "mood",
    to: "/mood",
    icon: Brain,
    labelKey: "nav.mood",
    hub: "capture",
    dockEligible: true,
    overflowEligible: true,
    hideable: true,
    commandPaletteEligible: true,
  },
  habits: {
    id: "habits",
    to: "/habits",
    icon: ListChecks,
    labelKey: "nav.habits",
    hub: "capture",
    dockEligible: true,
    overflowEligible: true,
    hideable: true,
    commandPaletteEligible: true,
  },
  journal: {
    id: "journal",
    to: "/journal",
    icon: PenLine,
    labelKey: "nav.journal",
    hub: "capture",
    dockEligible: true,
    overflowEligible: true,
    hideable: true,
    commandPaletteEligible: true,
  },
  decisions: {
    id: "decisions",
    to: "/decisions",
    icon: Target,
    labelKey: "nav.decisions",
    hub: "capture",
    dockEligible: true,
    overflowEligible: true,
    hideable: true,
    commandPaletteEligible: true,
  },
  people: {
    id: "people",
    to: "/people",
    icon: Users,
    labelKey: "nav.people",
    hub: "capture",
    dockEligible: true,
    overflowEligible: true,
    hideable: true,
    commandPaletteEligible: true,
  },
  portrait_hub: {
    id: "portrait_hub",
    to: "/persona",
    icon: Sparkles,
    labelKey: "menu.hub.portrait",
    hub: "portrait",
    isHubIndex: true,
    dockEligible: false,
    overflowEligible: true,
    hideable: false,
    commandPaletteEligible: true,
  },
  persona: {
    id: "persona",
    to: "/persona",
    icon: Sparkles,
    labelKey: "nav.profile",
    hub: "portrait",
    dockEligible: true,
    overflowEligible: true,
    hideable: true,
    commandPaletteEligible: true,
  },
  analytics: {
    id: "analytics",
    to: "/analytics",
    icon: BarChart3,
    labelKey: "nav.analytics",
    hub: "portrait",
    dockEligible: true,
    overflowEligible: true,
    hideable: true,
    commandPaletteEligible: true,
  },
  calendar: {
    id: "calendar",
    to: "/calendar",
    icon: CalendarDays,
    labelKey: "nav.calendar",
    hub: "portrait",
    dockEligible: true,
    overflowEligible: true,
    hideable: true,
    commandPaletteEligible: true,
  },
  pratiques_hub: {
    id: "pratiques_hub",
    to: "/pratiques",
    icon: Compass,
    labelKey: "menu.hub.pratiques",
    hub: "pratiques",
    isHubIndex: true,
    dockEligible: false,
    overflowEligible: true,
    hideable: false,
    commandPaletteEligible: true,
  },
  toolbox: {
    id: "toolbox",
    to: "/toolbox",
    icon: Headphones,
    labelKey: "nav.toolbox",
    hub: "pratiques",
    dockEligible: true,
    overflowEligible: true,
    hideable: true,
    commandPaletteEligible: true,
  },
  pulse: {
    id: "pulse",
    to: "/pulse",
    icon: Sparkles,
    labelKey: "nav.pulse",
    hub: "pratiques",
    dockEligible: true,
    overflowEligible: true,
    hideable: true,
    commandPaletteEligible: true,
  },
  bibliotheque: {
    id: "bibliotheque",
    to: "/bibliotheque",
    icon: Library,
    labelKey: "nav.bibliotheque",
    hub: "pratiques",
    dockEligible: true,
    overflowEligible: true,
    hideable: true,
    commandPaletteEligible: true,
  },
  dien_chan: {
    id: "dien_chan",
    to: "/pratiques/dien-chan",
    icon: ScanFace,
    labelKey: "hub.feature.dienchan",
    hub: "pratiques",
    dockEligible: true,
    overflowEligible: true,
    hideable: true,
    commandPaletteEligible: true,
  },
  messages_hub: {
    id: "messages_hub",
    to: "/messages",
    icon: Inbox,
    labelKey: "menu.hub.messages",
    hub: "messages",
    isHubIndex: true,
    dockEligible: false,
    overflowEligible: true,
    hideable: false,
    commandPaletteEligible: true,
  },
  messages: {
    id: "messages",
    to: "/messages",
    icon: MessageSquare,
    labelKey: "nav.messages",
    hub: "messages",
    dockEligible: true,
    overflowEligible: true,
    hideable: true,
    commandPaletteEligible: true,
  },
  newsletter: {
    id: "newsletter",
    to: "/newsletter",
    icon: Mail,
    labelKey: "nav.newsletter",
    hub: "messages",
    dockEligible: true,
    overflowEligible: true,
    hideable: true,
    commandPaletteEligible: true,
  },
  ambassadeur: {
    id: "ambassadeur",
    to: "/ambassadeur",
    icon: Handshake,
    labelKey: "nav.ambassador",
    hub: "messages",
    dockEligible: true,
    overflowEligible: true,
    hideable: true,
    commandPaletteEligible: true,
  },
  install: {
    id: "install",
    to: "/install-android",
    icon: Smartphone,
    labelKey: "nav.installApp",
    accountUtility: true,
    dockEligible: false,
    overflowEligible: true,
    hideable: false,
    commandPaletteEligible: true,
  },
  settings: {
    id: "settings",
    to: "/settings",
    icon: Settings2,
    labelKey: "nav.settings",
    accountUtility: true,
    dockEligible: false,
    overflowEligible: true,
    hideable: false,
    commandPaletteEligible: true,
  },
  profile: {
    id: "profile",
    to: "/profile",
    icon: UserCircle,
    labelKey: "nav.account",
    accountUtility: true,
    dockEligible: false,
    overflowEligible: true,
    hideable: false,
    commandPaletteEligible: true,
  },
};

export const HUB_SIDEBAR_PANEL_IDS: MenuPanelId[] = [
  "capture_hub",
  "portrait_hub",
  "pratiques_hub",
  "messages_hub",
];

export const HUB_SIDEBAR_ROUTES = HUB_SIDEBAR_PANEL_IDS.map((id) => PANELS[id].to);

export const DEFAULT_DOCK_PANEL_IDS: MenuPanelId[] = ["home", "mood", "decisions", "habits"];

/** Baseline radial (« Plus ») for new users — hubs + account essentials. */
export const DEFAULT_OVERFLOW_PANEL_IDS: MenuPanelId[] = [
  "pratiques_hub",
  "capture_hub",
  "messages_hub",
  "persona",
  "profile",
  "settings",
];

export const MENU_PANELS_LOCKED: MenuPanelId[] = ["home", "settings"];

const ALLOWED = new Set<string>(MENU_PANEL_ORDER);

export function getMenuPanel(id: MenuPanelId): MenuPanelDef {
  return PANELS[id];
}

export function getAllMenuPanels(): MenuPanelDef[] {
  return MENU_PANEL_ORDER.map((id) => PANELS[id]);
}

export function panelsForHub(hub: AppHubId, opts?: { includeHubIndex?: boolean }): MenuPanelDef[] {
  const includeIndex = opts?.includeHubIndex ?? false;
  return getAllMenuPanels().filter((p) => {
    if (p.navExcluded) return false;
    if (p.accountUtility) return false;
    if (p.hub !== hub) return false;
    if (p.isHubIndex && !includeIndex) return false;
    return true;
  });
}

export function hubSidebarNavItems(): MenuPanelDef[] {
  return HUB_SIDEBAR_PANEL_IDS.map((id) => PANELS[id]);
}

export function isMenuPanelId(raw: string): raw is MenuPanelId {
  return ALLOWED.has(raw);
}

export function panelPathIsActive(pathname: string, to: string): boolean {
  if (to === "/pratiques/dien-chan") {
    return pathname === to || pathname.startsWith(`${to}/`);
  }
  if (to === "/pratiques") {
    return pathname === "/pratiques" || pathname.startsWith("/pratiques/");
  }
  if (to === "/newsletter") {
    return pathname === "/newsletter" || pathname.startsWith("/newsletter/");
  }
  if (to === "/persona") {
    return pathname === "/persona" || pathname.startsWith("/persona/");
  }
  if (to === "/capture") {
    return pathname === "/capture";
  }
  if (to === "/dashboard") {
    return pathname === "/dashboard";
  }
  if (to === "/welcome") {
    return pathname === "/welcome" || pathname.startsWith("/welcome/");
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

/** Legacy radial id mapping (mobile_radial_menu string[]). */
export const LEGACY_RADIAL_TO_PANEL: Record<string, MenuPanelId | null> = {
  home: "home",
  decisions: "decisions",
  mood: "mood",
  people: "people",
  habits: "habits",
  toolbox: "toolbox",
  pulse: "pulse",
  bibliotheque: "bibliotheque",
  meditation: null,
  journal: "journal",
  analytics: "analytics",
  calendar: "calendar",
  deep_dive: null,
  deep_dive_scores: null,
  install: "install",
  persona: "persona",
  profile: "profile",
  settings: "settings",
};
