import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileDown, FileText, Trash2, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { buildMdPdfHtml, openMdPdfPrintWindow, type MdPdfContentLang } from "@/features/md-pdf/exportMarkdownPdf";
import { resolveMdPdfMeta } from "@/features/md-pdf/markdownToPrintHtml";
import { MD_PDF_THEMES, type MdPdfThemeId } from "@/features/md-pdf/printThemes";
import { saveMdPdfRenderSession } from "@/features/md-pdf/mdPdfRenderSession";
import { SAMPLE_VAULT_MD } from "@/features/md-pdf/sampleVaultMd";
import { useMdPdfAssessment } from "@/features/md-pdf/useMdPdfAssessment";

type DocFile = {
  id: string;
  filename: string;
  markdown: string;
  title: string;
  subtitle: string;
};

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isMarkdownFile(file: File): boolean {
  return /\.(md|markdown|txt)$/i.test(file.name) || /markdown|text\/plain/.test(file.type);
}

async function collectDroppedFiles(data: DataTransfer): Promise<File[]> {
  const items = Array.from(data.items);
  const fromEntries = await Promise.all(
    items.map((item) => {
      const entry = item.webkitGetAsEntry?.();
      return entry ? readEntry(entry) : Promise.resolve([] as File[]);
    }),
  );
  const nested = fromEntries.flat();
  if (nested.length > 0) return nested;
  return Array.from(data.files);
}

function readEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise((resolve, reject) => {
      (entry as FileSystemFileEntry).file(resolve, reject);
    }).then((file) => [file as File]);
  }
  if (!entry.isDirectory) return Promise.resolve([]);
  const reader = (entry as FileSystemDirectoryEntry).createReader();
  return new Promise((resolve, reject) => {
    const acc: File[] = [];
    const pump = () => {
      reader.readEntries(async (batch) => {
        if (batch.length === 0) {
          resolve(acc);
          return;
        }
        try {
          const nested = await Promise.all(batch.map(readEntry));
          acc.push(...nested.flat());
          pump();
        } catch (err) {
          reject(err);
        }
      }, reject);
    };
    pump();
  });
}

function docFromMarkdown(filename: string, markdown: string): DocFile {
  const meta = resolveMdPdfMeta(markdown, filename.replace(/\.(md|markdown|txt)$/i, "") || filename);
  return {
    id: newId(),
    filename,
    markdown,
    title: meta.title,
    subtitle: meta.subtitle,
  };
}

export default function AdminMarkdownPdf() {
  const { t, locale } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [theme, setTheme] = useState<MdPdfThemeId>("nocturne");
  const [showCover, setShowCover] = useState(true);
  const [contentLang, setContentLang] = useState<MdPdfContentLang>("fr");
  const [dragOver, setDragOver] = useState(false);

  const active = docs.find((d) => d.id === activeId) ?? docs[0] ?? null;
  const pdfLocale = contentLang === "en" ? "en" : "fr";
  const { assessment, status: userStatus, handle: userHandle } = useMdPdfAssessment(
    active?.markdown,
    pdfLocale,
  );

  useEffect(() => {
    if (!active) return;
    saveMdPdfRenderSession({
      markdown: active.markdown,
      filename: active.filename,
      theme,
      showCover,
      contentLang,
    });
  }, [active, theme, showCover, contentLang]);

  const previewHtml = useMemo(() => {
    if (!active) return "";
    return buildMdPdfHtml({
      sources: [
        {
          filename: active.filename,
          markdown: active.markdown,
          titleOverride: active.title,
          subtitleOverride: active.subtitle,
        },
      ],
      theme,
      showCover,
      locale,
      contentLang,
      assessment,
    }).html;
  }, [active, theme, showCover, locale, contentLang, assessment]);

  const ingest = useCallback(
    async (files: File[]) => {
      const mdFiles = files.filter(isMarkdownFile);
      if (mdFiles.length === 0) {
        toast.error(t("admin.mdPdf.errorNoMd"));
        return;
      }
      const next = await Promise.all(
        mdFiles.map(async (file) => docFromMarkdown(file.name, await file.text())),
      );
      setDocs((prev) => [...prev, ...next]);
      setActiveId((cur) => cur ?? next[0]?.id ?? null);
      toast.success(t("admin.mdPdf.loaded", { n: next.length }));
    },
    [t],
  );

  const updateActive = (patch: Partial<DocFile>) => {
    if (!active) return;
    setDocs((prev) => prev.map((d) => (d.id === active.id ? { ...d, ...patch } : d)));
  };

  const applyMarkdown = (value: string) => {
    if (!active) {
      const created = docFromMarkdown("document.md", value);
      setDocs([created]);
      setActiveId(created.id);
      return;
    }
    const fallback = active.filename.replace(/\.(md|markdown|txt)$/i, "") || active.filename;
    const meta = resolveMdPdfMeta(value, fallback);
    updateActive(
      value.trimStart().startsWith("---")
        ? { markdown: value, title: meta.title, subtitle: meta.subtitle }
        : { markdown: value },
    );
  };

  const removeDoc = (id: string) => {
    setDocs((prev) => {
      const next = prev.filter((d) => d.id !== id);
      if (activeId === id) setActiveId(next[0]?.id ?? null);
      return next;
    });
  };

  const exportPdf = (all: boolean) => {
    const sources = (all ? docs : active ? [active] : []).map((d) => ({
      filename: d.filename,
      markdown: d.markdown,
      titleOverride: d.title,
      subtitleOverride: d.subtitle,
    }));
    if (sources.length === 0) {
      toast.error(t("admin.mdPdf.errorEmpty"));
      return;
    }
    const ok = openMdPdfPrintWindow({
      sources,
      theme,
      showCover,
      locale,
      contentLang,
      assessment: all && docs[0]?.id !== active?.id ? null : assessment,
    });
    if (!ok) toast.error(t("admin.mdPdf.errorPopup"));
    else toast.success(t("admin.mdPdf.printHint"));
  };

  const loadSample = () => {
    const sample = docFromMarkdown("diag-balance-djanan33.md", SAMPLE_VAULT_MD);
    setDocs([sample]);
    setActiveId(sample.id);
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="font-display text-[10px] uppercase tracking-[0.25em] text-accent-warning">
            {t("admin.mdPdf.kicker")}
          </p>
          <h1 className="font-display text-2xl uppercase tracking-[0.16em] text-text-primary">
            {t("admin.mdPdf.title")}
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">{t("admin.mdPdf.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/md-pdf/render"
            className="inline-flex min-h-10 items-center rounded-full border border-accent-warning/40 bg-accent-warning/10 px-4 text-[11px] font-display uppercase tracking-[0.14em] text-accent-warning"
          >
            {t("admin.mdPdf.openRender")}
          </Link>
          <Button type="button" variant="outline" onClick={loadSample}>
            {t("admin.mdPdf.sample")}
          </Button>
          <Button type="button" disabled={!active || userStatus === "loading"} onClick={() => exportPdf(false)}>
            <FileDown size={16} aria-hidden />
            {t("admin.mdPdf.exportCurrent")}
          </Button>
          <Button type="button" disabled={docs.length === 0} onClick={() => exportPdf(true)}>
            <FileDown size={16} aria-hidden />
            {t("admin.mdPdf.exportAll")}
          </Button>
        </div>
      </header>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void collectDroppedFiles(e.dataTransfer).then(ingest);
        }}
        className={cn(
          "rounded-2xl border border-dashed p-6 transition-colors duration-200",
          dragOver
            ? "border-accent-warning/60 bg-accent-warning/10"
            : "border-border-subtle bg-bg-surface/60",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.txt,text/markdown,text/plain"
          multiple
          className="sr-only"
          onChange={(e) => {
            const list = e.target.files;
            if (list?.length) void ingest(Array.from(list));
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex min-h-14 w-full items-center justify-center gap-3 text-sm text-muted-foreground hover:text-foreground"
        >
          <Upload size={18} aria-hidden />
          {t("admin.mdPdf.dropHint")}
        </button>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-bg-surface/70 p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-display text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
            {t("admin.mdPdf.language")}
          </span>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["fr", t("admin.mdPdf.langFr")],
                ["en", t("admin.mdPdf.langEn")],
                ["both", t("admin.mdPdf.langBoth")],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setContentLang(id)}
                className={cn(
                  "min-h-10 rounded-full border px-4 text-[11px] font-display uppercase tracking-[0.14em] transition-colors duration-200",
                  contentLang === id
                    ? "border-accent-warning/40 bg-accent-warning/15 text-accent-warning"
                    : "border-border-subtle text-text-tertiary hover:border-accent-warning/25 hover:text-text-primary",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-display text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
            {t("admin.mdPdf.theme")}
          </span>
          <div className="flex flex-wrap gap-2">
            {MD_PDF_THEMES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTheme(item.id)}
                className={cn(
                  "min-h-10 rounded-full border px-4 text-[11px] font-display uppercase tracking-[0.14em] transition-colors duration-200",
                  theme === item.id
                    ? "border-accent-warning/40 bg-accent-warning/15 text-accent-warning"
                    : "border-border-subtle text-text-tertiary hover:border-accent-warning/25 hover:text-text-primary",
                )}
              >
                {t(item.labelKey)}
              </button>
            ))}
          </div>
          <label className="ml-auto flex min-h-10 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={showCover}
              onChange={(e) => setShowCover(e.target.checked)}
              className="h-4 w-4 accent-[hsl(var(--aegis-warm))]"
            />
            {t("admin.mdPdf.cover")}
          </label>
        </div>
        {userHandle ? (
          <p
            className={cn(
              "font-display text-[11px] uppercase tracking-[0.12em]",
              userStatus === "found"
                ? "text-accent-warning"
                : userStatus === "missing"
                  ? "text-destructive"
                  : "text-muted-foreground",
            )}
          >
            {userStatus === "loading"
              ? t("admin.mdPdf.userLoading", { user: userHandle })
              : userStatus === "found"
                ? t("admin.mdPdf.userLinked", { user: assessment?.displayName ?? userHandle })
                : t("admin.mdPdf.userMissing", { user: userHandle })}
          </p>
        ) : null}
      </div>

      {docs.length > 0 && (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {docs.map((doc) => (
            <li key={doc.id}>
              <div
                className={cn(
                  "flex items-center gap-1 rounded-lg border pl-3 pr-1",
                  doc.id === active?.id
                    ? "border-accent-warning/40 bg-accent-warning/10"
                    : "border-border-subtle bg-bg-elevated",
                )}
              >
                <button
                  type="button"
                  onClick={() => setActiveId(doc.id)}
                  className="flex min-h-10 max-w-[220px] items-center gap-2 truncate text-left text-xs"
                >
                  <FileText size={14} className="shrink-0 text-accent-warning" aria-hidden />
                  <span className="truncate">{doc.title || doc.filename}</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeDoc(doc.id)}
                  className="grid h-10 w-10 place-items-center text-text-tertiary hover:text-destructive"
                  aria-label={t("admin.mdPdf.remove")}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.95fr)]">
        <section className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="font-display text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
                {t("admin.mdPdf.docTitle")}
              </span>
              <Input
                value={active?.title ?? ""}
                onChange={(e) => {
                  if (!active) return;
                  updateActive({ title: e.target.value });
                }}
                placeholder={t("admin.mdPdf.docTitle")}
              />
            </label>
            <label className="space-y-1.5">
              <span className="font-display text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
                {t("admin.mdPdf.docSubtitle")}
              </span>
              <Input
                value={active?.subtitle ?? ""}
                onChange={(e) => {
                  if (!active) return;
                  updateActive({ subtitle: e.target.value });
                }}
                placeholder={t("admin.mdPdf.docSubtitle")}
              />
            </label>
          </div>
          <textarea
            value={active?.markdown ?? ""}
            onChange={(e) => applyMarkdown(e.target.value)}
            spellCheck={false}
            placeholder={t("admin.mdPdf.placeholder")}
            className="min-h-[520px] w-full resize-y rounded-xl border border-border bg-background/50 p-4 font-mono text-xs leading-relaxed sm:text-sm"
          />
          <p className="text-[10px] text-muted-foreground">
            {active ? t("admin.mdPdf.chars", { n: active.markdown.length }) : t("admin.mdPdf.emptyEditor")}
          </p>
        </section>

        <section className="space-y-3">
          <p className="font-display text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
            {t("admin.mdPdf.preview")}
          </p>
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-[#0b0d12] p-4 sm:p-6">
            {active ? (
              <div className="mx-auto overflow-auto" style={{ maxHeight: 760, maxWidth: 437 }}>
                <div style={{ width: 437, height: 4400 }}>
                  <iframe
                    title={t("admin.mdPdf.preview")}
                    srcDoc={previewHtml}
                    className="origin-top-left border-0 bg-transparent"
                    style={{ width: 794, height: 8000, transform: "scale(0.55)" }}
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            ) : (
              <div className="grid min-h-[420px] place-items-center text-sm text-muted-foreground">
                {t("admin.mdPdf.previewEmpty")}
              </div>
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{t("admin.mdPdf.printHelp")}</p>
        </section>
      </div>
    </div>
  );
}
