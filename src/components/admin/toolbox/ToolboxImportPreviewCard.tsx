import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import ToolboxItemPreview from "@/components/admin/ToolboxItemPreview";
import {
  canRenderToolboxWidget,
  renderToolboxWidget,
  TOOLBOX_TYPE_META,
} from "@/lib/toolbox-renderer-registry";
import type { ToolboxImportPreviewItem, ToolboxImportPreviewRow } from "@/lib/toolbox-import-preview";
import type { ToolboxUserDeliveryStatus } from "@/services/programBuilderService";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_BADGE_CLASS: Record<ToolboxUserDeliveryStatus, string> = {
  assigned: "border-neural-accent/40 bg-neural-accent/10 text-neural-accent",
  waiting: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  active: "border-primary/40 bg-primary/10 text-primary",
  inactive: "border-border bg-muted/50 text-muted-foreground",
};

interface ToolboxImportPreviewCardProps {
  item: ToolboxImportPreviewItem;
  statusLabel: (s: ToolboxUserDeliveryStatus | null) => string;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  defaultExpanded?: boolean;
}

export default function ToolboxImportPreviewCard({
  item,
  statusLabel,
  t,
  defaultExpanded = true,
}: ToolboxImportPreviewCardProps) {
  const { locale } = useLanguage();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [previewLocale, setPreviewLocale] = useState<"fr" | "en">(locale === "en" ? "en" : "fr");

  const typeMeta = TOOLBOX_TYPE_META[item.contentType] || TOOLBOX_TYPE_META.course;
  const TypeIcon = typeMeta.icon;

  const description =
    previewLocale === "fr" ? item.descriptionFr : item.descriptionEn || item.descriptionFr;

  const renderableItem = useMemo(
    () => ({
      content_type: item.contentType,
      title: previewLocale === "fr" ? item.titleFr : item.titleEn || item.titleFr,
      widget_config: item.widgetConfigHydrated,
      external_url: item.externalUrl,
    }),
    [item, previewLocale],
  );

  const inlineWidget = useMemo(() => {
    if (!canRenderToolboxWidget(renderableItem)) return null;
    return renderToolboxWidget({
      item: renderableItem,
      locale: previewLocale,
      title: renderableItem.title,
      hideTitle: false,
    });
  }, [renderableItem, previewLocale]);

  return (
    <article className="rounded-xl border border-border/60 bg-card/80 overflow-hidden shadow-sm">
      <header className="flex flex-col gap-3 border-b border-border/40 bg-muted/20 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3 min-w-0 flex-1">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/60">
            <TypeIcon className={cn("size-5", typeMeta.color)} strokeWidth={1.5} aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              #{item.itemIndex + 1} · {item.contentType}
              {item.externalKey ? ` · ${item.externalKey}` : ""}
            </p>
            <h4 className="text-base font-semibold text-foreground leading-snug">{item.titleFr}</h4>
            {item.titleEn && item.titleEn !== item.titleFr ? (
              <p className="text-sm text-muted-foreground">{item.titleEn}</p>
            ) : null}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge variant="secondary" className="text-[10px]">
                {item.templateAction === "create"
                  ? t("admin.toolboxMgmt.import.badgeTemplateNew")
                  : t("admin.toolboxMgmt.import.badgeTemplateReuse")}
              </Badge>
              {item.duration ? (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  {item.duration}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 self-start"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          {expanded ? t("admin.toolboxMgmt.import.collapse") : t("admin.toolboxMgmt.import.expand")}
        </Button>
      </header>

      {expanded ? (
        <div className="grid gap-0 lg:grid-cols-2">
          <section className="space-y-4 border-b border-border/40 p-4 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("admin.toolboxMgmt.import.textPreview")}
              </p>
              <div className="flex gap-1">
                {(["fr", "en"] as const).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setPreviewLocale(loc)}
                    className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-medium uppercase",
                      previewLocale === loc
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {description ? (
              <div className="rounded-lg bg-muted/30 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                  {t("admin.toolboxMgmt.import.description")}
                </p>
                <p className="text-sm text-foreground leading-relaxed">{description}</p>
              </div>
            ) : null}

            {item.textLines.length > 0 ? (
              <dl className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {item.textLines.map((line, idx) => (
                  <div
                    key={`${line.label}-${idx}`}
                    className="rounded-lg border border-border/40 px-3 py-2"
                  >
                    <dt className="text-[10px] font-mono uppercase text-muted-foreground">{line.label}</dt>
                    <dd className="text-sm text-foreground mt-1 leading-relaxed whitespace-pre-wrap">
                      {line.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-xs text-muted-foreground italic">{t("admin.toolboxMgmt.import.noTextFields")}</p>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {t("admin.toolboxMgmt.import.assignmentsHeading")}
              </p>
              <ul className="space-y-1.5">
                {item.assignmentRows.map((row) => (
                  <AssignmentChip key={row.rowKey} row={row} statusLabel={statusLabel} t={t} />
                ))}
              </ul>
            </div>
          </section>

          <section className="flex flex-col gap-3 p-4 bg-muted/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("admin.toolboxMgmt.import.uiPreview")}
            </p>
            <div className="min-h-[200px] rounded-xl border border-border/50 bg-background/80 p-4 overflow-auto max-h-[420px]">
              {inlineWidget ?? (
                <p className="text-sm text-muted-foreground">{t("admin.toolboxMgmt.previewUnavailable")}</p>
              )}
            </div>
            <ToolboxItemPreview
              contentType={item.contentType}
              title={previewLocale === "fr" ? item.titleFr : item.titleEn || item.titleFr}
              description={description}
              widgetConfig={item.widgetConfigHydrated}
              externalUrl={item.externalUrl}
            />
          </section>
        </div>
      ) : null}
    </article>
  );
}

function AssignmentChip({
  row,
  statusLabel,
  t,
}: {
  row: ToolboxImportPreviewRow;
  statusLabel: (s: ToolboxUserDeliveryStatus | null) => string;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}) {
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-md border border-border/30 bg-background/60 px-2 py-1.5 text-xs">
      <span className="font-medium text-foreground">{row.userDisplayName}</span>
      {row.deliveryStatus ? (
        <Badge variant="outline" className={cn("text-[9px]", STATUS_BADGE_CLASS[row.deliveryStatus])}>
          {statusLabel(row.deliveryStatus)}
        </Badge>
      ) : null}
      {row.assignmentAction === "skip_duplicate" ? (
        <Badge variant="outline" className="text-[9px] text-muted-foreground">
          {t("admin.toolboxMgmt.import.badgeAssignSkip")}
        </Badge>
      ) : row.assignmentAction === "create" ? (
        <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">
          {t("admin.toolboxMgmt.import.badgeAssignNew")}
        </Badge>
      ) : null}
    </li>
  );
}
