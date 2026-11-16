import { Helmet } from "react-helmet-async";
import { BookOpen } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { AEGIS_TOOLS_SITE_URL } from "@/lib/toolsSite";
import { toolsKicker, toolsLead, toolsTitle } from "@/components/tools/toolsDesign";
import { BlogLayout } from "./components/BlogLayout";
import { BlogPostCard } from "./components/BlogPostCard";
import { listBlogArticles } from "./blogRegistry";
import type { BlogLocale } from "./types";

const hubCopy = {
  fr: {
    title: "Blog",
    lead: "Articles courts sur la décision, le design des outils et ce que nous apprenons en construisant AEGIS.",
    seoTitle: "Blog AEGIS — design, décision et outils dirigeant",
    seoDescription:
      "Notes et articles pour CEOs et fondateurs : interface, clarté, parcours produit et outils gratuits.",
  },
  en: {
    title: "Blog",
    lead: "Short reads on decision-making, tool design, and what we learn building AEGIS.",
    seoTitle: "AEGIS Blog — design, decisions, and executive tools",
    seoDescription:
      "Notes and articles for CEOs and founders: interface, clarity, product journeys, and free tools.",
  },
} as const;

function localeFromApp(locale: string): BlogLocale {
  return locale === "en" ? "en" : "fr";
}

export default function BlogHubPage() {
  const { locale: appLocale } = useLanguage();
  const locale = localeFromApp(appLocale);
  const copy = hubCopy[locale];
  const posts = listBlogArticles();
  const canonical = `${AEGIS_TOOLS_SITE_URL}/blog`;

  return (
    <BlogLayout>
      <Helmet>
        <title>{`${copy.seoTitle} | AEGIS`}</title>
        <meta name="description" content={copy.seoDescription} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={copy.seoTitle} />
        <meta property="og:description" content={copy.seoDescription} />
        <meta property="og:url" content={canonical} />
      </Helmet>

      <main className="relative mx-auto max-w-5xl px-4 py-12 pb-20 md:px-6">
        <div className="flex items-center gap-3 text-primary">
          <BookOpen className="h-7 w-7" aria-hidden />
          <p className={toolsKicker}>AEGIS</p>
        </div>
        <h1 className={`${toolsTitle} mt-4`}>{copy.title}</h1>
        <p className={`${toolsLead} mt-4 max-w-2xl`}>{copy.lead}</p>

        {posts.length === 0 ? (
          <p className="mt-12 text-sm text-muted-foreground">
            {locale === "fr"
              ? "Aucun article pour l'instant."
              : "No articles yet."}
          </p>
        ) : (
          <ul className="mt-12 grid gap-6 sm:grid-cols-2" aria-label={locale === "fr" ? "Articles" : "Articles"}>
            {posts.map((article) => (
              <li key={article.id}>
                <BlogPostCard article={article} locale={locale} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </BlogLayout>
  );
}