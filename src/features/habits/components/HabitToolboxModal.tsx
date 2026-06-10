import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { pickCatalogTemplateDisplayTitle } from "@/lib/catalog-i18n";
import { pickWidgetCatalogCopy } from "@/lib/toolbox-widget-i18n";
import {
  TOOLBOX_TYPE_META,
  canRenderToolboxWidget,
  isInteractiveToolboxType,
  renderToolboxWidget,
} from "@/lib/toolbox-renderer-registry";
import {
  getHabitToolboxDurationOptions,
  buildHabitEffectiveWidgetConfig,
} from "@/lib/toolbox-widget-duration";
import { resolveToolboxContentSlug } from "@/lib/toolbox-content-slug";
import { clearTimerSession } from "@/lib/toolbox-session-storage";
import {
  upsertToolboxCompletion,
  type ToolboxCompletionPayload,
} from "@/lib/toolbox-completion";
import { setHabitDurationOverride } from "@/services/habitToolboxPrefsService";
import HabitDurationPicker from "@/features/habits/components/HabitDurationPicker";
import type { Locale } from "@/i18n/translations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface HabitToolboxItem {
  id: string;
  title: string;
  title_i18n?: unknown;
  content_type: string;
  content_type_slug?: string | null;
  duration: string | null;
  description: string | null;
  description_i18n?: unknown;
  external_url: string | null;
  widget_config: unknown;
}

interface Props {
  item: HabitToolboxItem | null;
  assignedHabitId?: string | null;
  durationOverrideMin?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
  onDurationChanged?: (minutes: number | null) => void;
}

export default function HabitToolboxModal({
  item,
  assignedHabitId,
  durationOverrideMin,
  open,
  onOpenChange,
  onCompleted,
  onDurationChanged,
}: Props) {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [savingDuration, setSavingDuration] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);
  const suppressAbandonRef = useRef(false);

  const baseConfig = useMemo(
    () =>
      item?.widget_config && typeof item.widget_config === "object"
        ? (item.widget_config as Record<string, unknown>)
        : {},
    [item?.widget_config],
  );

  const contentSlug = item
    ? resolveToolboxContentSlug(item.content_type_slug || item.content_type, baseConfig)
    : "";

  const durationOptions = useMemo(
    () =>
      item && assignedHabitId
        ? getHabitToolboxDurationOptions(contentSlug, baseConfig, item.duration)
        : null,
    [item, baseConfig, contentSlug, assignedHabitId],
  );

  useEffect(() => {
    if (!open) {
      setBusy(false);
      setSavingDuration(false);
      return;
    }
    if (!durationOptions) {
      setSelectedMinutes(null);
      return;
    }
    const next =
      durationOverrideMin != null ? durationOverrideMin : durationOptions.defaultMinutes;
    setSelectedMinutes(next);
  }, [open, durationOverrideMin, durationOptions, assignedHabitId, item?.id]);

  const effectiveConfig = useMemo(() => {
    if (!item || !durationOptions) return baseConfig;
    const perStepMin = selectedMinutes ?? durationOptions.defaultMinutes;
    return buildHabitEffectiveWidgetConfig(contentSlug, baseConfig, durationOptions, perStepMin);
  }, [item, baseConfig, contentSlug, durationOptions, selectedMinutes]);

  const widgetSessionKey = useMemo(() => {
    if (!item?.id || !assignedHabitId) return undefined;
    return `toolbox:${item.id}:habit:${assignedHabitId}`;
  }, [item?.id, assignedHabitId]);

  const renderItem = useMemo(() => {
    if (!item) return null;
    return {
      ...item,
      content_type: contentSlug,
      content_type_slug: contentSlug,
      widget_config: effectiveConfig,
    };
  }, [item, contentSlug, effectiveConfig]);

  const title = item ? pickCatalogTemplateDisplayTitle(locale as Locale, item) : "";
  const description = item
    ? pickWidgetCatalogCopy(locale as Locale, item.description_i18n as never, item.description)
    : "";

  const persistDuration = useCallback(
    async (minutes: number) => {
      if (!assignedHabitId || !durationOptions) return;
      setSavingDuration(true);
      const isDefault = minutes === durationOptions.defaultMinutes;
      const result = await setHabitDurationOverride(assignedHabitId, isDefault ? null : minutes);
      setSavingDuration(false);
      if (!result.ok) {
        toast({ title: t("toast.error"), description: result.error, variant: "destructive" });
        return;
      }
      if (item?.id && assignedHabitId) {
        clearTimerSession(`toolbox:${item.id}`);
        clearTimerSession(`toolbox:${item.id}:habit:${assignedHabitId}`);
      }
      onDurationChanged?.(isDefault ? null : minutes);
    },
    [assignedHabitId, durationOptions, item?.id, onDurationChanged, t, toast],
  );

  const handleDurationChange = useCallback(
    (minutes: number) => {
      suppressAbandonRef.current = true;
      if (item?.id && assignedHabitId) {
        clearTimerSession(`toolbox:${item.id}`);
        clearTimerSession(`toolbox:${item.id}:habit:${assignedHabitId}`);
      }
      setSelectedMinutes(minutes);
      void persistDuration(minutes);
      setTimeout(() => {
        suppressAbandonRef.current = false;
      }, 300);
    },
    [persistDuration, item?.id, assignedHabitId],
  );

  const recordCompletion = useCallback(
    async (status: "completed" | "abandoned", payload?: ToolboxCompletionPayload) => {
      if (!user || !item) return;
      setBusy(true);
      const { error } = await upsertToolboxCompletion({
        assignmentId: item.id,
        userId: user.id,
        status,
        payload,
      });
      setBusy(false);
      if (error) {
        toast({ title: t("toolbox.saveError"), description: error, variant: "destructive" });
        return;
      }
      if (status === "completed") {
        toast({ title: t("toolbox.exerciseCompleted") });
        window.dispatchEvent(new CustomEvent("aegis:toolbox-completed", { detail: { assignmentId: item.id } }));
        onCompleted();
        onOpenChange(false);
      } else {
        toast({ title: t("toolbox.exerciseAbandoned") });
        onOpenChange(false);
      }
    },
    [user, item, t, toast, onCompleted, onOpenChange],
  );

  const handleWidgetAbandon = useCallback(
    (payload?: ToolboxCompletionPayload) => {
      if (suppressAbandonRef.current) return;
      void recordCompletion("abandoned", payload);
    },
    [recordCompletion],
  );

  const typeLabel = item
    ? TOOLBOX_TYPE_META[item.content_type]
      ? t(TOOLBOX_TYPE_META[item.content_type].labelKey as never)
      : item.content_type
    : "";
  const isInteractive = renderItem ? isInteractiveToolboxType(renderItem) : false;
  const hasWidget = renderItem ? isInteractive && canRenderToolboxWidget(renderItem) : false;
  const isExternal = item?.content_type === "external_link" && item.external_url;

  const handleWidgetComplete = useCallback(
    (payload?: ToolboxCompletionPayload) => {
      void recordCompletion("completed", payload);
    },
    [recordCompletion],
  );

  const widget = hasWidget && renderItem
    ? renderToolboxWidget({
        item: renderItem,
        locale,
        title,
        hideTitle: true,
        sessionKey: widgetSessionKey,
        onComplete: handleWidgetComplete,
        onAbandon: handleWidgetAbandon,
      })
    : null;

  return (
    <Dialog open={open && Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="ethereal-glass border-border/30 sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground text-left">
            <span className="text-neural-label block mb-1">{typeLabel}</span>
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="text-left text-muted-foreground">{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="py-2 space-y-4">
          {durationOptions && selectedMinutes != null && assignedHabitId ? (
            <HabitDurationPicker
              variant="compact"
              options={durationOptions}
              valueMinutes={selectedMinutes}
              onChange={handleDurationChange}
              disabled={savingDuration || busy}
            />
          ) : null}

          {hasWidget && widget && item ? (
            <div key={`${item.id}-${assignedHabitId ?? "solo"}`}>{widget}</div>
          ) : isExternal && item ? (
            <div className="flex flex-col gap-4">
              <a
                href={item.external_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary hover:bg-primary/15 transition-colors"
              >
                <ExternalLink size={16} />
                {t("toolbox.openLink")}
              </a>
              <button
                type="button"
                disabled={busy}
                onClick={() => void recordCompletion("completed")}
                className="flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-[10px] uppercase tracking-[0.25em] text-primary hover:bg-primary/15 transition-colors min-h-[44px]"
              >
                <CheckCircle2 size={14} />
                {t("toolbox.markDone")}
              </button>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-6">{t("toolbox.unavailableConfig")}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
