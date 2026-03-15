import { useState } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useSessionTracking } from "@/hooks/use-session-tracking";
import { useHesitationTracking } from "@/hooks/use-hesitation-tracking";
import {
  LayoutDashboard, Brain, Target, ListChecks, Headphones, Users,
  ChevronLeft, ChevronRight, LogOut, Shield, BarChart3, BookOpen, UserCircle, CalendarDays,
  MoreHorizontal,
} from "lucide-react";
import aegisLogo from "@/assets/aegis-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/use-admin";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const bottomNavTabs = [
  { to: "/", icon: LayoutDashboard, label: "Board" },
  { to: "/decisions", icon: Target, label: "Décisions" },
  { to: "/habits", icon: ListChecks, label: "Habits" },
  { to: "/journal", icon: BookOpen, label: "Journal" },
] as const;

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
  { to: "/profile", icon: UserCircle, key: "nav.profile" as const },
];

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const location = useLocation();
  const { signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { t } = useLanguage();

  return (
    <>
      <div className="px-4 mb-10 flex items-center gap-3">
        <img src={aegisLogo} alt="Aegis" className="w-8 h-8 rounded-lg object-contain" />
        {!collapsed && (
          <span className="text-neural-title text-[11px]">Aegis</span>
        )}
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-3 overflow-y-auto">
        {navKeys.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink key={item.to} to={item.to} onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative ${
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
              }`}>
              {isActive && (
                <motion.div layoutId="sidebar-active" className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20" transition={{ duration: 0.3 }} />
              )}
              <item.icon size={18} strokeWidth={1.5} className="relative z-10 shrink-0" />
              {!collapsed && (
                <span className="text-xs font-medium tracking-widest uppercase relative z-10">
                  {t(item.key)}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {isAdmin && (
        <Link to="/admin" onClick={onNavigate} className="mx-3 mb-2 flex items-center gap-3 px-3 py-3 rounded-xl text-accent/60 hover:text-accent hover:bg-accent/5 transition-all">
          <Shield size={18} strokeWidth={1.5} className="shrink-0" />
          {!collapsed && (
            <span className="text-xs font-medium tracking-widest uppercase">
              {t("nav.admin")}
            </span>
          )}
        </Link>
      )}

      <div className="mx-3 mb-1">
        <NotificationBell />
      </div>
      <ThemeToggle collapsed={collapsed} />
      <LanguageSwitcher collapsed={collapsed} />
      <button onClick={signOut} className="mx-3 p-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors" title={t("nav.logout")}>
        <LogOut size={16} />
      </button>
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  useSessionTracking();
  useHesitationTracking();

  if (isMobile) {
    const avatarInitial = (user?.email ?? "?")[0].toUpperCase();
    const dateStr = new Date().toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

    return (
      <div className="min-h-screen w-full relative z-10">
        {/* Minimal top bar */}
        <div className="fixed top-0 left-0 right-0 z-50 ghost-sidebar flex items-center justify-between px-4 py-3">
          <img src={aegisLogo} alt="Aegis" className="w-7 h-7 rounded-lg object-contain" />
          <p className="text-[10px] text-muted-foreground/50 tracking-[0.2em] uppercase">{dateStr}</p>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-[10px] text-primary font-medium">{avatarInitial}</span>
            </div>
          </div>
        </div>

        <main className="pt-14 px-4 pb-24 min-h-screen">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {children}
          </motion.div>
        </main>

        {/* Bottom navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 ghost-sidebar border-t border-border/20">
          <div className="flex items-center justify-around pt-2 pb-4">
            {bottomNavTabs.map((tab) => {
              const isActive = location.pathname === tab.to;
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground/40"
                  }`}
                >
                  <tab.icon size={20} strokeWidth={1.5} />
                  <span className="text-[9px] tracking-widest uppercase">{tab.label}</span>
                </NavLink>
              );
            })}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-muted-foreground/40 transition-all">
                  <MoreHorizontal size={20} strokeWidth={1.5} />
                  <span className="text-[9px] tracking-widest uppercase">Plus</span>
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[260px] p-0 py-6 ghost-sidebar border-r-0">
                <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full relative z-10">
      <motion.aside
        animate={{ width: collapsed ? 72 : 220 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="ghost-sidebar fixed top-0 left-0 h-screen z-50 flex flex-col py-6"
      >
        <SidebarContent collapsed={collapsed} />
        <button onClick={() => setCollapsed(!collapsed)} className="mx-3 mt-2 p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </motion.aside>

      <motion.main animate={{ marginLeft: collapsed ? 72 : 220 }} transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }} className="flex-1 min-h-screen p-6 md:p-10">
        <motion.div key={location.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {children}
        </motion.div>
      </motion.main>
    </div>
  );
}
