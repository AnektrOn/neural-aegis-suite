import { describe, expect, it } from "vitest";
import {
  parseMarkdownBlocks,
  parseUniversalMarkdownDocument,
  sanitizeCartographyMarkdown,
  stripDocumentFrontmatter,
} from "./cartography-document-parse";

const T3_SAMPLE = `id: 00-Cartographie_Integrale·BALANCE·T3
type: INTEGRAL_CARTOGRAPHY·T3
pole: BALANCE
user: note
period: 2026-05
author: aegis-myss-balance-analyst

⚖️ CARTOGRAPHIE INTÉGRALE·BALANCE (TIER 3) | LA GÉOMÉTRIE SACRÉE DE LA SOUVERAINETÉ

Cette cartographie de Tier 3 offre une vision holomorphique du Champ de "note".

1. LA MATRICE ARCHÉTYPALE UNIFIÉE (CONSTELLATION T3)

En Tier 3, les archétypes ne sont plus des personnages isolés.

| Archétype Intégré | Code Vibratoire | Fonction Haute Résolution |
| :--- | :--- | :--- |
| LE SOUVERAIN-MYSTIQUE | [M10-M12] | Ordonnateur du Champ depuis le Silence. |
| LE SAGE-GUÉRISSEUR | [M9-M3] | Traducteur des Lois Sacrées. |

2. TOPOGRAPHIE FRACTALE DU CHAMP (MAISONS ET FLUX)

Le Champ est organisé en trois anneaux de souveraineté.

ANNEAU 1 : LE CŒUR IMMOBILE (M12, M4, M10)

- **M12 (Canal)** : Le point zéro de la réception. Silence radical.
- **M4 (Racines)** : L'ancrage dans le Soi profond.

Document haute résolution. Scellé pour intégration méta-cognitive.
`;

describe("cartography-document-parse", () => {
  it("extracts frontmatter and title", () => {
    const stripped = stripDocumentFrontmatter(T3_SAMPLE);
    expect(stripped.frontmatter?.lines.pole).toBe("BALANCE");
    expect(stripped.frontmatter?.lines.user).toBe("note");

    const doc = parseUniversalMarkdownDocument(T3_SAMPLE);
    expect(doc.frontmatter).toBeNull();
    expect(doc.title).toContain("CARTOGRAPHIE INTÉGRALE");
    expect(doc.subtitle).toBeNull();
    expect(doc.intro.length).toBeGreaterThan(0);
    expect(doc.intro.some((b) => b.type === "p" && /type:\s*INTEGRAL/i.test(b.text))).toBe(false);
  });

  it("sanitizeCartographyMarkdown strips frontmatter for storage", () => {
    const cleaned = sanitizeCartographyMarkdown(T3_SAMPLE);
    expect(cleaned).not.toMatch(/^id:/m);
    expect(cleaned).not.toMatch(/^type:/m);
    expect(cleaned).toContain("CARTOGRAPHIE INTÉGRALE");
  });

  it("removes NotebookLM boilerplate lines", () => {
    const md = `type: TEST
pole: BALANCE

# Rapport

Contenu utile.

*Document scellé pour archivage et ingestion par NotebookLM.*
`;
    const doc = parseUniversalMarkdownDocument(md);
    const allText = JSON.stringify(doc);
    expect(allText.toLowerCase()).not.toContain("notebooklm");
    expect(doc.intro.some((b) => b.type === "p" && b.text.includes("Contenu utile"))).toBe(true);
  });

  it("strips metadata leaked into intro body", () => {
    const md = `type: INTEGRAL_CARTOGRAPHY·T3
pole: BALANCE
user: note

⚖️ CARTOGRAPHIE INTÉGRALE·BALANCE (TIER 3)

Intro réelle du rapport.

1. SECTION UN

Contenu section.
`;
    const doc = parseUniversalMarkdownDocument(md);
    expect(doc.subtitle).toBeNull();
    expect(doc.intro.some((b) => b.type === "p" && b.text.includes("INTEGRAL_CARTOGRAPHY"))).toBe(false);
    expect(doc.intro.some((b) => b.type === "p" && b.text.includes("Intro réelle"))).toBe(true);
  });

  it("splits numbered sections", () => {
    const doc = parseUniversalMarkdownDocument(T3_SAMPLE);
    expect(doc.sections.length).toBeGreaterThanOrEqual(2);
    expect(doc.sections[0].title).toContain("MATRICE ARCHÉTYPALE");
    expect(doc.sections[1].title).toContain("TOPOGRAPHIE");
  });

  it("parses tables into table blocks", () => {
    const blocks = parseMarkdownBlocks(
      "| A | B |\n| --- | --- |\n| LE SOUVERAIN | [M10] |",
    );
    expect(blocks.some((b) => b.type === "table")).toBe(true);
  });

  it("parses ANNEAU subsections", () => {
    const doc = parseUniversalMarkdownDocument(T3_SAMPLE);
    const topo = doc.sections.find((s) => s.title.includes("TOPOGRAPHIE"));
    expect(topo?.subsections?.length).toBeGreaterThan(0);
    expect(topo?.subsections?.[0].title).toContain("ANNEAU 1");
  });

  it("synthesis: roman sections, numbered subsections, action list not top-level", () => {
    const md = `# GLOBAL · Synthèse

Intro du document.

I. ARCHÉOLOGIE DU CHAMP : RÉSUMÉ T3 🌑 SHADOW

Texte shadow.

II. ÉVEIL DU CHAMP : RÉSUMÉ T3 🌕 LIGHT

Texte light.

III. SYNTHÈSE ALCHIMIQUE : L'ÉTAT DE ⚖️ BALANCE (T3)

Corps balance.

1. LA TRANSMUTATION FONCTIONNELLE (P01-P02·T3)

Détails transmutation.

*Résultat : Une libération massive.*
2. LA TOPOGRAPHIE DU ROYAUME (P03·T3)

Détails topo.

IV. CONCLUSION CLINIQUE

En tant qu'Architecte du Champ, "note" possède désormais les outils pour :

5. **Stabiliser** son propre système en toutes circonstances.
6. **Réparer** les tissus relationnels par le Verbe Chirurgical.
7. **Orienter** le collectif par la radiation de son alignement.

*Fin de l'Analyse Intégrale de Tier 3. Scellé par AEGIS pour exécution souveraine.*

Protocole Nomos
Propriété de PT Membimbing Draco Terbang
`;
    const doc = parseUniversalMarkdownDocument(md);
    expect(doc.sections.length).toBe(4);
    expect(doc.sections[0].title).toMatch(/^I\./i);
    expect(doc.sections[3].title).toMatch(/CONCLUSION/i);

    const balance = doc.sections.find((s) => s.title.includes("III."));
    expect(balance?.subsections?.length).toBeGreaterThanOrEqual(2);

    const conclusion = doc.sections[3];
    const listBlock = conclusion.blocks.find((b) => b.type === "list" && b.ordered);
    expect(listBlock?.type).toBe("list");
    if (listBlock?.type === "list") {
      expect(listBlock.items.length).toBe(3);
      expect(listBlock.items[0]).toContain("Stabiliser");
    }

    const allText = JSON.stringify(doc);
    expect(allText).not.toContain("Protocole Nomos");
    expect(allText).not.toMatch(/\*Résultat/);
  });
});
