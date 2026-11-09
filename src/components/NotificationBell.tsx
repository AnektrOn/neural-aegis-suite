import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Z_INDEX } from "@/lib/zIndex";
import { useMemberInboxUnread } from "@/hooks/useMemberInboxUnread";

interface BellItem {
  id: string;
  source: "notification" | "admin_message";
  rawId: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

function formatNotificationTime(iso: string, locale: string): string {
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  return new Date(iso).toLocaleDateString(loc, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationBell() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [items, setItems] = useState<BellItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { unreadCount: inboxUnreadCount, refresh: refreshInboxUnread } = useMemberInboxUnread(user?.id);

  const loadInbox = useCallback(async () => {
    if (!user?.id) return;
    const [notifRes, adminRes] = await Promise.all([
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(16),
      supabase
        .from("admin_messages")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(16),
    ]);

    const fromNotif: BellItem[] = ((notifRes.data as any[]) || []).map((n) => ({
      id: `nt-${n.id}`,
      source: "notification" as const,
      rawId: n.id,
      title: n.title ?? "",
      message: n.message ?? "",
      type: n.type ?? "info",
      is_read: Boolean(n.is_read),
      link: n.link ?? null,
      created_at: n.created_at,
    }));

    const fromAdmin: BellItem[] = ((adminRes.data as any[]) || []).map((m) => ({
      id: `am-${m.id}`,
      source: "admin_message" as const,
      rawId: m.id,
      title: m.subject ?? "",
      message: m.body ?? "",
      type: "admin",
      is_read: Boolean(m.is_read),
      link: "/messages",
      created_at: m.created_at,
    }));

    const merged = [...fromNotif, ...fromAdmin]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20);

    setItems(merged);
    void refreshInboxUnread();
  }, [user?.id, refreshInboxUnread]);

  useEffect(() => {
    if (!user?.id) return;
    void loadInbox();

    const channel = supabase
      .channel(`notifications-bell-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const n = payload.new as Record<string, unknown>;
            const item: BellItem = {
              id: `nt-${String(n.id)}`,
              source: "notification",
              rawId: String(n.id),
              title: String(n.title ?? ""),
              message: String(n.message ?? ""),
              type: String(n.type ?? "info"),
              is_read: Boolean(n.is_read),
              link: (n.link as string | null) ?? null,
              created_at: String(n.created_at),
            };
            setItems((prev) => [item, ...prev].slice(0, 20));
            const toastFn =
              item.type === "success"
                ? toast.success
                : item.type === "error"
                  ? toast.error
                  : toast;
            toastFn(item.title, { description: item.message });
          } else {
            void loadInbox();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => void loadInbox(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, loadInbox]);

  useEffect(() => {
    if (isMobile) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMobile]);

  const markRead = async (item: BellItem) => {
    if (item.source === "notification") {
      await supabase.from("notifications").update({ is_read: true } as any).eq("id", item.rawId);
    } else {
      await supabase.from("admin_messages").update({ is_read: true }).eq("id", item.rawId);
    }
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
    void refreshInboxUnread();
  };

  const markAllRead = async () => {
    const unreadNotif = items.filter((n) => n.source === "notification" && !n.is_read);
    const unreadAdmin = items.filter((n) => n.source === "admin_message" && !n.is_read);
    if (unreadNotif.length) {
      await supabase
        .from("notifications")
        .update({ is_read: true } as any)
        .in(
          "id",
          unreadNotif.map((n) => n.rawId),
        );
    }
    if (unreadAdmin.length) {
      await supabase
        .from("admin_messages")
        .update({ is_read: true })
        .in(
          "id",
          unreadAdmin.map((n) => n.rawId),
        );
    }
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    void refreshInboxUnread();
  };

  const unreadCount = inboxUnreadCount > 0 ? inboxUnreadCount : items.filter((n) => !n.is_read).length;

  const NotificationList = () => (
    <>
      <div className="p-3 border-b border-border flex justify-between items-center">
        <h3 className="text-xs font-medium text-foreground uppercase tracking-wider">{t("notifications.title")}</h3>
        {unreadCount > 0 && (
          <button type="button" onClick={() => void markAllRead()} className="text-[10px] text-primary hover:underline">
            {t("notifications.markAllRead")}
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground text-xs">{t("notifications.none")}</div>
      ) : (
        items.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => {
              void markRead(n);
              const dest = n.link;
              if (dest) {
                setOpen(false);
                navigate(dest);
              }
            }}
            className={`w-full text-left p-3 border-b border-border/50 hover:bg-secondary/20 transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}
          >
            <div className="flex items-start gap-2">
              {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />}
              <div className={!n.is_read ? "" : "ml-3.5"}>
                <p className="text-xs font-medium text-foreground">{n.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[9px] text-muted-foreground mt-1">
                  {formatNotificationTime(n.created_at, locale)}
                </p>
              </div>
            </div>
          </button>
        ))
      )}
      <div className="p-2 border-t border-border">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            navigate("/messages");
          }}
          className="w-full min-h-[40px] rounded-lg text-[10px] font-cinzel uppercase tracking-wider text-primary hover:bg-primary/10 transition-colors"
        >
          {t("notifications.viewAllMessages")}
        </button>
      </div>
    </>
  );

  const BellButton = React.forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<"button"> & { expanded?: boolean }
  >(({ className, onClick, expanded, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      {...rest}
      aria-label={t("notifications.openPanel")}
      aria-expanded={expanded ?? false}
      onClick={(e) => {
        setOpen((o) => !o);
        onClick?.(e);
      }}
      className={cn(
        "relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors",
        className,
      )}
    >
      <Bell size={16} aria-hidden />
      {unreadCount > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-accent text-[8px] text-accent-foreground flex items-center justify-center font-semibold leading-none ring-2 ring-bg-surface pointer-events-none">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  ));
  BellButton.displayName = "BellButton";

  if (isMobile) {
    const mobilePanel = (
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Fermer les notifications"
              className={`fixed inset-0 z-[${Z_INDEX.notificationBackdrop}] bg-background/50`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="notifications-mobile-title"
              className={`fixed inset-x-0 bottom-0 z-[${Z_INDEX.notificationPanel}] flex max-h-[min(78dvh,38rem)] flex-col rounded-t-3xl border-t border-border bg-card pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl focus:outline-none`}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 34, stiffness: 360 }}
            >
              <h2 id="notifications-mobile-title" className="sr-only">
                {t("notifications.title")}
              </h2>
              <div className="mx-auto mb-1 mt-3 h-1 w-10 shrink-0 rounded-full bg-border/50" aria-hidden />
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <NotificationList />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );

    return (
      <>
        <BellButton expanded={open} />
        {typeof document !== "undefined" ? createPortal(mobilePanel, document.body) : mobilePanel}
      </>
    );
  }

  return (
    <div ref={ref} className="relative">
      <BellButton expanded={open} />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            role="dialog"
            aria-label={t("notifications.title")}
            className={`absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-1.5rem))] max-h-[min(70vh,32rem)] overflow-y-auto rounded-xl bg-card border border-border shadow-2xl z-[${Z_INDEX.notificationPanel}]`}
          >
            <NotificationList />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
