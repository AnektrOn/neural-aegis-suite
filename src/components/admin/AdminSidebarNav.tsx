import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  ADMIN_NAV_SECTIONS,
  filterAdminNavSections,
  isAdminPathActive,
  type AdminNavItem,
  type AdminNavSection,
} from "@/lib/adminNavConfig";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SECTION_STORAGE_KEY = "admin-nav-sections-open";

function loadOpenSections(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(SECTION_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    /* ignore */
  }
  const defaults: Record<string, boolean> = {};
  ADMIN_NAV_SECTIONS.forEach((s) => {
    defaults[s.id] = true;
  });
  return defaults;
}

function navItemTo(item: AdminNavItem): string {
  if (item.kind === "hub") return `${item.to}?tab=${item.defaultTab}`;
  return item.to;
}

function NavItemLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: AdminNavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const { t } = useLanguage();
  const to = navItemTo(item);
  const active = isAdminPathActive(location.pathname, item);

  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={cn(
        "relative flex min-h-11 items-center gap-3 overflow-hidden rounded-lg border border-transparent px-3 py-3 mx-2 transition-all duration-200",
        active ? "text-accent-warning" : "text-text-tertiary hover:bg-bg-elevated hover:text-text-primary",
      )}
    >
      {active && (
        <motion.div
          layoutId="admin-sidebar-active"
          className="pointer-events-none absolute inset-0 rounded-lg border border-accent-warning/25 bg-accent-warning/10"
          transition={{ duration: 0.25 }}
        />
      )}
      <item.icon size={16} strokeWidth={1.5} className="relative z-10 shrink-0" />
      {!collapsed && (
        <span className="relative z-10 text-[11px] font-medium uppercase tracking-[0.1em]">{t(item.labelKey)}</span>
      )}
    </NavLink>
  );
}

function NavSectionBlock({
  section,
  collapsed,
  open,
  onOpenChange,
  onNavigate,
  forceOpen,
}: {
  section: AdminNavSection;
  collapsed: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: () => void;
  forceOpen?: boolean;
}) {
  const { t } = useLanguage();
  const isOpen = forceOpen ?? open;

  if (collapsed) {
    return (
      <div className="flex flex-col gap-0.5">
        {section.items.map((item) => (
          <NavItemLink key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger
        className={cn(
          "mx-2 flex min-h-9 w-[calc(100%-1rem)] items-center justify-between rounded-lg px-3 py-2",
          "text-[10px] font-display uppercase tracking-widest text-text-tertiary",
          "hover:bg-bg-elevated hover:text-text-secondary transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-warning/40",
        )}
      >
        <span>{t(section.labelKey)}</span>
        <ChevronDown
          size={14}
          className={cn("shrink-0 transition-transform duration-200", isOpen && "rotate-180")}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-0.5 pt-0.5 pb-1">
        {section.items.map((item) => (
          <NavItemLink key={item.to} item={item} collapsed={false} onNavigate={onNavigate} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function AdminSidebarNav({
  collapsed,
  onNavigate,
  showSearch = false,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  showSearch?: boolean;
}) {
  const { t } = useLanguage();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>(loadOpenSections);

  const filteredSections = useMemo(
    () => filterAdminNavSections(ADMIN_NAV_SECTIONS, searchQuery, t),
    [searchQuery, t],
  );

  const searching = searchQuery.trim().length > 0;

  useEffect(() => {
    try {
      localStorage.setItem(SECTION_STORAGE_KEY, JSON.stringify(sectionOpen));
    } catch {
      /* ignore */
    }
  }, [sectionOpen]);

  useEffect(() => {
    if (!searching) return;
    setSectionOpen((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const s of filteredSections) {
        if (!next[s.id]) {
          next[s.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [searching, searchQuery, filteredSections]);

  const toggleSection = (id: string, open: boolean) => {
    setSectionOpen((prev) => ({ ...prev, [id]: open }));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {showSearch && !collapsed && (
        <div className="mx-3 mb-2 shrink-0">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              aria-hidden
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("admin.nav.searchPlaceholder")}
              className="min-h-11 pl-9 text-sm bg-bg-elevated border-border-subtle"
              aria-label={t("admin.nav.searchPlaceholder")}
            />
          </div>
        </div>
      )}

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pb-2">
        {filteredSections.map((section) => (
          <NavSectionBlock
            key={section.id}
            section={section}
            collapsed={collapsed}
            open={sectionOpen[section.id] ?? true}
            onOpenChange={(open) => toggleSection(section.id, open)}
            onNavigate={onNavigate}
            forceOpen={searching ? true : undefined}
          />
        ))}
        {searching && filteredSections.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-text-tertiary">{t("admin.nav.searchEmpty")}</p>
        )}
      </nav>
    </div>
  );
}
