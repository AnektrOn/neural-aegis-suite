import { Helmet } from "react-helmet-async";
import type { SeoFaqItem } from "./seoPages";
import { SEO_OG_IMAGE } from "./site";
import { faqPageJsonLd, organizationJsonLd, webPageJsonLd, webSiteJsonLd } from "./schemas";
import { useSyncPrerenderMetaDescription } from "./syncPrerenderDescription";

export type SeoHelmetProps = {
  title: string;
  description: string;
  canonical: string;
  ogTitle?: string;
  ogLocale?: string;
  ogImage?: string;
  noindex?: boolean;
  robots?: "noindex, follow" | "noindex, nofollow";
  /** Home gets Organization + WebSite; other pages WebPage + optional FAQ */
  variant?: "home" | "page";
  pageName?: string;
  faq?: SeoFaqItem[];
};

export function SeoHelmet({
  title,
  description,
  canonical,
  ogTitle,
  ogLocale = "fr_FR",
  ogImage = SEO_OG_IMAGE,
  noindex,
  robots = "noindex, nofollow",
  variant = "page",
  pageName,
  faq,
}: SeoHelmetProps) {
  const hasPrerenderDescription = useSyncPrerenderMetaDescription(description);
  const ogT = ogTitle ?? title;
  const jsonLd: object[] =
    variant === "home"
      ? [organizationJsonLd(), webSiteJsonLd(), webPageJsonLd({ name: title, description, url: canonical })]
      : [webPageJsonLd({ name: pageName ?? title, description, url: canonical })];
  if (faq?.length) {
    jsonLd.push(faqPageJsonLd(faq));
  }

  return (
    <Helmet>
      <title>{title}</title>
      {hasPrerenderDescription ? null : <meta name="description" content={description} />}
      {noindex ? <meta name="robots" content={robots} /> : null}
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:locale:alternate" content="en_US" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={ogT} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogT} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {jsonLd.map((ld, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}
    </Helmet>
  );
}