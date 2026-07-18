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
  Sparkles,
} from "lucide-react";
import type { TranslationKey } from "@/i18n/translations";

/** Stable ids stored in DB and used in the settings radial editor. */
export const MOBILE_RADIAL_CATALOG_ORDER = [
  "persona",
  "profile",
  "settings",
  "home",
  "decisions",
  "mood",
  "people",
  "habits",
  "toolbox",
  "pulse",
  "bibliotheque",
  "journal",
  "analytics",
  "calendar",
  "deep_dive",
  "deep_dive_scores",
  "install",
] as const;

export type MobileRadialMenuId = (typeof MOBILE_RADIAL_CATALOG_ORDER)[number];

export const DEFAULT_MOBILE_RADIAL_MENU_IDS: MobileRadialMenuId[] = [
  "persona",
  "settings",
  "home",
  "decisions",
  "mood",
  "people",
  "pulse",
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
  pulse: { to: "/pulse", icon: Sparkles, labelKey: "nav.pulse" },
  bibliotheque: { to: "/bibliotheque", icon: Library, labelKey: "nav.bibliotheque" },
  journal: { to: "/journal", icon: PenLine, labelKey: "nav.journal" },
  analytics: { to: "/analytics", icon: BarChart3, labelKey: "nav.analytics" },
  calendar: { to: "/calendar", icon: CalendarDays, labelKey: "nav.calendar" },
  deep_dive: { to: "/deep-dive", icon: FileText, labelKey: "nav.deepDive" },
  deep_dive_scores: { to: "/deep-dive/scores", icon: LineChart, labelKey: "nav.deepDiveScores" },
  progress_myss: { to: "/progress/myss", icon: LineChart, labelKey: "nav.progressEvolution" },
  install: { to: "/install-android", icon: Smartphone, labelKey: "nav.installApp" },
  persona: { to: "/persona", icon: Sparkles, labelKey: "nav.profile" },
  profile: { to: "/profile", icon: UserCircle, labelKey: "nav.account" },
  settings: { to: "/settings", icon: Settings2, labelKey: "nav.settings" },
};

const MAX_RADIAL = 14;
const MIN_RADIAL = 1;

/** Pre–Persona split default (profile pointed at account hub). */
const LEGACY_DEFAULT_RADIAL = [
  "profile",
  "settings",
  "home",
  "decisions",
  "mood",
  "people",
  "pulse",
  "toolbox",
  "bibliotheque",
] as const;

function isLegacyDefaultRadial(saved: string[]): boolean {
  return (
    saved.length === LEGACY_DEFAULT_RADIAL.length &&
    LEGACY_DEFAULT_RADIAL.every((id, i) => saved[i] === id)
  );
}

/** Normalize DB / API value into a non-empty ordered list of ids (falls back to default). */
export function orderSelectedRadialIds(saved: unknown): MobileRadialMenuId[] {
  if (!Array.isArray(saved) || saved.length === 0) return [...DEFAULT_MOBILE_RADIAL_MENU_IDS];
  const rawStrings = saved.filter((x): x is string => typeof x === "string");
  if (isLegacyDefaultRadial(rawStrings)) return [...DEFAULT_MOBILE_RADIAL_MENU_IDS];
  const out: MobileRadialMenuId[] = [];
  const seen = new Set<string>();
  for (const raw of rawStrings) {
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
