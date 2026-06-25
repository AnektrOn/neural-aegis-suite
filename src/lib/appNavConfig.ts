import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Brain,
  Target,
  ListChecks,
  Headphones,
  Users,
  BarChart3,
  BookOpen,
  UserCircle,
  CalendarDays,
  FileText,
  Library,
  Smartphone,
  LineChart,
  Settings2,
  Mail,
  Sparkles,
} from "lucide-react";
import type { TranslationKey } from "@/i18n/translations";

export type AppNavItem = {
  to: string;
  icon: LucideIcon;
  labelKey: TranslationKey;
};

export type AppNavSection = {
  id: string;
  labelKey: TranslationKey;
  items: AppNavItem[];
};

export const APP_NAV_SECTIONS: AppNavSection[] = [
  {
    id: "daily",
    labelKey: "layout.navGroup.daily",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard" },
      { to: "/mood", icon: Brain, labelKey: "nav.mood" },
      { to: "/habits", icon: ListChecks, labelKey: "nav.habits" },
      { to: "/journal", icon: BookOpen, labelKey: "nav.journal" },
      { to: "/decisions", icon: Target, labelKey: "nav.decisions" },
    ],
  },
  {
    id: "analysis",
    labelKey: "layout.navGroup.analysis",
    items: [
      { to: "/persona", icon: Sparkles, labelKey: "nav.profile" },
      { to: "/progress/myss", icon: LineChart, labelKey: "nav.progressEvolution" },
      { to: "/analytics", icon: BarChart3, labelKey: "nav.analytics" },
      { to: "/pulse", icon: Sparkles, labelKey: "nav.pulse" },
      { to: "/deep-dive", icon: FileText, labelKey: "nav.deepDive" },
      { to: "/deep-dive/scores", icon: LineChart, labelKey: "nav.deepDiveScores" },
      { to: "/people", icon: Users, labelKey: "nav.people" },
      { to: "/calendar", icon: CalendarDays, labelKey: "nav.calendar" },
    ],
  },
  {
    id: "resources",
    labelKey: "layout.navGroup.resources",
    items: [
      { to: "/toolbox", icon: Headphones, labelKey: "nav.toolbox" },
      { to: "/bibliotheque", icon: Library, labelKey: "nav.bibliotheque" },
      { to: "/newsletter", icon: Mail, labelKey: "nav.newsletter" },
      { to: "/install-android", icon: Smartphone, labelKey: "nav.installApp" },
      { to: "/settings", icon: Settings2, labelKey: "nav.settings" },
      { to: "/profile", icon: UserCircle, labelKey: "nav.account" },
    ],
  },
];

const EXTRA_ROUTES: { prefix: string; labelKey: TranslationKey; sectionKey?: TranslationKey }[] = [
  { prefix: "/onboarding/assessment", labelKey: "nav.profile", sectionKey: "layout.navGroup.analysis" },
  { prefix: "/onboarding/results", labelKey: "nav.profile", sectionKey: "layout.navGroup.analysis" },
  { prefix: "/cartographie", labelKey: "cartography.defaultTitle", sectionKey: "layout.navGroup.analysis" },
  { prefix: "/progress/myss", labelKey: "nav.progressEvolution", sectionKey: "layout.navGroup.analysis" },
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

export function getAppPageMeta(pathname: string): AppPageMeta {
  const exact = getNavItemByPath(pathname);
  if (exact) {
    return { titleKey: exact.item.labelKey, sectionKey: exact.section.labelKey };
  }

  const extra = EXTRA_ROUTES.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  if (extra) {
    return { titleKey: extra.labelKey, sectionKey: extra.sectionKey };
  }

  return { titleKey: "nav.dashboard", sectionKey: "layout.navGroup.daily" };
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
