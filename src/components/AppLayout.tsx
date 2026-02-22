import { useState } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Brain,
  Target,
  ListChecks,
  Headphones,
  Users,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
  Shield,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/use-admin";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/mood", icon: Brain, label: "Mood" },
  { to: "/decisions", icon: Target, label: "Decisions" },
  { to: "/habits", icon: ListChecks, label: "Habits" },
  { to: "/toolbox", icon: Headphones, label: "Toolbox" },
  { to: "/people", icon: Users, label: "People" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();
  const { isAdmin } = useAdmin();

  return (
    <div className="flex min-h-screen w-full relative z-10">
      {/* Ghost Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 220 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="ghost-sidebar fixed top-0 left-0 h-screen z-50 flex flex-col py-6"
      >
        {/* Logo */}
        <div className="px-4 mb-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center glow-node">
            <Zap size={16} className="text-primary" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-neural-title text-[11px]"
              >
                Aegis
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20"
                    transition={{ duration: 0.3 }}
                  />
                )}
                <item.icon size={18} strokeWidth={1.5} className="relative z-10 shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs font-medium tracking-widest uppercase relative z-10"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </nav>

        {/* Admin link */}
        {isAdmin && (
          <Link
            to="/admin"
            className="mx-3 mb-2 flex items-center gap-3 px-3 py-3 rounded-xl text-neural-accent/60 hover:text-neural-accent hover:bg-neural-accent/5 transition-all"
          >
            <Shield size={18} strokeWidth={1.5} className="shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs font-medium tracking-widest uppercase">
                  Admin
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        )}

        {/* Theme toggle */}
        <ThemeToggle collapsed={collapsed} />

        {/* Sign out */}
        <button
          onClick={signOut}
          className="mx-3 p-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mx-3 mt-2 p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </motion.aside>

      {/* Main content */}
      <motion.main
        animate={{ marginLeft: collapsed ? 72 : 220 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1 min-h-screen p-6 md:p-10"
      >
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      </motion.main>
    </div>
  );
}
