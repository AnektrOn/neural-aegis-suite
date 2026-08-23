import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Inbox, Megaphone, User, MailOpen, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

type BoardMessage = {
  id: string;
  source: "admin_message" | "notification";
  scope: "global" | "personal";
  title: string;
  body: string;
  link: string | null;
  createdAt: string;
  isRead: boolean;
};

type Filter = "all" | "global" | "personal";

export default function Messages() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const [messages, setMessages] = useState<BoardMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const [msgRes, notifRes] = await Promise.all([
        supabase
          .from("admin_messages" as never)
          .select("*")
          .eq("recipient_id", user.id)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .in("type", ["popup", "message", "admin"])
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      if (cancelled) return;

      const fromAdmin: BoardMessage[] = ((msgRes.data as unknown as Array<Record<string, unknown>>) || []).map((m) => ({
        id: `am-${String(m.id)}`,
        source: "admin_message",
        scope: "personal",
        title: String(m.subject ?? ""),
        body: String(m.body ?? ""),
        link: null,
        createdAt: String(m.created_at),
        isRead: Boolean(m.is_read),
      }));

      const fromNotifs: BoardMessage[] = ((notifRes.data as unknown as Array<Record<string, unknown>>) || []).map((n) => ({
        id: `nt-${String(n.id)}`,
        source: "notification",
        scope: n.scope === "global" ? "global" : "personal",
        title: String(n.title ?? ""),
        body: String(n.message ?? ""),
        link: (n.link as string | null) ?? null,
        createdAt: String(n.created_at),
        isRead: Boolean(n.is_read),
      }));

      const all = [...fromAdmin, ...fromNotifs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setMessages(all);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const counts = useMemo(
    () => ({
      all: messages.length,
      global: messages.filter((m) => m.scope === "global").length,
      personal: messages.filter((m) => m.scope === "personal").length,
    }),
    [messages],
  );

  const visible = useMemo(
    () => (filter === "all" ? messages : messages.filter((m) => m.scope === filter)),
    [messages, filter],
  );

  const markAllRead = async () => {
    if (!user) return;
    const unreadNotifs = messages.filter((m) => m.source === "notification" && !m.isRead);
    const unreadAdmin = messages.filter((m) => m.source === "admin_message" && !m.isRead);
    if (unreadNotifs.length) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", unreadNotifs.map((m) => m.id.slice(3)));
    }
    if (unreadAdmin.length) {
      await supabase
        .from("admin_messages" as never)
        .update({ is_read: true } as never)
        .in("id", unreadAdmin.map((m) => m.id.slice(3)));
    }
    setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
  };

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: t("messages.filterAll"), count: counts.all },
    { id: "global", label: t("messages.filterGlobal"), count: counts.global },
    { id: "personal", label: t("messages.filterPersonal"), count: counts.personal },
  ];

  const dateFormat = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="text-neural-label mb-3">{t("messages.sectionLabel")}</p>
        <h1 className="text-neural-title text-3xl text-foreground">{t("messages.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("messages.subtitle")}</p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "min-h-[40px] rounded-xl border px-4 text-xs uppercase tracking-[0.12em] transition-colors",
              filter === f.id
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border/30 bg-secondary/10 text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label} <span className="opacity-60">({f.count})</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => void markAllRead()}
          className="ml-auto flex min-h-[40px] items-center gap-2 rounded-xl border border-border/30 px-4 text-xs uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <MailOpen size={14} />
          {t("messages.markAllRead")}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      ) : visible.length === 0 ? (
        <div className="ethereal-glass flex flex-col items-center gap-3 p-12 text-center">
          <Inbox size={28} strokeWidth={1.5} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("messages.empty")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((m, i) => (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className={cn(
                "ethereal-glass space-y-3 p-6",
                !m.isRead && "border-primary/30 ring-1 ring-primary/20",
              )}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]",
                    m.scope === "global"
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border/30 bg-secondary/10 text-muted-foreground",
                  )}
                >
                  {m.scope === "global" ? <Megaphone size={11} /> : <User size={11} />}
                  {m.scope === "global" ? t("messages.badgeGlobal") : t("messages.badgePersonal")}
                </span>
                <span className="text-xs text-muted-foreground">{dateFormat.format(new Date(m.createdAt))}</span>
                {!m.isRead && (
                  <span className="text-[10px] uppercase tracking-[0.14em] text-primary">{t("messages.unread")}</span>
                )}
              </div>
              <h2 className="text-base font-medium text-foreground">{m.title}</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{m.body}</p>
              {m.link && (
                <Link
                  to={m.link}
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-primary hover:underline"
                >
                  <ExternalLink size={13} />
                  {t("messages.openLink")}
                </Link>
              )}
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
