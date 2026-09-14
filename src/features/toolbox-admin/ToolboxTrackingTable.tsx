import { Loader2, RotateCcw } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Locale } from "@/i18n/translations";
import { pickCatalogTemplateDisplayTitle } from "@/lib/catalog-i18n";
import type { ToolboxTrackingRow } from "@/services/toolboxAdminService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BUCKET_KEYS, BUCKET_STYLES } from "@/features/toolbox-admin/toolboxTrackingBuckets";

interface Props {
  rows: ToolboxTrackingRow[];
  locale: Locale;
  dateLocaleTag: string;
  resendingId: string | null;
  onResend: (row: ToolboxTrackingRow) => void;
}

function formatDate(iso: string | null, dateLocaleTag: string, fallback: string): string {
  if (!iso) return fallback;
  return new Date(iso).toLocaleDateString(dateLocaleTag, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ToolboxTrackingTable({ rows, locale, dateLocaleTag, resendingId, onResend }: Props) {
  const { t } = useLanguage();

  return (
    <div className="ethereal-glass overflow-x-auto rounded-2xl border border-border/40">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-border/40 text-left">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("admin.toolboxTracking.tableUser")}
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("admin.toolboxTracking.tableTool")}
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("admin.toolboxTracking.tableType")}
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("admin.toolboxTracking.tableStatus")}
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("admin.toolboxTracking.tableAssignedAt")}
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("admin.toolboxTracking.tableLastAction")}
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("admin.toolboxTracking.tableProgress")}
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("admin.toolboxTracking.tableActions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const title = pickCatalogTemplateDisplayTitle(locale, {
              title: row.title,
              title_i18n: row.title_i18n,
            });
            const styles = BUCKET_STYLES[row.trackingBucket];
            const resending = resendingId === row.id;
            return (
              <tr
                key={row.id}
                className="border-b border-border/20 transition-colors last:border-0 hover:bg-muted/20"
              >
                <td className="px-4 py-3">
                  <p className="truncate font-medium text-text-primary">{row.user_name || t("users.noName")}</p>
                </td>
                <td className="max-w-[260px] px-4 py-3">
                  <p className="truncate text-text-primary">{title}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {row.content_type}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      styles.badge,
                    )}
                  >
                    {t(BUCKET_KEYS[row.trackingBucket])}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-text-secondary">
                  {formatDate(row.assigned_at, dateLocaleTag, "—")}
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-text-secondary">
                  {formatDate(row.lastActionAt, dateLocaleTag, t("admin.toolboxTracking.noActionYet"))}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-black/10">
                      <div
                        className={cn("h-full rounded-full", styles.bar)}
                        style={{ width: `${row.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-text-secondary">
                      {row.progressPercent}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  {row.canResend ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={resending}
                      onClick={() => onResend(row)}
                    >
                      {resending ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <RotateCcw className="mr-2 size-4" />
                      )}
                      {t("admin.toolboxTracking.resend")}
                    </Button>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
