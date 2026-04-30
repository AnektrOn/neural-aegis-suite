import { useRef, useState } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useSessionTracking } from "@/hooks/use-session-tracking";
import { useHesitationTracking } from "@/hooks/use-hesitation-tracking";
import {
  LayoutDashboard,
  Brain,
  Target,
  ListChecks,
  Headphones,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  BarChart3,
  BookOpen,
  UserCircle,
  CalendarDays,
  Menu,
  FileText,
  X,
} from "lucide-react";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import aegisLogo from "@/assets/aegis-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/use-admin";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { PageWrapper } from "@/components/PageWrapper";
import AppFooter from "@/components/AppFooter";
import { useNetwork } from "@/hooks/use-network";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const mobileDockKeys = [
  { to: "/", icon: LayoutDashboard, labelKey: "nav.bottom.board" as const },
  { to: "/decisions", icon: Target, labelKey: "nav.decisions" as const },
  { to: "/people", icon: Users, labelKey: "nav.people" as const },
  { to: "/mood", icon: Brain, labelKey: "nav.mood" as const },
  { to: "/habits", icon: ListChecks, labelKey: "nav.habits" as const },
];

type MobileSection = {
  titleKey: "nav.section.daily" | "nav.section.reflect" | "nav.section.insights" | "nav.section.account";
  items: Array<{
    to: string;
    icon: typeof LayoutDashboard;
    labelKey: Parameters<ReturnType<typeof useLanguage>["t"]>[0];
  }>;
};

const mobileMenuSections: MobileSection[] = [
  {
    titleKey: "nav.section.daily",
    items: [
      { to: "/", icon: LayoutDashboard, labelKey: "nav.dashboard" as const },
      { to: "/mood", icon: Brain, labelKey: "nav.mood" as const },
      { to: "/decisions", icon: Target, labelKey: "nav.decisions" as const },
      { to: "/habits", icon: ListChecks, labelKey: "nav.habits" as const },
    ],
  },
  {
    titleKey: "nav.section.reflect",
    items: [
      { to: "/journal", icon: BookOpen, labelKey: "nav.journal" as const },
      { to: "/toolbox", icon: Headphones, labelKey: "nav.toolbox" as const },
      { to: "/people", icon: Users, labelKey: "nav.people" as const },
      { to: "/calendar", icon: CalendarDays, labelKey: "nav.calendar" as const },
    ],
  },
  {
    titleKey: "nav.section.insights",
    items: [
      { to: "/analytics", icon: BarChart3, labelKey: "nav.analytics" as const },
      { to: "/deep-dive", icon: FileText, labelKey: "nav.deepDive" as const },
    ],
  },
  {
    titleKey: "nav.section.account",
    items: [{ to: "/profile", icon: UserCircle, labelKey: "nav.profile" as const }],
  },
];

const navKeys = [
  { to: "/", icon: LayoutDashboard, key: "nav.dashboard" as const },
  { to: "/mood", icon: Brain, key: "nav.mood" as const },
  { to: "/decisions", icon: Target, key: "nav.decisions" as const },
  { to: "/habits", icon: ListChecks, key: "nav.habits" as const },
  { to: "/journal", icon: BookOpen, key: "nav.journal" as const },
  { to: "/toolbox", icon: Headphones, key: "nav.toolbox" as const },
  { to: "/people", icon: Users, key: "nav.people" as const },
  { to: "/analytics", icon: BarChart3, key: "nav.analytics" as const },
  { to: "/calendar", icon: CalendarDays, key: "nav.calendar" as const },
  { to: "/deep-dive", icon: FileText, key: "nav.deepDive" as const },
  { to: "/profile", icon: UserCircle, key: "nav.profile" as const },
];

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const location = useLocation();
  const { signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { t } = useLanguage();

  return (
    <>
      <div className="h-14 flex items-center px-4 border-b border-border-subtle shrink-0">
        <img src={aegisLogo} alt="Aegis" className="w-7 h-7 rounded-lg object-contain" />
        {!collapsed && (
          <span className="ml-3 font-display text-[10px] tracking-[0.2em] uppercase text-text-secondary">
            Neural Aegis
          </span>
        )}
      </div>

      <nav className="flex-1 flex flex-col gap-0.5 py-3 px-0 overflow-y-auto">
        {navKeys.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`relative overflow-hidden flex items-center gap-3 px-3 py-2.5 rounded-lg mx-2 transition-all duration-200 border border-transparent ${
                isActive ? "text-accent-primary" : "text-text-tertiary hover:text-text-primary hover:bg-bg-elevated"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-accent-primary/10 border border-accent-primary/20 pointer-events-none"
                  transition={{ duration: 0.25 }}
                />
              )}
              <item.icon size={16} strokeWidth={1.5} className="relative z-10 shrink-0" />
              {!collapsed && (
                <span className="text-[11px] font-medium tracking-[0.1em] uppercase relative z-10">{t(item.key)}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {isAdmin && (
        <Link
          to="/admin"
          onClick={onNavigate}
          className="mx-2 mb-2 flex items-center gap-3 px-3 py-2.5 rounded-lg text-accent-warning/80 hover:text-accent-warning hover:bg-accent-warning/5 border border-transparent hover:border-accent-warning/15 transition-all"
        >
          <Shield size={16} strokeWidth={1.5} className="shrink-0" />
          {!collapsed && (
            <span className="text-[11px] font-medium tracking-[0.1em] uppercase">{t("nav.admin")}</span>
          )}
        </Link>
      )}

      <div className="mx-3 mb-1">
        <NotificationBell />
      </div>
      <ThemeToggle collapsed={collapsed} />
      <LanguageSwitcher collapsed={collapsed} />
      <button
        onClick={signOut}
        className="mx-3 p-3 rounded-lg text-text-secondary hover:text-accent-danger hover:bg-accent-danger/5 transition-colors duration-200"
        title={t("nav.logout")}
      >
        <LogOut size={16} strokeWidth={1.5} />
      </button>
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { t, locale } = useLanguage();
  useSessionTracking();
  useHesitationTracking();
  const { online } = useNetwork();

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    const scrollTop = (e.currentTarget as HTMLElement).scrollTop;
    if (deltaY > 80 && scrollTop <= 0 && !refreshing) {
      setRefreshing(true);
      window.dispatchEvent(new CustomEvent("aegis:refresh"));
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  if (isMobile) {
    const avatarInitial = user?.email ? user.email[0].toUpperCase() : "?";
    const dateLocale = locale === "fr" ? "fr-FR" : "en-US";
    const dateStr = new Date()
      .toLocaleDateString(dateLocale, { weekday: "short", day: "numeric", month: "short" })
      .toUpperCase();

    const mobileTopPadding = online
      ? "calc(var(--safe-top) + var(--mobile-header-toolbar))"
      : "calc(var(--safe-top) + var(--mobile-offline-banner-height) + var(--mobile-header-toolbar))";

    return (
      <div className="min-h-screen w-full relative z-10 flex flex-col bg-bg-base">
        <div
          className="fixed top-0 left-0 right-0 z-50 flex flex-col bg-bg-surface/90 backdrop-blur-xl border-b border-border-subtle"
          style={{ paddingTop: "var(--safe-top)" }}
        >
          {!online && (
            <div
              className="bg-warning text-warning-foreground text-center text-xs py-1.5 font-medium px-2 shrink-0"
              role="status"
            >
              {t("layout.offlineMessage")}
            </div>
          )}
          <div className="relative flex min-h-[var(--mobile-header-toolbar)] items-center justify-between box-border px-4 py-3">
            <div className="flex items-center gap-2 shrink-0">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="relative z-[60] inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-xl text-text-tertiary hover:text-text-secondary active:bg-bg-elevated/60 transition-all duration-200 select-none"
                    aria-label={t("layout.openMenu")}
                    aria-expanded={mobileMenuOpen}
                    style={{
                      WebkitTapHighlightColor: "transparent",
                      touchAction: "manipulation",
                    } as React.CSSProperties}
                  >
                    <Menu size={22} strokeWidth={1.5} />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[88vw] max-w-[360px] p-0 bg-bg-surface border-r border-border-subtle flex flex-col [&>button.absolute]:hidden"
                  style={{
                    paddingTop: "var(--safe-top)",
                    paddingBottom: "calc(1rem + var(--safe-bottom))",
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={aegisLogo} alt="Aegis" className="w-9 h-9 rounded-xl object-contain shrink-0" />
                      <div className="min-w-0">
                        <p className="font-cormorant text-[15px] tracking-[0.2em] text-primary truncate">AEGIS</p>
                        <p className="text-[10px] text-text-tertiary truncate">{user?.email ?? ""}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-lg text-text-tertiary hover:text-text-secondary"
                      aria-label={t("layout.closeMenu")}
                    >
                      <X size={18} strokeWidth={1.5} />
                    </button>
                  </div>

                  {/* Scrollable nav */}
                  <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                    {mobileMenuSections.map((section) => (
                      <div key={section.titleKey}>
                        <p className="px-3 mb-2 text-[9px] tracking-[0.22em] uppercase text-text-tertiary/70 font-medium">
                          {t(section.titleKey)}
                        </p>
                        <div className="flex flex-col gap-0.5">
                          {section.items.map((item) => {
                            const isActive = location.pathname === item.to;
                            return (
                              <Link
                                key={item.to}
                                to={item.to}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 ${
                                  isActive
                                    ? "bg-accent-primary/10 border-accent-primary/25 text-accent-primary"
                                    : "border-transparent text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                                }`}
                              >
                                <item.icon size={18} strokeWidth={1.5} className="shrink-0" />
                                <span className="text-[12px] tracking-[0.08em] uppercase font-medium">
                                  {t(item.labelKey)}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {isAdmin && (
                      <div>
                        <p className="px-3 mb-2 text-[9px] tracking-[0.22em] uppercase text-accent-warning/70 font-medium">
                          {t("nav.admin")}
                        </p>
                        <Link
                          to="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-accent-warning/15 bg-accent-warning/5 text-accent-warning hover:bg-accent-warning/10 transition-all"
                        >
                          <Shield size={18} strokeWidth={1.5} className="shrink-0" />
                          <span className="text-[12px] tracking-[0.08em] uppercase font-medium">
                            {t("nav.admin")}
                          </span>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Footer controls */}
                  <div className="border-t border-border-subtle/60 px-3 pt-3 space-y-2 shrink-0">
                    <PushNotificationToggle className="w-full justify-center" />
                    <div className="flex items-center justify-between gap-2 px-1">
                      <ThemeToggle collapsed={false} />
                      <LanguageSwitcher collapsed={false} />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        void signOut();
                      }}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-accent-danger/80 hover:text-accent-danger hover:bg-accent-danger/5 transition-colors duration-200"
                    >
                      <LogOut size={16} strokeWidth={1.5} />
                      <span className="text-xs tracking-[0.08em] uppercase">{t("nav.logout")}</span>
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
              <img src={aegisLogo} alt="Aegis" className="w-8 h-8 rounded-lg object-contain" />
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none text-center max-w-[55%]">
              <span className="font-barlow text-[10px] font-medium text-text-tertiary/80 tracking-[0.22em] uppercase leading-tight">
                {dateStr}
              </span>
              <span className="font-cormorant text-[13px] font-light tracking-[0.2em] text-primary/80 leading-tight mt-0.5">
                AEGIS
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <NotificationBell />
              <Link
                to="/profile"
                className="w-8 h-8 rounded-full bg-accent-primary/10 border border-accent-primary/25 flex items-center justify-center text-accent-primary text-[11px] font-medium font-display active:scale-95 transition-all duration-200"
                style={{ WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
              >
                {avatarInitial}
              </Link>
            </div>
          </div>
        </div>

        <main
          className="flex-1 px-3 overflow-y-auto scroll-fade-bottom"
          style={{
            paddingTop: mobileTopPadding,
            paddingBottom: "calc(5rem + var(--safe-bottom))",
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {refreshing && (
            <div className="flex justify-center py-2">
              <div className="w-5 h-5 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
            </div>
          )}
          <PageWrapper key={location.pathname}>{children}</PageWrapper>
          <AppFooter />
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-bg-surface/90 backdrop-blur-xl border-t border-border-subtle pb-safe">
          <div className="flex items-stretch justify-between h-14 px-1 gap-0.5">
            {mobileDockKeys.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === "/"}
                className={({ isActive }) =>
                  `flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 py-1 rounded-xl transition-all duration-200 ${
                    isActive ? "text-accent-primary" : "text-text-tertiary hover:text-text-secondary"
                  }`
                }
              >
                <tab.icon size={19} strokeWidth={1.5} />
                <span className="text-[7px] sm:text-[8px] tracking-[0.06em] uppercase font-medium text-center leading-none line-clamp-2">
                  {t(tab.labelKey)}
                </span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full relative z-10 bg-bg-base">
      {!online && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] bg-warning text-warning-foreground text-center text-xs py-1.5 font-medium px-2"
          role="status"
        >
          {t("layout.offlineMessage")}
        </div>
      )}
      <aside
        className={`fixed left-0 h-full z-30 flex flex-col bg-bg-surface border-r border-border-subtle transition-all duration-300 ease-in-out ${
          collapsed ? "w-[60px]" : "w-[220px]"
        } ${!online ? "top-7" : "top-0"}`}
      >
        <SidebarContent collapsed={collapsed} />
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-bg-elevated border border-border-active text-text-secondary hover:text-accent-primary hover:border-accent-primary/40 flex items-center justify-center transition-all duration-200 z-10 shadow-card"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} strokeWidth={1.5} /> : <ChevronLeft size={14} strokeWidth={1.5} />}
        </button>
      </aside>

      <main
        className={`flex-1 min-h-screen p-6 md:p-10 transition-all duration-300 ease-in-out ${
          collapsed ? "ml-[60px]" : "ml-[220px]"
        } ${!online ? "mt-7" : ""}`}
      >
        <PageWrapper key={location.pathname}>{children}</PageWrapper>
        <AppFooter />
      </main>
    </div>
  );
}
