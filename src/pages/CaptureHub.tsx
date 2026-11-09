import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Target,
  ListChecks,
  Users,
  PenLine,
  ArrowUpRight,
  Send,
  Sparkles,
  Clock,
  CheckCircle2,
  Smile,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import { panelsForHub, type MenuPanelId } from "@/lib/userMenuCatalog";
import { isPanelVisible } from "@/lib/userMenuPreferences";
import { useUserMenuPrefs } from "@/hooks/useUserMenuPrefs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { MemberPageHeader } from "@/components/ui/MemberPageHeader";
import { MemberPageScaffold } from "@/layouts/MemberPageScaffold";
import { MemberSplitLayout } from "@/layouts/MemberSplitLayout";
import { MOOD_FREQUENCY_KEYS, moodFrequencyIndex } from "@/lib/moodFrequency";

type CapturePanel = {
  id: string;
  to: string;
  icon: LucideIcon;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
};

const CAPTURE_STATION_DESC_KEYS: Record<string, TranslationKey> = {
  mood: "capture.station.mood",
  decisions: "capture.station.decisions",
  habits: "capture.station.habits",
  people: "capture.station.people",
  journal: "capture.station.journal",
};

const CAPTURE_PANELS: CapturePanel[] = panelsForHub("capture").map((p) => ({
  id: p.id,
  to: p.to,
  icon: p.icon,
  nameKey: p.labelKey,
  descriptionKey: CAPTURE_STATION_DESC_KEYS[p.id] ?? "capture.station.default",
}));

type QuickType = "thought" | "decision" | "mood";

interface RecentLog {
  id: string;
  type: "journal" | "decision" | "mood";
  title: string;
  timestamp: string;
}

export default function CaptureHub() {
  const { t, locale } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { prefs } = useUserMenuPrefs();

  // Quick Capture State
  const [mobileTab, setMobileTab] = useState<"capture" | "stations" | "recent">("capture");
  const [quickType, setQuickType] = useState<QuickType>("thought");
  const [content, setContent] = useState("");
  const [moodValue, setMoodValue] = useState(7);
  const [decisionPriority, setDecisionPriority] = useState(3);
  const [isSaving, setIsSaving] = useState(false);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [todayCounts, setTodayCounts] = useState({ mood: 0, decisions: 0, journal: 0, habits: 0 });

  const visible = CAPTURE_PANELS.filter((p) => isPanelVisible(prefs, p.id as MenuPanelId));

  const moodLabel = useMemo(() => {
    const idx = moodFrequencyIndex(moodValue);
    return t(MOOD_FREQUENCY_KEYS[idx]);
  }, [moodValue, t]);

  const formatMoodLogTitle = useCallback(
    (value: number) => {
      const idx = moodFrequencyIndex(value);
      return `${t(MOOD_FREQUENCY_KEYS[idx])} · ${value}/10`;
    },
    [t],
  );

  const loadTodayStats = useCallback(async () => {
    if (!user) return;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayIso = startOfToday.toISOString();
    const todayDate = todayIso.split("T")[0];

    try {
      const [journalRes, moodRes, decRes, habitRes] = await Promise.all([
        supabase
          .from("journal_entries")
          .select("id, title, content, created_at")
          .eq("user_id", user.id)
          .gte("created_at", todayIso)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("mood_entries" as any)
          .select("id, value, logged_at")
          .eq("user_id", user.id)
          .gte("logged_at", todayIso)
          .order("logged_at", { ascending: false })
          .limit(5),
        supabase
          .from("decisions" as any)
          .select("id, name, created_at")
          .eq("user_id", user.id)
          .gte("created_at", todayIso)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("habit_completions" as any)
          .select("id")
          .eq("user_id", user.id)
          .eq("completed_date", todayDate),
      ]);

      const jList = (journalRes.data as any[] | null) || [];
      const mList = (moodRes.data as any[] | null) || [];
      const dList = (decRes.data as any[] | null) || [];
      const hCount = (habitRes.data as any[] | null)?.length || 0;

      setTodayCounts({
        journal: jList.length,
        mood: mList.length,
        decisions: dList.length,
        habits: hCount,
      });

      const combined: RecentLog[] = [
        ...jList.map((j) => ({
          id: `j-${j.id}`,
          type: "journal" as const,
          title: j.title || j.content?.slice(0, 40) || "Pensée au journal",
          timestamp: j.created_at,
        })),
        ...mList.map((m) => ({
          id: `m-${m.id}`,
          type: "mood" as const,
          title: formatMoodLogTitle(Number(m.value)),
          timestamp: m.logged_at,
        })),
        ...dList.map((d) => ({
          id: `d-${d.id}`,
          type: "decision" as const,
          title: d.name,
          timestamp: d.created_at,
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setRecentLogs(combined.slice(0, 8));
    } catch {
      // Non-blocking for offline or quiet loads
    }
  }, [user, formatMoodLogTitle]);

  useEffect(() => {
    loadTodayStats();
  }, [loadTodayStats]);

  const handleQuickCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (quickType !== "mood" && !content.trim()) return;

    setIsSaving(true);
    try {
      if (quickType === "thought") {
        const { error } = await supabase.from("journal_entries").insert({
          user_id: user.id,
          content: content.trim(),
          tags: ["capture-rapide"],
        });
        if (error) throw error;
        toast({ title: "Pensée capturée au Journal", description: "Enregistrée dans votre flux Exocortex." });
      } else if (quickType === "decision") {
        const { error } = await supabase.from("decisions" as any).insert({
          user_id: user.id,
          name: content.trim(),
          status: "pending",
          priority: Math.round(decisionPriority),
          responsibility: 5,
        } as any);
        if (error) throw error;
        toast({ title: "Décision capturée", description: "Ajoutée à vos arbitrages en attente." });
      } else if (quickType === "mood") {
        const { error } = await supabase.from("mood_entries" as any).insert({
          user_id: user.id,
          value: moodValue,
        } as any);
        if (error) throw error;
        toast({ title: "Signal émotionnel enregistré", description: `Indice ${moodValue}/10 synchronisé.` });
      }

      setContent("");
      await loadTodayStats();
    } catch (err: any) {
      toast({
        title: t("toast.error"),
        description: err.message || "Erreur de capture",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const leftPane = (
    <div className="flex flex-col gap-6 h-full justify-between">
      {/* Hero Header */}
      <div>
        <p className="font-cinzel text-[10.5px] font-semibold tracking-[0.26em] uppercase text-[#9e7828] dark:text-[#c9a24b] mb-2">
          CENTRE DE CAPTURE · BIO-LOGGING RAPIDE
        </p>
        <h1 className="font-cormorant text-3xl sm:text-4xl lg:text-5xl font-light text-foreground tracking-tight">
          Capture Exocortex
        </h1>
        <p className="font-sans text-sm text-muted-foreground mt-2 leading-relaxed">
          Enregistrez instantanément vos signaux, pensées et arbitrages sans briser votre flux d'attention.
        </p>
      </div>

      {/* Mobile Segmented Switcher (<lg) */}
      <div className="flex lg:hidden items-center p-1 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-sm">
        <button
          type="button"
          onClick={() => setMobileTab("capture")}
          className={cn(
            "flex-1 py-2 px-2 rounded-lg text-xs font-cinzel uppercase tracking-[0.12em] font-medium transition-all text-center",
            mobileTab === "capture"
              ? "bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/40 shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          ⚡ Saisie
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("stations")}
          className={cn(
            "flex-1 py-2 px-2 rounded-lg text-xs font-cinzel uppercase tracking-[0.12em] font-medium transition-all text-center",
            mobileTab === "stations"
              ? "bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/40 shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          🧭 Stations ({visible.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("recent")}
          className={cn(
            "flex-1 py-2 px-2 rounded-lg text-xs font-cinzel uppercase tracking-[0.12em] font-medium transition-all text-center",
            mobileTab === "recent"
              ? "bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/40 shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          📜 Flux ({recentLogs.length})
        </button>
      </div>

      {/* Live Intake Box & Telemetry (visible when mobileTab === 'capture' or on desktop) */}
      <div className={cn("space-y-4 flex-1 flex flex-col justify-between", mobileTab !== "capture" && "hidden lg:flex", "pb-6 lg:pb-0")}>
        <div className="aegis-dock-tile rounded-2xl p-4 sm:p-5 space-y-4 shadow-[0_8px_28px_rgba(0,0,0,0.25)]">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/20 dark:bg-black/30 border border-white/5 backdrop-blur-sm">
            {(
              [
                { id: "thought" as const, label: "Pensée", icon: PenLine },
                { id: "decision" as const, label: "Décision", icon: Target },
                { id: "mood" as const, label: "Humeur", icon: Smile },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setQuickType(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-cinzel text-[10px] font-semibold uppercase tracking-[0.14em] transition-all",
                  quickType === tab.id
                    ? "bg-white/10 dark:bg-white/10 text-[#c9a24b] shadow-sm border border-[#c9a24b]/30 backdrop-blur-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <tab.icon size={13} strokeWidth={1.5} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleQuickCapture} className="space-y-4">
            {quickType === "mood" ? (
              <div className="py-3 px-2 space-y-3 text-center">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-cinzel text-[11px] uppercase tracking-wider text-muted-foreground">
                    {t("mood.frequency")}
                  </span>
                  <span className="font-mono text-sm font-medium text-[#c9a24b] text-right">
                    {moodLabel} · {moodValue}/10
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={moodValue}
                  onChange={(e) => setMoodValue(Number(e.target.value))}
                  className="w-full accent-[#c9a24b] cursor-pointer"
                />
                <div className="flex justify-between font-mono text-[9px] text-muted-foreground/60 px-1">
                  <span>1 Récup</span>
                  <span>5 Neutre</span>
                  <span>10 Flow</span>
                </div>
                <p className="text-xs text-muted-foreground font-barlow italic">{t("capture.mood.scaleHint")}</p>
                <Link
                  to="/mood"
                  className="inline-flex items-center gap-1 text-[10px] font-cinzel uppercase tracking-wider text-[#c9a24b] hover:underline"
                >
                  {t("capture.mood.fullLogLink")}
                  <ArrowUpRight size={11} aria-hidden />
                </Link>
              </div>
            ) : quickType === "decision" ? (
              <div className="space-y-3">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      e.preventDefault();
                      void handleQuickCapture(e);
                    }
                  }}
                  placeholder={t("capture.decision.placeholder")}
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-black/25 dark:bg-black/35 backdrop-blur-sm p-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-[#c9a24b]/50 focus:outline-none transition-colors resize-none font-sans"
                />
                <div className="space-y-1.5">
                  <p className="font-cinzel text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t("capture.decision.priority")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {([1, 2, 3, 4, 5] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setDecisionPriority(p)}
                        aria-pressed={decisionPriority === p}
                        className={cn(
                          "min-h-9 min-w-9 rounded-xl border px-2.5 text-xs font-mono font-semibold tabular-nums transition-all",
                          decisionPriority === p
                            ? "border-[#c9a24b]/60 bg-[#c9a24b]/20 text-[#c9a24b]"
                            : "border-white/10 bg-black/25 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        P{p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    void handleQuickCapture(e);
                  }
                }}
                placeholder={t("capture.thought.placeholder")}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-black/25 dark:bg-black/35 backdrop-blur-sm p-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-[#c9a24b]/50 focus:outline-none transition-colors resize-none font-sans"
              />
            )}

            <button
              type="submit"
              disabled={isSaving || (quickType !== "mood" && !content.trim())}
              className="w-full btn-solaire flex min-h-[44px] items-center justify-center gap-2 rounded-xl py-3 font-cinzel text-xs uppercase tracking-[0.16em] disabled:opacity-50 cursor-pointer shadow-md"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              ) : (
                <Send size={13} />
              )}
              <span>Capturer dans l'Exocortex</span>
            </button>
          </form>
        </div>

        {/* Today's Intake Telemetry */}
        <div className="aegis-dock-tile rounded-2xl p-4">
          <p className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a24b] mb-3">
            Télémétrie du Jour
          </p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 sm:p-2.5 rounded-xl bg-black/25 dark:bg-black/35 border border-white/5 backdrop-blur-sm">
              <p className="font-mono text-base font-semibold text-foreground">{todayCounts.mood}</p>
              <p className="font-cinzel text-[8px] uppercase tracking-wider text-muted-foreground">Humeur</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-black/25 dark:bg-black/35 border border-white/5 backdrop-blur-sm">
              <p className="font-mono text-base font-semibold text-foreground">{todayCounts.decisions}</p>
              <p className="font-cinzel text-[8px] uppercase tracking-wider text-muted-foreground">Décisions</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-black/25 dark:bg-black/35 border border-white/5 backdrop-blur-sm">
              <p className="font-mono text-base font-semibold text-foreground">{todayCounts.habits}</p>
              <p className="font-cinzel text-[8px] uppercase tracking-wider text-muted-foreground">Habitudes</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-black/25 dark:bg-black/35 border border-white/5 backdrop-blur-sm">
              <p className="font-mono text-base font-semibold text-foreground">{todayCounts.journal}</p>
              <p className="font-cinzel text-[8px] uppercase tracking-wider text-muted-foreground">Journal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const rightPane = (
    <div className="space-y-6">
      {/* Modular Navigation Stations */}
      <section className={cn("space-y-3", mobileTab !== "stations" && "hidden lg:block")}>
        <div className="flex items-center justify-between">
          <h2 className="font-cinzel text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/90">
            Stations de Journalisation
          </h2>
          <span className="font-mono text-[10px] text-muted-foreground">5 protocoles actifs</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
          {visible.map((f) => (
            <motion.div
              key={f.id}
              role="link"
              tabIndex={0}
              aria-label={t(f.nameKey)}
              onClick={() => navigate(f.to)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(f.to);
                }
              }}
              className={cn(
                "group relative flex cursor-pointer flex-col justify-between gap-2.5 rounded-2xl p-3.5 sm:p-5 transition-all duration-300",
                "aegis-dock-tile hover:border-[#c9a24b]/40 hover:-translate-y-0.5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-[#c9a24b]/30 bg-[#c9a24b]/10 backdrop-blur-sm shadow-[0_2px_8px_rgba(201,162,75,0.12)]">
                  <f.icon size={17} strokeWidth={1.5} className="text-[#c9a24b]" aria-hidden />
                </span>
                <ArrowUpRight
                  size={14}
                  strokeWidth={1.5}
                  className="text-muted-foreground/40 transition-colors group-hover:text-[#c9a24b]"
                  aria-hidden
                />
              </div>

              <div>
                <p className="font-cinzel text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-foreground mb-0.5 group-hover:text-[#c9a24b] transition-colors truncate">
                  {t(f.nameKey)}
                </p>
                <p className="font-sans text-[11px] text-muted-foreground/80 line-clamp-2 leading-snug">
                  {t(f.descriptionKey)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Chronological Capture Stream */}
      <section className={cn("space-y-3", mobileTab !== "recent" && "hidden lg:block")}>
        <div className="flex items-center justify-between">
          <h2 className="font-cinzel text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/90">
            Flux Récent · Aujourd'hui
          </h2>
          <span className="font-mono text-[10px] text-muted-foreground">{recentLogs.length} entrées</span>
        </div>

        {recentLogs.length === 0 ? (
          <div className="aegis-dock-tile border-dashed border-border/40 p-8 text-center space-y-2 rounded-2xl">
            <Sparkles size={24} strokeWidth={1.2} className="mx-auto text-[#c9a24b]/50" />
            <p className="font-cormorant text-lg font-light italic text-muted-foreground">
              "Chaque signal capturé structure votre clarté mentale."
            </p>
            <p className="font-cinzel text-[9px] uppercase tracking-widest text-muted-foreground/60">
              Aucune capture aujourd'hui — utilisez l'onglet Saisie
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="aegis-dock-tile flex items-center justify-between p-3.5 rounded-xl border border-white/5 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      log.type === "mood" && "bg-[#d2ae5e]",
                      log.type === "decision" && "bg-[#c9a24b]",
                      log.type === "journal" && "bg-[#e9e4d8]/80",
                    )}
                  />
                  <p className="text-sm font-medium text-foreground truncate">{log.title}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground font-mono text-[10px]">
                  <Clock size={11} />
                  <span>
                    {new Date(log.timestamp).toLocaleTimeString(locale === "fr" ? "fr-FR" : "en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  return (
    <MemberPageScaffold width="wide" viewport>
      <MemberSplitLayout
        left={leftPane}
        right={rightPane}
        leftCols="lg:col-span-5"
        rightCols="lg:col-span-7"
        scrollRight={true}
        scrollLeft={false}
      />
    </MemberPageScaffold>
  );
}
