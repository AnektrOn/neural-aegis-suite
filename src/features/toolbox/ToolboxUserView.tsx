import { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Play, ExternalLink, CheckCircle2, XCircle, ListChecks, Loader2, Library, RotateCcw, RefreshCw } from "lucide-react";
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
  type ToolboxCompletionPayload,
} from "@/lib/toolbox-completion";
import { cn } from "@/lib/utils";
import { clearTimerSession } from "@/lib/toolbox-session-storage";

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
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [items, setItems] = useState<ToolboxItem[]>([]);
  const [completions, setCompletions] = useState<CompletionRecord[]>([]);
  const [habitLinks, setHabitLinks] = useState<ToolboxHabitLink[]>([]);
  const [activeWidget, setActiveWidget] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [mainView, setMainView] = useState<MainView>("todo");
  const [habitLinkBusy, setHabitLinkBusy] = useState<string | null>(null);
  const [widgetReloadKeys, setWidgetReloadKeys] = useState<Record<string, number>>({});
  const [refreshingList, setRefreshingList] = useState(false);
  const [completionDialog, setCompletionDialog] = useState<{ open: boolean; itemId: string | null; status: string }>({ open: false, itemId: null, status: "" });

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setIsError(false);
    try {
      const [itemsRes, compRes, links] = await Promise.all([
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
      ]);
      if (itemsRes.error) throw itemsRes.error;
      if (compRes.error) throw compRes.error;
      setHabitLinks(links);
      setItems((itemsRes.data || []) as ToolboxItem[]);
      setCompletions((compRes.data || []) as unknown as CompletionRecord[]);
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
    const openId = (location.state as { openToolboxId?: string } | null)?.openToolboxId;
    if (openId && items.some((i) => i.id === openId)) {
      setActiveWidget(openId);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [enableDeepLinkOpen, location.state, location.pathname, items, navigate]);

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

  const handleReload = useCallback((itemId: string) => {
    clearTimerSession(`toolbox:${itemId}`);
    setWidgetReloadKeys((prev) => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }));
    setActiveWidget(itemId);
    toast({ title: t("toolbox.toolReloaded"), description: t("toolbox.reloadHint") });
  }, [t, toast]);

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
          return status === "completed" || status === "abandoned" || status === "ignored";
        }
        return true;
      });
  }, [items, typeFilter, mainView, completions]);

  const featuredItem = useMemo(() => {
    const waiting = filtered.find((i) => (i.user_delivery_status || "active") === "waiting");
    if (waiting) return waiting;
    return filtered.find((i) => getItemStatus(i.id) === "pending") ?? null;
  }, [filtered, completions]);

  const gridItems = useMemo(
    () => (featuredItem ? filtered.filter((i) => i.id !== featuredItem.id) : filtered),
    [filtered, featuredItem],
  );

  const types = ["all", ...new Set(items.map((i) => i.content_type))];

  const getTypeLabel = (type: string) => {
    if (type === "all") return t("toolbox.filterAll");
    return TOOLBOX_TYPE_META[type] ? t(TOOLBOX_TYPE_META[type].labelKey as any) : type;
  };

  const getLocalizedTitle = (item: ToolboxItem) =>
    pickCatalogTemplateDisplayTitle(locale as Locale, item);

  const getLocalizedDescription = (item: ToolboxItem) =>
    pickWidgetCatalogCopy(locale as Locale, item.description_i18n as any, item.description);

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

  return (
    <div className={cn("space-y-10 max-w-5xl", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-[10px] tracking-[0.22em] uppercase text-text-tertiary/70 mb-2">{t("toolbox.neuralLibrary")}</p>
          <h1 className="font-cormorant text-3xl sm:text-4xl font-light text-text-primary tracking-tight">{t("toolbox.title")}</h1>
        </div>
        <button
          type="button"
          onClick={() => void refreshList()}
          disabled={loading || refreshingList}
          aria-label={t("toolbox.reload")}
          className="mt-1 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border/50 bg-background/60 text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-50"
        >
          <RefreshCw size={16} className={cn((loading || refreshingList) && "animate-spin")} />
        </button>
      </div>

      {items.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-primary">
            {t("toolbox.statsTodoChip", { n: String(todoCount) })}
          </span>
          <span className="rounded-full border border-border/50 px-3 py-1">
            {t("toolbox.statsDoneChip", { n: String(doneCount) })}
          </span>
        </div>
      ) : null}

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
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          {t("toolbox.waitingBanner")}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-wrap" role="tablist" aria-label={t("toolbox.title")}>
          {(
            [
              { key: "todo" as const, label: t("toolbox.viewTodo") },
              { key: "all" as const, label: t("toolbox.viewAll") },
              { key: "history" as const, label: t("toolbox.viewHistory") },
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
              onClick={() => startTransition(() => setMainView(entry.key))}
              className={cn(
                "min-h-[44px] rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.22em] transition-colors",
                mainView === entry.key
                  ? "border-primary/35 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/20",
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <label className="flex min-h-[44px] flex-col gap-1 sm:min-w-[200px]">
          <span className="font-display text-[9px] uppercase tracking-[0.2em] text-text-tertiary/70">
            {t("toolbox.filterType")}
          </span>
          <select
            value={typeFilter}
            onChange={(e) => startTransition(() => setTypeFilter(e.target.value))}
            className="rounded-xl border border-border/50 bg-background/60 px-3 py-2 text-sm"
          >
            {types.map((f) => (
              <option key={f} value={f}>
                {getTypeLabel(f)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Active widget overlay */}
      {activeWidget && (() => {
        const item = items.find(i => i.id === activeWidget);
        if (!item) return null;
        const widget = renderWidget(item);
        if (!widget) return null;
        return (
          <motion.div
            key={`${item.id}-${widgetReloadKeys[item.id] ?? 0}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="ethereal-glass p-6"
          >
            <div className="flex justify-between items-start gap-3 mb-4">
              <div className="min-w-0">
                <p className="text-neural-label">{getTypeLabel(item.content_type)}</p>
                <h2 className="text-sm font-medium text-foreground mt-1 tracking-wide truncate">
                  {getLocalizedTitle(item)}
                </h2>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleReload(item.id)}
                  className="flex min-h-[36px] items-center gap-1.5 text-[9px] uppercase tracking-[0.24em] text-neural-accent transition-colors hover:text-foreground"
                >
                  <RotateCcw size={12} />
                  {t("toolbox.reload")}
                </button>
                <button
                  type="button"
                  onClick={() => handleCloseWidget(item.id)}
                  className="min-h-[36px] text-muted-foreground hover:text-foreground text-xs"
                >
                  {t("toolbox.close")}
                </button>
              </div>
            </div>
            {widget}
          </motion.div>
        );
      })()}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ethereal-glass h-48 animate-pulse rounded-2xl" />
          ))}
          <p className="sr-only">{t("toolbox.loading")}</p>
        </div>
      ) : filtered.length === 0 && !featuredItem ? (
        <div className="glass-card p-14 text-center">
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
          className="space-y-6"
        >
          {featuredItem && mainView === "todo" ? (
            <motion.article
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="ethereal-glass relative overflow-hidden rounded-2xl border border-primary/25 p-6 sm:p-8"
            >
              <p className="font-display text-[10px] uppercase tracking-[0.24em] text-primary mb-2">
                {t("toolbox.featuredToday")}
              </p>
              <h2 className="font-cormorant text-2xl sm:text-3xl font-light text-foreground mb-3">
                {getLocalizedTitle(featuredItem)}
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mb-6">
                {getLocalizedDescription(featuredItem) || getTypeLabel(featuredItem.content_type)}
              </p>
              {(featuredItem.user_delivery_status || "active") === "waiting" ? (
                <button
                  type="button"
                  onClick={() => void confirmWaiting(featuredItem.id)}
                  className="min-h-[44px] rounded-full border border-amber-500/40 bg-amber-500/10 px-5 text-[10px] uppercase tracking-[0.22em] text-amber-700 dark:text-amber-200"
                >
                  {t("toolbox.confirmDelivery")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveWidget(featuredItem.id)}
                  className="min-h-[44px] rounded-full border border-primary/40 bg-primary/10 px-5 text-[10px] uppercase tracking-[0.22em] text-primary"
                >
                  {t("toolbox.launch")}
                </button>
              )}
            </motion.article>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gridItems.map((item, i) => {
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

            const canReload = isCompleted || isAbandoned;

            const primaryAction = () => {
              if (isWaiting || isIgnored) return;
              if (canReload && !isActive) {
                handleReload(item.id);
                return;
              }
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
              !isIgnored &&
              (canReload || !latestCompletion || isActive) &&
              (canLaunch || isVideoLink || canReload);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : i * 0.08 }}
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
                  "ethereal-glass p-6 flex flex-col min-h-[44px]",
                  latestCompletion && !isActive && !canReload && "opacity-60",
                  linkedToHabits && "border-primary/40 bg-primary/5 ring-1 ring-primary/20",
                  cardIsClickable && "cursor-pointer hover:border-primary/30 active:scale-[0.98] transition-all",
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <cfg.icon size={18} strokeWidth={1.5} className={cfg.color} />
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {linkedToHabits ? (
                      <span className="text-[8px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border text-primary border-primary/40 bg-primary/10">
                        {t("toolbox.inHabitsBadge")}
                      </span>
                    ) : null}
                    {delivery === "assigned" ? (
                      <span className="text-[8px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border text-neural-accent border-neural-accent/30 bg-neural-accent/5">
                        {t("toolbox.deliveryAssignedBadge")}
                      </span>
                    ) : null}
                    {isWaiting ? (
                      <span className="text-[8px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border text-amber-600 border-amber-600/30 bg-amber-500/10">
                        {t("toolbox.deliveryWaitingBadge")}
                      </span>
                    ) : null}
                    {latestCompletion && (
                      <span className={`text-[8px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${
                        isCompleted ? "text-primary border-primary/30 bg-primary/5" :
                        isAbandoned ? "text-destructive border-destructive/30 bg-destructive/5" :
                        "text-muted-foreground border-border bg-secondary/20"
                      }`}>
                        {isCompleted ? t("toolbox.completed") : isAbandoned ? t("toolbox.abandoned") : t("toolbox.ignored")}
                      </span>
                    )}
                    <span className="text-neural-label">{item.duration || "—"}</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground mb-2">{getLocalizedTitle(item)}</p>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                  {getLocalizedDescription(item) ||
                    (TOOLBOX_TYPE_META[item.content_type] ? t(TOOLBOX_TYPE_META[item.content_type].labelKey as any) : "")}
                </p>

                <div className="mt-4 space-y-2" onClick={(e) => e.stopPropagation()}>
                  {!isWaiting ? (
                    <button
                      type="button"
                      disabled={habitBusy}
                      onClick={() => void toggleHabitLink(item.id)}
                      className={cn(
                        "flex w-full min-h-11 items-center justify-center gap-2 rounded-xl border text-[9px] uppercase tracking-[0.28em] transition-colors",
                        linkedToHabits
                          ? "border-primary/50 bg-primary/15 text-primary hover:bg-primary/20"
                          : "border-border/50 bg-secondary/20 text-foreground hover:border-primary/40 hover:bg-primary/5",
                      )}
                    >
                      {habitBusy ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <ListChecks size={13} />
                      )}
                      {linkedToHabits ? t("toolbox.removeFromHabits") : t("toolbox.addToHabits")}
                    </button>
                  ) : null}
                  <div className="flex items-center gap-3 flex-wrap">
                  {isWaiting ? (
                    <button
                      type="button"
                      onClick={() => void confirmWaiting(item.id)}
                      className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-amber-600 hover:text-foreground transition-colors min-h-[36px] px-2"
                    >
                      <CheckCircle2 size={12} /> {t("toolbox.confirmDelivery")}
                    </button>
                  ) : canReload ? (
                    <button
                      type="button"
                      onClick={() => handleReload(item.id)}
                      className="flex min-h-[44px] items-center gap-2 px-2 text-[9px] uppercase tracking-[0.3em] text-neural-accent transition-colors hover:text-foreground"
                    >
                      <RotateCcw size={12} /> {t("toolbox.reload")}
                    </button>
                  ) : (!latestCompletion || isActive) && !isIgnored ? (
                    hasWidget ? (
                      <button onClick={() => setActiveWidget(isActive ? null : item.id)}
                        className="flex min-h-[44px] items-center gap-2 px-2 text-[9px] uppercase tracking-[0.3em] text-primary transition-colors hover:text-foreground">
                        <Play size={12} /> {isActive ? t("toolbox.inProgress") : t("toolbox.launch")}
                      </button>
                    ) : isVideoLink ? (
                      <Link
                        to="/bibliotheque"
                        className="flex min-h-[44px] items-center gap-2 px-2 text-[9px] uppercase tracking-[0.3em] text-primary transition-colors hover:text-foreground"
                      >
                        <Library size={12} /> {t("toolbox.openInLibrary")}
                      </Link>
                    ) : isExternal ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <a href={item.external_url!} target="_blank" rel="noopener noreferrer"
                          className="flex min-h-[44px] items-center gap-2 px-2 text-[9px] uppercase tracking-[0.3em] text-primary transition-colors hover:text-foreground">
                          <ExternalLink size={12} /> {t("toolbox.openLink")}
                        </a>
                        <button
                          type="button"
                          onClick={() => recordCompletion(item.id, "completed")}
                          className="flex min-h-[44px] items-center gap-2 px-2 text-[9px] uppercase tracking-[0.3em] text-neural-accent transition-colors hover:text-foreground"
                        >
                          <CheckCircle2 size={12} /> {t("toolbox.markDone")}
                        </button>
                      </div>
                    ) : isInteractiveType ? (
                      <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{t("toolbox.unavailableConfig")}</span>
                    ) : (
                      <button onClick={() => setActiveWidget(item.id)}
                        className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-primary hover:text-foreground transition-colors min-h-[36px] px-2">
                        <Play size={12} /> {t("toolbox.launch")}
                      </button>
                    )
                  ) : null}

                  </div>
                </div>
              </motion.div>
            );
          })}
          </div>
        </div>
      )}

      {/* Completion confirmation dialog */}
      <Dialog open={completionDialog.open} onOpenChange={(open) => { if (!open) setCompletionDialog({ open: false, itemId: null, status: "" }); }}>
        <DialogContent className="ethereal-glass border-border/30 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground text-center">
              {completionDialog.status === "completed" ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle2 size={20} className="text-primary" /> {t("toolbox.exerciseCompleted")}
                </span>
              ) : completionDialog.status === "abandoned" ? (
                <span className="flex items-center justify-center gap-2">
                  <XCircle size={20} className="text-destructive" /> {t("toolbox.exerciseAbandoned")}
                </span>
              ) : (
                t("toolbox.statusUpdated")
              )}
            </DialogTitle>
            <DialogDescription className="text-center">
              {dialogItem ? getLocalizedTitle(dialogItem) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4 space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-cinzel text-primary">{allCompletionStats.completed}</p>
                <p className="text-neural-label">{t("toolbox.completed")}</p>
              </div>
              <div>
                <p className="text-lg font-cinzel text-destructive">{allCompletionStats.abandoned}</p>
                <p className="text-neural-label">{t("toolbox.abandoned")}</p>
              </div>
              <div>
                <p className="text-lg font-cinzel text-muted-foreground">{allCompletionStats.ignored}</p>
                <p className="text-neural-label">{t("toolbox.ignored")}</p>
              </div>
            </div>
            <button
              onClick={() => setCompletionDialog({ open: false, itemId: null, status: "" })}
              className="mt-4 text-[9px] uppercase tracking-[0.3em] text-primary hover:text-foreground transition-colors"
            >
              {t("general.close")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
