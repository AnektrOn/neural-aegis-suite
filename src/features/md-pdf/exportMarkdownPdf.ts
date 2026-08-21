import {
  escapeHtml,
  filterMarkdownByLang,
  markdownToPrintHtml,
  resolveMdPdfMeta,
  slugifyFilename,
  type MdPdfContentLang,
  type MdPdfMeta,
} from "./markdownToPrintHtml";
import { getMdPdfThemeCss, MD_PDF_FONT_HREF, type MdPdfThemeId } from "./printThemes";
import { assessmentRadarSvg, type MdPdfAssessment } from "./assessmentPrint";

export type { MdPdfContentLang, MdPdfAssessment };

export interface MdPdfSource {
  filename: string;
  markdown: string;
  titleOverride?: string;
  subtitleOverride?: string;
}

export interface BuildMdPdfArgs {
  sources: MdPdfSource[];
  theme: MdPdfThemeId;
  showCover: boolean;
  locale: "fr" | "en";
  contentLang?: MdPdfContentLang;
  brand?: string;
  assessment?: MdPdfAssessment | null;
}

function formatVaultDate(value: string, locale: "fr" | "en"): string {
  if (!value) return "";
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function langBadge(contentLang: MdPdfContentLang): string {
  if (contentLang === "en") return "EN";
  if (contentLang === "both") return "FR · EN";
  return "FR";
}

function radarColors(theme: MdPdfThemeId): { stroke: string; fill: string; grid: string; text: string } {
  if (theme === "obsidian") {
    return {
      stroke: "#c4a35a",
      fill: "rgba(196,163,90,0.38)",
      grid: "rgba(196,163,90,0.28)",
      text: "#ece6d8",
    };
  }
  return {
    stroke: "#8a6a28",
    fill: "rgba(196,163,90,0.42)",
    grid: "rgba(138,106,40,0.28)",
    text: "#1d1914",
  };
}

function formatSessionDate(value: string | null, locale: "fr" | "en"): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function assessmentHtml(
  assessment: MdPdfAssessment,
  locale: "fr" | "en",
  theme: MdPdfThemeId,
): string {
  const title = locale === "en" ? "Archetypal profile" : "Profil archétypal";
  const scoreLabel = locale === "en" ? "Score" : "Score";
  const intensityLabel = locale === "en" ? "Intensity" : "Intensité";
  const when = formatSessionDate(assessment.submittedAt, locale);
  const topLine = assessment.top
    .map((row) => `${escapeHtml(row.name)} ${row.raw}`)
    .join(" · ");
  const kicker = [assessment.displayName, when, topLine].filter(Boolean).join("  ·  ");
  const rows = assessment.scores
    .map(
      (row) => `<tr>
        <td class="score-rank">${row.rank}</td>
        <td>${escapeHtml(row.name)}</td>
        <td class="score-num">${row.raw}</td>
        <td class="score-num">${row.normalized}%</td>
      </tr>`,
    )
    .join("");

  return `<section class="score-sheet">
    <h2 class="section-title"><span class="h-text">${title}</span></h2>
    <p class="score-kicker">${escapeHtml(kicker)}</p>
    <div class="score-layout">
      <div class="score-radar">${assessmentRadarSvg(assessment.scores, radarColors(theme), locale)}</div>
      <table class="score-table">
        <thead><tr><th>#</th><th>${locale === "en" ? "Archetype" : "Archétype"}</th><th>${scoreLabel}</th><th>${intensityLabel}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>`;
}

function coverScoreLine(assessment: MdPdfAssessment | null | undefined): string {
  if (!assessment?.top.length) return "";
  const line = assessment.top.map((row) => `${escapeHtml(row.name.replace(/^(Le |La |L')/, ""))} ${row.raw}`).join("  ·  ");
  return `<p class="cover-score">${line}</p>`;
}

function coverHtml(
  meta: MdPdfMeta,
  brand: string,
  locale: "fr" | "en",
  contentLang: MdPdfContentLang,
  assessment?: MdPdfAssessment | null,
): string {
  const chips = meta.tags
    .map((tag) => `<span>${escapeHtml(tag.replace(/^#/, ""))}</span>`)
    .join("");
  const facts = [
    meta.stade && [locale === "en" ? "Stage" : "Stade", meta.stade],
    meta.domaine && [locale === "en" ? "Domain" : "Domaine", meta.domaine],
    meta.principe && [locale === "en" ? "Principle" : "Principe", meta.principe.replace(/-/g, " ")],
    meta.tier && ["Tier", meta.tier],
    meta.density && [locale === "en" ? "Density" : "Densité", meta.density],
    meta.created && [locale === "en" ? "Created" : "Créé", formatVaultDate(meta.created, locale)],
  ].filter((row): row is [string, string] => Boolean(row));

  return `<section class="cover">
    <header class="cover-head">
      <div class="brand">${escapeHtml(brand)}${meta.author ? ` · ${escapeHtml(meta.author)}` : ""}</div>
      <div class="cover-lang">${langBadge(contentLang)}</div>
    </header>
    <div class="cover-hero">
      ${meta.glyphe ? `<div class="cover-glyph-wrap">${escapeHtml(meta.glyphe)}</div>` : ""}
      ${meta.orientation ? `<p class="cover-orientation">${escapeHtml(meta.orientation)}</p>` : ""}
      ${meta.user ? `<p class="cover-user">${escapeHtml(meta.user)}</p>` : ""}
      ${coverScoreLine(assessment)}
    </div>
    <footer class="cover-foot">
      <h1>${escapeHtml(meta.displayTitle)}</h1>
      ${meta.title && meta.title !== meta.displayTitle ? `<p class="cover-dossier">${escapeHtml(meta.title)}</p>` : ""}
      ${meta.subtitle && meta.subtitle !== meta.title ? `<p class="subtitle">${escapeHtml(meta.subtitle)}</p>` : ""}
      ${chips ? `<div class="cover-chips">${chips}</div>` : ""}
      ${facts.length ? `<div class="cover-facts">${facts.map(([k, v]) => `<div class="cover-fact"><span class="k">${escapeHtml(k)}</span><span class="v">${escapeHtml(v)}</span></div>`).join("")}</div>` : ""}
    </footer>
  </section>`;
}

export function buildMdPdfHtml({
  sources,
  theme,
  showCover,
  locale,
  contentLang = "fr",
  brand = "Aegis",
  assessment = null,
}: BuildMdPdfArgs): { html: string; title: string; filename: string } {
  const dateLocale = contentLang === "en" ? "en" : "fr";
  const docs = sources.map((src) => {
    const fallback = src.filename.replace(/\.md$/i, "") || (dateLocale === "fr" ? "Sans titre" : "Untitled");
    const meta = resolveMdPdfMeta(src.markdown, fallback);
    if (src.titleOverride?.trim()) {
      meta.title = src.titleOverride.trim();
      if (!meta.displayTitle) meta.displayTitle = src.titleOverride.trim();
    }
    if (src.subtitleOverride?.trim()) meta.subtitle = src.subtitleOverride.trim();
    const filtered = filterMarkdownByLang(meta.body, contentLang);
    return {
      meta,
      html: markdownToPrintHtml(filtered, { skipFirstH1: showCover }),
    };
  });

  const primary = docs[0];
  const docTitle =
    docs.length > 1
      ? `${primary?.meta.title ?? brand} +${docs.length - 1}`
      : (primary?.meta.title ?? brand);

  const cover = showCover && primary ? coverHtml(primary.meta, brand, dateLocale, contentLang, assessment) : "";
  const scores = assessment ? assessmentHtml(assessment, dateLocale, theme) : "";

  const articles = docs
    .map((doc, index) => {
      const hideBanner = showCover && index === 0;
      const banner = hideBanner
        ? ""
        : `<header class="doc-banner">
            <div class="kicker">${escapeHtml(brand)}${doc.meta.orientation ? ` · ${escapeHtml(doc.meta.orientation)}` : ""}</div>
            <h1>${escapeHtml(doc.meta.displayTitle)}</h1>
            ${doc.meta.subtitle ? `<p>${escapeHtml(doc.meta.subtitle)}</p>` : ""}
          </header>`;
      return `<article class="doc">${banner}${doc.html}</article>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html lang="${dateLocale}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(docTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${MD_PDF_FONT_HREF}" rel="stylesheet" />
  <style>${getMdPdfThemeCss(theme)}</style>
</head>
<body>
  ${cover}
  ${scores}
  <main class="sheet">
    ${articles}
  </main>
</body>
</html>`;

  return {
    html,
    title: docTitle,
    filename: `${slugifyFilename(docTitle)}.pdf`,
  };
}

function htmlWithPrintScript(html: string): string {
  return html.replace(
    "</body>",
    `<script>
      (function () {
        function go() {
          try { window.focus(); window.print(); } catch (e) {}
        }
        function start() {
          if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () { setTimeout(go, 200); });
          } else {
            setTimeout(go, 450);
          }
        }
        if (document.readyState === "complete") start();
        else window.addEventListener("load", start);
      })();
    </script></body>`,
  );
}

function printViaHiddenIframe(html: string): boolean {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("title", "PDF");
  Object.assign(iframe.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: "210mm",
    minWidth: "210mm",
    height: "297mm",
    border: "0",
    opacity: "0.01",
    pointerEvents: "none",
    zIndex: "0",
  });
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return false;
  }
  doc.open();
  doc.write(html);
  doc.close();
  const fullHeight = Math.max(
    doc.documentElement.scrollHeight,
    doc.body?.scrollHeight ?? 0,
    1123,
  );
  iframe.style.height = `${fullHeight + 64}px`;
  const cleanup = () => {
    window.setTimeout(() => iframe.remove(), 1500);
  };
  win.addEventListener("afterprint", cleanup);
  window.setTimeout(cleanup, 120_000);
  win.focus();
  win.print();
  return true;
}

export function openMdPdfPrintWindow(args: BuildMdPdfArgs): boolean {
  try {
    const { html } = buildMdPdfHtml(args);
    const printable = htmlWithPrintScript(html);

    if (printViaHiddenIframe(html)) return true;

    const blob = new Blob([printable], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) {
      URL.revokeObjectURL(url);
      return false;
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return true;
  } catch (err) {
    console.error("[md-pdf] export failed", err);
    return false;
  }
}
