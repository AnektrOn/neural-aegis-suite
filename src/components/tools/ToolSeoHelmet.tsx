import { Helmet } from "react-helmet-async";
import { toolsCanonicalPath } from "@/lib/toolsSite";
import type { ToolFaqItem, ToolSeoMeta } from "./types";

interface ToolSeoHelmetProps {
  path: string;
  seo: ToolSeoMeta;
  webAppName: string;
  faq: ToolFaqItem[];
}

export function ToolSeoHelmet({ path, seo, webAppName, faq }: ToolSeoHelmetProps) {
  const canonical = toolsCanonicalPath(path);

  const webAppLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: webAppName,
    applicationCategory: "BusinessApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    url: canonical,
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <script type="application/ld+json">{JSON.stringify(webAppLd)}</script>
      <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
    </Helmet>
  );
}