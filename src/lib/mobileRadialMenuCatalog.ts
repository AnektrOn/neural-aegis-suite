import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Target,
  Brain,
  ListChecks,
  Headphones,
  Users,
  PenLine,
  Library,
  BarChart3,
  CalendarDays,
  FileText,
  LineChart,
  Smartphone,
  UserCircle,
  Settings2,
} from "lucide-react";
import type { TranslationKey } from "@/i18n/translations";

/** Stable ids stored in DB and used in the profile editor. */
export const MOBILE_RADIAL_CATALOG_ORDER = [
  "home",
  "decisions",
  "mood",
  "people",
  "habits",
  "toolbox",
  "bibliotheque",
  "journal",
  "analytics",
  "calendar",
  "deep_dive_scores",
  "deep_dive",
  "install",
  "profile",
  "settings",
] as const;

export type MobileRadialMenuId = (typeof MOBILE_RADIAL_CATALOG_ORDER)[number];

export const DEFAULT_MOBILE_RADIAL_MENU_IDS: MobileRadialMenuId[] = [
  "profile",
  "settings",
  "home",
  "decisions",
  "mood",
  "people",
  "toolbox",
  "bibliotheque",
];

const ALLOWED = new Set<string>(MOBILE_RADIAL_CATALOG_ORDER);

export const RADIAL_CATALOG: Record<
  MobileRadialMenuId,
  { to: string; icon: LucideIcon; labelKey: TranslationKey }
> = {
  home: { to: "/", icon: LayoutDashboard, labelKey: "nav.bottom.board" },
  decisions: { to: "/decisions", icon: Target, labelKey: "nav.decisions" },
  mood: { to: "/mood", icon: Brain, labelKey: "nav.mood" },
  people: { to: "/people", icon: Users, labelKey: "nav.people" },
  habits: { to: "/habits", icon: ListChecks, labelKey: "nav.habits" },
  toolbox: { to: "/toolbox", icon: Headphones, labelKey: "nav.toolbox" },
  bibliotheque: { to: "/bibliotheque", icon: Library, labelKey: "nav.bibliotheque" },
  journal: { to: "/journal", icon: PenLine, labelKey: "nav.journal" },
  analytics: { to: "/analytics", icon: BarChart3, labelKey: "nav.analytics" },
  calendar: { to: "/calendar", icon: CalendarDays, labelKey: "nav.calendar" },
  deep_dive_scores: { to: "/deep-dive/scores", icon: LineChart, labelKey: "nav.deepDiveScores" },
  deep_dive: { to: "/deep-dive", icon: FileText, labelKey: "nav.deepDive" },
  install: { to: "/install", icon: Smartphone, labelKey: "nav.installApp" },
  profile: { to: "/profile", icon: UserCircle, labelKey: "nav.profile" },
  settings: { to: "/settings", icon: Settings2, labelKey: "settings.title" },
};

const MAX_RADIAL = 14;
const MIN_RADIAL = 1;

/** Normalize DB / API value into a non-empty ordered list of ids (falls back to default). */
export function orderSelectedRadialIds(saved: unknown): MobileRadialMenuId[] {
  if (!Array.isArray(saved) || saved.length === 0) return [...DEFAULT_MOBILE_RADIAL_MENU_IDS];
  const out: MobileRadialMenuId[] = [];
  const seen = new Set<string>();
  for (const raw of saved) {
    if (typeof raw !== "string") continue;
    if (!ALLOWED.has(raw) || seen.has(raw)) continue;
    seen.add(raw);
    out.push(raw as MobileRadialMenuId);
    if (out.length >= MAX_RADIAL) break;
  }
  if (out.length < MIN_RADIAL) return [...DEFAULT_MOBILE_RADIAL_MENU_IDS];
  return out;
}

export function radialPathIsActive(pathname: string, to: string): boolean {
  if (to === "/deep-dive/scores") {
    return pathname === "/deep-dive/scores" || pathname.startsWith("/deep-dive/scores/");
  }
  if (to === "/deep-dive") {
    return (
      pathname === "/deep-dive" ||
      (pathname.startsWith("/deep-dive/") && !pathname.startsWith("/deep-dive/scores"))
    );
  }
  return pathname === to;
}
