import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <motion.div {...motionProps} className="mb-8">
        <Link
          to={newsletterHubPath()}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors duration-200 font-display min-h-[44px]"
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
    </div>
  );
}
