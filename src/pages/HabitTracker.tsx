import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Flame, ListChecks, Dumbbell, Brain, Heart, BookOpen, Moon, Zap, Target, Play, Headphones, Clock } from "lucide-react";
import { getHabitToolboxDurationOptions, formatHabitDurationBadge } from "@/lib/toolbox-widget-duration";
import AddToCalendarButton from "@/features/toolbox/AddToCalendarButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { pickLocalizedText } from "@/lib/content-i18n";
import { pickCatalogTemplateDisplayTitle } from "@/lib/catalog-i18n";
import type { Locale } from "@/i18n/translations";
import HabitToolboxModal, { type HabitToolboxItem } from "@/features/habits/components/HabitToolboxModal";
import { resolveToolboxContentSlug } from "@/lib/toolbox-content-slug";
import { TOOLBOX_TYPE_META } from "@/lib/toolbox-renderer-registry";
import { MemberPageHeader } from "@/components/ui/MemberPageHeader";
import { MemberPageScaffold } from "@/layouts/MemberPageScaffold";
import { MemberSplitLayout } from "@/layouts/MemberSplitLayout";
import { cn } from "@/lib/utils";

interface AssignedHabit {
  id: string;
  habit_template_id: string | null;
  toolbox_assignment_id: string | null;
  is_active: boolean;
  template_name: string;
  template_category: string;
  isToolboxLinked: boolean;
  toolbox_content_type?: string;
  duration_override_min?: number | null;
}

const categoryIcon = (cat: string) => {
  const c = cat?.toLowerCase() ?? "";
  if (c.includes("toolbox")) return Headphones;
  if (c.includes("sport") || c.includes("physique") || c.includes("exercise")) return Dumbbell;
  if (c.includes("mind") || c.includes("médita") || c.includes("mental")) return Brain;
  if (c.includes("santé") || c.includes("health") || c.includes("bien")) return Heart;
  if (c.includes("lecture") || c.includes("learn") || c.includes("read")) return BookOpen;
  if (c.includes("sommeil") || c.includes("sleep") || c.includes("repos")) return Moon;
  if (c.includes("énergie") || c.includes("energy")) return Zap;
  return Target;
};

export default function HabitTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const [habits, setHabits] = useState<AssignedHabit[]>([]);
  const [toolboxItemsById, setToolboxItemsById] = useState<Record<string, HabitToolboxItem>>({});
  const [activeToolboxItem, setActiveToolboxItem] = useState<HabitToolboxItem | null>(null);
  const [activeAssignedHabitId, setActiveAssignedHabitId] = useState<string | null>(null);
  const [activeDurationOverrideMin, setActiveDurationOverrideMin] = useState<number | null>(null);
  const [toolboxModalOpen, setToolboxModalOpen] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending">("all");
  const [mobileTab, setMobileTab] = useState<"habits" | "cadence">("habits");
  const today = new Date().toISOString().split("T")[0];

  const loadData = async (opts?: { silent?: boolean }) => {
    if (!user) return;
    if (!opts?.silent) setLoading(true);

    const baseSelect = "id, habit_template_id, toolbox_assignment_id, is_active";
    let assigned: {
      id: string;
      habit_template_id: string | null;
      toolbox_assignment_id: string | null;
      is_active: boolean;
      duration_override_min?: number | null;
    }[] | null = null;

    const withDuration = await supabase
      .from("assigned_habits" as any)
      .select(`${baseSelect}, duration_override_min`)
      .eq("user_id", user.id);

    if (withDuration.error) {
      console.warn("[HabitTracker] duration_override_min unavailable, falling back:", withDuration.error.message);
      const fallback = await supabase
        .from("assigned_habits" as any)
        .select(baseSelect)
        .eq("user_id", user.id);
      assigned = ((fallback.data as unknown as typeof assigned) ?? []).map((row) => ({
        ...row,
        duration_override_min: null,
      }));
    } else {
      assigned = withDuration.data as unknown as typeof assigned;
    }

    if (!assigned || assigned.length === 0) {
      setHabits([]);
      setToolboxItemsById({});
      const { data: completions } = await supabase
        .from("habit_completions" as any)
        .select("assigned_habit_id")
        .eq("user_id", user.id)
        .eq("completed_date", today);
      setCompletedIds(new Set((completions as any[] || []).map((c) => c.assigned_habit_id)));
      if (!opts?.silent) setLoading(false);
      return;
    }

    const rows = assigned.map((a) => ({
      ...a,
      duration_override_min: a.duration_override_min ?? null,
    }));

    const templateIds = [...new Set(rows.map((a) => a.habit_template_id).filter(Boolean))] as string[];
    const toolboxIds = [...new Set(rows.map((a) => a.toolbox_assignment_id).filter(Boolean))] as string[];

    const [templatesRes, toolboxRes] = await Promise.all([
      templateIds.length
        ? supabase.from("habit_templates" as any).select("id, name, name_i18n, category").in("id", templateIds)
        : Promise.resolve({ data: [] }),
      toolboxIds.length
        ? supabase
            .from("toolbox_assignments")
            .select("id, title, title_i18n, content_type, duration, description, description_i18n, external_url, widget_config")
            .in("id", toolboxIds)
        : Promise.resolve({ data: [] }),
    ]);

    const templateMap = new Map((templatesRes.data as any[] || []).map((tpl) => [tpl.id, tpl]));
    const toolboxRows = (toolboxRes.data as HabitToolboxItem[]) || [];
    const toolboxMap = new Map(toolboxRows.map((tb) => [tb.id, tb]));
    setToolboxItemsById(Object.fromEntries(toolboxRows.map((tb) => [tb.id, tb])));

    const mapAssignment = (a: (typeof rows)[number]): AssignedHabit => {
      if (a.toolbox_assignment_id) {
        const toolbox = toolboxMap.get(a.toolbox_assignment_id);
        const title = toolbox
          ? pickCatalogTemplateDisplayTitle(locale as Locale, toolbox)
          : t("habits.unknown");
        const typeLabel = toolbox?.content_type && TOOLBOX_TYPE_META[toolbox.content_type]
          ? t(TOOLBOX_TYPE_META[toolbox.content_type].labelKey as never)
          : t("habits.toolboxLinked");
        return {
          id: a.id,
          habit_template_id: a.habit_template_id,
          toolbox_assignment_id: a.toolbox_assignment_id,
          is_active: a.is_active,
          template_name: title,
          template_category: typeLabel,
          isToolboxLinked: true,
          toolbox_content_type: toolbox?.content_type,
          duration_override_min: a.duration_override_min,
        };
      }

      const template = a.habit_template_id ? templateMap.get(a.habit_template_id) : null;
      return {
        id: a.id,
        habit_template_id: a.habit_template_id,
        toolbox_assignment_id: null,
        is_active: a.is_active,
        template_name: template
          ? pickLocalizedText(locale as Locale, (template as any).name_i18n, template.name)
          : t("habits.unknown"),
        template_category: template?.category || t("habits.categoryGeneral"),
        isToolboxLinked: false,
      };
    };

    const all = rows.map(mapAssignment);
    setHabits(all.filter((h) => h.is_active));

    const { data: completions } = await supabase
      .from("habit_completions" as any)
      .select("assigned_habit_id")
      .eq("user_id", user.id)
      .eq("completed_date", today);
    setCompletedIds(new Set((completions as any[] || []).map((c) => c.assigned_habit_id)));
    if (!opts?.silent) setLoading(false);
  };

  useEffect(() => {
    if (user) void loadData();
  }, [user, locale]);

  useEffect(() => {
    const onToolboxCompleted = () => {
      void loadData({ silent: true });
      toast({ title: t("habits.autoCompleted") });
    };
    window.addEventListener("aegis:toolbox-completed", onToolboxCompleted);
    return () => window.removeEventListener("aegis:toolbox-completed", onToolboxCompleted);
  }, [t, toast, user, locale]);

  const toggleComplete = async (habitId: string) => {
    if (!user) return;
    const isCompleted = completedIds.has(habitId);
    if (isCompleted) {
      await supabase.from("habit_completions" as any).delete().eq("user_id", user.id).eq("assigned_habit_id", habitId).eq("completed_date", today);
      setCompletedIds((prev) => { const s = new Set(prev); s.delete(habitId); return s; });
    } else {
      const { error } = await supabase.from("habit_completions" as any).insert({ user_id: user.id, assigned_habit_id: habitId, completed_date: today } as any);
      if (error) { toast({ title: t("toast.error"), description: error.message, variant: "destructive" }); return; }
      setCompletedIds((prev) => new Set(prev).add(habitId));
    }
  };

  const completedCount = completedIds.size;
  const categories = ["all", ...new Set(habits.map((h) => h.template_category).filter(Boolean))];
  const filteredHabits = habits.filter((habit) => {
    const byCategory = categoryFilter === "all" || habit.template_category === categoryFilter;
    const isDone = completedIds.has(habit.id);
    const byStatus =
      statusFilter === "all" ||
      (statusFilter === "completed" && isDone) ||
      (statusFilter === "pending" && !isDone);
    return byCategory && byStatus;
  });

  const openToolboxModal = (habit: AssignedHabit) => {
    if (!habit.toolbox_assignment_id) return;
    const toolboxItem = toolboxItemsById[habit.toolbox_assignment_id];
    if (!toolboxItem) return;
    setActiveAssignedHabitId(habit.id);
    setActiveDurationOverrideMin(habit.duration_override_min ?? null);
    setActiveToolboxItem(toolboxItem);
    setToolboxModalOpen(true);
  };

  useEffect(() => {
    const habitId = new URLSearchParams(window.location.search).get("habit");
    if (!habitId || habits.length === 0) return;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    if (habit.toolbox_assignment_id && toolboxItemsById[habit.toolbox_assignment_id]) {
      openToolboxModal(habit);
    }
    document.getElementById(`habit-${habitId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.history.replaceState({}, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits, toolboxItemsById]);

  if (loading) {
    return (
      <MemberPageScaffold>
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      </MemberPageScaffold>
    );
  }

  const progressPct = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  const leftPane = (
    <div className="space-y-5">
      <MemberPageHeader
        kicker="ARCHITECTURE DE PERFORMANCE · HABITUDES"
        title={t("habits.trackingTitle")}
        subtitle="Maintenez la constance bio-exécutive au fil des jours."
      />

      {/* Mobile Segmented Switcher (<lg) */}
      <div className="flex lg:hidden items-center p-1 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-sm">
        <button
          type="button"
          onClick={() => setMobileTab("habits")}
          className={cn(
            "flex-1 py-2 px-2 rounded-lg text-xs font-cinzel uppercase tracking-[0.12em] font-medium transition-all text-center",
            mobileTab === "habits"
              ? "bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/40 shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          ✅ Habitudes ({habits.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("cadence")}
          className={cn(
            "flex-1 py-2 px-2 rounded-lg text-xs font-cinzel uppercase tracking-[0.12em] font-medium transition-all text-center",
            mobileTab === "cadence"
              ? "bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/40 shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          📊 Cadence ({progressPct}%)
        </button>
      </div>

      <div className={cn("space-y-5", mobileTab !== "cadence" && "hidden lg:block", "pb-6 lg:pb-0")}>
        {/* Daily Performance Score Card */}
        <div className="aegis-dock-tile rounded-2xl p-5 space-y-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-cinzel text-[9.5px] font-semibold uppercase tracking-[0.24em] text-[#9e7828] dark:text-[#c9a24b]">
                CADENCE QUOTIDIENNE
              </p>
              <p className="font-cormorant text-4xl font-light text-foreground tabular-nums mt-1">
                {completedCount} <span className="text-muted-foreground text-2xl font-light">/ {habits.length}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="font-cormorant text-5xl font-light text-[#c9a24b] tabular-nums">
                {progressPct}%
              </span>
              <p className="font-cinzel text-[9px] uppercase tracking-wider text-muted-foreground">
                {t("habits.dailyScore")}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-black/30 overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#9e7828] to-[#c9a24b] transition-all duration-500 rounded-full shadow-[0_0_12px_rgba(201,162,75,0.4)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.08] text-xs">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-black/20 border border-white/5">
              <ListChecks size={14} className="text-[#c9a24b]" />
              <span className="text-muted-foreground text-[11px]">{t("habits.completedToday")}:</span>
              <span className="font-semibold text-foreground font-mono">{completedCount}</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-black/20 border border-white/5">
              <Flame size={14} className="text-amber-400" />
              <span className="text-muted-foreground text-[11px]">{t("habits.assignedHabits")}:</span>
              <span className="font-semibold text-foreground font-mono">{habits.length}</span>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="space-y-2">
          <p className="font-cinzel text-[9.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground px-1">
            CATÉGORIES
          </p>
          <div className="flex flex-nowrap overflow-x-auto no-scrollbar gap-1.5 pb-1 lg:flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setCategoryFilter(category)}
                className={cn(
                  "shrink-0 font-cinzel text-[9.5px] font-semibold uppercase tracking-[0.14em] px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap",
                  categoryFilter === category
                    ? "border-[#c9a24b]/60 bg-[#c9a24b]/20 text-[#c9a24b] shadow-sm font-semibold"
                    : "border-white/5 bg-black/25 text-muted-foreground hover:border-white/15 hover:text-foreground",
                )}
              >
                {category === "all" ? t("habits.filterAllCategories") : category}
              </button>
            ))}
          </div>
        </div>

        {/* Bio-Executive Cadence Tip */}
        <div className="aegis-dock-tile p-4 rounded-xl border border-white/10 space-y-1.5 shadow-sm">
          <p className="font-cinzel text-[9.5px] font-semibold uppercase tracking-wider text-[#c9a24b]">
            MAXIME BIO-EXÉCUTIVE
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed italic font-body">
            « La régularité de vos micro-habitudes ancre la résilience neuro-végétative sous haute pression. »
          </p>
        </div>
      </div>
    </div>
  );

  const rightPane = (
    <div className={cn("space-y-4", mobileTab !== "habits" && "hidden lg:block")}>
      {/* Status Filter Pills */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all" as const, label: t("habits.filterAllStatuses") },
            { key: "completed" as const, label: t("toolbox.completed") },
            { key: "pending" as const, label: t("toolbox.pending") },
          ].map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => setStatusFilter(entry.key)}
              className={cn(
                "font-cinzel text-[9.5px] font-semibold uppercase tracking-[0.14em] px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer",
                statusFilter === entry.key
                  ? "border-[#c9a24b]/60 bg-[#c9a24b]/20 text-[#c9a24b] shadow-sm font-semibold"
                  : "border-white/5 bg-black/25 text-muted-foreground hover:border-white/15 hover:text-foreground",
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {filteredHabits.length} {filteredHabits.length > 1 ? "habitudes" : "habitude"}
        </span>
      </div>

      {/* Habits List */}
      {filteredHabits.length === 0 ? (
        <div className="aegis-dock-tile rounded-2xl p-12 text-center shadow-md">
          <svg width="44" height="44" viewBox="0 0 48 48" fill="none" aria-hidden className="mx-auto mb-3 text-[#c9a24b]/30">
            <rect x="8" y="10" width="32" height="6" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <rect x="8" y="21" width="32" height="6" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <rect x="8" y="32" width="20" height="6" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="40" cy="35" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M37.5 35l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="font-cormorant text-lg font-light text-muted-foreground/70 italic mb-1">
            {habits.length === 0 ? "Votre routine bien-être vous attend" : "Aucune habitude dans ce filtre"}
          </p>
          <p className="font-cinzel text-[9.5px] tracking-[0.18em] uppercase text-muted-foreground/40">
            {habits.length === 0 ? t("habits.noHabitsAssigned") : t("habits.noHabitsInFilters")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredHabits.map((habit, i) => {
            const completed = completedIds.has(habit.id);
            return (
              <motion.div
                key={habit.id}
                id={`habit-${habit.id}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.25) }}
                className={cn(
                  "aegis-dock-tile rounded-2xl px-4 py-3.5 flex items-center gap-3.5 min-h-[58px] transition-all duration-200 hover:border-[#c9a24b]/30 shadow-sm",
                  completed ? "opacity-65" : "",
                  habit.isToolboxLinked ? "border-[#c9a24b]/30 bg-[#c9a24b]/5" : "",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleComplete(habit.id)}
                  aria-label={`${completed ? "Décocher" : "Cocher"} ${habit.template_name}`}
                  aria-checked={completed}
                  role="checkbox"
                  className={cn(
                    "w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-all cursor-pointer",
                    completed
                      ? "bg-[#c9a24b] border-[#c9a24b] text-[#0b0b0a] shadow-[0_0_12px_rgba(201,162,75,0.4)]"
                      : "border-white/15 bg-black/30 text-muted-foreground/30 hover:border-[#c9a24b]/50 hover:text-foreground",
                  )}
                  style={{ WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
                >
                  {completed ? (
                    <Check size={15} strokeWidth={2.5} />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm transition-colors font-medium truncate ${
                      completed ? "line-through text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {habit.template_name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {(() => {
                      const IconComp = categoryIcon(habit.template_category);
                      return <IconComp size={10} strokeWidth={1.5} className="text-primary/50" />;
                    })()}
                    <span className="font-mono text-[9px] text-muted-foreground tracking-wider uppercase">
                      {habit.isToolboxLinked ? t("habits.toolboxLinked") : habit.template_category}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <AddToCalendarButton
                    title={habit.template_name}
                    description={habit.template_category}
                    duration={habit.duration_override_min ? `${habit.duration_override_min} min` : null}
                    path={`/habits?habit=${habit.id}`}
                    category={habit.template_category}
                    compact
                  />

                  {habit.isToolboxLinked && habit.toolbox_assignment_id ? (() => {
                    const toolbox = toolboxItemsById[habit.toolbox_assignment_id];
                    const toolboxCfg = (toolbox?.widget_config as Record<string, unknown>) ?? {};
                    const slug = toolbox
                      ? resolveToolboxContentSlug(toolbox.content_type, toolboxCfg)
                      : "";
                    const durationOpts = toolbox
                      ? getHabitToolboxDurationOptions(slug, toolboxCfg, toolbox.duration)
                      : null;
                    const perStepMin =
                      habit.duration_override_min ?? durationOpts?.defaultMinutes ?? null;
                    const badge =
                      durationOpts && perStepMin != null
                        ? formatHabitDurationBadge(perStepMin, durationOpts)
                        : null;
                    return (
                      <div className="flex items-center gap-1.5">
                        {badge ? (
                          <span className="inline-flex items-center gap-1 rounded border border-border/25 px-2 py-1 text-[9px] uppercase font-mono text-muted-foreground">
                            <Clock size={10} />
                            {badge}
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => openToolboxModal(habit)}
                          className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 font-cinzel text-[9.5px] font-semibold uppercase tracking-wider text-primary hover:bg-primary/15 transition-colors min-h-[32px]"
                        >
                          <Play size={10} />
                          {t("habits.launchToolbox")}
                        </button>
                      </div>
                    );
                  })() : null}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <MemberPageScaffold width="wide" viewport className="min-w-0 overflow-x-hidden">
      <MemberSplitLayout
        left={leftPane}
        right={rightPane}
        leftColSpan={5}
        rightColSpan={7}
        scrollRight={true}
        scrollLeft={true}
      />

      <HabitToolboxModal
        item={activeToolboxItem}
        assignedHabitId={activeAssignedHabitId}
        durationOverrideMin={activeDurationOverrideMin}
        open={toolboxModalOpen}
        onOpenChange={setToolboxModalOpen}
        onCompleted={() => void loadData({ silent: true })}
        onDurationChanged={(minutes) => {
          setActiveDurationOverrideMin(minutes);
          setHabits((prev) =>
            prev.map((h) =>
              h.id === activeAssignedHabitId ? { ...h, duration_override_min: minutes } : h,
            ),
          );
        }}
      />
    </MemberPageScaffold>
  );
}
