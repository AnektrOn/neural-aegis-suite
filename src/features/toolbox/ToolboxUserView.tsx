import { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Play, ExternalLink, CheckCircle2, XCircle, ListChecks, Loader2, Library, RotateCcw, RefreshCw, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { isLikelyVideoUrl } from "@/lib/video-links";
import { pickCatalogTemplateDisplayTitle } from "@/lib/catalog-i18n";
import { pickWidgetCatalogCopy } from "@/lib/toolbox-widget-i18n";
import type { Locale } from "@/i18n/translations";
import {
  TOOLBOX_TYPE_META,
  canRenderToolboxWidget,
  isInteractiveToolboxType,
  renderToolboxWidget,
} from "@/lib/toolbox-renderer-registry";
import { formatToolboxDurationLabel } from "@/lib/toolbox-widget-duration";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  addToolboxToHabits,
  fetchToolboxHabitLinks,
  removeToolboxFromHabits,
  type ToolboxHabitLink,
} from "@/services/toolboxHabitLinkService";
import {
  upsertToolboxCompletion,
  resetToolboxCompletionForReload,
  type ToolboxCompletionPayload,
} from "@/lib/toolbox-completion";
import { cn } from "@/lib/utils";
import { clearTimerSession } from "@/lib/toolbox-session-storage";
import {
  ToolboxAssignmentStatsStrip,
  ToolboxHabitLinkButton,
  type ToolboxAssignmentStats,
} from "@/features/toolbox/ToolboxAssignmentStatsStrip";
import { useToolboxExerciseSessionOptional } from "@/features/toolbox/ToolboxExerciseSessionContext";
import AddToCalendarButton from "@/features/toolbox/AddToCalendarButton";

interface ToolboxItem {
  id: string;
  title: string;
  title_i18n?: unknown;
  content_type: string;
  duration: string | null;
  description: string | null;
  description_i18n?: unknown;
  external_url: string | null;
  widget_config: any;
  assigned_at: string;
  user_delivery_status?: string | null;
}

interface CompletionRecord {
  assignment_id: string;
  status: string;
}

type MainView = "todo" | "all" | "history";
type StatusFilter = "all" | "pending" | "completed" | "abandoned" | "ignored";

export interface ToolboxUserViewProps {
  userId: string;
  readOnly?: boolean;
  enableDeepLinkOpen?: boolean;
  className?: string;
}

export function ToolboxUserView({
  userId,
  readOnly = false,
  enableDeepLinkOpen = false,
  className,
}: ToolboxUserViewProps) {
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [, startTransition] = useTransition();
  const reduceMotion = useReducedMotion();
  const exerciseSession = useToolboxExerciseSessionOptional();
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [items, setItems] = useState<ToolboxItem[]>([]);
  const [completions, setCompletions] = useState<CompletionRecord[]>([]);
  const [habitLinks, setHabitLinks] = useState<ToolboxHabitLink[]>([]);
  const [activeWidget, setActiveWidget] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [mainView, setMainView] = useState<MainView>("todo");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [assignmentStats, setAssignmentStats] = useState<Record<string, ToolboxAssignmentStats>>({});
  const [habitLinkBusy, setHabitLinkBusy] = useState<string | null>(null);
  const [reloadBusy, setReloadBusy] = useState<string | null>(null);
  const [widgetReloadKeys, setWidgetReloadKeys] = useState<Record<string, number>>({});
  const [refreshingList, setRefreshingList] = useState(false);
  const [completionDialog, setCompletionDialog] = useState<{ open: boolean; itemId: string | null; status: string }>({ open: false, itemId: null, status: "" });

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setIsError(false);
    try {
      const [itemsRes, compRes, links, statsRes] = await Promise.all([
        supabase
          .from("toolbox_assignments")
          .select("*")
          .eq("user_id", userId)
          .neq("user_delivery_status", "inactive")
          .order("assigned_at", { ascending: false }),
        supabase
          .from("toolbox_completions" as any)
          .select("assignment_id, status")
          .eq("user_id", userId),
        fetchToolboxHabitLinks(userId),
        supabase
          .from("toolbox_assignment_stats" as never)
          .select("assignment_id, completed_count, abandoned_count, ignored_count")
          .eq("user_id", userId),
      ]);
      if (itemsRes.error) throw itemsRes.error;
      if (compRes.error) throw compRes.error;
      setHabitLinks(links);
      setItems((itemsRes.data || []) as ToolboxItem[]);
      setCompletions((compRes.data || []) as unknown as CompletionRecord[]);
      if (!statsRes.error) {
        const statsMap: Record<string, ToolboxAssignmentStats> = {};
        for (const row of (statsRes.data || []) as ToolboxAssignmentStats[]) {
          statsMap[row.assignment_id] = row;
        }
        setAssignmentStats(statsMap);
      } else {
        console.warn("[Toolbox] stats load failed", statsRes.error.message);
        setAssignmentStats({});
      }
    } catch (err) {
      console.error("[Toolbox] load failed", err);
      setIsError(true);
      toast({
        title: t("toolbox.loadError"),
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, t, toast]);

  useEffect(() => {
    if (userId) void loadData();
  }, [userId, loadData]);

  useEffect(() => {
    const onRefresh = () => {
      void (async () => {
        setRefreshingList(true);
        try {
          await loadData();
        } finally {
          setRefreshingList(false);
        }
      })();
    };
    window.addEventListener("aegis:refresh", onRefresh);
    return () => window.removeEventListener("aegis:refresh", onRefresh);
  }, [loadData]);

  const refreshList = useCallback(async () => {
    setRefreshingList(true);
    try {
      await loadData();
    } finally {
      setRefreshingList(false);
    }
  }, [loadData]);

  useEffect(() => {
    if (!enableDeepLinkOpen) return;
    const stateId = (location.state as { openToolboxId?: string } | null)?.openToolboxId;
    const queryId = new URLSearchParams(location.search).get("item");
    const openId = stateId || queryId || null;
    if (openId && items.some((i) => i.id === openId)) {
      if (exerciseSession && !readOnly) exerciseSession.openExercise(openId);
      else setActiveWidget(openId);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [
    enableDeepLinkOpen,
    location.state,
    location.search,
    location.pathname,
    items,
    navigate,
    exerciseSession,
    readOnly,
  ]);

  const blockReadOnlyAction = useCallback(() => {
    toast({ title: t("admin.toolboxPreview.readOnlyHint") });
  }, [t, toast]);

  const confirmWaiting = useCallback(
    async (assignmentId: string) => {
      if (readOnly) {
        blockReadOnlyAction();
        return;
      }
      const { error } = await supabase.rpc("confirm_waiting_toolbox_assignment" as any, {
        p_assignment_id: assignmentId,
      } as any);
      if (error) {
        toast({ title: t("toolbox.saveError"), description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: t("toolbox.deliveryConfirmed") });
      void loadData();
    },
    [readOnly, blockReadOnlyAction, t, toast, loadData],
  );

  // Get the latest completion for an item
  const getLatestCompletion = (assignmentId: string) => {
    const matches = completions.filter(c => c.assignment_id === assignmentId);
    return matches.length > 0 ? matches[matches.length - 1] : undefined;
  };

  // Count all completions (not just unique)
  const allCompletionStats = {
    completed: completions.filter(c => c.status === "completed").length,
    abandoned: completions.filter(c => c.status === "abandoned").length,
    ignored: completions.filter(c => c.status === "ignored").length,
    total: items.length,
  };

  const recordCompletion = useCallback(async (
    assignmentId: string,
    status: "completed" | "abandoned",
    payload?: ToolboxCompletionPayload,
  ) => {
    if (readOnly) {
      blockReadOnlyAction();
      return;
    }

    const { error } = await upsertToolboxCompletion({
      assignmentId,
      userId,
      status,
      payload,
    });

    if (!error) {
      const labels: Record<string, string> = { completed: t("toolbox.exerciseCompleted"), abandoned: t("toolbox.exerciseAbandoned") };
      setActiveWidget(null);
      setCompletionDialog({ open: true, itemId: assignmentId, status });
      toast({ title: labels[status] });
      if (status === "completed") {
        window.dispatchEvent(new CustomEvent("aegis:toolbox-completed", { detail: { assignmentId } }));
      }
      void loadData();
    } else {
      toast({
        title: t("toolbox.saveError"),
        description: typeof error === "string" ? error : (error as { message?: string })?.message,
        variant: "destructive",
      });
    }
  }, [userId, readOnly, blockReadOnlyAction, t, toast, loadData]);

  const handleReload = useCallback(async (itemId: string) => {
    if (readOnly) {
      blockReadOnlyAction();
      return;
    }

    setReloadBusy(itemId);
    try {
      clearTimerSession(`toolbox:${itemId}`);
      setWidgetReloadKeys((prev) => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }));

      const { error } = await resetToolboxCompletionForReload({
        assignmentId: itemId,
        userId,
      });
      if (error) {
        toast({ title: t("toolbox.saveError"), description: error, variant: "destructive" });
        return;
      }

      setCompletions((prev) => prev.filter((c) => c.assignment_id !== itemId));
      startTransition(() => setMainView("todo"));
      setActiveWidget(null);

      toast({ title: t("toolbox.toolReloaded"), description: t("toolbox.reloadHint") });
      void loadData();
    } finally {
      setReloadBusy(null);
    }
  }, [userId, readOnly, blockReadOnlyAction, t, toast, loadData]);

  const handleCloseWidget = useCallback((itemId: string) => {
    setActiveWidget(null);
  }, []);

  const getItemStatus = (itemId: string): "completed" | "abandoned" | "ignored" | "pending" => {
    const latest = getLatestCompletion(itemId);
    if (!latest) return "pending";
    if (latest.status === "completed" || latest.status === "abandoned" || latest.status === "ignored") {
      return latest.status;
    }
    return "pending";
  };

  const activeHabitLinkIds = new Set(
    habitLinks.filter((l) => l.is_active).map((l) => l.toolbox_assignment_id),
  );
  const isInHabits = (itemId: string) => activeHabitLinkIds.has(itemId);

  const toggleHabitLink = async (itemId: string) => {
    if (readOnly) {
      blockReadOnlyAction();
      return;
    }
    setHabitLinkBusy(itemId);
    try {
      if (isInHabits(itemId)) {
        const res = await removeToolboxFromHabits(itemId);
        if (!res.ok) {
          toast({ title: t("toolbox.saveError"), description: res.error, variant: "destructive" });
          return;
        }
        toast({ title: t("toolbox.removedFromHabits") });
      } else {
        const res = await addToolboxToHabits(itemId);
        if (!res.ok) {
          toast({ title: t("toolbox.saveError"), description: res.error, variant: "destructive" });
          return;
        }
        toast({ title: t("toolbox.addedToHabits") });
      }
      void loadData();
    } finally {
      setHabitLinkBusy(null);
    }
  };

  const todoCount = useMemo(
    () =>
      items.filter((i) => {
        if ((i.user_delivery_status || "active") === "waiting") return true;
        const s = getItemStatus(i.id);
        return s === "pending";
      }).length,
    [items, completions],
  );

  const doneCount = useMemo(
    () => completions.filter((c) => c.status === "completed").length,
    [completions],
  );

  const waitingCount = useMemo(
    () => items.filter((i) => (i.user_delivery_status || "active") === "waiting").length,
    [items],
  );

  const filtered = useMemo(() => {
    return items
      .filter((i) => typeFilter === "all" || i.content_type === typeFilter)
      .filter((i) => {
        const status = getItemStatus(i.id);
        const waiting = (i.user_delivery_status || "active") === "waiting";

        if (mainView === "todo") {
          if (waiting) return true;
          return status === "pending";
        }

        if (mainView === "history") {
          if (!(status === "completed" || status === "abandoned" || status === "ignored")) {
            return false;
          }
          if (statusFilter === "all") return true;
          return status === statusFilter;
        }

        if (mainView === "all") {
          if (statusFilter === "all") return true;
          if (statusFilter === "pending") {
            if (waiting) return true;
            return status === "pending";
          }
          return status === statusFilter;
        }

        return true;
      });
  }, [items, typeFilter, mainView, statusFilter, completions]);

  const statusFilterOptions = useMemo((): Array<{ key: StatusFilter; label: string }> => {
    if (mainView === "history") {
      return [
        { key: "all", label: t("toolbox.filterAll") },
        { key: "completed", label: t("toolbox.completed") },
        { key: "abandoned", label: t("toolbox.abandoned") },
        { key: "ignored", label: t("toolbox.ignored") },
      ];
    }
    if (mainView === "all") {
      return [
        { key: "all", label: t("toolbox.filterAll") },
        { key: "pending", label: t("toolbox.pending") },
        { key: "completed", label: t("toolbox.completed") },
        { key: "abandoned", label: t("toolbox.abandoned") },
        { key: "ignored", label: t("toolbox.ignored") },
      ];
    }
    return [];
  }, [mainView, t]);

  const historyTotals = useMemo(() => {
    const totals = { completed: 0, abandoned: 0, ignored: 0 };
    for (const stats of Object.values(assignmentStats)) {
      totals.completed += stats.completed_count;
      totals.abandoned += stats.abandoned_count;
      totals.ignored += stats.ignored_count;
    }
    return totals;
  }, [assignmentStats]);

  const getStatsForItem = (itemId: string) => assignmentStats[itemId];

  const todoWaitingInView = useMemo(
    () => filtered.filter((i) => (i.user_delivery_status || "active") === "waiting").length,
    [filtered],
  );

  const activeItem = useMemo(
    () => (activeWidget ? items.find((i) => i.id === activeWidget) ?? null : null),
    [activeWidget, items],
  );

  const openTodoItem = useCallback(
    (item: ToolboxItem) => {
      const isWaiting = (item.user_delivery_status || "active") === "waiting";
      if (isWaiting) return;
      const isExternal = item.content_type === "external_link" && item.external_url;
      const isVideoLink = Boolean(isExternal && item.external_url && isLikelyVideoUrl(item.external_url));
      if (isVideoLink) {
        navigate("/bibliotheque");
        return;
      }
      if (exerciseSession && !readOnly) {
        exerciseSession.openExercise(item.id);
      } else {
        setActiveWidget(item.id);
      }
    },
    [navigate, exerciseSession, readOnly],
  );

  useEffect(() => {
    if (exerciseSession) return;
    if (mainView !== "todo") {
      setActiveWidget(null);
    }
  }, [mainView, exerciseSession]);

  const types = ["all", ...new Set(items.map((i) => i.content_type))];

  const getTypeLabel = (type: string) => {
    if (type === "all") return t("toolbox.filterAll");
    return TOOLBOX_TYPE_META[type] ? t(TOOLBOX_TYPE_META[type].labelKey as any) : type;
  };

  const getLocalizedTitle = (item: ToolboxItem) =>
    pickCatalogTemplateDisplayTitle(locale as Locale, item);

  const getLocalizedDescription = (item: ToolboxItem) =>
    pickWidgetCatalogCopy(locale as Locale, item.description_i18n as any, item.description);

  const durationLabel = (item: ToolboxItem) =>
    formatToolboxDurationLabel(item.duration, item.content_type, item.widget_config);

  const renderWidget = (item: ToolboxItem) =>
    renderToolboxWidget({
      item,
      locale,
      title: getLocalizedTitle(item),
      hideTitle: true,
      onComplete: (payload) => recordCompletion(item.id, "completed", payload),
      onAbandon: (payload) => recordCompletion(item.id, "abandoned", payload),
    });

  const dialogItem = items.find(i => i.id === completionDialog.itemId);

  const renderWidgetModalBody = (item: ToolboxItem) => {
    const isInteractiveType = isInteractiveToolboxType(item);
    const hasWidget = isInteractiveType && canRenderToolboxWidget(item);
    const isExternal = item.content_type === "external_link" && item.external_url;
    const widget = hasWidget ? renderWidget(item) : null;

    if (hasWidget && widget) {
      return (
        <div key={`${item.id}-${widgetReloadKeys[item.id] ?? 0}`}>{widget}</div>
      );
    }
    if (isExternal && item.external_url) {
      return (
        <div className="flex flex-col gap-4">
          <a
            href={item.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary transition-colors hover:bg-primary/15"
          >
            <ExternalLink size={16} />
            {t("toolbox.openLink")}
          </a>
          <button
            type="button"
            onClick={() => recordCompletion(item.id, "completed")}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-[10px] uppercase tracking-[0.25em] text-primary transition-colors hover:bg-primary/15"
          >
            <CheckCircle2 size={14} />
            {t("toolbox.markDone")}
          </button>
        </div>
      );
    }
    if (!isInteractiveType) {
      const fallbackWidget = renderWidget(item);
      if (fallbackWidget) {
        return (
          <div key={`${item.id}-${widgetReloadKeys[item.id] ?? 0}`}>{fallbackWidget}</div>
        );
      }
    }
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">{t("toolbox.unavailableConfig")}</p>
    );
  };

  const totalItems = items.filter((i) => (i.user_delivery_status || "active") !== "waiting").length;
  const progressPct = totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0;

  return (
    <div className={cn("mx-auto w-full min-w-0 max-w-5xl overflow-x-hidden space-y-6 sm:space-y-8", className)}>
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-display text-[10px] tracking-[0.22em] uppercase text-text-tertiary/70 mb-1.5">
            {t("toolbox.neuralLibrary")}
          </p>
          <h1 className="font-cormorant text-2xl sm:text-3xl md:text-4xl font-light text-text-primary tracking-tight mb-3 break-words">
            {t("toolbox.title")}
          </h1>
          {items.length > 0 ? (
            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
              <div className="h-1.5 min-w-[5rem] flex-1 max-w-[180px] rounded-full bg-border/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="font-display text-[10px] tracking-[0.15em] text-text-tertiary/70 tabular-nums whitespace-nowrap shrink-0">
                {doneCount}/{totalItems}
              </span>
              {todoCount > 0 ? (
                <span className="shrink-0 rounded-full border border-primary/30 bg-primary/8 px-2 py-0.5 font-display text-[9px] tracking-[0.14em] uppercase text-primary max-w-full truncate">
                  {t("toolbox.statsTodoChip", { n: String(todoCount) })}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void refreshList()}
          disabled={loading || refreshingList}
          aria-label={t("toolbox.reload")}
          className="mt-1 flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-border/50 bg-background/60 text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-40"
        >
          <RefreshCw size={15} className={cn((loading || refreshingList) && "animate-spin")} />
        </button>
      </div>

      {isError && !loading && (
        <div className="flex flex-col gap-2 rounded-2xl border border-destructive/35 bg-destructive/10 px-4 py-3 sm:flex-row sm:items-center">
          <p className="flex-1 font-barlow text-sm text-destructive">{t("toolbox.loadError")}</p>
          <button
            type="button"
            className="rounded-xl border border-destructive/40 bg-background/80 px-3 py-2 font-barlow text-xs font-medium uppercase tracking-wide text-destructive hover:bg-destructive/10"
            onClick={() => void loadData()}
          >
            {t("dashboard.retry")}
          </button>
        </div>
      )}

      {waitingCount > 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
          <p className="text-sm text-amber-800 dark:text-amber-200">{t("toolbox.waitingBanner")}</p>
        </div>
      ) : null}

      {/* ── Main tabs ── */}
      <div className="min-w-0 space-y-3">
        <div
          role="tablist"
          aria-label={t("toolbox.title")}
          className="flex min-w-0 gap-1 rounded-2xl border border-border/40 bg-background/40 p-1"
        >
          {(
            [
              { key: "todo" as const, label: t("toolbox.viewTodo"), badge: todoCount > 0 ? todoCount : null },
              { key: "all" as const, label: t("toolbox.viewAll"), badge: null },
              { key: "history" as const, label: t("toolbox.viewHistory"), badge: null },
            ] as const
          ).map((entry) => (
            <button
              key={entry.key}
              type="button"
              role="tab"
              id={`toolbox-tab-${entry.key}`}
              aria-selected={mainView === entry.key}
              aria-controls={`toolbox-panel-${entry.key}`}
              tabIndex={mainView === entry.key ? 0 : -1}
              onClick={() => {
                startTransition(() => {
                  setMainView(entry.key);
                  setStatusFilter("all");
                });
              }}
              className={cn(
                "flex min-w-0 flex-1 min-h-[40px] items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.12em] sm:tracking-[0.16em] transition-all duration-150",
                mainView === entry.key
                  ? "bg-background shadow-sm border border-border/40 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="truncate">{entry.label}</span>
              {entry.badge ? (
                <span className="inline-flex min-w-[16px] shrink-0 items-center justify-center rounded-full bg-primary/15 px-1 py-0.5 text-[8px] tabular-nums text-primary">
                  {entry.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Type filter — horizontal scrolling chips */}
        {types.length > 1 ? (
          <div className="-mx-1 min-w-0 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max min-w-full gap-2">
              {types.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => startTransition(() => setTypeFilter(f))}
                  className={cn(
                    "shrink-0 min-h-[34px] rounded-full border px-3 py-1 text-[9px] uppercase tracking-[0.14em] sm:tracking-[0.18em] transition-colors whitespace-nowrap",
                    typeFilter === f
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/40 text-muted-foreground hover:border-primary/20 hover:text-foreground",
                  )}
                >
                  {getTypeLabel(f)}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {(mainView === "all" || mainView === "history") ? (
        <div className="min-w-0 rounded-2xl border border-border/30 bg-background/30 px-3 py-3 sm:px-4 sm:py-3.5 space-y-3">
          {/* Lifetime stats row */}
          <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-1.5 sm:gap-x-5">
            {[
              { count: historyTotals.completed, label: t("toolbox.completed"), dot: "bg-primary/70" },
              { count: historyTotals.abandoned, label: t("toolbox.abandoned"), dot: "bg-destructive/70" },
              { count: historyTotals.ignored, label: t("toolbox.ignored"), dot: "bg-border" },
            ].filter(s => s.count > 0).map((s) => (
              <span key={s.label} className="flex min-w-0 items-center gap-2 font-display text-[10px] tracking-[0.12em] sm:tracking-[0.14em] text-muted-foreground">
                <span className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", s.dot)} aria-hidden />
                <span className="font-medium tabular-nums text-foreground">{s.count}</span>
                <span className="truncate">{s.label.toLowerCase()}</span>
              </span>
            ))}
          </div>
          {/* Status filter chips — scroll on narrow screens */}
          <div className="-mx-1 min-w-0 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max min-w-full flex-wrap gap-1.5 sm:w-auto" role="tablist" aria-label={t("toolbox.statusFilter")}>
              {statusFilterOptions.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === entry.key}
                  onClick={() => startTransition(() => setStatusFilter(entry.key))}
                  className={cn(
                    "shrink-0 min-h-[32px] rounded-full border px-2.5 sm:px-3 py-1 text-[9px] uppercase tracking-[0.12em] sm:tracking-[0.16em] transition-all whitespace-nowrap",
                    statusFilter === entry.key
                      ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                      : "border-border/40 text-muted-foreground hover:border-primary/20 hover:text-foreground",
                  )}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Active widget panel — all / history tabs */}
      {activeItem && mainView !== "todo" && (() => {
        const widget = renderWidget(activeItem);
        if (!widget) return null;
        const panelCfg = TOOLBOX_TYPE_META[activeItem.content_type] || TOOLBOX_TYPE_META.course;
        return (
          <motion.div
            key={`${activeItem.id}-${widgetReloadKeys[activeItem.id] ?? 0}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="ethereal-glass min-w-0 overflow-hidden rounded-2xl border border-primary/25"
          >
            {/* Panel header */}
            <div className="flex flex-col gap-2 border-b border-border/20 bg-background/30 px-3 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-5 sm:py-3.5">
              <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/30 bg-background/60">
                  <panelCfg.icon size={14} strokeWidth={1.5} className={panelCfg.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[9px] uppercase tracking-[0.14em] sm:tracking-[0.16em] text-muted-foreground truncate">
                    {getTypeLabel(activeItem.content_type)}
                  </p>
                  <h2 className="text-sm font-medium text-foreground truncate leading-snug">
                    {getLocalizedTitle(activeItem)}
                  </h2>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => void handleReload(activeItem.id)}
                  disabled={reloadBusy === activeItem.id}
                  className="flex min-h-[34px] items-center gap-1.5 rounded-full border border-border/40 px-2.5 sm:px-3 text-[9px] uppercase tracking-[0.14em] sm:tracking-[0.18em] text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-40"
                >
                  <RotateCcw size={11} />
                  <span className="hidden sm:inline">{t("toolbox.reload")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCloseWidget(activeItem.id)}
                  className="flex min-h-[34px] min-w-[34px] items-center justify-center rounded-full border border-border/40 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={t("toolbox.close")}
                >
                  <span className="text-xs">✕</span>
                </button>
              </div>
            </div>
            <div className="min-w-0 overflow-x-auto p-4 sm:p-6">{widget}</div>
          </motion.div>
        );
      })()}

      {loading ? (
        <div className={mainView === "todo" ? "space-y-3" : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"}>
          {Array.from({ length: mainView === "todo" ? 4 : 6 }).map((_, i) => (
            mainView === "todo" ? (
              <div key={i} className="ethereal-glass animate-pulse rounded-2xl p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-xl bg-border/40 shrink-0" />
                  <div className="flex-1 space-y-2 pt-0.5">
                    <div className="h-3.5 w-3/4 rounded bg-border/40" />
                    <div className="h-2.5 w-1/3 rounded bg-border/30" />
                    <div className="h-2.5 w-full rounded bg-border/20" />
                  </div>
                  <div className="h-9 w-20 rounded-full bg-border/30 shrink-0" />
                </div>
              </div>
            ) : (
              <div key={i} className="ethereal-glass animate-pulse rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="h-9 w-9 rounded-xl bg-border/40" />
                  <div className="h-5 w-16 rounded-full bg-border/30" />
                </div>
                <div className="space-y-2">
                  <div className="h-3.5 w-5/6 rounded bg-border/40" />
                  <div className="h-2.5 w-full rounded bg-border/25" />
                  <div className="h-2.5 w-4/5 rounded bg-border/20" />
                </div>
                <div className="h-9 w-full rounded-xl bg-border/30 mt-2" />
              </div>
            )
          ))}
          <p className="sr-only">{t("toolbox.loading")}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-8 sm:p-14 text-center">
          <div className="mx-auto mb-5 text-primary/20 w-14 h-14">
            <svg viewBox="0 0 56 56" fill="none" aria-hidden>
              <path d="M28 8C17 8 8 17 8 28s9 20 20 20 20-9 20-20S39 8 28 8Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M20 28c0-4.4 3.6-8 8-8v16c-4.4 0-8-3.6-8-8Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M28 20c4.4 0 8 3.6 8 8s-3.6 8-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="font-cormorant text-xl font-light italic text-text-tertiary/70 mb-2">{t("toolbox.emptyCoachPrep")}</p>
          <p className="font-display text-[10px] tracking-[0.18em] uppercase text-text-tertiary/40">{t("toolbox.noContentAssigned")}</p>
        </div>
      ) : (
        <div
          id={`toolbox-panel-${mainView}`}
          role="tabpanel"
          aria-labelledby={`toolbox-tab-${mainView}`}
          className="min-w-0 space-y-6"
        >
          {mainView === "todo" ? (
            <div className="space-y-2.5">
              <ul className="space-y-2.5">
                {filtered.map((item, i) => {
                  const cfg = TOOLBOX_TYPE_META[item.content_type] || TOOLBOX_TYPE_META.course;
                  const isWaiting = (item.user_delivery_status || "active") === "waiting";
                  const isExternal = item.content_type === "external_link" && item.external_url;
                  const isVideoLink = Boolean(isExternal && item.external_url && isLikelyVideoUrl(item.external_url));
                  const linkedToHabits = isInHabits(item.id);
                  const habitBusy = habitLinkBusy === item.id;
                  const description =
                    getLocalizedDescription(item) ||
                    (TOOLBOX_TYPE_META[item.content_type]
                      ? t(TOOLBOX_TYPE_META[item.content_type].labelKey as any)
                      : "");

                  return (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduceMotion ? 0 : i * 0.04, duration: 0.22 }}
                    >
                      <article
                        className={cn(
                          "ethereal-glass flex min-w-0 flex-col gap-0 rounded-2xl border border-border/35 overflow-hidden transition-all",
                          linkedToHabits && "border-primary/35",
                          !isWaiting && "cursor-pointer hover:border-primary/25 sm:active:scale-[0.995]",
                        )}
                        role={isWaiting ? undefined : "button"}
                        tabIndex={isWaiting ? undefined : 0}
                        onClick={isWaiting ? undefined : () => openTodoItem(item)}
                        onKeyDown={
                          isWaiting
                            ? undefined
                            : (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  openTodoItem(item);
                                }
                              }
                        }
                      >
                        {/* Main row — stacks on mobile */}
                        <div className="flex flex-col gap-3 px-3 py-3.5 sm:flex-row sm:items-start sm:gap-3.5 sm:px-5 sm:py-4">
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <div className={cn(
                              "mt-0.5 shrink-0 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl",
                              "border border-border/30 bg-background/60",
                            )}>
                              <cfg.icon size={17} strokeWidth={1.5} className={cfg.color} />
                            </div>
                            <div className="min-w-0 flex-1 py-0.5">
                              <div className="mb-0.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <p className="min-w-0 text-sm font-medium text-foreground leading-snug break-words">
                                  {getLocalizedTitle(item)}
                                </p>
                                {isWaiting ? (
                                  <span className="shrink-0 text-[8px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border text-amber-600 border-amber-500/30 bg-amber-500/10">
                                    {t("toolbox.deliveryWaitingBadge")}
                                  </span>
                                ) : null}
                                {linkedToHabits ? (
                                  <span className="shrink-0 text-[8px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border text-primary border-primary/30 bg-primary/8">
                                    {t("toolbox.inHabitsBadge")}
                                  </span>
                                ) : null}
                              </div>
                              <p className="font-display text-[9px] uppercase tracking-[0.14em] sm:tracking-[0.16em] text-muted-foreground truncate">
                                {getTypeLabel(item.content_type)}
                                {durationLabel(item) ? <span className="opacity-50"> · {durationLabel(item)}</span> : null}
                              </p>
                              {description ? (
                                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground/80 break-words">
                                  {description}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="w-full shrink-0 sm:w-auto sm:self-center" onClick={(e) => e.stopPropagation()}>
                            {isWaiting ? (
                              <button
                                type="button"
                                onClick={() => void confirmWaiting(item.id)}
                                className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 text-[9px] uppercase tracking-[0.14em] sm:tracking-[0.18em] text-amber-700 dark:text-amber-200 transition-colors hover:bg-amber-500/15 sm:w-auto"
                              >
                                <CheckCircle2 size={11} />
                                {t("toolbox.confirmDelivery")}
                              </button>
                            ) : isVideoLink ? (
                              <Link
                                to="/bibliotheque"
                                className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-full border border-primary/35 bg-primary/8 px-3.5 text-[9px] uppercase tracking-[0.14em] sm:tracking-[0.18em] text-primary transition-colors hover:bg-primary/15 sm:w-auto"
                              >
                                <Library size={11} />
                                {t("toolbox.openInLibrary")}
                              </Link>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openTodoItem(item)}
                                className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-full border border-primary/35 bg-primary/8 px-3.5 text-[9px] uppercase tracking-[0.14em] sm:tracking-[0.18em] text-primary transition-colors hover:bg-primary/15 sm:w-auto"
                              >
                                {t("toolbox.todoOpenExercise")}
                                <ChevronRight size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                        {/* Footer bar — stats + habit button */}
                        <div
                          className="flex min-w-0 flex-col gap-2 border-t border-border/20 bg-background/20 px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ToolboxAssignmentStatsStrip stats={getStatsForItem(item.id)} className="min-w-0" />
                          {!isWaiting ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <ToolboxHabitLinkButton
                                itemId={item.id}
                                linked={linkedToHabits}
                                busy={habitBusy}
                                onToggle={(id) => void toggleHabitLink(id)}
                                compact={false}
                              />
                              <AddToCalendarButton
                                title={getLocalizedTitle(item)}
                                description={getLocalizedDescription(item)}
                                duration={durationLabel(item) ?? item.duration}
                                path={`/toolbox?item=${item.id}`}
                                category={getTypeLabel(item.content_type)}
                              />
                            </div>
                          ) : null}
                        </div>
                      </article>
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          ) : (
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {filtered.map((item, i) => {
            const cfg = TOOLBOX_TYPE_META[item.content_type] || TOOLBOX_TYPE_META.course;
            const isInteractiveType = isInteractiveToolboxType(item);
            const hasWidget = isInteractiveType && canRenderToolboxWidget(item);
            const isExternal = item.content_type === "external_link" && item.external_url;
            const isVideoLink = Boolean(isExternal && item.external_url && isLikelyVideoUrl(item.external_url));
            const latestCompletion = getLatestCompletion(item.id);
            const isAbandoned = latestCompletion?.status === "abandoned";
            const isIgnored = latestCompletion?.status === "ignored";
            const isCompleted = latestCompletion?.status === "completed";
            const isActive = activeWidget === item.id;
            const delivery = item.user_delivery_status || "active";
            const isWaiting = delivery === "waiting";
            const linkedToHabits = isInHabits(item.id);
            const habitBusy = habitLinkBusy === item.id;
            const canLaunch = hasWidget || (!isInteractiveType && !isVideoLink) || (isExternal && !isVideoLink);

            const canReload = isCompleted || isAbandoned || isIgnored;

            const primaryAction = () => {
              if (isWaiting) return;
              if (latestCompletion && !isActive && !canReload) return;
              if (hasWidget) {
                setActiveWidget(isActive ? null : item.id);
              } else if (isExternal && !isVideoLink) {
                window.open(item.external_url!, "_blank", "noopener,noreferrer");
              } else if (!isInteractiveType) {
                setActiveWidget(item.id);
              }
            };
            const cardIsClickable =
              !isWaiting &&
              (canReload || !latestCompletion || isActive) &&
              (canLaunch || isVideoLink || canReload);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : i * 0.06, duration: 0.22 }}
                role={cardIsClickable ? "button" : undefined}
                tabIndex={cardIsClickable ? 0 : undefined}
                onClick={cardIsClickable ? primaryAction : undefined}
                onKeyDown={
                  cardIsClickable
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          primaryAction();
                        }
                      }
                    : undefined
                }
                style={cardIsClickable ? ({ WebkitTapHighlightColor: "transparent" } as React.CSSProperties) : undefined}
                className={cn(
                  "ethereal-glass flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/35 min-h-[44px] transition-all duration-150",
                  latestCompletion && !isActive && !canReload && "opacity-55",
                  linkedToHabits && "border-primary/35",
                  isActive && "border-primary/50 shadow-sm",
                  cardIsClickable && "cursor-pointer hover:border-primary/30 sm:active:scale-[0.985]",
                )}
              >
                {/* Card body */}
                <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
                  {/* Top row: icon + badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/30 bg-background/60"
                    )}>
                      <cfg.icon size={16} strokeWidth={1.5} className={cfg.color} />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {latestCompletion && (
                        <span className={cn(
                          "text-[8px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border",
                          isCompleted ? "text-primary border-primary/30 bg-primary/8" :
                          isAbandoned ? "text-destructive border-destructive/30 bg-destructive/8" :
                          "text-muted-foreground border-border/50 bg-secondary/20",
                        )}>
                          {isCompleted ? t("toolbox.completed") : isAbandoned ? t("toolbox.abandoned") : t("toolbox.ignored")}
                        </span>
                      )}
                      {isWaiting ? (
                        <span className="text-[8px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border text-amber-600 border-amber-500/30 bg-amber-500/10">
                          {t("toolbox.deliveryWaitingBadge")}
                        </span>
                      ) : null}
                      {linkedToHabits ? (
                        <span className="text-[8px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border text-primary border-primary/30 bg-primary/8">
                          {t("toolbox.inHabitsBadge")}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Title + meta */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="text-sm font-medium text-foreground leading-snug break-words">
                      {getLocalizedTitle(item)}
                    </p>
                    <p className="font-display text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                      {getTypeLabel(item.content_type)}
                      {durationLabel(item) ? <span className="opacity-50"> · {durationLabel(item)}</span> : null}
                    </p>
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
                      {getLocalizedDescription(item) ||
                        (TOOLBOX_TYPE_META[item.content_type] ? t(TOOLBOX_TYPE_META[item.content_type].labelKey as any) : "")}
                    </p>
                  </div>

                  <ToolboxAssignmentStatsStrip
                    stats={getStatsForItem(item.id)}
                    emphasize={
                      mainView === "history" || (mainView === "all" && statusFilter !== "all" && statusFilter !== "pending")
                        ? (isCompleted ? "completed" : isAbandoned ? "abandoned" : isIgnored ? "ignored" : null)
                        : null
                    }
                  />
                </div>

                {/* Card footer — actions */}
                <div
                  className="flex min-w-0 flex-col gap-2 border-t border-border/20 bg-background/20 px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!isWaiting ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <ToolboxHabitLinkButton
                        itemId={item.id}
                        linked={linkedToHabits}
                        busy={habitBusy}
                        onToggle={(id) => void toggleHabitLink(id)}
                        compact={false}
                      />
                      <AddToCalendarButton
                        title={getLocalizedTitle(item)}
                        description={getLocalizedDescription(item)}
                        duration={durationLabel(item) ?? item.duration}
                        path={`/toolbox?item=${item.id}`}
                                category={getTypeLabel(item.content_type)}
                      />
                    </div>
                  ) : null}
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:ml-auto sm:justify-end">
                  {isWaiting ? (
                    <button
                      type="button"
                      onClick={() => void confirmWaiting(item.id)}
                      className="flex min-h-[34px] items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/10 px-2 sm:px-3 text-[9px] uppercase tracking-[0.12em] sm:tracking-[0.16em] text-amber-700 dark:text-amber-200 transition-colors hover:bg-amber-500/15"
                    >
                      <CheckCircle2 size={11} /> {t("toolbox.confirmDelivery")}
                    </button>
                  ) : canReload ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleReload(item.id)}
                        disabled={reloadBusy === item.id}
                        className="flex min-h-[34px] items-center gap-1 rounded-full border border-border/40 px-2 sm:px-3 text-[9px] uppercase tracking-[0.12em] sm:tracking-[0.16em] text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                      >
                        <RotateCcw size={11} /> {t("toolbox.reload")}
                      </button>
                      {canLaunch ? (
                        <button
                          type="button"
                          onClick={() => setActiveWidget(item.id)}
                          className="flex min-h-[34px] items-center gap-1 rounded-full border border-primary/35 bg-primary/8 px-2 sm:px-3 text-[9px] uppercase tracking-[0.12em] sm:tracking-[0.16em] text-primary transition-colors hover:bg-primary/15"
                        >
                          <Play size={11} /> {t("toolbox.launch")}
                        </button>
                      ) : isVideoLink ? (
                        <Link
                          to="/bibliotheque"
                          className="flex min-h-[34px] items-center gap-1 rounded-full border border-primary/35 bg-primary/8 px-2 sm:px-3 text-[9px] uppercase tracking-[0.12em] sm:tracking-[0.16em] text-primary transition-colors hover:bg-primary/15"
                        >
                          <Library size={11} /> {t("toolbox.openInLibrary")}
                        </Link>
                      ) : null}
                    </>
                  ) : (!latestCompletion || isActive) ? (
                    hasWidget ? (
                      <button
                        onClick={() => setActiveWidget(isActive ? null : item.id)}
                        className="flex min-h-[34px] items-center gap-1.5 rounded-full border border-primary/35 bg-primary/8 px-3 text-[9px] uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary/15"
                      >
                        <Play size={11} /> {isActive ? t("toolbox.inProgress") : t("toolbox.launch")}
                      </button>
                    ) : isVideoLink ? (
                      <Link
                        to="/bibliotheque"
                        className="flex min-h-[34px] items-center gap-1 rounded-full border border-primary/35 bg-primary/8 px-2 sm:px-3 text-[9px] uppercase tracking-[0.12em] sm:tracking-[0.16em] text-primary transition-colors hover:bg-primary/15"
                      >
                        <Library size={11} /> {t("toolbox.openInLibrary")}
                      </Link>
                    ) : isExternal ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <a href={item.external_url!} target="_blank" rel="noopener noreferrer"
                          className="flex min-h-[34px] items-center gap-1 rounded-full border border-primary/35 bg-primary/8 px-2 sm:px-3 text-[9px] uppercase tracking-[0.12em] sm:tracking-[0.16em] text-primary transition-colors hover:bg-primary/15">
                          <ExternalLink size={11} /> {t("toolbox.openLink")}
                        </a>
                        <button
                          type="button"
                          onClick={() => recordCompletion(item.id, "completed")}
                          className="flex min-h-[34px] items-center gap-1 rounded-full border border-border/40 px-2 sm:px-3 text-[9px] uppercase tracking-[0.12em] sm:tracking-[0.16em] text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                        >
                          <CheckCircle2 size={11} /> {t("toolbox.markDone")}
                        </button>
                      </div>
                    ) : isInteractiveType ? (
                      <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">{t("toolbox.unavailableConfig")}</span>
                    ) : (
                      <button
                        onClick={() => setActiveWidget(item.id)}
                        className="flex min-h-[34px] items-center gap-1.5 rounded-full border border-primary/35 bg-primary/8 px-3 text-[9px] uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary/15"
                      >
                        <Play size={11} /> {t("toolbox.launch")}
                      </button>
                    )
                  ) : null}
                  </div>
                </div>
              </motion.div>
            );
          })}
          </div>
          )}
        </div>
      )}

      {/* Todo exercise modal — local fallback when global session provider is absent (admin preview) */}
      {!exerciseSession ? (
      <Dialog
        open={Boolean(activeItem) && mainView === "todo"}
        onOpenChange={(open) => {
          if (!open) setActiveWidget(null);
        }}
      >
        <DialogContent className="ethereal-glass w-[calc(100vw-1.25rem)] max-w-lg max-h-[min(90dvh,720px)] overflow-x-hidden overflow-y-auto border-border/30 p-4 sm:p-6">
          {activeItem ? (() => {
            const activeCfg = TOOLBOX_TYPE_META[activeItem.content_type] || TOOLBOX_TYPE_META.course;
            return (
              <>
                <DialogHeader className="min-w-0 pr-8">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-border/30 bg-background/60 mt-0.5">
                      <activeCfg.icon size={17} strokeWidth={1.5} className={activeCfg.color} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <DialogDescription className="text-neural-label mb-0.5 truncate">
                        {getTypeLabel(activeItem.content_type)}
                        {activeItem.duration ? <span className="opacity-60"> · {activeItem.duration}</span> : null}
                      </DialogDescription>
                      <DialogTitle className="text-left text-foreground leading-snug break-words">
                        {getLocalizedTitle(activeItem)}
                      </DialogTitle>
                      {getLocalizedDescription(activeItem) ? (
                        <p className="mt-1.5 text-left text-xs leading-relaxed text-muted-foreground line-clamp-3 break-words">
                          {getLocalizedDescription(activeItem)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </DialogHeader>
                <div className="flex min-w-0 flex-col gap-2 border-t border-border/20 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <ToolboxAssignmentStatsStrip stats={getStatsForItem(activeItem.id)} className="min-w-0" />
                  <button
                    type="button"
                    onClick={() => void handleReload(activeItem.id)}
                    disabled={reloadBusy === activeItem.id}
                    className="flex min-h-[36px] shrink-0 items-center justify-center gap-1.5 self-end rounded-full border border-border/40 px-3 text-[9px] uppercase tracking-[0.14em] sm:tracking-[0.18em] text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-40 sm:self-center"
                  >
                    <RotateCcw size={11} />
                    {t("toolbox.reload")}
                  </button>
                </div>
                <div className="min-w-0 overflow-x-auto py-1">{renderWidgetModalBody(activeItem)}</div>
              </>
            );
          })() : null}
        </DialogContent>
      </Dialog>
      ) : null}

      {/* Completion confirmation dialog */}
      <Dialog open={completionDialog.open} onOpenChange={(open) => { if (!open) setCompletionDialog({ open: false, itemId: null, status: "" }); }}>
        <DialogContent className="ethereal-glass w-[calc(100vw-1.25rem)] max-w-sm overflow-x-hidden border-border/30 p-4 sm:p-6">
          <div className="flex flex-col items-center gap-4 py-2">
            {/* Status icon */}
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl border",
              completionDialog.status === "completed"
                ? "border-primary/30 bg-primary/10 text-primary"
                : completionDialog.status === "abandoned"
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-border bg-secondary/20 text-muted-foreground",
            )}>
              {completionDialog.status === "completed" ? (
                <CheckCircle2 size={22} strokeWidth={1.5} />
              ) : completionDialog.status === "abandoned" ? (
                <XCircle size={22} strokeWidth={1.5} />
              ) : (
                <RotateCcw size={22} strokeWidth={1.5} />
              )}
            </div>
            <DialogHeader className="text-center space-y-1">
              <DialogTitle className="text-foreground text-center">
                {completionDialog.status === "completed"
                  ? t("toolbox.exerciseCompleted")
                  : completionDialog.status === "abandoned"
                  ? t("toolbox.exerciseAbandoned")
                  : t("toolbox.statusUpdated")}
              </DialogTitle>
              {dialogItem ? (
                <DialogDescription className="text-center text-sm">
                  {getLocalizedTitle(dialogItem)}
                </DialogDescription>
              ) : null}
            </DialogHeader>

            {/* Lifetime stats */}
            {(allCompletionStats.completed + allCompletionStats.abandoned + allCompletionStats.ignored) > 0 ? (
              <div className="w-full rounded-xl border border-border/30 bg-background/40 px-4 py-3">
                <p className="font-display text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-2.5 text-center">
                  {t("toolbox.neuralLibrary")}
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { n: allCompletionStats.completed, label: t("toolbox.completed"), cls: "text-primary" },
                    { n: allCompletionStats.abandoned, label: t("toolbox.abandoned"), cls: "text-destructive" },
                    { n: allCompletionStats.ignored, label: t("toolbox.ignored"), cls: "text-muted-foreground" },
                  ].map((s) => (
                    <div key={s.label} className="space-y-0.5">
                      <p className={cn("text-xl font-cinzel tabular-nums", s.cls)}>{s.n}</p>
                      <p className="text-neural-label">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <button
              onClick={() => setCompletionDialog({ open: false, itemId: null, status: "" })}
              className="min-h-[40px] rounded-full border border-border/40 px-6 text-[9px] uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
            >
              {t("general.close")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
