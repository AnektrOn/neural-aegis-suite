import { useCallback, useState } from "react";
import { FileText, Loader2, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  createToolboxTemplate,
  distributeToolboxContent,
  runToolboxCatalogImport,
  type ToolboxDistributionInput,
} from "@/services/programBuilderService";
import {
  parseToolboxMarkdownBatch,
  type ParsedToolboxMarkdownItem,
} from "@/features/toolbox-admin/toolboxMarkdownParser";
import { ToolboxPanel, ToolboxEmptyState } from "@/components/admin/toolbox/ToolboxAdminUi";
import { Button } from "@/components/ui/button";

interface Props {
  onImported: () => void;
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
    assignmentStatus: d.assignment_status,
  };
}

export default function ToolboxMarkdownImportTab({ onImported }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parseResult, setParseResult] = useState<ReturnType<typeof parseToolboxMarkdownBatch> | null>(
    null,
  );

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setParsing(true);
    try {
      const files = await readFilesAsText(fileList);
      const result = parseToolboxMarkdownBatch(files);
      setParseResult(result);
    } finally {
      setParsing(false);
    }
  }, []);

  const handleImport = async () => {
    if (!user || !parseResult?.items.length) return;
    setImporting(true);
    try {
      let templates = 0;
      let assignments = 0;
      let skipped = 0;

      const catalogOnly = parseResult.items.filter((i) => i.distribution.mode === "catalog");
      if (catalogOnly.length) {
        const payload = {
          version: "toolbox-catalog-v1" as const,
          toolbox_items: catalogOnly.map((item) => ({
            external_key: item.external_key,
            content_type: item.content_type as any,
            title: item.title_i18n.fr || item.title_i18n.en,
            title_i18n: item.title_i18n,
            description: item.description_i18n.fr || item.description_i18n.en,
            description_i18n: item.description_i18n,
            duration: item.duration,
            widget_config: item.widget_config,
            is_active: item.is_active,
          })),
        };
        const summary = await runToolboxCatalogImport({
          payload,
          actorId: user.id,
          dryRun: false,
        });
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
        description: t("admin.toolboxMd.importSuccessDesc", {
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
            onChange={(e) => void handleFiles(e.target.files)}
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
          </div>

          {parseResult.errors.length > 0 ? (
            <ul className="mb-4 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
              {parseResult.errors.map((err) => (
                <li key={err} className="flex gap-2">
                  <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                  {err}
                </li>
              ))}
            </ul>
          ) : null}

          <ul className="mb-6 max-h-64 space-y-2 overflow-y-auto">
            {parseResult.items.map((item) => (
              <li
                key={item.external_key}
                className="flex items-start gap-3 rounded-lg border border-border/40 bg-secondary/10 px-4 py-3 text-sm"
              >
                <CheckCircle2 className="size-4 shrink-0 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">{item.title_i18n.fr}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.content_type} · {item.distribution.mode} · {item.source}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {parseResult.valid > 0 ? (
            <Button type="button" disabled={importing} onClick={() => void handleImport()}>
              {importing ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <FileText className="size-4 mr-2" />
              )}
              {t("admin.toolboxMd.confirmImport")}
            </Button>
          ) : (
            <ToolboxEmptyState message={t("admin.toolboxMd.noValidItems")} />
          )}
        </ToolboxPanel>
      ) : null}
    </div>
  );
}
