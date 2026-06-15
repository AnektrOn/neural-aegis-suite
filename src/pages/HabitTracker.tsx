import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Flame, ListChecks, Dumbbell, Brain, Heart, BookOpen, Moon, Zap, Target, Play, Headphones, Clock } from "lucide-react";
import { getHabitToolboxDurationOptions, formatHabitDurationBadge } from "@/lib/toolbox-widget-duration";
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
      assigned = ((fallback.data as typeof assigned) ?? []).map((row) => ({
        ...row,
        duration_override_min: null,
      }));
    } else {
      assigned = withDuration.data as typeof assigned;
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

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <p className="font-display text-[10px] tracking-[0.22em] uppercase text-text-tertiary/70 mb-2">{t("habits.performanceArchitecture")}</p>
        <h1 className="font-cormorant text-3xl sm:text-4xl font-light text-text-primary tracking-tight">{t("habits.trackingTitle")}</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <ListChecks size={16} strokeWidth={1.5} className="text-primary mb-3" />
          <p className="font-cormorant text-3xl font-light text-foreground tabular-nums">{completedCount}/{habits.length}</p>
          <p className="font-display text-[10px] tracking-[0.14em] uppercase text-text-tertiary/70 mt-1">{t("habits.completedToday")}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card p-5">
          <Flame size={16} strokeWidth={1.5} className="text-warning mb-3" />
          <p className="font-cormorant text-3xl font-light text-foreground tabular-nums">{habits.length}</p>
          <p className="font-display text-[10px] tracking-[0.14em] uppercase text-text-tertiary/70 mt-1">{t("habits.assignedHabits")}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="glass-card p-5">
          <p className="font-cormorant text-3xl font-light text-primary tabular-nums">{habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0}%</p>
          <p className="font-display text-[10px] tracking-[0.14em] uppercase text-text-tertiary/70 mt-1">{t("habits.dailyScore")}</p>
        </motion.div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setCategoryFilter(category)}
            className={`text-[9px] uppercase tracking-[0.2em] px-3 py-2 rounded-lg border transition-all ${
              categoryFilter === category
                ? "border-primary/40 bg-primary/5 text-primary"
                : "border-border/30 text-muted-foreground hover:border-primary/30"
            }`}
          >
            {category === "all" ? t("habits.filterAllCategories") : category}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "all" as const, label: t("habits.filterAllStatuses") },
          { key: "completed" as const, label: t("toolbox.completed") },
          { key: "pending" as const, label: t("toolbox.pending") },
        ].map((entry) => (
          <button
            key={entry.key}
            onClick={() => setStatusFilter(entry.key)}
            className={`text-[9px] uppercase tracking-[0.2em] px-3 py-2 rounded-lg border transition-all ${
              statusFilter === entry.key
                ? "border-primary/40 bg-primary/5 text-primary"
                : "border-border/30 text-muted-foreground hover:border-primary/30"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {filteredHabits.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden className="mx-auto mb-4 text-primary/20">
            <rect x="8" y="10" width="32" height="6" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <rect x="8" y="21" width="32" height="6" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <rect x="8" y="32" width="20" height="6" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="40" cy="35" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M37.5 35l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="font-cormorant text-xl font-light text-text-tertiary/70 italic mb-2">
            {habits.length === 0 ? "Votre routine bien-être vous attend" : "Aucune habitude dans ce filtre"}
          </p>
          <p className="font-display text-[10px] tracking-[0.18em] uppercase text-text-tertiary/40">
            {habits.length === 0 ? t("habits.noHabitsAssigned") : t("habits.noHabitsInFilters")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredHabits.map((habit, i) => {
            const completed = completedIds.has(habit.id);
            const doneCount = completedIds.size;
            const progressPct = habits.length > 0 ? Math.round((doneCount / habits.length) * 100) : 0;
            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 + i * 0.04 }}
                className={`glass-card px-4 flex items-center gap-4 min-h-[60px] transition-all duration-200 hover:border-primary/30 ${completed ? "opacity-60" : ""} ${habit.isToolboxLinked ? "border-primary/25 bg-primary/5" : ""}`}
              >
                <button
                  onClick={() => toggleComplete(habit.id)}
                  aria-label={`${completed ? "Décocher" : "Cocher"} ${habit.template_name}`}
                  aria-checked={completed}
                  role="checkbox"
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-300 ${completed ? "bg-primary/20 border-primary/40" : "border-border hover:border-primary/30"}`}
                  style={{ WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
                >
                  {completed && <Check size={14} className="text-primary" />}
                </button>
                <div className="flex-1 min-w-0 py-3">
                  <p className={`text-[15px] transition-colors ${completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{habit.template_name}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {(() => {
                      const IconComp = categoryIcon(habit.template_category);
                      return <IconComp size={10} strokeWidth={1.5} className="text-primary/40" />;
                    })()}
                    <span className="font-display text-[9px] text-muted-foreground/40 tracking-wider uppercase">
                      {habit.isToolboxLinked ? t("habits.toolboxLinked") : habit.template_category}
                    </span>
                    {habit.isToolboxLinked && habit.template_category !== t("habits.toolboxLinked") ? (
                      <span className="font-display text-[9px] text-muted-foreground/30 tracking-wider uppercase">
                        · {habit.template_category}
                      </span>
                    ) : null}
                  </div>
                </div>
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
                    <div className="shrink-0 flex items-center gap-1.5">
                      {badge ? (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-border/25 px-2 py-1.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                          <Clock size={10} />
                          {badge}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => openToolboxModal(habit)}
                        className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-[9px] uppercase tracking-[0.2em] text-primary hover:bg-primary/15 transition-colors min-h-[36px]"
                      >
                        <Play size={11} />
                        {t("habits.launchToolbox")}
                      </button>
                    </div>
                  );
                })() : null}
                {i === 0 && habits.length > 0 && !habit.isToolboxLinked ? (
                  <div className="shrink-0 text-right">
                    <span className="font-display text-[10px] text-primary/60 tracking-widest">{progressPct}%</span>
                  </div>
                ) : null}
              </motion.div>
            );
          })}
        </div>
      )}

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
    </div>
  );
}
