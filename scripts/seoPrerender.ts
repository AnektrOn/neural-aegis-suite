import fs from "node:fs";
import path from "node:path";
import { createServer, type Plugin } from "vite";
import {
  buildNoindexPageRecords,
  buildToolsHubPageRecord,
  getStaticIndexablePages,
  type SeoPageRecord,
} from "../src/seo/seoPages";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function renderSeoHtml(template: string, page: SeoPageRecord): string {
  const robotsDirective =
    page.noindex || page.indexable === false
      ? page.robots ?? "noindex, nofollow"
      : null;
  const robots = robotsDirective ? `\n    <meta name="robots" content="${robotsDirective}" />` : "";
  let out = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(page.description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${esc(page.canonical)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${esc(page.canonical)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(page.ogTitle)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(page.description)}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(page.ogTitle)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(page.description)}$2`);

  if (robots) {
    out = out.replace("</head>", `${robots}\n  </head>`);
  } else {
    out = out.replace(/\s*<meta name="robots" content="noindex[^"]*" \/>\s*/g, "\n");
  }

  // Remove legacy SoftwareApplication block from template when prerendering
  out = out.replace(
    /<script type="application\/ld\+json">\s*\{[^]*?"@type":"SoftwareApplication"[^]*?\}\s*<\/script>\s*/g,
    "",
  );

  return out.replace(
    /<div id="root"><\/div>/,
    `<div id="root">${page.prerenderBody}</div>`,
  );
}

async function loadDynamicIndexablePages(root: string): Promise<SeoPageRecord[]> {
  const server = await createServer({
    root,
    configFile: false,
    logLevel: "error",
    appType: "custom",
    server: { middlewareMode: true, hmr: false },
    resolve: { alias: [{ find: "@", replacement: path.resolve(root, "src") }] },
    esbuild: { jsx: "automatic" },
  });
  try {
    const tools = await server.ssrLoadModule("/src/components/tools/toolsRegistry.ts");
    const blog = await server.ssrLoadModule("/src/pages/blog/blogRegistry.ts");
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { createElement } = await import("react");
    const { StaticRouter } = await import("react-router-dom/server.js");
    const pages: SeoPageRecord[] = [];
    const all = tools.getAllTools() as {
      path: string;
      title: string;
      shortDescription: string;
      hubBlurb: string;
      guide: { plainExplain: string; bestFor: string; outcomes: string[] };
      faq: { question: string; answer: string }[];
      seo: { title: string; description: string };
    }[];

    const toolListHtml = all
      .map(
        (t) =>
          `<li><a href="${t.path}">${esc(t.title)}</a> — ${esc(t.shortDescription)}</li>`,
      )
      .join("");
    pages.push(buildToolsHubPageRecord(toolListHtml));

    for (const t of all) {
      pages.push({
        route: t.path,
        indexable: true,
        title: t.seo.title,
        description: t.seo.description,
        ogTitle: t.seo.title,
        h1: t.title,
        canonical: `https://aegis.humancatalystbeacon.com${t.path}`,
        ogLocale: "fr_FR",
        ogImage: "https://aegis.humancatalystbeacon.com/aegis-landing/hero-scene-1440.jpg",
        faq: t.faq.map((f) => ({ question: f.question, answer: f.answer })),
        prerenderBody: `<main>
<h1>${esc(t.title)}</h1>
<p>${esc(t.shortDescription)}</p>
<p>${esc(t.guide.plainExplain)}</p>
<p>Pour qui : ${esc(t.guide.bestFor)}</p>
<ul>${t.guide.outcomes.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
<section><h2>Questions fréquentes</h2>
${t.faq.map((f) => `<h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p>`).join("")}
</section>
<p><a href="${t.path}/run">Lancer l'outil</a> · <a href="/tools">Tous les outils</a> · <a href="/quiz">Diagnostic AEGIS</a></p>
</main>`,
      });
    }

    const articles = blog.listBlogArticles() as {
      path: string;
      title: { fr: string };
      excerpt: { fr: string };
      seo: { fr: { title: string; description: string } };
      publishedAt?: string;
      renderBody: (locale: "fr") => unknown;
    }[];

    if (articles.length) {
      pages.push({
        route: "/blog",
        indexable: true,
        title: "Blog AEGIS — Décision et leadership",
        description:
          "Articles AEGIS sur la décision en solitaire, les archétypes et le leadership des dirigeants.",
        ogTitle: "Blog AEGIS — Décision et leadership",
        h1: "Blog AEGIS",
        canonical: "https://aegis.humancatalystbeacon.com/blog",
        ogLocale: "fr_FR",
        ogImage: "https://aegis.humancatalystbeacon.com/aegis-landing/hero-scene-1440.jpg",
        prerenderBody: `<main><h1>Blog AEGIS</h1><ul>${articles
          .map((a) => `<li><a href="${a.path}">${esc(a.title.fr)}</a> — ${esc(a.excerpt.fr)}</li>`)
          .join("")}</ul></main>`,
      });
      for (const a of articles) {
        pages.push({
          route: a.path,
          indexable: true,
          title: a.seo.fr.title,
          description: a.seo.fr.description,
          ogTitle: a.seo.fr.title,
          h1: a.title.fr,
          canonical: `https://aegis.humancatalystbeacon.com${a.path}`,
          ogLocale: "fr_FR",
          ogImage: "https://aegis.humancatalystbeacon.com/aegis-landing/hero-scene-1440.jpg",
          lastmod: a.publishedAt?.slice(0, 10),
          prerenderBody: `<article><h1>${esc(a.title.fr)}</h1><p>${esc(a.excerpt.fr)}</p>${renderToStaticMarkup(
            createElement(StaticRouter, { location: a.path }, a.renderBody("fr")),
          )}</article>`,
        });
      }
    }

    const runRoutes = all.map((t) => `${t.path}/run`);
    return [...pages, ...buildNoindexPageRecords(runRoutes)];
  } finally {
    await server.close();
  }
}

export function buildSitemap(pages: SeoPageRecord[]): string {
  const indexable = pages.filter((p) => p.indexable);
  const urls = indexable
    .map(
      (p) =>
        `  <url><loc>${p.canonical}</loc>${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ""}</url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** Build-time static prerender aligned with src/seo/seoPages.ts */
export function seoPrerender(): Plugin {
  let outDir = "dist";
  let root = process.cwd();
  return {
    name: "aegis-seo-prerender",
    apply: "build",
    configResolved(c) {
      root = c.root;
      outDir = path.resolve(c.root, c.build.outDir);
    },
    async closeBundle() {
      const file = path.join(outDir, "index.html");
      if (!fs.existsSync(file)) return;
      const template = fs.readFileSync(file, "utf8");

      const indexableStatic = getStaticIndexablePages();
      const dynamic = await loadDynamicIndexablePages(root);
      const noindexFromDynamic = dynamic.filter((p) => !p.indexable);
      const indexableDynamic = dynamic.filter((p) => p.indexable);
      const allPages: SeoPageRecord[] = [...indexableStatic, ...indexableDynamic, ...noindexFromDynamic];

      fs.writeFileSync(path.join(outDir, "sitemap.xml"), buildSitemap(allPages));

      for (const page of allPages) {
        const target =
          page.route === "/" ? file : path.join(outDir, page.route.slice(1), "index.html");
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, renderSeoHtml(template, page));
      }
    },
  };
}