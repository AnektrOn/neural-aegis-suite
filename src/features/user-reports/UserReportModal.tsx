import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import type { UserReport } from "./types";
import { parseFrontmatter, filterMarkdownByLocale } from "./parseReportMd";

interface Props {
  report: UserReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserReportModal({ report, open, onOpenChange }: Props) {
  const { locale, t } = useLanguage();
  const isFR = locale === "fr";

  const { body, fm } = useMemo(() => {
    if (!report) return { body: "", fm: {} as Record<string, unknown> };
    const parsed = parseFrontmatter(report.content_md);
    return {
      body: filterMarkdownByLocale(parsed.body, locale),
      fm: parsed.frontmatter as Record<string, unknown>,
    };
  }, [report, locale]);

  const dateLabel = report
    ? new Date(report.updated_at).toLocaleDateString(isFR ? "fr-FR" : "en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  const eyebrow =
    (typeof fm.tier === "string" && fm.tier) ||
    (typeof fm.orientation === "string" && fm.orientation) ||
    (isFR ? "Rapport personnel" : "Personal report");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-3xl p-0 gap-0 border-white/10 bg-transparent shadow-none",
          "max-h-[90vh] overflow-hidden flex flex-col",
        )}
      >
        {/* Ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-lg opacity-70"
          style={{
            background:
              "radial-gradient(120% 60% at 50% -10%, hsl(var(--primary) / 0.18), transparent 60%), radial-gradient(90% 60% at 50% 110%, hsl(var(--accent) / 0.10), transparent 60%)",
          }}
        />

        <div className="relative flex flex-col max-h-[90vh] rounded-lg border border-white/10 bg-[hsl(var(--background))]/85 backdrop-blur-3xl">
          {/* Hero */}
          <header className="relative px-8 pt-10 pb-6 text-center border-b border-white/5">
            <p className="font-display text-[10px] uppercase tracking-[0.42em] text-primary/80">
              {eyebrow}
            </p>

            {report?.glyph ? (
              <div
                aria-hidden
                className="mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-2xl shadow-[0_0_40px_-10px_hsl(var(--primary)/0.5)]"
              >
                {report.glyph}
              </div>
            ) : null}

            <h2 className="mt-4 font-cormorant-display text-3xl sm:text-4xl leading-[1.1] tracking-tight text-foreground">
              {report?.title}
            </h2>

            <div className="mt-3 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              <span aria-hidden className="h-px w-8 bg-gradient-to-r from-transparent to-white/20" />
              <span>{dateLabel}</span>
              <span aria-hidden className="h-px w-8 bg-gradient-to-l from-transparent to-white/20" />
            </div>

            {report && report.tags && report.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {report.tags.slice(0, 6).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </header>

          {/* Body */}
          <div className="overflow-y-auto px-6 sm:px-10 py-8">
            <article
              className={cn(
                "mx-auto max-w-2xl font-body text-[15px] leading-[1.75] text-foreground/90",
                // Headings
                "[&_h1]:font-cormorant-display [&_h1]:text-3xl [&_h1]:font-normal [&_h1]:tracking-tight [&_h1]:text-foreground [&_h1]:mt-10 [&_h1]:mb-4",
                "[&_h2]:font-cormorant-display [&_h2]:text-2xl [&_h2]:font-normal [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-white/5",
                "[&_h3]:font-display [&_h3]:text-[11px] [&_h3]:font-medium [&_h3]:uppercase [&_h3]:tracking-[0.28em] [&_h3]:text-primary/80 [&_h3]:mt-8 [&_h3]:mb-2",
                "[&_h4]:font-display [&_h4]:text-sm [&_h4]:font-medium [&_h4]:text-foreground [&_h4]:mt-6 [&_h4]:mb-2",
                // Body
                "[&_p]:mb-4 [&_p]:text-foreground/85",
                "[&_strong]:text-foreground [&_strong]:font-medium",
                "[&_em]:text-foreground/95",
                "[&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline",
                // Lists
                "[&_ul]:my-4 [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:list-disc [&_ul]:marker:text-primary/50",
                "[&_ol]:my-4 [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol]:list-decimal [&_ol]:marker:text-primary/50",
                "[&_li]:pl-1",
                // Quotes
                "[&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-foreground/75",
                // Code
                "[&_code]:rounded [&_code]:bg-white/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:text-primary/90",
                "[&_pre]:my-4 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-white/10 [&_pre]:bg-black/30 [&_pre]:p-4 [&_pre]:overflow-x-auto",
                // Tables
                "[&_table]:my-5 [&_table]:w-full [&_table]:text-sm [&_table]:border-collapse",
                "[&_th]:border-b [&_th]:border-white/10 [&_th]:pb-2 [&_th]:pr-4 [&_th]:text-left [&_th]:font-display [&_th]:uppercase [&_th]:tracking-[0.12em] [&_th]:text-[11px] [&_th]:text-muted-foreground",
                "[&_td]:border-b [&_td]:border-white/5 [&_td]:py-2 [&_td]:pr-4",
                // Rule
                "[&_hr]:my-8 [&_hr]:border-0 [&_hr]:h-px [&_hr]:bg-gradient-to-r [&_hr]:from-transparent [&_hr]:via-white/15 [&_hr]:to-transparent",
              )}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            </article>

            {/* Footer flourish */}
            <div className="mx-auto mt-10 flex max-w-2xl items-center justify-center gap-3 text-[10px] uppercase tracking-[0.42em] text-muted-foreground/70">
              <span aria-hidden className="h-px w-12 bg-gradient-to-r from-transparent to-white/15" />
              <span>{t("welcome.hud.eyebrow") || "Neural Aegis"}</span>
              <span aria-hidden className="h-px w-12 bg-gradient-to-l from-transparent to-white/15" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
