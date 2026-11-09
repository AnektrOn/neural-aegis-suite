import { useEffect, useMemo, useState } from "react";
import { MemberPageHeader } from "@/components/ui/MemberPageHeader";
import { MemberPageScaffold } from "@/layouts/MemberPageScaffold";
import { MemberSplitLayout } from "@/layouts/MemberSplitLayout";
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

  const unreadCount = useMemo(() => messages.filter((m) => !m.isRead).length, [messages]);

  const leftPane = (
    <div className="space-y-5">
      <div>
        <p className="font-cinzel text-[10.5px] font-semibold tracking-[0.24em] uppercase text-[#9e7828] dark:text-[#c9a24b] mb-1.5">
          {t("messages.sectionLabel")} · CENTRE DE COMMANDE
        </p>
        <h1 className="font-cormorant text-3xl sm:text-4xl lg:text-5xl font-light text-foreground tracking-tight">
          {t("messages.title")}
        </h1>
        <p className="font-sans text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
          {t("messages.subtitle")}
        </p>
      </div>

      {/* Filter Categories */}
      <div className="space-y-2">
        <p className="font-cinzel text-[9.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground px-1">
          DOSSIERS & TRANSMISSIONS
        </p>
        <div className="flex flex-row overflow-x-auto no-scrollbar gap-2 sm:flex-col">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "w-full text-left rounded-xl border p-3.5 flex items-center justify-between transition-all duration-200 cursor-pointer shadow-sm",
                filter === f.id
                  ? "border-[#c9a24b]/60 bg-[#c9a24b]/15 text-foreground shadow-[0_0_16px_rgba(201,162,75,0.12)] font-semibold"
                  : "border-white/5 bg-black/25 text-muted-foreground hover:border-white/15 hover:text-foreground",
              )}
            >
              <div className="flex items-center gap-2.5">
                {f.id === "global" ? (
                  <Megaphone size={14} className="text-[#c9a24b]" />
                ) : f.id === "personal" ? (
                  <User size={14} className="text-[#c9a24b]" />
                ) : (
                  <Inbox size={14} className="text-[#c9a24b]" />
                )}
                <span className="font-cinzel text-xs font-semibold uppercase tracking-wider">
                  {f.label}
                </span>
              </div>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-black/30 border border-white/5 text-[#c9a24b]">
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions & Telemetry */}
      <div className="aegis-dock-tile p-5 rounded-2xl space-y-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between">
          <span className="font-cinzel text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Non lus
          </span>
          <span className="font-cormorant text-2xl font-light text-[#c9a24b] tabular-nums">
            {unreadCount}
          </span>
        </div>

        <button
          type="button"
          onClick={() => void markAllRead()}
          disabled={unreadCount === 0}
          className="w-full flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 font-cinzel text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-all hover:text-foreground hover:border-[#c9a24b]/40 hover:bg-[#c9a24b]/10 disabled:opacity-40 cursor-pointer"
        >
          <MailOpen size={13} />
          {t("messages.markAllRead")}
        </button>
      </div>
    </div>
  );

  const rightPane = (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
        <p className="font-cinzel text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          FLUX DES TRANSMISSIONS
        </p>
        <span className="font-mono text-xs text-muted-foreground">
          {visible.length} {visible.length > 1 ? "messages" : "message"}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center p-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#c9a24b]/30 border-t-[#c9a24b]" />
        </div>
      ) : visible.length === 0 ? (
        <div className="aegis-dock-tile flex flex-col items-center gap-3 p-12 text-center rounded-2xl shadow-md">
          <Inbox size={32} strokeWidth={1} className="text-[#c9a24b]/30" />
          <p className="text-sm text-muted-foreground">{t("messages.empty")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((m, i) => (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.25) }}
              className={cn(
                "aegis-dock-tile space-y-3 p-5 rounded-2xl transition-all duration-200 shadow-sm",
                !m.isRead
                  ? "border-[#c9a24b]/50 shadow-[0_0_24px_rgba(201,162,75,0.18)] bg-black/30"
                  : "border-white/5",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9.5px] font-cinzel uppercase tracking-[0.14em]",
                    m.scope === "global"
                      ? "border-[#c9a24b]/30 bg-[#c9a24b]/10 text-[#c9a24b]"
                      : "border-white/10 bg-black/20 text-muted-foreground",
                  )}
                >
                  {m.scope === "global" ? <Megaphone size={10} /> : <User size={10} />}
                  {m.scope === "global" ? t("messages.badgeGlobal") : t("messages.badgePersonal")}
                </span>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {dateFormat.format(new Date(m.createdAt))}
                  </span>
                  {!m.isRead && (
                    <span className="font-cinzel text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-[#c9a24b]/40 bg-[#c9a24b]/15 text-[#c9a24b] font-semibold">
                      {t("messages.unread")}
                    </span>
                  )}
                </div>
              </div>

              <h2 className="text-sm font-semibold text-foreground font-cinzel tracking-wide">{m.title}</h2>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground font-sans">
                {m.body}
              </p>

              {m.link && (
                <div className="pt-1">
                  <Link
                    to={m.link}
                    className="inline-flex items-center gap-1.5 font-cinzel text-[10px] uppercase tracking-[0.14em] text-[#c9a24b] hover:underline"
                  >
                    <ExternalLink size={12} />
                    {t("messages.openLink")}
                  </Link>
                </div>
              )}
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <MemberPageScaffold width="wide" viewport className="min-w-0 overflow-x-hidden">
      <MemberSplitLayout
        left={leftPane}
        right={rightPane}
        leftColSpan={4}
        rightColSpan={8}
        scrollRight={true}
        scrollLeft={true}
      />
    </MemberPageScaffold>
  );
}
