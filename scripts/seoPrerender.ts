import fs from "node:fs";
import path from "node:path";
import { createServer, type Plugin } from "vite";

const SITE = "https://aegis.humancatalystbeacon.com";

type Page = { route: string; title: string; description: string; body: string };

export const PRERENDER_PAGES: Page[] = [
  {
    route: "/",
    title: "AEGIS — 30 questions sur la personne qui décide",
    description:
      "Un questionnaire gratuit sur la façon dont vous décidez quand vous décidez seul. Puis, si vous le souhaitez, une Lecture de votre profil par un humain.",
    body: `<header><h1>AEGIS — Vous décidez seul. Personne ne relit vos décisions.</h1>
<p>AEGIS est une suite de coaching pour dirigeants : un questionnaire gratuit de 30 questions sur la façon dont vous décidez, une cartographie de vos archétypes, puis un suivi quotidien de l'humeur, des décisions, des habitudes et des relations.</p></header>
<section><h2>Comment ça marche</h2><ol><li>Répondez aux 30 questions du questionnaire d'archétypes.</li><li>Recevez votre profil et votre portrait de décideur.</li><li>Poursuivez avec le Deep Dive, la boîte à outils et le journal de décisions.</li></ol></section>
<section><h2>Les offres AEGIS Solo</h2><ul><li>AEGIS Solo — 35 € HT / mois</li><li>Solo + LOGOS (guide vocal) — 110 € HT / mois</li><li>Fondateurs — 350 € HT, accès à vie, 20 places</li></ul><p><a href="/pricing">Voir les offres</a> · <a href="/newsletter">Newsletter</a></p></section>`,
  },
  {
    route: "/pricing",
    title: "Forfaits AEGIS — Tarifs Solo, LOGOS et Fondateurs",
    description:
      "Tarifs AEGIS : Solo à 35 € HT/mois, Solo + LOGOS à 110 € HT/mois, offre Fondateurs à 350 € HT à vie (20 places). Paiement sécurisé par Stripe.",
    body: `<header><h1>Forfaits AEGIS</h1><p>Choisissez votre accès à la suite de coaching AEGIS. Prix HT, TVA calculée au paiement selon votre pays.</p></header>
<section><h2>AEGIS Solo — 35 € HT / mois</h2><p>Questionnaire d'archétypes, Deep Dive, suivi de l'humeur, journal de décisions, habitudes et boîte à outils.</p></section>
<section><h2>Solo + LOGOS — 110 € HT / mois</h2><p>Tout AEGIS Solo, plus LOGOS, le guide vocal personnel.</p></section>
<section><h2>Fondateurs — 350 € HT, accès à vie</h2><p>Accès à vie à AEGIS Solo, limité à 20 places.</p></section>
<p>Offres entreprise : sur devis. <a href="/">Accueil</a> · <a href="/newsletter">Newsletter</a></p>`,
  },
  {
    route: "/newsletter",
    title: "Newsletter AEGIS — Archétypes, forme mentale et leadership",
    description:
      "Éditions hebdomadaires sur les archétypes personnels, la forme mentale, la prise de décision et le leadership, par la plateforme de coaching AEGIS.",
    body: `<header><h1>La newsletter AEGIS</h1><p>Chaque semaine : archétypes personnels, forme mentale, prise de décision et leadership pour dirigeants.</p></header>
<section><h2>Ce que vous recevez</h2><ul><li>Une édition hebdomadaire courte et actionnable.</li><li>Des lectures sur les archétypes et la décision en solitaire.</li><li>Des exercices tirés de la boîte à outils AEGIS.</li></ul><p><a href="/">Accueil</a> · <a href="/pricing">Tarifs</a></p></section>`,
  },
];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function renderPage(template: string, page: Page): string {
  const url = `${SITE}${page.route}`;
  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(page.description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(page.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(page.description)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(page.description)}$2`)
    .replace(/<div id="root"><\/div>/, `<div id="root"><main data-prerendered="true">${page.body}</main></div>`);
}

type DynPage = Page & { lastmod?: string };

/** Loads tool and blog registries through Vite (TSX + aliases) so new entries are prerendered and listed automatically. */
async function loadDynamicPages(root: string): Promise<DynPage[]> {
  const server = await createServer({
    root, configFile: false, logLevel: "error", appType: "custom",
    server: { middlewareMode: true, hmr: false },
    resolve: { alias: [{ find: "@", replacement: path.resolve(root, "src") }] },
    esbuild: { jsx: "automatic" },
  });
  try {
    const tools = await server.ssrLoadModule("/src/components/tools/toolsRegistry.ts");
    const blog = await server.ssrLoadModule("/src/pages/blog/blogRegistry.ts");
    const { renderToStaticMarkup } = await import("react-dom/server");
    const pages: DynPage[] = [];
    const all = tools.getAllTools() as any[];
    pages.push({
      route: "/tools",
      title: "Outils gratuits pour CEO et dirigeants | AEGIS",
      description: "Calculateurs et diagnostics gratuits pour dirigeants : coût du coaching, fatigue décisionnelle, biais, priorisation, ROI des cercles de pairs.",
      body: `<h1>Outils gratuits pour CEO et dirigeants</h1><ul>${all.map((t) => `<li><a href="${t.path}">${esc(t.title)}</a> — ${esc(t.shortDescription)}</li>`).join("")}</ul>`,
    });
    for (const t of all) {
      pages.push({
        route: t.path, title: t.seo.title, description: t.seo.description,
        body: `<h1>${esc(t.title)}</h1><p>${esc(t.shortDescription)}</p><p>${esc(t.guide.plainExplain)}</p><p>Pour qui : ${esc(t.guide.bestFor)}</p><ul>${t.guide.outcomes.map((o: string) => `<li>${esc(o)}</li>`).join("")}</ul><section><h2>Questions fréquentes</h2>${t.faq.map((f: any) => `<h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p>`).join("")}</section><p><a href="${t.path}/run">Lancer l'outil</a> · <a href="/tools">Tous les outils</a></p>`,
      });
    }
    const articles = blog.listBlogArticles() as any[];
    if (articles.length) {
      pages.push({
        route: "/blog", title: "Blog AEGIS — Décision et leadership",
        description: "Articles AEGIS sur la décision en solitaire, les archétypes et le leadership des dirigeants.",
        body: `<h1>Blog AEGIS</h1><ul>${articles.map((a) => `<li><a href="${a.path}">${esc(a.title.fr)}</a> — ${esc(a.excerpt.fr)}</li>`).join("")}</ul>`,
      });
      for (const a of articles) {
        pages.push({
          route: a.path, title: a.seo.fr.title, description: a.seo.fr.description, lastmod: a.publishedAt?.slice(0, 10),
          body: `<article><h1>${esc(a.title.fr)}</h1><p>${esc(a.excerpt.fr)}</p>${renderToStaticMarkup(a.renderBody("fr"))}</article>`,
        });
      }
    }
    return pages;
  } finally {
    await server.close();
  }
}

export function buildSitemap(pages: DynPage[]): string {
  const urls = pages.map((p) => `  <url><loc>${SITE}${p.route}</loc>${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ""}</url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** Build-time static prerender: writes route HTML with real content; React's createRoot replaces it on load. */
export function seoPrerender(): Plugin {
  let outDir = "dist";
  let root = process.cwd();
  return {
    name: "aegis-seo-prerender",
    apply: "build",
    configResolved(c) { root = c.root; outDir = path.resolve(c.root, c.build.outDir); },
    async closeBundle() {
      const file = path.join(outDir, "index.html");
      if (!fs.existsSync(file)) return;
      const template = fs.readFileSync(file, "utf8");
      const pages: DynPage[] = [...PRERENDER_PAGES, ...(await loadDynamicPages(root))];
      fs.writeFileSync(path.join(outDir, "sitemap.xml"), buildSitemap(pages));
      for (const page of pages) {
        const target = page.route === "/" ? file : path.join(outDir, page.route.slice(1), "index.html");
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, renderPage(template, page));
      }
    },
  };
}
