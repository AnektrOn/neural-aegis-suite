import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { NewsletterMarkdownBody } from "@/components/newsletter/NewsletterMarkdownBody";

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
    <article className={cn("newsletter-article", className)}>
      <header className="newsletter-article-hero relative">
        <div
          className="pointer-events-none absolute -inset-x-4 -top-8 bottom-0 sm:-inset-x-8"
          aria-hidden
        >
          <div
            className="absolute inset-0 rounded-[28px] opacity-90"
            style={{
              background:
                "radial-gradient(ellipse 90% 70% at 50% -10%, hsl(var(--aegis-warm) / 0.14), transparent 58%), radial-gradient(ellipse 50% 40% at 100% 20%, hsl(var(--primary) / 0.06), transparent 50%), linear-gradient(180deg, hsl(var(--card) / 0.55) 0%, transparent 100%)",
            }}
          />
          <div className="absolute inset-0 rounded-[28px] border border-border-subtle/50 bg-bg-elevated/30 backdrop-blur-sm" />
        </div>

        <div className="relative px-6 py-12 sm:px-10 sm:py-14 lg:px-12 lg:py-16">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="inline-flex items-center rounded-full border border-[hsl(var(--aegis-warm)/0.35)] bg-[hsl(var(--aegis-warm-muted)/0.4)] px-3 py-1 font-display text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--aegis-warm))]">
              {t("newsletter.badge")}
            </span>
          </div>

          <h1 className="font-display text-[1.75rem] sm:text-[2.25rem] lg:text-[2.65rem] font-medium leading-[1.12] tracking-tight text-foreground text-balance max-w-[20ch] sm:max-w-none">
            {title}
          </h1>

          {excerpt && (
            <p className="mt-8 max-w-2xl text-lg sm:text-xl leading-relaxed text-muted-foreground font-light border-l-[3px] border-[hsl(var(--aegis-warm)/0.5)] pl-5 sm:pl-6">
              {excerpt}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {dateLabel && (
              <span className="inline-flex items-center gap-2 rounded-full border border-border-subtle/80 bg-bg-base/60 px-3 py-1.5 text-[11px] font-display uppercase tracking-wider text-text-tertiary">
                <Calendar size={13} className="text-[hsl(var(--aegis-warm)/0.8)]" aria-hidden />
                <time dateTime={publishedAt ?? undefined}>{dateLabel}</time>
              </span>
            )}
            <span className="inline-flex items-center gap-2 rounded-full border border-border-subtle/80 bg-bg-base/60 px-3 py-1.5 text-[11px] font-display uppercase tracking-wider text-text-tertiary">
              <Clock size={13} className="text-[hsl(var(--aegis-warm)/0.8)]" aria-hidden />
              {t("newsletter.readingTime", { min: String(readingMin) })}
            </span>
          </div>
        </div>
      </header>

      <div className="newsletter-article-body relative mt-4 sm:mt-6">
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-px hidden lg:block"
          aria-hidden
          style={{
            background:
              "linear-gradient(180deg, transparent, hsl(var(--border) / 0.5) 15%, hsl(var(--border) / 0.5) 85%, transparent)",
          }}
        />
        <NewsletterMarkdownBody markdown={markdown} className="lg:pl-8" />
      </div>
    </article>
  );
}
