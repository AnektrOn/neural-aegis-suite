import { Link, Navigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Calendar, ChevronLeft, Clock } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { AEGIS_TOOLS_SITE_URL } from "@/lib/toolsSite";
import { toolsKicker, toolsLead, toolsTitle } from "@/components/tools/toolsDesign";
import { BlogLayout } from "./components/BlogLayout";
import { getBlogArticleBySlug } from "./blogRegistry";
import type { BlogLocale } from "./types";

function localeFromApp(locale: string): BlogLocale {
  return locale === "en" ? "en" : "fr";
}

export default function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { locale: appLocale } = useLanguage();
  const locale = localeFromApp(appLocale);

  const article = slug ? getBlogArticleBySlug(slug) : undefined;
  if (!article) {
    return <Navigate to="/blog" replace />;
  }

  const seo = article.seo[locale];
  const canonical = `${AEGIS_TOOLS_SITE_URL}${article.path}`;
  const dateLabel = new Date(article.publishedAt).toLocaleDateString(
    locale === "en" ? "en-US" : "fr-FR",
    { year: "numeric", month: "long", day: "numeric" },
  );

  return (
    <BlogLayout>
      <Helmet>
        <title>{`${seo.title} | AEGIS`}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta name="twitter:card" content="summary" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: article.title[locale],
            description: article.excerpt[locale],
            datePublished: article.publishedAt,
            author: { "@type": "Organization", name: "AEGIS · Protocole Nomos" },
            publisher: { "@type": "Organization", name: "AEGIS", url: AEGIS_TOOLS_SITE_URL },
            mainEntityOfPage: canonical,
            inLanguage: locale,
          })}
        </script>
      </Helmet>

      <main className="relative mx-auto max-w-3xl px-4 py-10 pb-16 md:px-6">
        <Link
          to="/blog"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {locale === "fr" ? "Tous les articles" : "All posts"}
        </Link>

        <article className="mt-8">
          <p className={toolsKicker}>{article.kicker[locale]}</p>
          <h1 className={`${toolsTitle} mt-3`}>{article.title[locale]}</h1>
          <p className={`${toolsLead} mt-4`}>{article.excerpt[locale]}</p>

          <h2 className="sr-only">{locale === "fr" ? "Métadonnées" : "Metadata"}</h2>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-border/40 bg-card/60 px-3 py-1.5 text-[11px] font-display uppercase tracking-wider text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary/80" aria-hidden />
              <time dateTime={article.publishedAt}>{dateLabel}</time>
            </span>
            <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-border/40 bg-card/60 px-3 py-1.5 text-[11px] font-display uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary/80" aria-hidden />
              {locale === "fr"
                ? `${article.readingMinutes} min de lecture`
                : `${article.readingMinutes} min read`}
            </span>
          </div>

          <div className="mt-10 border-t border-border/30 pt-10">{article.renderBody(locale)}</div>
        </article>
      </main>
    </BlogLayout>
  );
}