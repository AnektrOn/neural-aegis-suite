import { describe, expect, it } from "vitest";
import {
  filterMarkdownByLang,
  firstHeadingTitle,
  markdownToPrintHtml,
  pickBilingualText,
  resolveMdPdfMeta,
  slugifyFilename,
  stripYamlFrontmatter,
} from "./markdownToPrintHtml";
import { buildMdPdfHtml } from "./exportMarkdownPdf";
import { assessmentRadarSvg, pdfUserHandles, rowsFromScores } from "./assessmentPrint";

describe("markdownToPrintHtml", () => {
  it("strips yaml frontmatter and resolves title", () => {
    const md = `---
title: Portrait Tao
subtitle: Bois
author: Aegis
---
# Ignored heading

Corps.`;
    const { fields, body } = stripYamlFrontmatter(md);
    expect(fields.title).toBe("Portrait Tao");
    expect(body.startsWith("# Ignored")).toBe(true);
    const meta = resolveMdPdfMeta(md, "fallback");
    expect(meta.title).toBe("Portrait Tao");
    expect(meta.subtitle).toBe("Bois");
    expect(meta.author).toBe("Aegis");
  });

  it("parses Vault frontmatter (titre, glyphe, tags, nested liens)", () => {
    const md = `---
titre: "DIAG BALANCE 2608 Djanan33"
stade: noeud
domaine: "psychologie"
glyphe: "⊕"
principe-dominant: "champ-morphique"
tags: ["#diagnostic", "#Djanan33", "#balance"]
densite-morphique: 3
liens:
  resonance: []
  correspondance: []
user: "Djanan33"
auteur: "aegis-myss-balance"
tier: "2"
orientation: "BALANCE"
created: "2026-08-16"
---

# ⚖️ BALANCE - Exégèse Haute Résolution : Djanan33

**Date d'Analyse / Date of Analysis:** 2026-08-16
**Période de Référence / Reference Period:** Août 2026

## 1. Cadre

### 🇫🇷 Architecture du Diagnostic (FR)
Texte FR.

### 🇬🇧 Diagnostic Architecture (EN)
English text.

1. **L'évitement (◈ · PHI) :** Corps du point.
`;
    const meta = resolveMdPdfMeta(md, "fallback");
    expect(meta.title).toBe("DIAG BALANCE 2608 Djanan33");
    expect(meta.displayTitle).toBe("BALANCE - Exégèse Haute Résolution : Djanan33");
    expect(meta.glyphe).toBe("⊕");
    expect(meta.user).toBe("Djanan33");
    expect(meta.author).toBe("aegis-myss-balance");
    expect(meta.orientation).toBe("BALANCE");
    expect(meta.tags).toEqual(["#diagnostic", "#Djanan33", "#balance"]);
    expect(meta.body).not.toMatch(/^liens:/m);
    expect(meta.body).not.toContain("resonance:");

    const html = markdownToPrintHtml(meta.body, { skipFirstH1: true });
    expect(html).not.toContain("<h1>");
    expect(html).toContain('class="dossier"');
    expect(html).toContain("Date d'Analyse");
    expect(html).toContain("locale-fr");
    expect(html).toContain("locale-en");
    expect(html).toContain('class="points"');
    expect(html).toContain('class="point-title"');
    expect(html).toContain("L'évitement (◈ · PHI)");
  });

  it("filters bilingual Vault blocks by language", () => {
    const md = `## 1. Cadre FR / Framework EN

**Date d'Analyse / Date of Analysis:** 2026-08-16

### 🇫🇷 Architecture (FR)
Texte français.

### 🇬🇧 Architecture (EN)
English text.
`;
    expect(pickBilingualText("Cadre FR / Framework EN", "fr")).toBe("Cadre FR");
    expect(pickBilingualText("Cadre FR / Framework EN", "en")).toBe("Framework EN");

    const fr = filterMarkdownByLang(md, "fr");
    expect(fr).toContain("## 1. Cadre FR");
    expect(fr).not.toContain("Framework EN");
    expect(fr).toContain("**Date d'Analyse:**");
    expect(fr).not.toContain("Date of Analysis");
    expect(fr).toContain("Texte français");
    expect(fr).not.toContain("English text");
    expect(fr).toContain("### Architecture");
    expect(fr).not.toContain("🇫🇷");

    const en = filterMarkdownByLang(md, "en");
    expect(en).toContain("## 1. Framework EN");
    expect(en).toContain("English text");
    expect(en).not.toContain("Texte français");
  });

  it("falls back to first h1", () => {
    expect(firstHeadingTitle("intro\n# Hello **world**\n")).toBe("Hello world");
    expect(resolveMdPdfMeta("## Only h2", "Doc.md").title).toBe("Doc.md");
  });

  it("renders headings, emphasis, lists and quotes", () => {
    const html = markdownToPrintHtml(`# Title

A **bold** and *italic* word with \`code\`.

> cited line

- one
- two

1. first
2. second

---
`);
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toContain("<code>code</code>");
    expect(html).toContain("<blockquote>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<ol");
    expect(html).toContain("<hr />");
  });

  it("renders GFM tables and fenced code", () => {
    const html = markdownToPrintHtml(`| Pole | Score |
| --- | --- |
| Wood | 12 |

\`\`\`ts
const x = 1;
\`\`\`
`);
    expect(html).toContain("<table>");
    expect(html).toContain("<th>Pole</th>");
    expect(html).toContain("<td>Wood</td>");
    expect(html).toContain("data-lang=\"ts\"");
    expect(html).toContain("const x = 1;");
  });

  it("renders links, images and task lists", () => {
    const html = markdownToPrintHtml(`[Aegis](https://aegis.test)

![sigil](https://img.test/a.png)

- [x] done
- [ ] todo
`);
    expect(html).toContain('<a href="https://aegis.test">Aegis</a>');
    expect(html).toContain('<img src="https://img.test/a.png" alt="sigil" />');
    expect(html).toContain('class="task done"');
    expect(html).toContain('class="task"');
  });

  it("slugifies filenames", () => {
    expect(slugifyFilename("Rapport Été 2026.md")).toBe("rapport-ete-2026-md");
  });
});

describe("buildMdPdfHtml", () => {
  it("builds a print document with cover and theme css", () => {
    const { html, filename } = buildMdPdfHtml({
      sources: [{ filename: "note.md", markdown: "# Hello\n\nBody." }],
      theme: "nocturne",
      showCover: true,
      locale: "fr",
    });
    expect(html).toContain('class="cover"');
    expect(html).toContain("Hello");
    expect(html).toContain("class=\"sheet\"");
    expect(html).toContain("@page { size: A4 portrait; margin: 16mm 15mm 18mm; }");
    expect(html).toContain("Cormorant Garamond");
    expect(filename).toBe("hello.pdf");
  });

  it("renders a Vault cover from titre / glyphe / tags", () => {
    const { html, filename } = buildMdPdfHtml({
      sources: [
        {
          filename: "diag.md",
          markdown: `---
titre: "DIAG BALANCE 2608 Djanan33"
glyphe: "⊕"
orientation: "BALANCE"
user: "Djanan33"
tags: ["#diagnostic", "#balance"]
auteur: "aegis-myss-balance"
---
# ⚖️ BALANCE - Exégèse Haute Résolution : Djanan33
`,
        },
      ],
      theme: "nocturne",
      showCover: true,
      locale: "fr",
    });
    expect(html).toContain("cover-glyph-wrap");
    expect(html).toContain("⊕");
    expect(html).toContain("Djanan33");
    expect(html).toContain("BALANCE");
    expect(html).toContain("DIAG BALANCE 2608 Djanan33");
    expect(html).toContain("diagnostic");
    expect(filename).toBe("diag-balance-2608-djanan33.pdf");
  });

  it("paginates multiple documents", () => {
    const { html } = buildMdPdfHtml({
      sources: [
        { filename: "a.md", markdown: "# One" },
        { filename: "b.md", markdown: "# Two" },
      ],
      theme: "ivoire",
      showCover: false,
      locale: "en",
    });
    expect(html.match(/class="doc"/g)?.length).toBe(2);
    expect(html).toContain("Two");
  });

  it("embeds cover scores and a radar sheet when assessment is provided", () => {
    const assessment = {
      userId: "user-1",
      displayName: "Djanan33",
      submittedAt: "2026-08-01T00:00:00.000Z",
      scores: [
        { key: "mystic", name: "Le Mystique", rank: 1, raw: 102, normalized: 94 },
        { key: "sage", name: "Le Sage", rank: 2, raw: 88, normalized: 81 },
        { key: "lover", name: "L'Amoureux", rank: 3, raw: 71, normalized: 65 },
      ],
      top: [
        { key: "mystic", name: "Le Mystique", rank: 1, raw: 102, normalized: 94 },
        { key: "sage", name: "Le Sage", rank: 2, raw: 88, normalized: 81 },
        { key: "lover", name: "L'Amoureux", rank: 3, raw: 71, normalized: 65 },
      ],
    };
    const { html } = buildMdPdfHtml({
      sources: [
        {
          filename: "diag.md",
          markdown: `---
user: "Djanan33"
titre: "DIAG"
---
# Body
`,
        },
      ],
      theme: "nocturne",
      showCover: true,
      locale: "fr",
      assessment,
    });
    expect(html).toContain("cover-score");
    expect(html).toContain("Mystique 102");
    expect(html).toContain("Sage 88");
    expect(html).toContain("score-sheet");
    expect(html).toContain("score-radar-svg");
    expect(html).toContain("102");
    expect(html).toContain("94%");
    expect(html).toContain("Profil archétypal");
  });
});

describe("assessmentPrint", () => {
  it("collects yaml user and non-generic tags", () => {
    expect(pdfUserHandles("Djanan33", ["#diagnostic", "#Djanan33", "#balance"])).toEqual(["Djanan33"]);
    expect(pdfUserHandles("", ["#vault", "#Maya"])).toEqual(["Maya"]);
  });

  it("keeps major archetypes ordered by rank with rounded scores", () => {
    const rows = rowsFromScores(
      [
        { archetype_key: "child", rank: 1, raw_score: 50, normalized_score: 50 },
        { archetype_key: "mystic", rank: 2, raw_score: 102.4, normalized_score: 93.7 },
        { archetype_key: "sage", rank: 1, raw_score: 88.2, normalized_score: 80.6 },
      ],
      "fr",
    );
    expect(rows.map((r) => r.key)).toEqual(["sage", "mystic"]);
    expect(rows[0]).toMatchObject({ name: "Le Sage", raw: 88, normalized: 81, rank: 1 });
  });

  it("renders an inline radar with polygon and labels", () => {
    const svg = assessmentRadarSvg(
      [{ key: "mystic", name: "Le Mystique", rank: 1, raw: 102, normalized: 94 }],
      { stroke: "#8a6a28", fill: "rgba(0,0,0,0.2)", grid: "#ccc", text: "#111" },
      "fr",
    );
    expect(svg).toContain("<polygon");
    expect(svg).toContain("Mystique");
    expect(svg).toContain("score-radar-svg");
  });

  it("scales the fill to the peak score instead of a fixed 0–100 domain", () => {
    const svg = assessmentRadarSvg(
      [
        { key: "mystic", name: "Le Mystique", rank: 1, raw: 102, normalized: 24 },
        { key: "sage", name: "Le Sage", rank: 2, raw: 88, normalized: 18 },
      ],
      { stroke: "#8a6a28", fill: "gold", grid: "#ccc", text: "#111" },
      "fr",
    );
    const fill = svg.match(/class="score-radar-fill" points="([^"]+)"/);
    expect(fill?.[1]).toBeTruthy();
    const cx = 240;
    const cy = 236;
    const maxR = 172;
    const distances = fill![1].split(" ").map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return Math.hypot(x - cx, y - cy);
    });
    expect(Math.max(...distances)).toBeCloseTo(maxR, 0);
  });
});
