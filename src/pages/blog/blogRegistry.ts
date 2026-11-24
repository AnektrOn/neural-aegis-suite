import type { BlogArticleMeta } from "./types";
import { renderCoachIaDirigeantsBody } from "./articles/coachIaDirigeants";
import { renderConflitEntreAssociesBody } from "./articles/conflitEntreAssocies";

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
  {
    id: "conflit-associes-startup-non-dits",
    path: "/blog/conflit-associes-startup-non-dits",
    publishedAt: "2026-11-24T09:00:00.000Z",
    readingMinutes: 9,
    category: {
      fr: "Gouvernance & fondateurs",
      en: "Governance & founders",
    },
    kicker: {
      fr: "Pacte d'associés · Arbitrage",
      en: "Co-founder conflict · Arbitration",
    },
    title: {
      fr: "Conflit entre associés : pourquoi 65 % des startups meurent de leurs non-dits (et comment arbitrer avant les avocats)",
      en: "Co-founder conflict: why 65% of startups die from unspoken fractures (and how to arbitrate before lawyers)",
    },
    excerpt: {
      fr: "Dimanche 23 h, le brouillon incendiaire. Les non-dits qui nourrissent l'implosion fondatrice — et la méthode du miroir systémique avant que les honoraires ne brûlent la valeur.",
      en: "Sunday night, the angry draft. Unspoken fractures that kill founder teams — and systemic mirror arbitration before legal fees burn enterprise value.",
    },
    seo: {
      fr: {
        title: "Conflit entre associés : 65 % des startups et les non-dits",
        description:
          "Harvard / Wasserman : la fracture fondatrice tue avant le cash. Victime, marchandage, sabotage — cartographie, faits bruts et arbitrage formel avant l'avocat.",
      },
      en: {
        title: "Co-founder conflict: 65% of startups and unspoken fractures",
        description:
          "Founder-team implosion often precedes cash death. Map relations, force formal arbitration, audit your decision reflexes with AEGIS before lawyers.",
      },
    },
    renderBody: renderConflitEntreAssociesBody,
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