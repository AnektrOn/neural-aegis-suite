import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Headphones, Eye, BookOpen, Wind, Sparkles, Stars, Heart, Scan, Link as LinkIcon, ExternalLink, CheckCircle2, XCircle, EyeOff, RotateCcw, ShieldAlert, Target, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

export default function Toolbox() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const [items, setItems] = useState<ToolboxItem[]>([]);
  const [completions, setCompletions] = useState<CompletionRecord[]>([]);
  const [activeWidget, setActiveWidget] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "abandoned" | "ignored" | "pending">("all");
  const [completionDialog, setCompletionDialog] = useState<{ open: boolean; itemId: string | null; status: string }>({ open: false, itemId: null, status: "" });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    const [itemsRes, compRes] = await Promise.all([
      supabase.from("toolbox_assignments").select("*").eq("user_id", user!.id).neq("user_delivery_status", "inactive").order("assigned_at", { ascending: false }),
      supabase.from("toolbox_completions" as any).select("assignment_id, status").eq("user_id", user!.id),
    ]);
    if (itemsRes.data) {
      const filteredItems = (itemsRes.data as ToolboxItem[]).filter(
        (item) => !(item.content_type === "external_link" && isLikelyVideoUrl(item.external_url))
      );
      setItems(filteredItems as any);
    }
    const comps = (compRes.data || []) as unknown as CompletionRecord[];
    setCompletions(comps);

    // Auto-detect ignored items (assigned >24h ago, never opened, no completion)
    if (itemsRes.data && user) {
      const now = Date.now();
      const completedIds = new Set(comps.map(c => c.assignment_id));
      const ignoredCandidates = (itemsRes.data as ToolboxItem[]).filter(item => {
        if (completedIds.has(item.id)) return false;
        const assignedAge = now - new Date(item.assigned_at).getTime();
        return assignedAge > 24 * 60 * 60 * 1000;
      });
      for (const item of ignoredCandidates) {
        await supabase.from("toolbox_completions" as any).upsert(
          {
            assignment_id: item.id,
            user_id: user.id,
            status: "ignored",
          } as any,
          { onConflict: "assignment_id", ignoreDuplicates: true }
        );
      }
      if (ignoredCandidates.length > 0) {
        const { data: freshComps } = await supabase.from("toolbox_completions" as any).select("assignment_id, status").eq("user_id", user!.id);
        if (freshComps) setCompletions(freshComps as unknown as CompletionRecord[]);
      }
    }
  };

  const confirmWaiting = useCallback(
    async (assignmentId: string) => {
      if (!user) return;
      const { error } = await supabase.rpc("confirm_waiting_toolbox_assignment" as any, {
        p_assignment_id: assignmentId,
      } as any);
      if (error) {
        toast({ title: t("toolbox.saveError"), description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: t("toolbox.deliveryConfirmed") });
      loadData();
    },
    [user, t, toast],
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

  const recordCompletion = useCallback(async (assignmentId: string, status: "completed" | "abandoned") => {
    if (!user) return;

    // DB unique index is on assignment_id only — INSERT fails if a row already exists
    // (e.g. auto "ignored" after 24h, or a previous "abandoned"). Upsert updates the row.
    const { error } = await supabase.from("toolbox_completions" as any).upsert(
      {
        assignment_id: assignmentId,
        user_id: user.id,
        status,
        completed_at: new Date().toISOString(),
      } as any,
      { onConflict: "assignment_id" }
    );

    if (!error) {
      const labels: Record<string, string> = { completed: t("toolbox.exerciseCompleted"), abandoned: t("toolbox.exerciseAbandoned") };
      setCompletionDialog({ open: true, itemId: assignmentId, status });
      toast({ title: labels[status] });
      loadData();
    } else {
      toast({
        title: t("toolbox.saveError"),
        description: error.message,
        variant: "destructive",
      });
    }
  }, [user, t, toast]);

  // Reload an abandoned tool = clear the "reloaded" flag so user can retry
  // We DON'T delete the old completion — we just allow a new attempt
  const handleReload = (itemId: string) => {
    setActiveWidget(itemId);
    toast({ title: t("toolbox.toolReloaded"), description: t("toolbox.reloadHint") });
  };

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

  const filtered = items
    .filter((i) => filter === "all" || i.content_type === filter)
    .filter((i) => statusFilter === "all" || getItemStatus(i.id) === statusFilter);
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
      onComplete: () => recordCompletion(item.id, "completed"),
      onAbandon: () => recordCompletion(item.id, "abandoned"),
    });

  const dialogItem = items.find(i => i.id === completionDialog.itemId);

  return (
    <div className="space-y-10 max-w-5xl">
      <div>
        <p className="text-neural-label mb-3">{t("toolbox.neuralLibrary")}</p>
        <h1 className="text-neural-title text-3xl text-foreground">{t("toolbox.title")}</h1>
      </div>

      {/* Stats bar */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t("toolbox.total"), value: allCompletionStats.total, icon: Headphones, color: "text-muted-foreground" },
            { label: t("toolbox.completed"), value: allCompletionStats.completed, icon: CheckCircle2, color: "text-primary" },
            { label: t("toolbox.abandoned"), value: allCompletionStats.abandoned, icon: XCircle, color: "text-destructive" },
            { label: t("toolbox.ignored"), value: allCompletionStats.ignored, icon: EyeOff, color: "text-muted-foreground" },
          ].map((s) => (
            <div key={s.label} className="ethereal-glass p-4 text-center">
              <s.icon size={16} strokeWidth={1.5} className={`${s.color} mx-auto mb-2`} />
              <p className="text-xl font-cinzel text-foreground">{s.value}</p>
              <p className="text-neural-label mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {types.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-[9px] uppercase tracking-[0.3em] px-4 py-2 rounded-full border transition-all ${
              filter === f ? "text-primary border-primary/30 bg-primary/5" : "text-muted-foreground border-border hover:border-muted-foreground/30"
            }`}>
            {getTypeLabel(f)}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all" as const, label: t("toolbox.statusFilterAll") },
          { key: "completed" as const, label: t("toolbox.completed") },
          { key: "abandoned" as const, label: t("toolbox.abandoned") },
          { key: "ignored" as const, label: t("toolbox.ignored") },
          { key: "pending" as const, label: t("toolbox.pending") },
        ].map((entry) => (
          <button
            key={entry.key}
            onClick={() => setStatusFilter(entry.key)}
            className={`text-[9px] uppercase tracking-[0.3em] px-4 py-2 rounded-full border transition-all ${
              statusFilter === entry.key
                ? "text-primary border-primary/30 bg-primary/5"
                : "text-muted-foreground border-border hover:border-muted-foreground/30"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {/* Active widget overlay */}
      {activeWidget && (() => {
        const item = items.find(i => i.id === activeWidget);
        if (!item) return null;
        const widget = renderWidget(item);
        if (!widget) return null;
        return (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-6">
            <div className="flex justify-between items-start gap-3 mb-4">
              <div className="min-w-0">
                <p className="text-neural-label">{getTypeLabel(item.content_type)}</p>
                <h2 className="text-sm font-medium text-foreground mt-1 tracking-wide truncate">
                  {getLocalizedTitle(item)}
                </h2>
              </div>
              <button onClick={() => handleCloseWidget(item.id)} className="text-muted-foreground hover:text-foreground text-xs shrink-0">{t("toolbox.close")}</button>
            </div>
            {widget}
          </motion.div>
        );
      })()}

      {filtered.length === 0 ? (
        <div className="ethereal-glass p-12 text-center">
          <Headphones size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">{t("toolbox.noContentAssigned")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, i) => {
            const cfg = TOOLBOX_TYPE_META[item.content_type] || TOOLBOX_TYPE_META.course;
            const isInteractiveType = isInteractiveToolboxType(item);
            const hasWidget = isInteractiveType && canRenderToolboxWidget(item);
            const isExternal = item.content_type === "external_link" && item.external_url;
            const latestCompletion = getLatestCompletion(item.id);
            const isAbandoned = latestCompletion?.status === "abandoned";
            const isIgnored = latestCompletion?.status === "ignored";
            const isCompleted = latestCompletion?.status === "completed";
            const isActive = activeWidget === item.id;
            const delivery = item.user_delivery_status || "active";
            const isWaiting = delivery === "waiting";

            const primaryAction = () => {
              if (isWaiting) return;
              if (isIgnored) return;
              if (latestCompletion && !isActive) return;
              if (hasWidget) {
                setActiveWidget(isActive ? null : item.id);
              } else if (isExternal) {
                window.open(item.external_url!, "_blank", "noopener,noreferrer");
              } else if (!isInteractiveType) {
                setActiveWidget(item.id);
              }
            };
            const cardIsClickable =
              !isWaiting &&
              !isIgnored &&
              (!latestCompletion || isActive) &&
              (hasWidget || isExternal || !isInteractiveType);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
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
                className={`ethereal-glass p-6 flex flex-col ${latestCompletion && !isActive ? "opacity-60" : ""} ${
                  cardIsClickable
                    ? "cursor-pointer hover:border-primary/30 active:scale-[0.98] transition-all"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <cfg.icon size={18} strokeWidth={1.5} className={cfg.color} />
                  <div className="flex items-center gap-2">
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

                <div className="mt-4 flex items-center gap-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
                  {isWaiting ? (
                    <button
                      type="button"
                      onClick={() => void confirmWaiting(item.id)}
                      className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-amber-600 hover:text-foreground transition-colors min-h-[36px] px-2"
                    >
                      <CheckCircle2 size={12} /> {t("toolbox.confirmDelivery")}
                    </button>
                  ) : (!latestCompletion || isActive) && !isIgnored ? (
                    hasWidget ? (
                      <button onClick={() => setActiveWidget(isActive ? null : item.id)}
                        className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-primary hover:text-foreground transition-colors min-h-[36px] px-2">
                        <Play size={12} /> {isActive ? t("toolbox.inProgress") : t("toolbox.launch")}
                      </button>
                    ) : isExternal ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <a href={item.external_url!} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-primary hover:text-foreground transition-colors min-h-[36px] px-2">
                          <ExternalLink size={12} /> {t("toolbox.openLink")}
                        </a>
                        <button
                          type="button"
                          onClick={() => recordCompletion(item.id, "completed")}
                          className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-neural-accent hover:text-foreground transition-colors min-h-[36px] px-2"
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

                  {latestCompletion && !isActive && (hasWidget || isExternal || !isInteractiveType) && (
                    <button onClick={() => {
                      if (isExternal) {
                        window.open(item.external_url!, "_blank", "noopener,noreferrer");
                      } else {
                        handleReload(item.id);
                      }
                    }}
                      className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-neural-accent hover:text-foreground transition-colors min-h-[36px] px-2">
                      <RotateCcw size={12} /> {t("toolbox.reload")}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
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
