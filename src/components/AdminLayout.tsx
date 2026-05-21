import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
  ArrowLeft,
  Menu,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import NotificationBell from "@/components/NotificationBell";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { PageWrapper } from "@/components/PageWrapper";
import AppFooter from "@/components/AppFooter";
import { useNetwork } from "@/hooks/use-network";
import AdminSidebarNav from "@/components/admin/AdminSidebarNav";
import { getAdminPageMeta } from "@/lib/adminNavConfig";

function AdminSidebarContent({
  collapsed,
  onNavigate,
  showNotificationBell = true,
  showSearch = false,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  showNotificationBell?: boolean;
  showSearch?: boolean;
}) {
  const { signOut } = useAuth();
  const { t } = useLanguage();

  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border-subtle px-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-accent-warning/25 bg-accent-warning/15">
          <Zap size={14} strokeWidth={1.5} className="text-accent-warning" />
        </div>
        {!collapsed && (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-display text-[10px] uppercase tracking-[0.2em] text-text-secondary">
              {t("admin.nav.adminLabel")}
            </span>
            <span className="w-fit rounded border border-accent-warning/20 bg-accent-warning/10 px-2 py-0.5 font-display text-[9px] uppercase tracking-widest text-accent-warning">
              Admin
            </span>
          </div>
        )}
      </div>

      <Link
        to="/"
        onClick={onNavigate}
        className="mx-2 mb-2 mt-3 flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-text-tertiary transition-all duration-200 hover:bg-bg-elevated hover:text-text-primary"
      >
        <ArrowLeft size={16} strokeWidth={1.5} className="shrink-0" />
        {!collapsed && (
          <span className="text-[9px] font-medium uppercase tracking-[0.12em]">{t("admin.nav.dashboard")}</span>
        )}
      </Link>

      <AdminSidebarNav collapsed={collapsed} onNavigate={onNavigate} showSearch={showSearch} />

      {showNotificationBell && (
        <div className="mx-3 mb-2 flex shrink-0 flex-col gap-2">
          <NotificationBell />
          {!collapsed && <PushNotificationToggle />}
        </div>
      )}

      <button
        type="button"
        onClick={signOut}
        className="mx-3 min-h-11 rounded-lg p-3 text-text-secondary transition-colors duration-200 hover:bg-accent-danger/5 hover:text-accent-danger"
        title={t("nav.logout")}
        aria-label={t("nav.logout")}
      >
        <LogOut size={16} strokeWidth={1.5} />
      </button>
      <LanguageSwitcher collapsed={collapsed} />
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const { online } = useNetwork();
  const { t } = useLanguage();

  const pageMeta = getAdminPageMeta(location.pathname, location.search, t);
  const headerTitle = pageMeta.subtitle ? `${pageMeta.title} · ${pageMeta.subtitle}` : pageMeta.title;

  const adminMainPaddingTop = online
    ? "calc(var(--safe-top) + var(--mobile-header-toolbar))"
    : "calc(var(--safe-top) + var(--mobile-offline-banner-height) + var(--mobile-header-toolbar))";

  if (isMobile) {
    return (
      <div className="relative z-10 min-h-screen w-full bg-bg-base">
        <div
          className="fixed left-0 right-0 top-0 z-50 flex flex-col border-b border-border-subtle bg-bg-surface/90 backdrop-blur-xl"
          style={{ paddingTop: "var(--safe-top)" }}
        >
          {!online && (
            <div
              className="shrink-0 bg-warning px-2 py-1.5 text-center text-xs font-medium text-warning-foreground"
              role="status"
            >
              {t("layout.offlineMessage")}
            </div>
          )}
          <div className="box-border flex min-h-[var(--mobile-header-toolbar)] items-center justify-between px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="min-h-11 min-w-11 rounded-lg p-2 text-text-secondary transition-colors duration-200 hover:bg-bg-elevated hover:text-text-primary"
                    aria-label={t("admin.nav.openMenu")}
                  >
                    <Menu size={20} strokeWidth={1.5} />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="flex h-full w-[min(100vw,320px)] max-w-full flex-col border-r border-border-subtle bg-bg-surface p-0"
                >
                  <SheetTitle className="sr-only">{t("admin.nav.openMenu")}</SheetTitle>
                  <div className="flex min-h-0 flex-1 flex-col py-2">
                    <AdminSidebarContent
                      collapsed={false}
                      onNavigate={() => setMobileOpen(false)}
                      showNotificationBell={false}
                      showSearch
                    />
                  </div>
                </SheetContent>
              </Sheet>
              <div className="min-w-0">
                <p className="truncate font-display text-[10px] uppercase tracking-[0.2em] text-accent-warning">
                  {t("admin.nav.adminLabel")}
                </p>
                <p className="truncate text-sm font-medium text-foreground">{headerTitle}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
              <PushNotificationToggle compact />
              <NotificationBell />
            </div>
          </div>
        </div>

        <main className="min-h-screen px-4 pb-6" style={{ paddingTop: adminMainPaddingTop }}>
          <PageWrapper key={location.pathname}>{children}</PageWrapper>
          <AppFooter />
        </main>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex min-h-screen w-full bg-bg-base">
      {!online && (
        <div
          className="fixed left-0 right-0 top-0 z-[60] bg-warning px-2 py-1.5 text-center text-xs font-medium text-warning-foreground"
          role="status"
        >
          {t("layout.offlineMessage")}
        </div>
      )}
      <aside
        className={`fixed left-0 z-30 flex h-full flex-col border-r border-border-subtle bg-bg-surface transition-all duration-300 ease-in-out ${
          collapsed ? "w-[60px]" : "w-[240px]"
        } ${!online ? "top-7" : "top-0"}`}
      >
        <AdminSidebarContent collapsed={collapsed} />
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border-active bg-bg-elevated text-text-secondary shadow-card transition-all duration-200 hover:border-accent-warning/40 hover:text-accent-warning"
          aria-label={collapsed ? t("admin.nav.expandSidebar") : t("admin.nav.collapseSidebar")}
        >
          {collapsed ? <ChevronRight size={14} strokeWidth={1.5} /> : <ChevronLeft size={14} strokeWidth={1.5} />}
        </button>
      </aside>

      <main
        className={`min-h-screen flex-1 p-6 transition-all duration-300 ease-in-out md:p-10 ${
          collapsed ? "ml-[60px]" : "ml-[240px]"
        } ${!online ? "mt-7" : ""}`}
      >
        <PageWrapper key={location.pathname}>{children}</PageWrapper>
        <AppFooter />
      </main>
    </div>
  );
}
