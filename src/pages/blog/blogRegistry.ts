import type { BlogArticleMeta } from "./types";
import { renderCoachIaDirigeantsBody } from "./articles/coachIaDirigeants";

const articles: BlogArticleMeta[] = [
  {
    id: "coach-ia-dirigeants-sparring-vocal",
    path: "/blog/coach-ia-dirigeants-sparring-vocal",
    publishedAt: "2026-11-20T10:00:00.000Z",
    readingMinutes: 11,
    category: {
      fr: "Décision & leadership",
      en: "Decision & leadership",
    },
    kicker: {
      fr: "Coach IA · Arbitrage",
      en: "AI coaching · Arbitration",
    },
    title: {
      fr: "Coach IA pour dirigeants : pourquoi votre prochain sparring partner ne devrait être ni un humain à 500 €/h, ni un chatbot complaisant",
      en: "AI coach for executives: why your next sparring partner should be neither a €500/h human nor a flattering chatbot",
    },
    excerpt: {
      fr: "Coaching exécutif trop tardif, chatbots trop mielleux : l’alternative est un sparring vocal souverain (LOGOS + AEGIS) — confrontation, voix et données sanctuarisées.",
      en: "Late executive coaching and sugary chatbots leave a gap: sovereign voice sparring (LOGOS + AEGIS) — confrontation, speech, and sealed data.",
    },
    seo: {
      fr: {
        title:
          "Coach IA pour dirigeants : sparring vocal vs coaching à 500 €/h",
        description:
          "Pourquoi le coaching exécutif classique et les chatbots IA échouent face aux crises de gouvernance — et comment un coach IA vocal souverain (LOGOS + AEGIS) change l’arbitrage.",
      },
      en: {
        title: "AI coach for executives: sovereign voice sparring vs €500/h coaching",
        description:
          "Why traditional executive coaching and generic AI chatbots fail on governance crises — and how sovereign voice sparring (LOGOS + AEGIS) reframes arbitration.",
      },
    },
    renderBody: renderCoachIaDirigeantsBody,
  },
];

const byPath = new Map(articles.map((a) => [a.path, a]));
const byId = new Map(articles.map((a) => [a.id, a]));

export function getBlogArticleByPath(pathname: string): BlogArticleMeta | undefined {
  return byPath.get(pathname);
}

export function getBlogArticleBySlug(slug: string): BlogArticleMeta | undefined {
  return byId.get(slug);
}

export function listBlogArticles(): BlogArticleMeta[] {
  return [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function isPublicBlogPath(pathname: string): boolean {
  return pathname === "/blog" || pathname.startsWith("/blog/");
}