import { Loader2, RotateCcw } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Locale, TranslationKey } from "@/i18n/translations";
import ToolboxItemPreview from "@/components/admin/ToolboxItemPreview";
import { pickCatalogTemplateDisplayTitle } from "@/lib/catalog-i18n";
import { formatElapsedMinutes } from "@/lib/toolbox-completion";
import type { ToolboxTrackingBucket, ToolboxTrackingRow } from "@/services/toolboxAdminService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { BUCKET_KEYS, BUCKET_STYLES } from "@/features/toolbox-admin/toolboxTrackingBuckets";

const COMPLETION_STATUS_KEYS: Record<ToolboxTrackingRow["completionStatus"], TranslationKey> = {
  none: "admin.toolboxTracking.completionStatus.none",
  completed: "admin.toolboxTracking.completionStatus.completed",
  ignored: "admin.toolboxTracking.completionStatus.ignored",
  abandoned: "admin.toolboxTracking.completionStatus.abandoned",
};

function MetricCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="min-w-0 rounded-xl border border-border/30 bg-background/50 px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 truncate text-sm font-semibold text-text-primary", highlight && "text-primary")}>
        {value}
      </p>
    </div>
  );
}

interface Props {
  row: ToolboxTrackingRow;
  locale: Locale;
  dateLocaleTag: string;
  resending: boolean;
  onResend: () => void;
}

export default function ToolboxTrackingRowCard({ row, locale, dateLocaleTag, resending, onResend }: Props) {
  const { t } = useLanguage();
  const title = pickCatalogTemplateDisplayTitle(locale, {
    title: row.title,
    title_i18n: row.title_i18n,
  });
  const styles = BUCKET_STYLES[row.trackingBucket];
  const completionCount = row.completion?.completion_count ?? (row.completion ? 1 : 0);

  const assignedLabel = t("admin.toolboxTracking.daysAgo", { count: String(row.daysSinceAssigned) });
  const lastActionLabel = row.lastActionAt
    ? new Date(row.lastActionAt).toLocaleDateString(dateLocaleTag, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : t("admin.toolboxTracking.noActionYet");

  const completionsLabel =
    row.completionStatus === "none"
      ? t("admin.toolboxTracking.neverCompleted")
      : t("admin.toolboxTracking.completionCount", { count: String(completionCount) });

  const routineLabel = row.habitLinkActive
    ? t("admin.toolboxTracking.routineActive", { count: String(row.habitCompletionCount) })
    : t("admin.toolboxTracking.routineInactive");

  const elapsedLabel =
    row.completion?.elapsed_sec != null
      ? formatElapsedMinutes(row.completion.elapsed_sec, locale)
      : "—";

  return (
    <li className={cn("ethereal-glass overflow-hidden rounded-2xl border border-border/40 ring-1", styles.ring)}>
      <div className={cn("flex items-center gap-3 border-b border-border/30 px-4 py-3 md:px-5", styles.badge)}>
        <span className="text-xs font-semibold uppercase tracking-widest">
          {t(BUCKET_KEYS[row.trackingBucket])}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/10">
          <div
            className={cn("h-full rounded-full transition-all", styles.bar)}
            style={{ width: `${row.progressPercent}%` }}
          />
        </div>
        <span className="text-xs font-semibold tabular-nums">{row.progressPercent}%</span>
      </div>

      <div className="grid gap-4 p-4 md:p-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_auto] lg:items-center">
        <div className="min-w-0 space-y-1.5">
          <p className="text-base font-semibold leading-snug text-text-primary">{title}</p>
          <p className="text-sm text-muted-foreground">{row.user_name || t("users.noName")}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="outline" className="text-[10px] uppercase">
              {row.content_type}
            </Badge>
            <Badge variant="outline" className="text-[10px] uppercase">
              {row.user_delivery_status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          <MetricCell label={t("admin.toolboxTracking.metricAssigned")} value={assignedLabel} />
          <MetricCell
            label={t("admin.toolboxTracking.metricCompletion")}
            value={t(COMPLETION_STATUS_KEYS[row.completionStatus])}
            highlight={row.completionStatus === "completed"}
          />
          <MetricCell label={t("admin.toolboxTracking.metricCompletions")} value={completionsLabel} />
          <MetricCell
            label={t("admin.toolboxTracking.metricRoutine")}
            value={routineLabel}
            highlight={row.habitLinkActive}
          />
          <MetricCell label={t("admin.toolboxTracking.metricLastAction")} value={lastActionLabel} />
          <MetricCell label={t("admin.toolboxTracking.metricDuration")} value={elapsedLabel} />
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-stretch">
          <ToolboxItemPreview
            contentType={row.content_type}
            title={row.title}
            title_i18n={row.title_i18n}
            description={row.description}
            description_i18n={row.description_i18n}
            widgetConfig={row.widget_config}
            externalUrl={row.external_url}
          />
          {row.canResend ? (
            <Button type="button" variant="outline" size="sm" disabled={resending} onClick={onResend}>
              {resending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 size-4" />
              )}
              {t("admin.toolboxTracking.resend")}
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
