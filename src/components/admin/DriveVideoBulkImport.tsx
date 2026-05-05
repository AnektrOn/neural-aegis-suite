import { useMemo, useState } from "react";
import { CloudUpload, CheckCircle2, AlertTriangle, Loader2, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

type ImportResult = {
  input: string;
  fileId: string | null;
  title: string | null;
  status: "created" | "duplicate" | "failed";
  createdAssignments: number;
  skippedDuplicates: number;
  error: string | null;
};

type ImportSummary = {
  receivedLinks: number;
  uniqueLinks: number;
  processedVideos: number;
  targetUsers: number;
  createdAssignments: number;
  skippedDuplicates: number;
  failed: number;
};

type ImportResponse = {
  summary: ImportSummary;
  results: ImportResult[];
};

interface DriveVideoBulkImportProps {
  onImported?: () => void;
}

export default function DriveVideoBulkImport({ onImported }: DriveVideoBulkImportProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [rawLinks, setRawLinks] = useState("");
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<ImportResponse | null>(null);

  const parsedLinks = useMemo(
    () =>
      rawLinks
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    [rawLinks],
  );

  const uniqueCount = useMemo(() => new Set(parsedLinks).size, [parsedLinks]);

  const handleImport = async () => {
    if (parsedLinks.length === 0) {
      toast({
        title: t("toast.error"),
        description: t("admin.driveImport.errNoLinks"),
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setReport(null);

    try {
      const { data, error } = await supabase.functions.invoke("import-drive-links", {
        body: { links: parsedLinks },
      });

      if (error || data?.error) {
        toast({
          title: t("toast.error"),
          description: data?.error || error?.message || t("admin.driveImport.errUnknown"),
          variant: "destructive",
        });
        return;
      }

      const typedData = data as ImportResponse;
      setReport(typedData);

      toast({
        title: t("admin.driveImport.successTitle"),
        description: t("admin.driveImport.successDesc", {
          count: String(typedData.summary.createdAssignments),
        }),
      });

      onImported?.();
    } catch (err) {
      toast({
        title: t("toast.error"),
        description: err instanceof Error ? err.message : t("admin.driveImport.errUnknown"),
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="ethereal-glass p-6 space-y-4">
      <div className="flex items-center gap-3">
        <CloudUpload size={16} className="text-primary" />
        <p className="text-sm font-medium text-foreground">{t("admin.driveImport.title")}</p>
      </div>

      <p className="text-neural-label">{t("admin.driveImport.subtitle")}</p>

      <textarea
        value={rawLinks}
        onChange={(event) => setRawLinks(event.target.value)}
        rows={8}
        placeholder={t("admin.driveImport.placeholder")}
        className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 transition-colors"
      />

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/20">
          <LinkIcon size={12} />
          {t("admin.driveImport.totalLines", { count: String(parsedLinks.length) })}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/20">
          <CheckCircle2 size={12} />
          {t("admin.driveImport.uniqueLinks", { count: String(uniqueCount) })}
        </span>
      </div>

      <button onClick={handleImport} disabled={importing || parsedLinks.length === 0} className="btn-neural disabled:opacity-50">
        {importing ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            {t("admin.driveImport.importing")}
          </>
        ) : (
          <>
            <CloudUpload size={14} />
            {t("admin.driveImport.import")}
          </>
        )}
      </button>

      {report && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border/20 bg-secondary/10 p-3">
              <p className="text-neural-label">{t("admin.driveImport.metricCreated")}</p>
              <p className="text-sm text-foreground font-medium">{report.summary.createdAssignments}</p>
            </div>
            <div className="rounded-lg border border-border/20 bg-secondary/10 p-3">
              <p className="text-neural-label">{t("admin.driveImport.metricDuplicates")}</p>
              <p className="text-sm text-foreground font-medium">{report.summary.skippedDuplicates}</p>
            </div>
            <div className="rounded-lg border border-border/20 bg-secondary/10 p-3">
              <p className="text-neural-label">{t("admin.driveImport.metricFailed")}</p>
              <p className="text-sm text-foreground font-medium">{report.summary.failed}</p>
            </div>
            <div className="rounded-lg border border-border/20 bg-secondary/10 p-3">
              <p className="text-neural-label">{t("admin.driveImport.metricUsers")}</p>
              <p className="text-sm text-foreground font-medium">{report.summary.targetUsers}</p>
            </div>
          </div>

          <div className="max-h-64 overflow-auto rounded-lg border border-border/20">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/20 text-left">
                  <th className="px-3 py-2 text-neural-label">{t("admin.driveImport.colLink")}</th>
                  <th className="px-3 py-2 text-neural-label">{t("admin.driveImport.colStatus")}</th>
                  <th className="px-3 py-2 text-neural-label">{t("admin.driveImport.colTitle")}</th>
                  <th className="px-3 py-2 text-neural-label">{t("admin.driveImport.colDetails")}</th>
                </tr>
              </thead>
              <tbody>
                {report.results.map((result, index) => (
                  <tr key={`${result.input}-${index}`} className="border-b border-border/10 align-top">
                    <td className="px-3 py-2 text-foreground max-w-[220px] truncate" title={result.input}>
                      {result.input}
                    </td>
                    <td className="px-3 py-2">
                      {result.status === "failed" ? (
                        <span className="inline-flex items-center gap-1 text-destructive">
                          <AlertTriangle size={12} />
                          {t("admin.driveImport.statusFailed")}
                        </span>
                      ) : result.status === "duplicate" ? (
                        <span className="text-muted-foreground">{t("admin.driveImport.statusDuplicate")}</span>
                      ) : (
                        <span className="text-primary">{t("admin.driveImport.statusCreated")}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-foreground">{result.title || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {result.error ||
                        t("admin.driveImport.detailsCounts", {
                          created: String(result.createdAssignments),
                          skipped: String(result.skippedDuplicates),
                        })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
