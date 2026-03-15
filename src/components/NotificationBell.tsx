import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  useEffect(() => {
    if (isMobile) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMobile]);

  const loadNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications(((data as any[]) || []) as Notification[]);
  };

  const markRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true } as any)
      .eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase
      .from("notifications")
      .update({ is_read: true } as any)
      .in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const NotificationList = () => (
    <>
      <div className="p-3 border-b border-border flex justify-between items-center">
        <h3 className="text-xs font-medium text-foreground uppercase tracking-wider">{t("notifications.title")}</h3>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-[10px] text-primary hover:underline">
            {t("notifications.markAllRead")}
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground text-xs">{t("notifications.none")}</div>
      ) : (
        notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => markRead(n.id)}
            className={`w-full text-left p-3 border-b border-border/50 hover:bg-secondary/20 transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}
          >
            <div className="flex items-start gap-2">
              {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />}
              <div className={!n.is_read ? "" : "ml-3.5"}>
                <p className="text-xs font-medium text-foreground">{n.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-[9px] text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </button>
        ))
      )}
    </>
  );

  const BellButton = () => (
    <button
      onClick={() => setOpen(!open)}
      className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
    >
      <Bell size={16} />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent text-[9px] text-accent-foreground flex items-center justify-center font-medium">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );

  // ── Mobile: Vaul bottom drawer ──────────────────────────────────────────────
  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Trigger asChild>
          <BellButton />
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[90]" />
          <Drawer.Content
            className="fixed bottom-0 left-0 right-0 z-[100] rounded-t-3xl bg-card border-t border-border focus:outline-none max-h-[70vh] flex flex-col"
            style={{ paddingBottom: "var(--safe-bottom)" }}
          >
            <div className="w-10 h-1 bg-border/50 rounded-full mx-auto mt-3 mb-1 shrink-0" />
            <div className="overflow-y-auto flex-1">
              <NotificationList />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // ── Desktop: absolute dropdown ──────────────────────────────────────────────
  return (
    <div ref={ref} className="relative">
      <BellButton />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-xl bg-card border border-border shadow-xl z-[100]"
          >
            <NotificationList />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
