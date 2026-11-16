import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import type { BlogArticleMeta } from "../types";
import type { BlogLocale } from "../types";
import { toolsBento, toolsBentoHover, toolsKicker } from "@/components/tools/toolsDesign";

type Props = {
  article: BlogArticleMeta;
  locale: BlogLocale;
};

export function BlogPostCard({ article, locale }: Props) {
  const dateLabel = new Date(article.publishedAt).toLocaleDateString(
    locale === "en" ? "en-US" : "fr-FR",
    { year: "numeric", month: "short", day: "numeric" },
  );
  const readLabel =
    locale === "fr"
      ? `${article.readingMinutes} min`
      : `${article.readingMinutes} min read`;

  return (
    <article className={`flex h-full flex-col ${toolsBento} ${toolsBentoHover}`}>
      <p className={toolsKicker}>{article.category[locale]}</p>
      <h2 className="mt-2 text-lg font-semibold leading-snug text-foreground">
        <Link to={article.path} className="hover:text-primary">
          {article.title[locale]}
        </Link>
      </h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {article.excerpt[locale]}
      </p>
      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/30 pt-4">
        <div className="flex flex-wrap gap-3 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          <span className="inline-flex min-h-8 items-center gap-1">
            <Calendar className="h-3 w-3 text-primary" aria-hidden />
            <time dateTime={article.publishedAt}>{dateLabel}</time>
          </span>
          <span className="inline-flex min-h-8 items-center gap-1">
            <Clock className="h-3 w-3 text-primary" aria-hidden />
            {readLabel}
          </span>
        </div>
        <Link
          to={article.path}
          className="inline-flex min-h-11 items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-primary hover:underline"
        >
          {locale === "fr" ? "Lire" : "Read"}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </footer>
    </article>
  );
}