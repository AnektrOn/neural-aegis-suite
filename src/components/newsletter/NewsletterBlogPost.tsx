import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

function estimateReadingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export interface NewsletterBlogPostProps {
  title: string;
  excerpt?: string;
  markdown: string;
  publishedAt: string | null;
  className?: string;
}

/**
 * Rendu article « blog » — design de base à affiner quand le MD final est fourni.
 */
export function NewsletterBlogPost({
  title,
  excerpt,
  markdown,
  publishedAt,
  className,
}: NewsletterBlogPostProps) {
  const { t, locale } = useLanguage();
  const readingMin = estimateReadingMinutes(markdown);
  const dateLabel = publishedAt
    ? new Date(publishedAt).toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <article className={cn("newsletter-blog", className)}>
      <header className="newsletter-blog-hero relative overflow-hidden rounded-[20px] border border-border-subtle/80 bg-gradient-to-br from-bg-elevated via-bg-surface to-bg-base px-6 py-10 sm:px-10 sm:py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 0%, hsl(var(--aegis-warm) / 0.12), transparent 55%), radial-gradient(ellipse 60% 50% at 100% 100%, hsl(var(--primary) / 0.08), transparent 50%)",
          }}
        />
        <div className="relative space-y-4">
          <p className="font-display text-[10px] tracking-[0.22em] uppercase text-accent-primary">
            {t("newsletter.badge")}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.15] tracking-tight text-foreground max-w-3xl">
            {title}
          </h1>
          {excerpt && (
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl border-l-2 border-accent-primary/40 pl-4">
              {excerpt}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-wider font-display text-text-tertiary pt-2">
            {dateLabel && <span>{dateLabel}</span>}
            <span aria-hidden>·</span>
            <span>{t("newsletter.readingTime", { min: String(readingMin) })}</span>
          </div>
        </div>
      </header>

      <div className="newsletter-blog-body mt-10 sm:mt-12 px-1 sm:px-2">
        <div
          className={cn(
            "prose prose-base sm:prose-lg dark:prose-invert max-w-none",
            "prose-headings:font-display prose-headings:font-medium prose-headings:tracking-tight prose-headings:text-foreground",
            "prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-2xl",
            "prose-h3:mt-8 prose-h3:text-xl",
            "prose-p:text-text-secondary prose-p:leading-[1.75]",
            "prose-strong:text-foreground prose-strong:font-medium",
            "prose-blockquote:border-l-[3px] prose-blockquote:border-[hsl(var(--aegis-warm)/0.55)]",
            "prose-blockquote:bg-bg-surface/60 prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-blockquote:pl-5",
            "prose-blockquote:not-italic prose-blockquote:text-text-secondary",
            "prose-li:text-text-secondary prose-li:marker:text-accent-primary",
            "prose-a:text-[hsl(var(--aegis-warm))] prose-a:no-underline hover:prose-a:underline",
            "prose-hr:border-border-subtle prose-hr:my-12",
            "prose-img:rounded-xl prose-img:border prose-img:border-border-subtle",
          )}
        >
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
      </div>
    </article>
  );
}
