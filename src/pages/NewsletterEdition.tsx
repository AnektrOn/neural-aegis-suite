import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";
import { NeuralCard } from "@/components/ui/neural-card";
import { useLanguage } from "@/i18n/LanguageContext";
import { NewsletterBlogPost } from "@/components/newsletter/NewsletterBlogPost";
import { Button } from "@/components/ui/button";
import {
  getNewsletterEditionBySlug,
  type NewsletterEdition,
} from "@/services/newsletterService";
import { newsletterHubPath } from "@/lib/appUrl";

export default function NewsletterEditionPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { t, locale } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const [edition, setEdition] = useState<NewsletterEdition | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotFound(false);
    (async () => {
      const row = await getNewsletterEditionBySlug(slug);
      if (!alive) return;
      if (!row) setNotFound(true);
      else setEdition(row);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  const title = edition
    ? locale === "en"
      ? edition.titleEn
      : edition.titleFr
    : "";
  const excerpt = edition
    ? locale === "en"
      ? edition.excerptEn
      : edition.excerptFr
    : "";
  const body = edition ? (locale === "en" ? edition.bodyEn : edition.bodyFr) : "";

  const motionProps = prefersReducedMotion
    ? { initial: false, animate: { opacity: 1, y: 0 } }
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !edition) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-muted-foreground">{t("newsletter.editionNotFound")}</p>
        <Button asChild variant="outline" className="min-h-[44px]">
          <Link to={newsletterHubPath()}>{t("newsletter.backToHub")}</Link>
        </Button>
      </div>
    );
  }

  const canonicalUrl = `https://aegis.humancatalystbeacon.com/newsletter/${encodeURIComponent(slug)}`;
  const metaDescription = (excerpt || title).slice(0, 160);
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: metaDescription,
    datePublished: edition.publishedAt,
    author: { "@type": "Organization", name: "Aegis" },
    mainEntityOfPage: canonicalUrl,
  };

  return (
    <div className="newsletter-edition-page relative min-h-[60vh]">
      <Helmet>
        <title>{`${title} — Aegis Newsletter`}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={metaDescription} />
        <script type="application/ld+json">{JSON.stringify(articleLd)}</script>
      </Helmet>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(520px,55vh)] opacity-80"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% -20%, hsl(var(--aegis-warm) / 0.08), transparent 70%)",
        }}
      />

      <div className="relative max-w-3xl lg:max-w-[44rem] mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <motion.div {...motionProps} className="mb-8 sm:mb-10">
          <Link
            to={newsletterHubPath()}
            className="inline-flex items-center gap-2 rounded-full border border-border-subtle/70 bg-bg-surface/40 px-4 py-2 text-[11px] uppercase tracking-wider text-text-secondary hover:text-text-primary hover:border-[hsl(var(--aegis-warm)/0.35)] transition-all duration-200 font-display min-h-[44px]"
          >
            <ArrowLeft size={16} aria-hidden />
            {t("newsletter.backToHub")}
          </Link>
        </motion.div>

        <motion.div {...motionProps} transition={{ delay: prefersReducedMotion ? 0 : 0.06 }}>
          <NewsletterBlogPost
            title={title}
            excerpt={excerpt}
            markdown={body || t("newsletter.editionEmpty")}
            publishedAt={edition.publishedAt}
          />
        </motion.div>

        <motion.footer
          {...motionProps}
          transition={{ delay: prefersReducedMotion ? 0 : 0.12 }}
          className="mt-16 sm:mt-20"
        >
          <NeuralCard variant="elevated" glow="warm" className="p-6 sm:p-8 text-center space-y-4">
            <div
              className="mx-auto w-12 h-12 rounded-2xl bg-[hsl(var(--aegis-warm-muted)/0.5)] border border-[hsl(var(--aegis-warm)/0.25)] flex items-center justify-center"
              aria-hidden
            >
              <Mail size={22} className="text-[hsl(var(--aegis-warm))]" strokeWidth={1.5} />
            </div>
            <p className="font-display text-sm uppercase tracking-[0.12em] text-foreground">
              {t("newsletter.editionCtaTitle")}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              {t("newsletter.editionCtaDesc")}
            </p>
            <Button asChild className="min-h-[44px]">
              <Link to={`${newsletterHubPath()}#subscribe`}>{t("newsletter.editionCtaButton")}</Link>
            </Button>
          </NeuralCard>
        </motion.footer>
      </div>
    </div>
  );
}
