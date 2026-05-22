import { useCallback, useState } from "react";
import {
  FileText,
  FolderOpen,
  FileArchive,
  Upload,
  Loader2,
  Download,
  ClipboardPaste,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { NeuralCard } from "@/components/ui/neural-card";
import { Badge } from "@/components/ui/badge";
import {
  mergeNewsletterMarkdownEntries,
  readNewsletterMdFromFileList,
  readNewsletterMdZip,
  NEWSLETTER_MD_TEMPLATE,
  type NewsletterImportPreview,
} from "@/lib/newsletter-markdown-parse";
import {
  upsertNewsletterEditionAdmin,
  type NewsletterEdition,
} from "@/services/newsletterService";

interface NewsletterMarkdownImportProps {
  onImported: (edition: NewsletterEdition) => void;
}

export default function NewsletterMarkdownImport({ onImported }: NewsletterMarkdownImportProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [preview, setPreview] = useState<NewsletterImportPreview | null>(null);
  const [pasteContent, setPasteContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const IMPORT_INFO_ISSUES = new Set([
    "excerpt_auto_generated",
    "excerpt_inferred_from_article",
    "format_inferred_from_markdown",
  ]);

  const runPreview = useCallback((entries: Array<{ path: string; content: string }>) => {
    setPreview(mergeNewsletterMarkdownEntries(entries));
  }, []);

  const onFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setLoading(true);
    try {
      const entries = await readNewsletterMdFromFileList(files);
      if (!entries.length) {
        toast({
          title: t("toast.error"),
          description: t("newsletter.admin.importNoMd"),
          variant: "destructive",
        });
        return;
      }
      runPreview(entries);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const onFolderPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setLoading(true);
    try {
      runPreview(await readNewsletterMdFromFileList(files));
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const onZipPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      runPreview(await readNewsletterMdZip(file));
    } catch (err) {
      toast({
        title: t("toast.error"),
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const onPastePreview = () => {
    const trimmed = pasteContent.trim();
    if (!trimmed) {
      toast({
        title: t("toast.error"),
        description: t("newsletter.admin.importPasteEmpty"),
        variant: "destructive",
      });
      return;
    }
    runPreview([{ path: "paste.md", content: trimmed }]);
  };

  const downloadTemplate = () => {
    const blob = new Blob([NEWSLETTER_MD_TEMPLATE], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "newsletter-template.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveDraft = async () => {
    if (!user?.id || !preview?.edition.slug) return;
    const blocking = preview.issues.filter(
      (i) => !IMPORT_INFO_ISSUES.has(i) && !i.startsWith("excerpt_auto"),
    );
    if (blocking.some((i) => i === "slug_required" || i === "title_fr_required" || i === "body_required")) {
      toast({
        title: t("toast.error"),
        description: t("newsletter.admin.importInvalid"),
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const ed = preview.edition;
    const saved = await upsertNewsletterEditionAdmin(
      {
        slug: ed.slug,
        titleFr: ed.titleFr,
        titleEn: ed.titleEn || ed.titleFr,
        excerptFr: ed.excerptFr,
        excerptEn: ed.excerptEn || ed.excerptFr,
        bodyFr: ed.bodyFr,
        bodyEn: ed.bodyEn || ed.bodyFr,
        status: "draft",
      },
      user.id,
    );
    setSaving(false);

    if (!saved) {
      toast({ title: t("toast.error"), description: t("newsletter.admin.saveFailed"), variant: "destructive" });
      return;
    }

    toast({ title: t("newsletter.admin.importSaved") });
    onImported(saved);
  };

  const ed = preview?.edition;

  return (
    <NeuralCard variant="premium" className="p-6 space-y-5">
      <div>
        <p className="text-neural-label">{t("newsletter.admin.importTitle")}</p>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {t("newsletter.admin.importDesc")}
        </p>
      </div>

      <pre className="text-[10px] text-text-tertiary bg-bg-base/80 border border-border-subtle rounded-lg p-3 overflow-x-auto font-mono leading-relaxed">
        {t("newsletter.admin.importFormat")}
      </pre>

      <div className="space-y-3">
        <p className="text-xs font-medium text-text-secondary flex items-center gap-2">
          <ClipboardPaste size={14} aria-hidden />
          {t("newsletter.admin.importPaste")}
        </p>
        <Textarea
          value={pasteContent}
          onChange={(e) => setPasteContent(e.target.value)}
          placeholder={t("newsletter.admin.importPastePlaceholder")}
          className="min-h-[200px] font-mono text-xs leading-relaxed resize-y"
          spellCheck={false}
        />
        <Button
          type="button"
          variant="secondary"
          className="min-h-[44px]"
          disabled={loading}
          onClick={onPastePreview}
        >
          {t("newsletter.admin.importPastePreview")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-lg border border-border-active bg-bg-base text-sm text-text-primary hover:bg-bg-elevated transition-colors duration-200 cursor-pointer">
          <input type="file" accept=".md,text/markdown" multiple className="sr-only" onChange={onFilePick} />
          <FileText size={16} aria-hidden />
          {t("newsletter.admin.importFile")}
        </label>
        <label className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-lg border border-border-active bg-bg-base text-sm text-text-primary hover:bg-bg-elevated transition-colors duration-200 cursor-pointer">
          <input
            type="file"
            {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
            multiple
            className="sr-only"
            onChange={onFolderPick}
          />
          <FolderOpen size={16} aria-hidden />
          {t("newsletter.admin.importFolder")}
        </label>
        <label className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-lg border border-border-active bg-bg-base text-sm text-text-primary hover:bg-bg-elevated transition-colors duration-200 cursor-pointer">
          <input type="file" accept=".zip,application/zip" className="sr-only" onChange={onZipPick} />
          <FileArchive size={16} aria-hidden />
          {t("newsletter.admin.importZip")}
        </label>
        <Button type="button" variant="ghost" className="min-h-[44px] gap-2" onClick={downloadTemplate}>
          <Download size={16} aria-hidden />
          {t("newsletter.admin.downloadTemplate")}
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" aria-hidden />
          {t("newsletter.admin.importLoading")}
        </div>
      )}

      {preview && ed && (
        <div className="space-y-4 border-t border-border-subtle/60 pt-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              /{ed.slug}
            </Badge>
            {preview.files.map((f) => (
              <span key={f} className="text-[10px] text-text-tertiary font-mono">
                {f}
              </span>
            ))}
          </div>
          {preview.issues.length > 0 && (
            <ul className="text-xs text-amber-600/90 dark:text-amber-400/90 space-y-1">
              {preview.issues.map((issue) => (
                <li key={issue}>
                  {IMPORT_INFO_ISSUES.has(issue) || issue.startsWith("excerpt_auto")
                    ? `ℹ ${issue}`
                    : issue}
                </li>
              ))}
            </ul>
          )}
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-tertiary font-display">FR</p>
              <p className="font-medium text-foreground mt-1">{ed.titleFr || "—"}</p>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{ed.excerptFr}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-tertiary font-display">EN</p>
              <p className="font-medium text-foreground mt-1">{ed.titleEn || "—"}</p>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{ed.excerptEn}</p>
            </div>
          </div>
          <p className="text-xs text-text-tertiary">
            {t("newsletter.admin.importBodyStats", {
              fr: String(ed.bodyFr.length),
              en: String(ed.bodyEn.length),
            })}
          </p>
          <Button
            type="button"
            className="min-h-[44px] gap-2 w-full sm:w-auto"
            disabled={saving}
            onClick={saveDraft}
          >
            <Upload size={16} aria-hidden />
            {saving ? t("newsletter.admin.importSaving") : t("newsletter.admin.importSaveDraft")}
          </Button>
        </div>
      )}
    </NeuralCard>
  );
}
