import { useRef, useState, useEffect, useCallback } from "react";
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
  MoreVertical,
  FileText,
  Library,
  Smartphone,
  LineChart,
  Settings2,
  Mail,
  Sparkles,
} from "lucide-react";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import { MobileDockCircleMenu } from "@/components/MobileDockCircleMenu";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_MOBILE_RADIAL_MENU_IDS,
  orderSelectedRadialIds,
  radialPathIsActive,
  RADIAL_CATALOG,
  type MobileRadialMenuId,
} from "@/lib/mobileRadialMenuCatalog";
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
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const navKeys = [
  { to: "/", icon: LayoutDashboard, key: "nav.dashboard" as const },
  { to: "/mood", icon: Brain, key: "nav.mood" as const },
  { to: "/decisions", icon: Target, key: "nav.decisions" as const },
  { to: "/habits", icon: ListChecks, key: "nav.habits" as const },
  { to: "/journal", icon: BookOpen, key: "nav.journal" as const },
  { to: "/toolbox", icon: Headphones, key: "nav.toolbox" as const },
  { to: "/pulse", icon: Sparkles, key: "nav.pulse" as const },
  { to: "/bibliotheque", icon: Library, key: "nav.bibliotheque" as const },
  { to: "/people", icon: Users, key: "nav.people" as const },
  { to: "/analytics", icon: BarChart3, key: "nav.analytics" as const },
  { to: "/calendar", icon: CalendarDays, key: "nav.calendar" as const },
  { to: "/deep-dive", icon: FileText, key: "nav.deepDive" as const },
  { to: "/deep-dive/scores", icon: LineChart, key: "nav.deepDiveScores" as const },
  { to: "/install", icon: Smartphone, key: "nav.installApp" as const },
  { to: "/newsletter", icon: Mail, key: "nav.newsletter" as const },
  { to: "/settings", icon: Settings2, key: "profile.settings" as const },
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

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto py-3 px-0">
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
          className="mx-2 mb-2 flex shrink-0 items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-accent-warning/80 transition-all hover:border-accent-warning/15 hover:bg-accent-warning/5 hover:text-accent-warning"
        >
          <Shield size={16} strokeWidth={1.5} className="shrink-0" />
          {!collapsed && (
            <span className="text-[11px] font-medium tracking-[0.1em] uppercase">{t("nav.admin")}</span>
          )}
        </Link>
      )}

      <div className="mx-3 mb-1 shrink-0">
        <NotificationBell />
      </div>
      <div className="shrink-0">
        <ThemeToggle collapsed={collapsed} />
        <LanguageSwitcher collapsed={collapsed} />
      </div>
      <button
        onClick={signOut}
        className="mx-3 shrink-0 rounded-lg p-3 text-text-secondary transition-colors duration-200 hover:bg-accent-danger/5 hover:text-accent-danger"
        title={t("nav.logout")}
      >
        <LogOut size={16} strokeWidth={1.5} />
      </button>
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileUtilityOpen, setMobileUtilityOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dockRadialOpen, setDockRadialOpen] = useState(false);
  const [radialMenuIds, setRadialMenuIds] = useState<MobileRadialMenuId[]>(DEFAULT_MOBILE_RADIAL_MENU_IDS);
  const touchStartY = useRef(0);
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { t, locale } = useLanguage();
  useSessionTracking();
  useHesitationTracking();
  const { online } = useNetwork();

  const fetchRadialMenu = useCallback(async (uid: string) => {
    const { data, error } = await supabase.from("profiles").select("mobile_radial_menu").eq("id", uid).maybeSingle();
    if (error) {
      console.error("mobile_radial_menu load", error);
      return DEFAULT_MOBILE_RADIAL_MENU_IDS;
    }
    return orderSelectedRadialIds(data?.mobile_radial_menu);
  }, []);

  useEffect(() => {
    if (!user) {
      setRadialMenuIds(DEFAULT_MOBILE_RADIAL_MENU_IDS);
      return;
    }
    let alive = true;
    void fetchRadialMenu(user.id).then((ids) => {
      if (alive) setRadialMenuIds(ids);
    });
    return () => {
      alive = false;
    };
  }, [user, fetchRadialMenu]);

  useEffect(() => {
    if (!user) return;
    const onUpdate = () => {
      void fetchRadialMenu(user.id).then(setRadialMenuIds);
    };
    window.addEventListener("aegis:radial-menu-updated", onUpdate);
    return () => window.removeEventListener("aegis:radial-menu-updated", onUpdate);
  }, [user, fetchRadialMenu]);

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

    const radialItemsBase = radialMenuIds.map((id) => {
      const def = RADIAL_CATALOG[id];
      return {
        to: def.to,
        Icon: def.icon,
        label: t(def.labelKey),
        isActive: radialPathIsActive(location.pathname, def.to),
      };
    });
    const radialItems =
      isAdmin
        ? [
            ...radialItemsBase,
            {
              to: "/admin",
              Icon: Shield,
              label: t("nav.admin"),
              isActive: location.pathname.startsWith("/admin"),
            },
          ]
        : radialItemsBase;
    const dockRadialHasActive = radialItems.some((item) => item.isActive);

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
            <div className="flex shrink-0 items-center">
              <NavLink
                to="/"
                end
                aria-label={t("nav.dashboard")}
                className={({ isActive }) =>
                  cn(
                    "inline-flex h-10 w-10 min-h-[44px] min-w-[44px] select-none items-center justify-center rounded-xl transition-colors active:scale-[0.98]",
                    isActive
                      ? "bg-accent-primary/12 ring-1 ring-accent-primary/35"
                      : "text-text-tertiary hover:bg-bg-elevated/70 hover:text-text-secondary active:bg-bg-elevated",
                  )
                }
                style={
                  {
                    WebkitTapHighlightColor: "transparent",
                    touchAction: "manipulation",
                  } as React.CSSProperties
                }
              >
                <img src={aegisLogo} alt="" className="h-8 w-8 rounded-lg object-contain" />
              </NavLink>
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none text-center max-w-[55%]">
              <span className="font-barlow text-[10px] font-medium text-text-tertiary/80 tracking-[0.22em] uppercase leading-tight">
                {dateStr}
              </span>
              <span className="font-cormorant text-[13px] font-light tracking-[0.2em] text-primary/80 leading-tight mt-0.5">
                AEGIS
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <NotificationBell />
              <Sheet open={mobileUtilityOpen} onOpenChange={setMobileUtilityOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="relative z-[60] inline-flex min-h-[44px] min-w-[44px] select-none items-center justify-center rounded-xl p-2 text-text-tertiary transition-colors hover:bg-bg-elevated/70 hover:text-text-secondary active:bg-bg-elevated/80"
                    aria-label={t("layout.openUtilityMenu")}
                    aria-expanded={mobileUtilityOpen}
                    aria-haspopup="dialog"
                    style={
                      {
                        WebkitTapHighlightColor: "transparent",
                        touchAction: "manipulation",
                      } as React.CSSProperties
                    }
                  >
                    <MoreVertical size={22} strokeWidth={1.5} />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="flex max-h-[min(88dvh,540px)] flex-col gap-0 rounded-t-[22px] border-border-subtle bg-bg-surface p-0 pb-[max(1rem,var(--safe-bottom))] pt-2 [&>button.absolute]:hidden"
                >
                  <SheetTitle className="sr-only">{t("layout.mobileUtilityTitle")}</SheetTitle>
                  <div className="mx-auto h-1 w-10 shrink-0 rounded-full bg-border/60" aria-hidden />
                  <div className="border-b border-border-subtle/80 px-5 pb-3 pt-3 text-center">
                    <p className="font-cormorant text-[14px] tracking-[0.22em] text-primary">{t("layout.mobileUtilityTitle")}</p>
                    <p className="mt-1 truncate px-2 text-[10px] text-text-tertiary">{user?.email ?? ""}</p>
                    <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{t("layout.mobileUtilityIntro")}</p>
                  </div>
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileUtilityOpen(false)}
                        className="flex items-center gap-3 rounded-xl border border-accent-warning/20 bg-accent-warning/5 px-3 py-3 text-accent-warning transition-colors hover:bg-accent-warning/10"
                      >
                        <Shield size={18} strokeWidth={1.5} className="shrink-0" />
                        <span className="text-[12px] font-medium uppercase tracking-[0.08em]">{t("nav.admin")}</span>
                      </Link>
                    )}
                    <Link
                      to="/settings"
                      onClick={() => setMobileUtilityOpen(false)}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${
                        location.pathname === "/settings"
                          ? "border-accent-primary/30 bg-accent-primary/10 text-accent-primary"
                          : "border-border/40 bg-secondary/10 text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                      }`}
                    >
                      <Settings2 size={18} strokeWidth={1.5} className="shrink-0" />
                      <span className="text-[12px] font-medium uppercase tracking-[0.08em]">{t("settings.title")}</span>
                    </Link>
                    <div className="space-y-2 rounded-xl border border-border/30 bg-secondary/5 p-3">
                      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-tertiary/80">
                        {t("settings.notifications")}
                      </p>
                      <PushNotificationToggle className="w-full justify-start" />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/30 bg-secondary/5 px-3 py-3">
                      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-tertiary/80">
                        {t("settings.appearance")}
                      </span>
                      <div className="flex items-center gap-2">
                        <ThemeToggle collapsed={false} />
                        <LanguageSwitcher collapsed={false} />
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 border-t border-border-subtle/70 px-4 pb-1 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileUtilityOpen(false);
                        setLogoutDialogOpen(true);
                      }}
                      className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl py-2.5 text-accent-danger/85 transition-colors hover:bg-accent-danger/10 hover:text-accent-danger"
                    >
                      <LogOut size={16} strokeWidth={1.5} />
                      <span className="text-xs font-medium uppercase tracking-[0.08em]">{t("nav.logout")}</span>
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
              <Link
                to="/profile"
                aria-label={t("nav.profile")}
                className="inline-flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-accent-primary/25 bg-accent-primary/10 font-display text-[11px] font-medium text-accent-primary transition-all duration-200 active:scale-95"
                style={{ WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
              >
                {avatarInitial}
              </Link>
            </div>
          </div>
        </div>

        <main
          className="flex-1 px-3 sm:px-5 md:px-6 overflow-y-auto scroll-fade-bottom"
          style={{
            paddingTop: mobileTopPadding,
            paddingBottom: "calc(4rem + var(--safe-bottom))",
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

        <div
          role="navigation"
          aria-label={t("nav.dockMoreAria")}
          className={`pointer-events-none fixed inset-x-0 bottom-0 flex justify-center md:hidden ${
            dockRadialOpen ? "z-[130]" : "z-40"
          }`}
        >
          <div className="pointer-events-auto pb-[max(0.5rem,var(--safe-bottom))] pt-1">
            <MobileDockCircleMenu
              items={radialItems}
              ariaLabel={t("nav.dockMoreAria")}
              menuTitle={t("nav.dockMoreTitle")}
              hasActiveShortcut={dockRadialHasActive}
              onOpenChange={setDockRadialOpen}
            />
          </div>
        </div>

        <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
          <AlertDialogContent className="z-[120] max-w-[min(100vw-1.5rem,24rem)]">
            <AlertDialogHeader>
              <AlertDialogTitle>{t("layout.logoutConfirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t("layout.logoutConfirmBody")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("layout.logoutConfirmCancel")}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  setLogoutDialogOpen(false);
                  void signOut();
                }}
              >
                {t("layout.logoutConfirmAction")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
        className={`fixed left-0 z-30 flex h-full min-h-0 flex-col overflow-hidden border-r border-border-subtle bg-bg-surface transition-all duration-300 ease-in-out ${
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
