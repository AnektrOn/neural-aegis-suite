import { Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Locale, TranslationKey } from "@/i18n/translations";
import ToolboxItemPreview from "@/components/admin/ToolboxItemPreview";
import { pickLocalizedText } from "@/lib/content-i18n";
import { pickWidgetCatalogCopy } from "@/lib/toolbox-widget-i18n";
import type { ToolboxTrackingRow } from "@/services/toolboxAdminService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BUCKET_KEYS, BUCKET_STYLES } from "@/features/toolbox-admin/toolboxTrackingBuckets";

interface Props {
  row: ToolboxTrackingRow;
  locale: Locale;
  dateLocaleTag: string;
  typeMeta: { icon: LucideIcon; color: string; label: string };
  onDelete: () => void;
  showUserName?: boolean;
}

export default function ToolboxByUserToolCard({
  row,
  locale,
  dateLocaleTag,
  typeMeta,
  onDelete,
  showUserName = false,
}: Props) {
  const { t } = useLanguage();
  const title = pickLocalizedText(locale, row.title_i18n, row.title);
  const styles = BUCKET_STYLES[row.trackingBucket];
  const Icon = typeMeta.icon;
  const assignedDate = new Date(row.assigned_at).toLocaleDateString(dateLocaleTag, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article
      className={cn(
        "ethereal-glass flex h-full flex-col overflow-hidden rounded-2xl border border-border/40 ring-1 transition-shadow hover:shadow-md",
        styles.ring,
      )}
    >
      <div className={cn("flex items-center gap-2 border-b border-border/30 px-4 py-2.5", styles.badge)}>
        <span className="text-[10px] font-semibold uppercase tracking-widest">
          {t(BUCKET_KEYS[row.trackingBucket] as TranslationKey)}
        </span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-black/10">
          <div
            className={cn("h-full rounded-full", styles.bar)}
            style={{ width: `${row.progressPercent}%` }}
          />
        </div>
        <span className="text-[10px] font-semibold tabular-nums">{row.progressPercent}%</span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/50">
            <Icon className={cn("size-5", typeMeta.color)} strokeWidth={1.5} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-text-primary">{title}</h3>
            {showUserName ? (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {row.user_name || t("users.noName")}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-[10px] font-medium">
            {typeMeta.label}
          </Badge>
          {row.duration ? (
            <Badge variant="outline" className="text-[10px]">
              {row.duration}
            </Badge>
          ) : null}
          <Badge variant="outline" className="text-[10px] uppercase">
            {row.user_delivery_status}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          {t("admin.toolboxMgmt.listColumnDate")}: {assignedDate}
        </p>

        <div className="mt-auto flex items-center gap-2 pt-1">
          <ToolboxItemPreview
            contentType={row.content_type}
            title={title}
            description={pickWidgetCatalogCopy(
              locale,
              row.description_i18n as Parameters<typeof pickWidgetCatalogCopy>[1],
              row.description,
            )}
            widgetConfig={row.widget_config}
            externalUrl={row.external_url}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 shrink-0 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
            onClick={onDelete}
            aria-label={t("admin.toolboxMgmt.removeTitle")}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </article>
  );
}
