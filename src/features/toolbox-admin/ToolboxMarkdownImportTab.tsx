import { Component, useCallback, useState, type ErrorInfo, type ReactNode } from "react";
import { FileText, Loader2, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import ToolboxItemPreview from "@/components/admin/ToolboxItemPreview";
import {
  createToolboxTemplate,
  distributeToolboxContent,
  runToolboxCatalogImport,
  type ToolboxDistributionInput,
} from "@/services/programBuilderService";
import {
  parseToolboxMarkdownBatch,
  parsedItemsToCatalogPayload,
  type ParsedToolboxMarkdownItem,
} from "@/features/toolbox-admin/toolboxMarkdownParser";
import { ToolboxPanel, ToolboxEmptyState } from "@/components/admin/toolbox/ToolboxAdminUi";
import { Button } from "@/components/ui/button";

interface Props {
  onImported: () => void;
}

class MarkdownImportErrorBoundary extends Component<
  { children: ReactNode; onReset: () => void },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ToolboxMarkdownImport]", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <ToolboxPanel title="Import Markdown" description="Une erreur a bloqué l’aperçu.">
          <p className="mb-4 text-sm text-destructive">{this.state.error.message}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              this.setState({ error: null });
              this.props.onReset();
            }}
          >
            Réessayer
          </Button>
        </ToolboxPanel>
      );
    }
    return this.props.children;
  }
}

async function readFilesAsText(fileList: FileList): Promise<Array<{ name: string; content: string }>> {
  const files = Array.from(fileList).filter((f) => f.name.endsWith(".md"));
  return Promise.all(
    files.map(async (f) => ({ name: f.name, content: await f.text() })),
  );
}

function itemToDistribution(item: ParsedToolboxMarkdownItem): ToolboxDistributionInput {
  const d = item.distribution;
  return {
    mode: d.mode,
    userId: d.user_id,
    userIds: d.user_ids,
    companyId: d.company_id,
    locale: d.locale,
    assignmentStatus: "waiting",
  };
}

function ToolboxMarkdownImportPanel({ onImported }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parseResult, setParseResult] = useState<ReturnType<typeof parseToolboxMarkdownBatch> | null>(
    null,
  );

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList?.length) return;
      setParsing(true);
      try {
        const files = await readFilesAsText(fileList);
        if (!files.length) {
          toast({
            title: t("toast.error"),
            description: t("admin.toolboxMd.noValidItems"),
            variant: "destructive",
          });
          return;
        }
        const result = parseToolboxMarkdownBatch(files);
        setParseResult(result);
      } catch (e: unknown) {
        console.error("[ToolboxMarkdownImport] parse failed", e);
        setParseResult(null);
        toast({
          title: t("toast.error"),
          description: e instanceof Error ? e.message : String(e),
          variant: "destructive",
        });
      } finally {
        setParsing(false);
      }
    },
    [t, toast],
  );

  const handleImport = async () => {
    if (!user || !parseResult?.items.length) return;
    if (parseResult.importIssues.length > 0) {
      toast({
        title: t("toast.error"),
        description: parseResult.importIssues.map((i) => i.message).join(" · "),
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    try {
      let templates = 0;
      let assignments = 0;
      let skipped = 0;

      const catalogOnly = parseResult.items.filter((i) => i.distribution.mode === "catalog");
      if (catalogOnly.length) {
        const payload = parsedItemsToCatalogPayload(catalogOnly);
        payload.default_assignment_status = "waiting";
        payload.toolbox_items = (payload.toolbox_items || []).map((item) => ({
          ...item,
          assignment_status: "waiting",
        }));
        const summary = await runToolboxCatalogImport({
          payload,
          actorId: user.id,
          dryRun: false,
        });
        if (summary.issues.length > 0) {
          throw new Error(summary.issues.map((i) => i.message).join(" · "));
        }
        templates += summary.createdToolboxTemplates;
        assignments += summary.createdToolboxAssignments;
        skipped += summary.skippedDuplicateToolboxAssignments;
      }

      for (const item of parseResult.items.filter((i) => i.distribution.mode !== "catalog")) {
        const tpl = await createToolboxTemplate(
          {
            external_key: item.external_key,
            content_type: item.content_type as any,
            title: item.title_i18n.fr || item.title_i18n.en,
            title_i18n: item.title_i18n,
            description: item.description_i18n.fr || item.description_i18n.en,
            description_i18n: item.description_i18n,
            duration: item.duration,
            widget_config: item.widget_config,
            is_active: item.is_active,
            archetype_targets: item.archetype_targets,
            shadow_targets: item.shadow_targets,
          },
          user.id,
        );
        templates += 1;
        const dist = await distributeToolboxContent({
          actorId: user.id,
          templateId: (tpl as any).id,
          distribution: itemToDistribution(item),
        });
        assignments += dist.created;
        skipped += dist.skipped;
      }

      toast({
        title: t("admin.toolboxMd.importSuccess"),
        description: t("admin.toolboxMd.importSuccessReview", {
          templates: String(templates),
          assignments: String(assignments),
          skipped: String(skipped),
        }),
      });
      onImported();
      setParseResult(null);
    } catch (e: unknown) {
      toast({
        title: t("toast.error"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const importBlocked = (parseResult?.importIssues.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <ToolboxPanel
        title={t("admin.toolboxMd.title")}
        description={t("admin.toolboxMd.description")}
      >
        <label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-secondary/5 px-6 py-8 transition-colors hover:border-primary/30 hover:bg-primary/5">
          <Upload className="size-8 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-sm text-muted-foreground">{t("admin.toolboxMd.dropHint")}</span>
          <input
            type="file"
            accept=".md,text/markdown"
            multiple
            className="sr-only"
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        {parsing ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {t("admin.toolboxMd.parsing")}
          </p>
        ) : null}
      </ToolboxPanel>

      {parseResult ? (
        <ToolboxPanel title={t("admin.toolboxMd.previewTitle")} description={t("admin.toolboxMd.previewDesc")}>
          <div className="mb-4 flex flex-wrap gap-3 text-sm">
            <span className="text-muted-foreground">
              {t("admin.toolboxMd.statsTotal", { n: String(parseResult.total) })}
            </span>
            <span className="text-primary">
              {t("admin.toolboxMd.statsValid", { n: String(parseResult.valid) })}
            </span>
            {parseResult.errors.length ? (
              <span className="text-destructive">
                {t("admin.toolboxMd.statsErrors", { n: String(parseResult.errors.length) })}
              </span>
            ) : null}
            {parseResult.importIssues.length ? (
              <span className="text-destructive">
                {t("admin.toolboxMd.statsImportBlock", {
                  n: String(parseResult.importIssues.length),
                })}
              </span>
            ) : null}
          </div>

          {parseResult.errors.length > 0 ? (
            <ul className="mb-4 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
              {parseResult.errors.map((err, index) => (
                <li key={`${err}-${index}`} className="flex gap-2">
                  <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                  {err}
                </li>
              ))}
            </ul>
          ) : null}

          {parseResult.importIssues.length > 0 ? (
            <ul className="mb-4 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
              {parseResult.importIssues.map((issue, index) => (
                <li key={`${issue.path}-${index}`} className="flex gap-2">
                  <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                  {issue.message}
                </li>
              ))}
            </ul>
          ) : null}

          <ul className="mb-6 max-h-[28rem] space-y-3 overflow-y-auto">
            {parseResult.items.map((item) => {
              const title = item.title_i18n.fr || item.title_i18n.en;
              const userLabel =
                item.distribution.user_id ||
                (item.distribution.user_ids?.length
                  ? item.distribution.user_ids.join(", ")
                  : item.distribution.mode);
              return (
                <li
                  key={item.external_key}
                  className="rounded-lg border border-border/40 bg-secondary/10 px-4 py-3 text-sm"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                        <div className="min-w-0 space-y-1">
                          <p className="font-medium text-foreground">{title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.content_type} · {item.distribution.mode}
                          </p>
                          <p className="break-all font-mono text-[11px] text-muted-foreground">
                            {t("admin.toolboxMd.previewUser")}: {userLabel}
                          </p>
                        </div>
                      </div>
                    </div>
                    <ToolboxItemPreview
                      contentType={item.content_type}
                      title={title}
                      description={item.description_i18n.fr || item.description_i18n.en}
                      widgetConfig={item.widget_config}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          {parseResult.valid > 0 && !importBlocked ? (
            <Button type="button" disabled={importing} onClick={() => void handleImport()}>
              {importing ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <FileText className="size-4 mr-2" />
              )}
              {t("admin.toolboxMd.confirmImport")}
            </Button>
          ) : (
            <ToolboxEmptyState
              icon={importBlocked ? AlertTriangle : FileText}
              title={
                importBlocked
                  ? t("admin.toolboxMd.importBlocked")
                  : t("admin.toolboxMd.noValidItems")
              }
            />
          )}
        </ToolboxPanel>
      ) : null}
    </div>
  );
}

export default function ToolboxMarkdownImportTab({ onImported }: Props) {
  const [boundaryKey, setBoundaryKey] = useState(0);

  return (
    <MarkdownImportErrorBoundary
      key={boundaryKey}
      onReset={() => {
        setBoundaryKey((k) => k + 1);
      }}
    >
      <ToolboxMarkdownImportPanel onImported={onImported} />
    </MarkdownImportErrorBoundary>
  );
}
