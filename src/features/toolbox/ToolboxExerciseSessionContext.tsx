import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ExternalLink, CheckCircle2, XCircle, RotateCcw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { pickCatalogTemplateDisplayTitle } from "@/lib/catalog-i18n";
import { pickWidgetCatalogCopy } from "@/lib/toolbox-widget-i18n";
import type { Locale } from "@/i18n/translations";
import {
  TOOLBOX_TYPE_META,
  canRenderToolboxWidget,
  isInteractiveToolboxType,
  renderToolboxWidget,
  type ToolboxRenderableItem,
} from "@/lib/toolbox-renderer-registry";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  upsertToolboxCompletion,
  resetToolboxCompletionForReload,
  type ToolboxCompletionPayload,
} from "@/lib/toolbox-completion";
import { clearTimerSession, hasActiveToolboxSession } from "@/lib/toolbox-session-storage";
import {
  loadOpenToolboxExerciseId,
  saveOpenToolboxExerciseId,
} from "@/features/toolbox/toolbox-exercise-open-storage";
import {
  ToolboxAssignmentStatsStrip,
  type ToolboxAssignmentStats,
} from "@/features/toolbox/ToolboxAssignmentStatsStrip";
import { cn } from "@/lib/utils";

interface ToolboxAssignmentRow {
  id: string;
  title: string;
  title_i18n?: unknown;
  content_type: string;
  duration: string | null;
  description: string | null;
  description_i18n?: unknown;
  external_url: string | null;
  widget_config: unknown;
}

function toRenderableItem(row: ToolboxAssignmentRow): ToolboxRenderableItem {
  const widgetConfig =
    row.widget_config && typeof row.widget_config === "object" && !Array.isArray(row.widget_config)
      ? (row.widget_config as Record<string, unknown>)
      : null;

  return {
    id: row.id,
    content_type: row.content_type,
    title: row.title,
    widget_config: widgetConfig,
    external_url: row.external_url,
  };
}

type ToolboxExerciseSessionContextValue = {
  openAssignmentId: string | null;
  openExercise: (assignmentId: string) => void;
  closeExercise: () => void;
};

const ToolboxExerciseSessionContext = createContext<ToolboxExerciseSessionContextValue | null>(null);

export function useToolboxExerciseSession(): ToolboxExerciseSessionContextValue {
  const ctx = useContext(ToolboxExerciseSessionContext);
  if (!ctx) {
    throw new Error("useToolboxExerciseSession must be used within ToolboxExerciseSessionProvider");
  }
  return ctx;
}

/** Optional hook — returns no-op when provider is absent (e.g. admin preview). */
export function useToolboxExerciseSessionOptional(): ToolboxExerciseSessionContextValue | null {
  return useContext(ToolboxExerciseSessionContext);
}

function ToolboxExerciseModalLayer({
  userId,
  assignmentId,
  onClose,
}: {
  userId: string;
  assignmentId: string;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const [item, setItem] = useState<ToolboxAssignmentRow | null>(null);
  const [stats, setStats] = useState<ToolboxAssignmentStats | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [reloadBusy, setReloadBusy] = useState(false);
  const [completionDialog, setCompletionDialog] = useState<{
    open: boolean;
    status: string;
    title: string;
    stats: ToolboxAssignmentStats | null;
  }>({ open: false, status: "", title: "", stats: null });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadItem = useCallback(async () => {
    const [itemRes, statsRes] = await Promise.all([
      supabase.from("toolbox_assignments").select("*").eq("id", assignmentId).eq("user_id", userId).maybeSingle(),
      supabase
        .from("toolbox_assignment_stats" as never)
        .select("assignment_id, completed_count, abandoned_count, ignored_count")
        .eq("assignment_id", assignmentId)
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    if (!mountedRef.current) return;
    if (itemRes.error || !itemRes.data) {
      console.warn("[ToolboxExerciseModal] assignment load failed", itemRes.error);
      onClose();
      return;
    }
    setItem(itemRes.data as ToolboxAssignmentRow);
    setStats((statsRes.data as ToolboxAssignmentStats | null) ?? null);
  }, [assignmentId, userId, onClose]);

  useEffect(() => {
    void loadItem();
  }, [loadItem, reloadKey]);

  const getLocalizedTitle = (row: ToolboxAssignmentRow) =>
    pickCatalogTemplateDisplayTitle(locale as Locale, row);

  const getLocalizedDescription = (row: ToolboxAssignmentRow) =>
    pickWidgetCatalogCopy(locale as Locale, row.description_i18n as any, row.description);

  const getTypeLabel = (type: string) =>
    TOOLBOX_TYPE_META[type] ? t(TOOLBOX_TYPE_META[type].labelKey as any) : type;

  const itemRef = useRef(item);
  itemRef.current = item;
  const statsRef = useRef(stats);
  statsRef.current = stats;

  const recordCompletion = useCallback(
    async (status: "completed" | "abandoned", payload?: ToolboxCompletionPayload) => {
      const { error } = await upsertToolboxCompletion({
        assignmentId,
        userId,
        status,
        payload,
      });
      if (error) {
        toast({
          title: t("toolbox.saveError"),
          description: typeof error === "string" ? error : (error as { message?: string })?.message,
          variant: "destructive",
        });
        return;
      }

      const labels: Record<string, string> = {
        completed: t("toolbox.exerciseCompleted"),
        abandoned: t("toolbox.exerciseAbandoned"),
      };
      toast({ title: labels[status] });
      if (status === "completed") {
        window.dispatchEvent(new CustomEvent("aegis:toolbox-completed", { detail: { assignmentId } }));
      }
      window.dispatchEvent(new CustomEvent("aegis:refresh"));

      const { data: freshStats } = await supabase
        .from("toolbox_assignment_stats" as never)
        .select("assignment_id, completed_count, abandoned_count, ignored_count")
        .eq("assignment_id", assignmentId)
        .eq("user_id", userId)
        .maybeSingle();

      const currentItem = itemRef.current;
      onClose();
      setCompletionDialog({
        open: true,
        status,
        title: currentItem ? getLocalizedTitle(currentItem) : "",
        stats: (freshStats as ToolboxAssignmentStats | null) ?? statsRef.current,
      });
    },
    [assignmentId, userId, t, toast, onClose, locale],
  );

  const handleReload = useCallback(async () => {
    setReloadBusy(true);
    try {
      clearTimerSession(`toolbox:${assignmentId}`);
      const { error } = await resetToolboxCompletionForReload({ assignmentId, userId });
      if (error) {
        toast({ title: t("toolbox.saveError"), description: error, variant: "destructive" });
        return;
      }
      setReloadKey((k) => k + 1);
      toast({ title: t("toolbox.toolReloaded"), description: t("toolbox.reloadHint") });
      window.dispatchEvent(new CustomEvent("aegis:refresh"));
    } finally {
      setReloadBusy(false);
    }
  }, [assignmentId, userId, t, toast]);

  const handleRequestClose = useCallback(() => {
    if (hasActiveToolboxSession()) {
      void recordCompletion("abandoned");
    } else {
      onClose();
    }
  }, [recordCompletion, onClose]);

  const renderWidgetBody = (row: ToolboxAssignmentRow) => {
    const renderable = toRenderableItem(row);
    const isInteractiveType = isInteractiveToolboxType(renderable);
    const hasWidget = isInteractiveType && canRenderToolboxWidget(renderable);
    const isExternal = row.content_type === "external_link" && row.external_url;
    const title = getLocalizedTitle(row);

    const widget = hasWidget
      ? renderToolboxWidget({
          item: renderable,
          locale,
          title,
          hideTitle: true,
          onComplete: (payload) => void recordCompletion("completed", payload),
          // Abandon only via explicit close — not on tab/app switch unmount.
          onAbandon: () => {},
        })
      : null;

    if (hasWidget && widget) {
      return <div key={`${row.id}-${reloadKey}`}>{widget}</div>;
    }
    if (isExternal && row.external_url) {
      return (
        <div className="flex flex-col gap-4">
          <a
            href={row.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary transition-colors hover:bg-primary/15"
          >
            <ExternalLink size={16} />
            {t("toolbox.openLink")}
          </a>
          <button
            type="button"
            onClick={() => void recordCompletion("completed")}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-[10px] uppercase tracking-[0.25em] text-primary transition-colors hover:bg-primary/15"
          >
            <CheckCircle2 size={14} />
            {t("toolbox.markDone")}
          </button>
        </div>
      );
    }
    if (!isInteractiveType && widget) {
      return <div key={`${row.id}-${reloadKey}`}>{widget}</div>;
    }
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">{t("toolbox.unavailableConfig")}</p>
    );
  };

  const activeCfg = item
    ? TOOLBOX_TYPE_META[item.content_type] || TOOLBOX_TYPE_META.course
    : null;

  return (
    <>
      <Dialog open modal onOpenChange={() => {}}>
        <DialogContent
          showCloseButton={false}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="ethereal-glass w-[calc(100vw-1.25rem)] max-w-lg max-h-[min(90dvh,720px)] overflow-x-hidden overflow-y-auto border-border/30 p-4 sm:p-6"
        >
          <button
            type="button"
            onClick={handleRequestClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label={t("general.close")}
          >
            <X className="h-4 w-4" />
          </button>
          {item && activeCfg ? (
            <>
              <DialogHeader className="min-w-0 pr-8">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-border/30 bg-background/60 mt-0.5">
                    <activeCfg.icon size={17} strokeWidth={1.5} className={activeCfg.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogDescription className="text-neural-label mb-0.5 truncate">
                      {getTypeLabel(item.content_type)}
                      {item.duration ? <span className="opacity-60"> · {item.duration}</span> : null}
                    </DialogDescription>
                    <DialogTitle className="text-left text-foreground leading-snug break-words">
                      {getLocalizedTitle(item)}
                    </DialogTitle>
                    {getLocalizedDescription(item) ? (
                      <p className="mt-1.5 text-left text-xs leading-relaxed text-muted-foreground line-clamp-3 break-words">
                        {getLocalizedDescription(item)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </DialogHeader>
              <div className="flex min-w-0 flex-col gap-2 border-t border-border/20 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <ToolboxAssignmentStatsStrip stats={stats ?? undefined} className="min-w-0" />
                <button
                  type="button"
                  onClick={() => void handleReload()}
                  disabled={reloadBusy}
                  className="flex min-h-[36px] shrink-0 items-center justify-center gap-1.5 self-end rounded-full border border-border/40 px-3 text-[9px] uppercase tracking-[0.14em] sm:tracking-[0.18em] text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-40 sm:self-center"
                >
                  <RotateCcw size={11} />
                  {t("toolbox.reload")}
                </button>
              </div>
              <div className="min-w-0 overflow-x-auto py-1">{renderWidgetBody(item)}</div>
            </>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("toolbox.loading")}</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={completionDialog.open}
        onOpenChange={(open) => {
          if (!open) setCompletionDialog({ open: false, status: "", title: "", stats: null });
        }}
      >
        <DialogContent className="ethereal-glass w-[calc(100vw-1.25rem)] max-w-sm overflow-x-hidden border-border/30 p-4 sm:p-6">
          <div className="flex flex-col items-center gap-4 py-2">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl border",
                completionDialog.status === "completed"
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : completionDialog.status === "abandoned"
                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                    : "border-border bg-secondary/20 text-muted-foreground",
              )}
            >
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
              {completionDialog.title ? (
                <DialogDescription className="text-center text-sm">{completionDialog.title}</DialogDescription>
              ) : null}
            </DialogHeader>
            {completionDialog.stats ? (
              <div className="w-full rounded-xl border border-border/30 bg-background/40 px-4 py-3">
                <ToolboxAssignmentStatsStrip stats={completionDialog.stats} className="justify-center" />
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setCompletionDialog({ open: false, status: "", title: "", stats: null })}
              className="min-h-[40px] rounded-full border border-border/40 px-6 text-[9px] uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
            >
              {t("general.close")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ToolboxExerciseSessionProvider({
  userId,
  children,
}: {
  userId: string | undefined;
  children: ReactNode;
}) {
  const [openAssignmentId, setOpenAssignmentId] = useState<string | null>(() =>
    userId ? loadOpenToolboxExerciseId(userId) : null,
  );

  useEffect(() => {
    if (!userId) {
      setOpenAssignmentId(null);
      return;
    }
    const stored = loadOpenToolboxExerciseId(userId);
    if (stored) setOpenAssignmentId(stored);
  }, [userId]);

  const openExercise = useCallback(
    (assignmentId: string) => {
      if (!userId) return;
      setOpenAssignmentId(assignmentId);
      saveOpenToolboxExerciseId(userId, assignmentId);
    },
    [userId],
  );

  const closeExercise = useCallback(() => {
    if (userId) saveOpenToolboxExerciseId(userId, null);
    setOpenAssignmentId(null);
  }, [userId]);

  const value = useMemo(
    () => ({ openAssignmentId, openExercise, closeExercise }),
    [openAssignmentId, openExercise, closeExercise],
  );

  return (
    <ToolboxExerciseSessionContext.Provider value={value}>
      {children}
      {userId && openAssignmentId ? (
        <ToolboxExerciseModalLayer
          key={openAssignmentId}
          userId={userId}
          assignmentId={openAssignmentId}
          onClose={closeExercise}
        />
      ) : null}
    </ToolboxExerciseSessionContext.Provider>
  );
}
