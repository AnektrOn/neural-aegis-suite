import { useState } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, Factory, Users, ChevronLeft, ChevronRight, Zap, LogOut, ArrowLeft, BarChart3, Building2, LayoutDashboard, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const adminNavKeys = [
  { to: "/admin", icon: Phone, key: "admin.nav.calls" as const },
  { to: "/admin/habits", icon: Factory, key: "admin.nav.habits" as const },
  { to: "/admin/users", icon: Users, key: "admin.nav.users" as const },
  { to: "/admin/analytics", icon: BarChart3, key: "admin.nav.analytics" as const },
  { to: "/admin/executive", icon: LayoutDashboard, key: "admin.nav.executive" as const },
  { to: "/admin/companies", icon: Building2, key: "admin.nav.companies" as const },
];

function AdminSidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const location = useLocation();
  const { signOut } = useAuth();
  const { t } = useLanguage();

  return (
    <>
      <div className="px-4 mb-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-neural-accent/20 flex items-center justify-center" style={{ boxShadow: "0 0 20px hsla(270, 50%, 55%, 0.3)" }}>
          <Zap size={16} className="text-neural-accent" />
        </div>
        {!collapsed && (
          <span className="text-neural-title text-[11px] text-neural-accent">Admin</span>
        )}
      </div>

      <Link to="/" onClick={onNavigate} className="mx-3 mb-4 flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-all">
        <ArrowLeft size={16} strokeWidth={1.5} className="shrink-0" />
        {!collapsed && (
          <span className="text-[9px] uppercase tracking-[0.3em]">
            {t("admin.nav.dashboard")}
          </span>
        )}
      </Link>

      <nav className="flex-1 flex flex-col gap-1 px-3 overflow-y-auto">
        {adminNavKeys.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink key={item.to} to={item.to} onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative ${
                isActive ? "bg-neural-accent/10 text-neural-accent" : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
              }`}>
              {isActive && (
                <motion.div layoutId="admin-sidebar-active" className="absolute inset-0 rounded-xl bg-neural-accent/10 border border-neural-accent/20" transition={{ duration: 0.3 }} />
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

      <button onClick={signOut} className="mx-3 p-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors" title={t("nav.logout")}>
        <LogOut size={16} />
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

  if (isMobile) {
    return (
      <div className="min-h-screen w-full relative z-10">
        <div className="fixed top-0 left-0 right-0 z-50 ghost-sidebar flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors">
                  <Menu size={20} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[260px] p-0 py-6 ghost-sidebar border-r-0">
                <AdminSidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="w-7 h-7 rounded-lg bg-neural-accent/20 flex items-center justify-center">
              <Zap size={14} className="text-neural-accent" />
            </div>
            <span className="text-neural-title text-[10px] text-neural-accent">Admin</span>
          </div>
        </div>

        <main className="pt-16 px-4 pb-6 min-h-screen">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {children}
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full relative z-10">
      <motion.aside
        animate={{ width: collapsed ? 72 : 220 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="ghost-sidebar fixed top-0 left-0 h-screen z-50 flex flex-col py-6"
        style={{ borderColor: "hsla(270, 50%, 55%, 0.08)" }}
      >
        <AdminSidebarContent collapsed={collapsed} />
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
