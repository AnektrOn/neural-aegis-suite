import { useCallback, useMemo, useState } from "react";
import { FileJson, Loader2, CheckCircle2, AlertTriangle, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import {
  runToolboxCatalogImport,
  TOOLBOX_USER_DELIVERY_STATUSES,
  type ToolboxUserDeliveryStatus,
} from "@/services/programBuilderService";
import ToolboxImportPreviewCard from "@/components/admin/toolbox/ToolboxImportPreviewCard";
import {
  deliveryStatusLabelKey,
  filterPreviewItems,
  parseAndPreviewToolboxImport,
  type ToolboxImportPreviewItem,
  type ToolboxImportPreviewRow,
} from "@/lib/toolbox-import-preview";
import {
  ToolboxEmptyState,
  ToolboxPanel,
  toolboxFieldClass,
  toolboxLabelClass,
} from "@/components/admin/toolbox/ToolboxAdminUi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  display_name: string | null;
}

interface ExistingTemplate {
  id: string;
  external_key?: string | null;
}

interface ExistingAssignment {
  user_id: string;
  template_id: string | null;
}

const DEFAULT_JSON = {
  version: "toolbox-catalog-v1",
  default_user_ids: [] as string[],
  default_assignment_status: "active",
  toolbox_items: [] as unknown[],
  habit_items: [] as unknown[],
  journal_items: [] as unknown[],
};

interface ToolboxJsonImportTabProps {
  profiles: Profile[];
  templates: ExistingTemplate[];
  assignments: ExistingAssignment[];
  onImported: () => void;
}

export default function ToolboxJsonImportTab({
  profiles,
  templates,
  assignments,
  onImported,
}: ToolboxJsonImportTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useLanguage();

  const [importJson, setImportJson] = useState(() => JSON.stringify(DEFAULT_JSON, null, 2));
  const [previewRows, setPreviewRows] = useState<ToolboxImportPreviewRow[]>([]);
  const [previewItems, setPreviewItems] = useState<ToolboxImportPreviewItem[]>([]);
  const [issues, setIssues] = useState<Array<{ path: string; message: string }>>([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterUserId, setFilterUserId] = useState<string>("all");
  const [groupMode, setGroupMode] = useState<"status_user" | "user_status">("status_user");

  const previewContext = useMemo(() => {
    const existingTemplateKeys = new Map<string, string>();
    for (const tmpl of templates) {
      const key = (tmpl.external_key || "").trim();
      if (key) existingTemplateKeys.set(key, tmpl.id);
    }
    const existingAssignmentPairs = new Set<string>();
    for (const a of assignments) {
      if (a.template_id) {
        existingAssignmentPairs.add(`${a.user_id}::${a.template_id}`);
      }
    }
    const profileNames = new Map(profiles.map((p) => [p.id, p.display_name || p.id.slice(0, 8)]));
    return { existingTemplateKeys, existingAssignmentPairs, profileNames };
  }, [templates, assignments, profiles]);

  const usersInPreview = useMemo(() => {
    const ids = new Set<string>();
    for (const row of previewRows) {
      if (row.userId) ids.add(row.userId);
    }
    return profiles.filter((p) => ids.has(p.id));
  }, [previewRows, profiles]);

  const filteredItems = useMemo(
    () => filterPreviewItems(previewItems, filterStatus, filterUserId),
    [previewItems, filterStatus, filterUserId],
  );

  const filteredRowCount = useMemo(
    () => filteredItems.reduce((n, item) => n + item.assignmentRows.length, 0),
    [filteredItems],
  );

  const sortedFilteredItems = useMemo(() => {
    const items = [...filteredItems];
    const statusOrder: Array<ToolboxUserDeliveryStatus | null> = [
      "waiting",
      "assigned",
      "active",
      "inactive",
      null,
    ];
    if (groupMode === "status_user") {
      items.sort((a, b) => {
        const sa = a.assignmentRows[0]?.deliveryStatus ?? null;
        const sb = b.assignmentRows[0]?.deliveryStatus ?? null;
        return statusOrder.indexOf(sa) - statusOrder.indexOf(sb);
      });
    } else {
      items.sort((a, b) =>
        (a.assignmentRows[0]?.userDisplayName ?? "").localeCompare(
          b.assignmentRows[0]?.userDisplayName ?? "",
          undefined,
          { sensitivity: "base" },
        ),
      );
    }
    return items;
  }, [filteredItems, groupMode]);

  const stats = useMemo(() => {
    const uniqueItems = new Set(previewRows.map((r) => r.itemIndex));
    let templatesCreate = 0;
    let templatesReuse = 0;
    for (const idx of uniqueItems) {
      const row = previewRows.find((r) => r.itemIndex === idx);
      if (!row) continue;
      if (row.templateAction === "create") templatesCreate += 1;
      else templatesReuse += 1;
    }
    const assignCreate = previewRows.filter((r) => r.assignmentAction === "create").length;
    const assignSkip = previewRows.filter((r) => r.assignmentAction === "skip_duplicate").length;
    return { templatesCreate, templatesReuse, assignCreate, assignSkip };
  }, [previewRows]);

  const canConfirm = analyzed && issues.length === 0 && previewRows.length > 0;

  const runAnalyze = useCallback(() => {
    const result = parseAndPreviewToolboxImport(importJson, previewContext, locale);
    setIssues(result.issues);
    setPreviewRows(result.previewRows);
    setPreviewItems(result.previewItems);
    setAnalyzed(true);
    if (result.parseError) {
      toast({
        title: t("toast.error"),
        description: result.parseError,
        variant: "destructive",
      });
      return;
    }
    if (result.issues.length > 0) {
      toast({
        title: t("admin.toolboxMgmt.import.analyzeInvalid"),
        description: t("admin.toolboxMgmt.import.issueCount", { n: result.issues.length }),
        variant: "destructive",
      });
    } else {
      toast({
        title: t("admin.toolboxMgmt.import.analyzeOk"),
        description: t("admin.toolboxMgmt.import.previewReady", { n: result.previewRows.length }),
      });
    }
  }, [importJson, previewContext, toast, t, locale]);

  const runConfirmImport = async () => {
    if (!user || !canConfirm) return;
    setSubmitting(true);
    try {
      const parsed = JSON.parse(importJson);
      const summary = await runToolboxCatalogImport({
        payload: parsed,
        actorId: user.id,
        dryRun: false,
      });
      if (summary.issues.length > 0) {
        setIssues(summary.issues);
        toast({
          title: t("toast.error"),
          description: t("admin.toolboxMgmt.import.issueCount", { n: summary.issues.length }),
          variant: "destructive",
        });
        return;
      }
      toast({
        title: t("admin.toolboxMgmt.import.doneTitle"),
        description: t("admin.toolboxMgmt.import.doneDesc", {
          templates: summary.createdToolboxTemplates,
          assignments: summary.createdToolboxAssignments,
          skipped: summary.skippedDuplicateToolboxAssignments,
        }),
      });
      setPreviewRows([]);
      setPreviewItems([]);
      setAnalyzed(false);
      setImportJson(JSON.stringify(DEFAULT_JSON, null, 2));
      onImported();
    } catch (e) {
      toast({
        title: t("toast.error"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filterChipClass = (active: boolean) =>
    cn(
      "h-9 rounded-lg border px-3 text-sm font-medium transition-colors",
      active
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-background text-muted-foreground hover:border-primary/30",
    );

  const statusLabel = (status: ToolboxUserDeliveryStatus | null) => {
    const key = deliveryStatusLabelKey(status) as TranslationKey;
    return t(key);
  };

  return (
    <div className="space-y-8">
      <ToolboxPanel
        title={t("admin.toolboxMgmt.import.panelTitle")}
        description={t("admin.toolboxMgmt.import.panelDesc")}
      >
        <div className="space-y-4">
          <label htmlFor="toolbox-json-import" className={toolboxLabelClass}>
            {t("admin.toolboxMgmt.import.jsonLabel")}
          </label>
          <textarea
            id="toolbox-json-import"
            className={cn(toolboxFieldClass, "min-h-[220px] font-mono text-xs leading-relaxed")}
            value={importJson}
            onChange={(e) => {
              setImportJson(e.target.value);
              setAnalyzed(false);
            }}
            spellCheck={false}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={runAnalyze}>
              <FileJson className="size-4" aria-hidden />
              {t("admin.toolboxMgmt.import.analyze")}
            </Button>
          </div>
        </div>
      </ToolboxPanel>

      {analyzed && issues.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
          <p className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertTriangle className="size-4" aria-hidden />
            {t("admin.toolboxMgmt.import.validationErrors")}
          </p>
          <ul className="max-h-40 overflow-y-auto text-xs text-destructive/90 space-y-1 font-mono">
            {issues.map((issue, i) => (
              <li key={`${issue.path}-${i}`}>
                <span className="text-destructive/70">{issue.path}</span> — {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analyzed && issues.length === 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatChip label={t("admin.toolboxMgmt.import.statTemplatesNew")} value={stats.templatesCreate} />
            <StatChip label={t("admin.toolboxMgmt.import.statTemplatesReuse")} value={stats.templatesReuse} />
            <StatChip label={t("admin.toolboxMgmt.import.statAssignNew")} value={stats.assignCreate} />
            <StatChip label={t("admin.toolboxMgmt.import.statAssignSkip")} value={stats.assignSkip} />
          </div>

          <ToolboxPanel
            title={t("admin.toolboxMgmt.import.previewTitle")}
            description={t("admin.toolboxMgmt.import.previewDesc")}
          >
            {previewRows.length === 0 ? (
              <ToolboxEmptyState
                icon={FileJson}
                title={t("admin.toolboxMgmt.import.previewEmpty")}
                hint={t("admin.toolboxMgmt.import.previewEmptyHint")}
              />
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="space-y-2">
                    <p className={toolboxLabelClass}>{t("admin.toolboxMgmt.import.filterStatus")}</p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={filterChipClass(filterStatus === "all")} onClick={() => setFilterStatus("all")}>
                        {t("admin.toolboxMgmt.filterAll")}
                      </button>
                      {TOOLBOX_USER_DELIVERY_STATUSES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={filterChipClass(filterStatus === s)}
                          onClick={() => setFilterStatus(s)}
                        >
                          {statusLabel(s)}
                        </button>
                      ))}
                      <button
                        type="button"
                        className={filterChipClass(filterStatus === "template_only")}
                        onClick={() => setFilterStatus("template_only")}
                      >
                        {statusLabel(null)}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className={toolboxLabelClass}>{t("admin.toolboxMgmt.import.filterUser")}</p>
                    <select
                      className={toolboxFieldClass}
                      value={filterUserId}
                      onChange={(e) => setFilterUserId(e.target.value)}
                    >
                      <option value="all">{t("admin.toolboxMgmt.filterAll")}</option>
                      {usersInPreview.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.display_name || p.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <p className={toolboxLabelClass}>{t("admin.toolboxMgmt.import.groupBy")}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={filterChipClass(groupMode === "status_user")}
                        onClick={() => setGroupMode("status_user")}
                      >
                        {t("admin.toolboxMgmt.import.groupStatusUser")}
                      </button>
                      <button
                        type="button"
                        className={filterChipClass(groupMode === "user_status")}
                        onClick={() => setGroupMode("user_status")}
                      >
                        {t("admin.toolboxMgmt.import.groupUserStatus")}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  {t("admin.toolboxMgmt.import.filteredCount", {
                    shown: filteredRowCount,
                    total: previewRows.length,
                  })}
                  {" · "}
                  {t("admin.toolboxMgmt.import.filteredToolsCount", {
                    shown: filteredItems.length,
                    total: previewItems.length,
                  })}
                </p>

                {filteredItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("admin.toolboxMgmt.import.noFilterMatch")}</p>
                ) : (
                  <div className="space-y-6 max-h-[min(75vh,720px)] overflow-y-auto pr-1">
                    {sortedFilteredItems.map((item) => (
                      <ToolboxImportPreviewCard
                        key={`preview-item-${item.itemIndex}`}
                        item={item}
                        statusLabel={statusLabel}
                        t={t}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </ToolboxPanel>

          <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" aria-hidden />
                {t("admin.toolboxMgmt.import.confirmTitle")}
              </p>
              <p className="text-xs text-muted-foreground">{t("admin.toolboxMgmt.import.confirmHint")}</p>
            </div>
            <Button
              type="button"
              size="lg"
              disabled={!canConfirm || submitting}
              onClick={() => void runConfirmImport()}
            >
              {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
              {t("admin.toolboxMgmt.import.confirmButton")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/80 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
}