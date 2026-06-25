import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Check, Target, Wrench, BookOpen, ArrowUpRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAegisHealthScore } from "@/hooks/useAegisHealthScore";
import { useAegisMotion } from "@/hooks/useAegisMotion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArcGauge } from "@/features/welcome/components/ArcGauge";
import { SlideToStart } from "@/features/welcome/components/SlideToStart";
import QuickLogModal from "@/components/QuickLogModal";
import aegisLogo from "@/assets/aegis-logo.png";

/**
 * Luxe / minimalist / futurist mobile dashboard.
 * Mounted at /dashboard-lux. Does NOT replace the production dashboard.
 * Real dashboard data (habits checkable, decisions, journal) presented
 * with the Welcome HUD aesthetic: deep void background, ethereal glass,
 * Cinzel headers, bioluminescent halos.
 */
export default function DashboardLux() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const isFR = locale === "fr";
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { fadeUp } = useAegisMotion();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const dashData = useDashboardData(user?.id, isMobile, locale);
  const { score: aegisScore } = useAegisHealthScore(user?.id);

  const mobile = dashData.mobile;
  const [quickLog, setQuickLog] = useState(false);
  const [localHabits, setLocalHabits] = useState<typeof mobile extends { mobileHabits: infer H } ? H : never>(
    (mobile?.mobileHabits ?? []) as never,
  );
  // Sync local state when fresh data arrives
  useMemo(() => {
    if (mobile?.mobileHabits) setLocalHabits(mobile.mobileHabits as never);
  }, [mobile?.mobileHabits]);

  const habits = (localHabits as Array<{ id: string; name: string; completed: boolean }>) ?? [];
  const decisions = (mobile?.decisions ?? []) as Array<{
    id: string;
    name: string;
    priority: number;
    created_at?: string;
  }>;
  const journal = mobile?.lastJournalEntry ?? null;

  const moodAvg = mobile?.moodAvg ?? "—";
  const moodNum = Number.isFinite(Number(String(moodAvg).replace(",", "."))) ? Number(String(moodAvg).replace(",", ".")) : 0;
  const completed = habits.filter((h) => h.completed).length;
  const habitsMax = Math.max(habits.length, 1);

  const firstName = useMemo(() => {
    const meta = user?.user_metadata as Record<string, unknown> | undefined;
    const raw =
      (meta?.["first_name"] as string | undefined) ??
      (typeof meta?.["full_name"] === "string"
        ? (meta["full_name"] as string).split(" ")[0]
        : undefined) ??
      user?.email?.split("@")[0] ??
      "";
    return raw.trim();
  }, [user]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? isFR ? "Bonjour" : "Good morning"
      : hour < 18
        ? isFR ? "Bon après-midi" : "Good afternoon"
        : isFR ? "Bonsoir" : "Good evening";

  const L = {
    eyebrow: isFR ? "Aegis · Tableau de bord" : "Aegis · Dashboard",
    todayHabits: isFR ? "Habitudes du jour" : "Today's habits",
    allDone: isFR ? "Tout est fait. Souffle." : "All done. Breathe.",
    noHabits: isFR ? "Aucune habitude active" : "No active habits",
    openDecisions: isFR ? "Décisions ouvertes" : "Open decisions",
    noDecisions: isFR ? "Aucune décision en attente" : "No pending decision",
    journal: isFR ? "Dernière note" : "Latest note",
    noJournal: isFR ? "Aucune entrée de journal" : "No journal entry yet",
    mood: t("mood.label"),
    habits: isFR ? "Habitudes" : "Habits",
    toolbox: t("toolbox.title"),
    seeAll: isFR ? "Voir tout" : "See all",
    slide: isFR ? "Glisser pour saisir l'instant" : "Slide to log the moment",
    write: isFR ? "Écrire" : "Write",
  };

  async function toggleHabit(habitId: string) {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const current = habits.find((h) => h.id === habitId);
    if (!current) return;
    const next = !current.completed;
    setLocalHabits((prev: any) =>
      (prev as typeof habits).map((h) => (h.id === habitId ? { ...h, completed: next } : h)) as never,
    );
    try {
      if (next) {
        const { error } = await supabase
          .from("habit_completions" as any)
          .insert({ user_id: user.id, assigned_habit_id: habitId, completed_date: today } as any);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("habit_completions" as any)
          .delete()
          .eq("user_id", user.id)
          .eq("assigned_habit_id", habitId)
          .eq("completed_date", today);
        if (error) throw error;
      }
      void queryClient.invalidateQueries({ queryKey: ["dashboard-mobile", user.id, locale] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setLocalHabits((prev: any) =>
        (prev as typeof habits).map((h) => (h.id === habitId ? { ...h, completed: current.completed } : h)) as never,
      );
      toast({ title: t("toast.error"), description: msg, variant: "destructive" });
    }
  }

  function priorityDot(p: number) {
    if (p >= 4) return "bg-[hsl(var(--destructive))] shadow-[0_0_8px_hsl(var(--destructive)/0.65)]";
    if (p === 3) return "bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.55)]";
    return "bg-muted-foreground/60";
  }

  return (
    <div className="welcome-hud relative min-h-[100dvh] overflow-hidden">
      <div className="welcome-hud-bg" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col gap-6 px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        {/* Header */}
        <motion.header {...fadeUp(0)} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={aegisLogo} alt="AEGIS" className="h-8 w-8 rounded-lg object-contain" />
            <div className="flex flex-col">
              <span className="font-display text-[9px] uppercase tracking-[0.32em] text-muted-foreground">
                {L.eyebrow}
              </span>
              <span className="font-cormorant-display text-lg leading-tight text-foreground">
                {greeting}{firstName ? `, ${firstName}` : ""}
              </span>
            </div>
          </div>
          {aegisScore ? (
            <div className="welcome-glass-tile flex items-center gap-2 rounded-full px-3 py-1.5">
              <Sparkles className="h-3 w-3 text-primary" strokeWidth={1.5} aria-hidden />
              <span className="font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Aegis
              </span>
              <span className="font-display text-sm tabular-nums text-foreground">
                {Math.round(aegisScore.overall_score)}
              </span>
            </div>
          ) : null}
        </motion.header>

        {/* Twin gauges */}
        <motion.section {...fadeUp(0.05)} className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => navigate("/mood")} className="welcome-glass-tile p-3 text-left">
            <ArcGauge
              value={moodNum}
              max={10}
              accent="neural"
              label={L.mood}
              centerPrimary={String(moodAvg)}
              centerSecondary="/10"
              showProgressPct={false}
            />
          </button>
          <button type="button" onClick={() => navigate("/habits")} className="welcome-glass-tile p-3 text-left">
            <ArcGauge
              value={completed}
              max={habitsMax}
              accent="primary"
              label={L.habits}
              centerPrimary={String(completed)}
              centerSecondary={`/${habitsMax}`}
            />
          </button>
        </motion.section>

        {/* Today's habits */}
        <motion.section {...fadeUp(0.1)} className="welcome-glass-tile p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              {L.todayHabits}
            </h2>
            <button
              type="button"
              onClick={() => navigate("/habits")}
              className="inline-flex items-center gap-1 font-display text-[10px] uppercase tracking-[0.22em] text-primary/80"
            >
              {L.seeAll}
              <ArrowUpRight size={11} strokeWidth={1.5} aria-hidden />
            </button>
          </div>
          {habits.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">{L.noHabits}</p>
          ) : habits.every((h) => h.completed) ? (
            <p className="py-4 text-center font-cormorant-display text-base italic text-foreground/80">{L.allDone}</p>
          ) : (
            <ul className="divide-y divide-border/30">
              {habits.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={h.completed}
                    onClick={() => void toggleHabit(h.id)}
                    className="flex w-full items-center gap-3 py-2.5 text-left transition-opacity active:opacity-80"
                  >
                    <span
                      className={[
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all",
                        h.completed
                          ? "border-primary/60 bg-primary/15 shadow-[0_0_12px_hsl(var(--primary)/0.45)]"
                          : "border-border/60",
                      ].join(" ")}
                    >
                      {h.completed ? <Check size={12} strokeWidth={2} className="text-primary" /> : null}
                    </span>
                    <span
                      className={[
                        "flex-1 truncate font-body text-sm",
                        h.completed ? "text-muted-foreground line-through" : "text-foreground/90",
                      ].join(" ")}
                    >
                      {h.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {habits.length > 0 && (
            <div className="mt-3 h-px overflow-hidden bg-border/30">
              <div
                className="h-full bg-gradient-to-r from-primary/40 via-primary to-primary/40 transition-all duration-700"
                style={{ width: `${(completed / habitsMax) * 100}%` }}
              />
            </div>
          )}
        </motion.section>

        {/* Open decisions */}
        <motion.section {...fadeUp(0.15)} className="welcome-glass-tile p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              {L.openDecisions}
            </h2>
            <button
              type="button"
              onClick={() => navigate("/decisions")}
              className="inline-flex items-center gap-1 font-display text-[10px] uppercase tracking-[0.22em] text-primary/80"
            >
              {L.seeAll}
              <ArrowUpRight size={11} strokeWidth={1.5} aria-hidden />
            </button>
          </div>
          {decisions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Target size={22} strokeWidth={1} className="text-muted-foreground/40" aria-hidden />
              <p className="text-center text-xs text-muted-foreground">{L.noDecisions}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/30">
              {decisions.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => navigate("/decisions")}
                    className="flex w-full items-center gap-3 py-2.5 text-left"
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${priorityDot(d.priority)}`} aria-hidden />
                    <span className="flex-1 truncate font-body text-sm text-foreground/90">{d.name}</span>
                    <ArrowUpRight size={13} strokeWidth={1.5} className="text-muted-foreground/50" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.section>

        {/* Twin tiles: Journal + Toolbox */}
        <motion.section {...fadeUp(0.2)} className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate("/journal")}
            className="welcome-glass-tile flex min-h-[120px] flex-col p-4 text-left"
          >
            <div className="mb-2 flex items-center justify-between">
              <BookOpen size={18} strokeWidth={1.25} className="text-primary" aria-hidden />
              <span className="font-display text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                {L.journal}
              </span>
            </div>
            <p className="font-cormorant-display text-sm italic text-foreground/85 line-clamp-3 flex-1">
              {journal?.content ? `« ${journal.content.slice(0, 80)}${journal.content.length > 80 ? "…" : ""} »` : L.noJournal}
            </p>
            <span className="mt-2 inline-flex self-start rounded-full border border-border/50 bg-background/30 px-2.5 py-1 font-display text-[9px] uppercase tracking-[0.22em] text-foreground/85">
              {L.write}
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/toolbox")}
            className="welcome-glass-tile flex min-h-[120px] flex-col p-4 text-left"
          >
            <div className="mb-2 flex items-center justify-between">
              <Wrench size={18} strokeWidth={1.25} className="text-primary" aria-hidden />
              <span className="font-display text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                {L.toolbox}
              </span>
            </div>
            <p className="font-cormorant-display text-2xl text-foreground leading-tight tracking-tight">
              {isFR ? "Outils" : "Tools"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground flex-1">{t("toolbox.viewTodo")}</p>
            <span className="mt-2 inline-flex self-start rounded-full border border-border/50 bg-background/30 px-2.5 py-1 font-display text-[9px] uppercase tracking-[0.22em] text-foreground/85">
              {isFR ? "Ouvrir" : "Open"}
            </span>
          </button>
        </motion.section>

        {/* Slide to log */}
        <motion.div {...fadeUp(0.25)}>
          <SlideToStart label={L.slide} onComplete={() => setQuickLog(true)} />
        </motion.div>
      </div>

      <QuickLogModal open={quickLog} onClose={() => setQuickLog(false)} />
    </div>
  );
}
