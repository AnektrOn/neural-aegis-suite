import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Factory, Users, ChevronLeft, ChevronRight, Zap, LogOut, ArrowLeft, BarChart3, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const adminNavKeys = [
  { to: "/admin", icon: Phone, key: "admin.nav.calls" as const },
  { to: "/admin/habits", icon: Factory, key: "admin.nav.habits" as const },
  { to: "/admin/users", icon: Users, key: "admin.nav.users" as const },
  { to: "/admin/analytics", icon: BarChart3, key: "admin.nav.analytics" as const },
  { to: "/admin/companies", icon: Building2, key: "admin.nav.companies" as const },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen w-full relative z-10">
      <motion.aside
        animate={{ width: collapsed ? 72 : 220 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="ghost-sidebar fixed top-0 left-0 h-screen z-50 flex flex-col py-6"
        style={{ borderColor: "hsla(270, 50%, 55%, 0.08)" }}
      >
        <div className="px-4 mb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neural-accent/20 flex items-center justify-center" style={{ boxShadow: "0 0 20px hsla(270, 50%, 55%, 0.3)" }}>
            <Zap size={16} className="text-neural-accent" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-neural-title text-[11px] text-neural-accent">
                Admin
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <Link to="/" className="mx-3 mb-4 flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-all">
          <ArrowLeft size={16} strokeWidth={1.5} className="shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[9px] uppercase tracking-[0.3em]">
                {t("admin.nav.dashboard")}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        <nav className="flex-1 flex flex-col gap-1 px-3">
          {adminNavKeys.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink key={item.to} to={item.to}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative ${
                  isActive ? "bg-neural-accent/10 text-neural-accent" : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                }`}>
                {isActive && (
                  <motion.div layoutId="admin-sidebar-active" className="absolute inset-0 rounded-xl bg-neural-accent/10 border border-neural-accent/20" transition={{ duration: 0.3 }} />
                )}
                <item.icon size={18} strokeWidth={1.5} className="relative z-10 shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs font-medium tracking-widest uppercase relative z-10">
                      {t(item.key)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </nav>

        <button onClick={signOut} className="mx-3 p-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors" title={t("nav.logout")}>
          <LogOut size={16} />
        </button>
        <LanguageSwitcher collapsed={collapsed} />
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
