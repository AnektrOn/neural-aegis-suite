import { ADMIN_NOTIFICATION_DEFINITIONS } from "@/lib/admin-notification-registry";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/i18n/LanguageContext";

export default function AdminNotificationRegistry() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-display text-lg tracking-wide uppercase text-foreground">
          {t("admin.notificationRegistry.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          {t("admin.notificationRegistry.subtitle")}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">{t("admin.notificationRegistry.colType")}</TableHead>
              <TableHead>{t("admin.notificationRegistry.colLabel")}</TableHead>
              <TableHead className="whitespace-nowrap">{t("admin.notificationRegistry.colSource")}</TableHead>
              <TableHead>{t("admin.notificationRegistry.colOrigin")}</TableHead>
              <TableHead>{t("admin.notificationRegistry.colDetail")}</TableHead>
              <TableHead className="whitespace-nowrap">{t("admin.notificationRegistry.colLink")}</TableHead>
              <TableHead className="whitespace-nowrap">{t("admin.notificationRegistry.colEmail")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ADMIN_NOTIFICATION_DEFINITIONS.map((row) => (
              <TableRow key={`${row.type}-${row.origin}`}>
                <TableCell className="font-mono text-xs align-top">{row.type}</TableCell>
                <TableCell className="text-sm align-top">{row.labelFr}</TableCell>
                <TableCell className="text-xs align-top">
                  {row.source === "postgres_trigger"
                    ? t("admin.notificationRegistry.sourceDb")
                    : t("admin.notificationRegistry.sourceEdge")}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground align-top">{row.origin}</TableCell>
                <TableCell className="text-xs align-top max-w-[14rem]">
                  {row.detail}
                  {row.disambiguation ? (
                    <span className="block mt-1 text-muted-foreground italic">{row.disambiguation}</span>
                  ) : null}
                </TableCell>
                <TableCell className="font-mono text-[11px] align-top">{row.defaultLink ?? "—"}</TableCell>
                <TableCell className="text-xs align-top">{row.emailChannel}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
