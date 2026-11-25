import { SEO_SITE_URL, SEO_OG_IMAGE } from "./site";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AEGIS",
    url: SEO_SITE_URL,
    logo: `${SEO_SITE_URL}/favicon.png`,
    description:
      "Suite cognitive et décisionnelle pour dirigeants, fondateurs et équipes : diagnostic gratuit, outils pratiques et lecture de profil.",
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AEGIS",
    url: SEO_SITE_URL,
    inLanguage: ["fr", "en"],
    publisher: { "@type": "Organization", name: "AEGIS", url: SEO_SITE_URL },
  };
}

export function webPageJsonLd(params: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: params.name,
    description: params.description,
    url: params.url,
    inLanguage: "fr",
    isPartOf: { "@type": "WebSite", url: SEO_SITE_URL, name: "AEGIS" },
    primaryImageOfPage: SEO_OG_IMAGE,
  };
}

export function faqPageJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}