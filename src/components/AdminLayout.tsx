import { useState } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Phone,
  Factory,
  Users,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
  ArrowLeft,
  BarChart3,
  Building2,
  LayoutDashboard,
  Menu,
  Package,
  Target,
  MessageSquare,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PageWrapper } from "@/components/PageWrapper";
import AppFooter from "@/components/AppFooter";
import { useNetwork } from "@/hooks/use-network";

const adminNavKeys = [
  { to: "/admin", icon: Phone, key: "admin.nav.calls" as const },
  { to: "/admin/habits", icon: Factory, key: "admin.nav.habits" as const },
  { to: "/admin/users", icon: Users, key: "admin.nav.users" as const },
  { to: "/admin/analytics", icon: BarChart3, key: "admin.nav.analytics" as const },
  { to: "/admin/executive", icon: LayoutDashboard, key: "admin.nav.executive" as const },
  { to: "/admin/companies", icon: Building2, key: "admin.nav.companies" as const },
  { to: "/admin/toolbox", icon: Package, key: "admin.nav.toolbox" as const },
  { to: "/admin/decisions", icon: Target, key: "admin.nav.decisions" as const },
  { to: "/admin/messages", icon: MessageSquare, key: "admin.nav.messages" as const },
  { to: "/admin/scoreboard", icon: Trophy, key: "admin.nav.scoreboard" as const },
];

function AdminSidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const location = useLocation();
  const { signOut } = useAuth();
  const { t } = useLanguage();

  return (
    <>
      <div className="h-14 flex items-center px-4 border-b border-border-subtle shrink-0 gap-2">
        <div className="w-7 h-7 rounded-lg bg-accent-warning/15 border border-accent-warning/25 flex items-center justify-center shrink-0">
          <Zap size={14} strokeWidth={1.5} className="text-accent-warning" />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0 gap-0.5">
            <span className="font-display text-[10px] tracking-[0.2em] uppercase text-text-secondary truncate">Admin</span>
            <span className="px-2 py-0.5 rounded text-[9px] tracking-widest uppercase w-fit bg-accent-warning/10 text-accent-warning border border-accent-warning/20 font-display">
              Admin
            </span>
          </div>
        )}
      </div>

      <Link
        to="/"
        onClick={onNavigate}
        className="mx-2 mt-3 mb-2 flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-all duration-200"
      >
        <ArrowLeft size={16} strokeWidth={1.5} className="shrink-0" />
        {!collapsed && <span className="text-[9px] uppercase tracking-[0.12em] font-medium">{t("admin.nav.dashboard")}</span>}
      </Link>

      <nav className="flex-1 flex flex-col gap-0.5 px-0 overflow-y-auto pb-2">
        {adminNavKeys.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`relative overflow-hidden flex items-center gap-3 px-3 py-2.5 rounded-lg mx-2 transition-all duration-200 border border-transparent ${
                isActive ? "text-accent-warning" : "text-text-tertiary hover:text-text-primary hover:bg-bg-elevated"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="admin-sidebar-active"
                  className="absolute inset-0 rounded-lg bg-accent-warning/10 border border-accent-warning/25 pointer-events-none"
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

      <button
        onClick={signOut}
        className="mx-3 p-3 rounded-lg text-text-secondary hover:text-accent-danger hover:bg-accent-danger/5 transition-colors duration-200"
        title={t("nav.logout")}
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

  const adminMainPaddingTop = online
    ? "calc(var(--safe-top) + var(--mobile-header-toolbar))"
    : "calc(var(--safe-top) + var(--mobile-offline-banner-height) + var(--mobile-header-toolbar))";

  if (isMobile) {
    return (
      <div className="min-h-screen w-full relative z-10 bg-bg-base">
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
          <div className="flex min-h-[var(--mobile-header-toolbar)] items-center justify-between box-border px-4 py-3">
            <div className="flex items-center gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors duration-200"
                  >
                    <Menu size={20} strokeWidth={1.5} />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[260px] p-0 py-0 bg-bg-surface border-r border-border-subtle">
                  <div className="py-4">
                    <AdminSidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
              <div className="w-7 h-7 rounded-lg bg-accent-warning/15 border border-accent-warning/25 flex items-center justify-center">
                <Zap size={14} strokeWidth={1.5} className="text-accent-warning" />
              </div>
              <span className="font-display text-[10px] tracking-[0.2em] uppercase text-accent-warning">Admin</span>
            </div>
          </div>
        </div>

        <main className="px-4 pb-6 min-h-screen" style={{ paddingTop: adminMainPaddingTop }}>
          <PageWrapper key={location.pathname}>{children}</PageWrapper>
          <AppFooter />
        </main>
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
        <AdminSidebarContent collapsed={collapsed} />
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-bg-elevated border border-border-active text-text-secondary hover:text-accent-warning hover:border-accent-warning/40 flex items-center justify-center transition-all duration-200 z-10 shadow-card"
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
