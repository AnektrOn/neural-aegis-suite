import { describe, expect, it } from "vitest";
import {
  isCartographyIndexMarkdown,
  parseBundleToDisplay,
  parseGuardiansFromMarkdown,
  parseHousesFromMarkdown,
  parseSynthesisFromMarkdown,
} from "./cartography-markdown-parse";
import type { DbCartographyBundle } from "@/services/cartographyService";

const SAMPLE_CARTO = `# ⚖️ Cartographie Archétypale Intégrale (100 Questions) · PÔLE BALANCE
**Utilisateur :** note  |  **Date :** 2026-05-16  |  **Stade :** Blueprint Alchimique (Synthèse)

---

## I. Matrice des 12 Maisons (Dialogue de Synthèse)

### ♈ Maison 1 — Ego & Masque
*L'incarnation lucide.*
- **SHADOW :** Méfiance réflexe et retrait protecteur.
- **LIGHT :** Autorité naturelle par la présence calme.
- **BALANCE :** Le Saboteur devient le **Gardien de l'Alignement**.

### ♉ Maison 2 — Valeurs & Sécurité
*La souveraineté de la valeur.*
- **SHADOW :** Intellectualisation excessive.
- **LIGHT :** Sécurité par le non-attachement.
- **BALANCE :** **Intégrité Abondante**.

## II. Les 4 Gardiens (Synthèse Archétypale)

### Saboteur
- **SHADOW :** Disruption identitaire
- **LIGHT :** Gardien du Choix
- **BALANCE :** Vigilance d'Alignement
`;

describe("cartography-markdown-parse", () => {
  it("parse 12 maisons avec pôles SHADOW/LIGHT/BALANCE", () => {
    const { housesPart, guardiansPart } = {
      housesPart: SAMPLE_CARTO.split(/##\s+.*gardiens/i)[0] ?? "",
      guardiansPart: SAMPLE_CARTO.match(/##\s+.*gardiens[\s\S]*/i)?.[0] ?? "",
    };
    const houses = parseHousesFromMarkdown(housesPart);
    expect(houses).toHaveLength(2);
    expect(houses[0].id).toBe(1);
    expect(houses[0].sign).toBe("♈");
    expect(houses[0].tagline).toContain("incarnation");
    expect(houses[0].shadow).toContain("Méfiance");
    expect(houses[0].balance).toContain("Gardien");
  });

  it("parse gardiens depuis section II", () => {
    const guardiansPart = SAMPLE_CARTO.match(/##\s+.*gardiens[\s\S]*/i)?.[0] ?? "";
    const guardians = parseGuardiansFromMarkdown(guardiansPart);
    expect(guardians).toHaveLength(1);
    expect(guardians[0].name).toBe("Saboteur");
    expect(guardians[0].balance).toContain("Vigilance");
  });

  it("parse synthèse GLOBAL en sections ##", () => {
    const md = `# GLOBAL · Analyse
## I. Résumé des Cartographies
Paragraphe intro.

### Vue Overview · Pôle SHADOW
Texte ombre.

## II. P01 · ARC
- **Point 1**
- **Point 2**
`;
    const sections = parseSynthesisFromMarkdown(md);
    expect(sections.length).toBeGreaterThanOrEqual(2);
    expect(sections[0].title).toContain("Résumé");
    expect(sections[0].subsections?.length).toBeGreaterThan(0);
  });

  it("detects 00 index README as non-user cartography content", () => {
    const indexMd = `# 00 | CARTOGRAPHIE INTÉGRALE : PÔLE SHADOW (T2)

## STRUCTURE DU DOSSIER
Ce répertoire contient l'exégèse clinique du pôle d'Ombre.
L'ordre de lecture est strict et progressif.`;
    expect(isCartographyIndexMarkdown(indexMd, "00 | CARTOGRAPHIE INTÉGRALE")).toBe(true);
    expect(isCartographyIndexMarkdown(SAMPLE_CARTO)).toBe(false);
  });

  it("keeps 00-Cartographie integral report when it contains maisons", () => {
    const integral = `# 00 | CARTOGRAPHIE INTÉGRALE · BALANCE

## I. Matrice des 12 Maisons

### ♈ Maison 1 — Ego & Masque
- **SHADOW :** test shadow
- **LIGHT :** test light
- **BALANCE :** test balance`;
    expect(isCartographyIndexMarkdown(integral, "00-Cartographie_Integrale·BALANCE")).toBe(false);
  });

  it("parses ## Maison headings (not only ###)", () => {
    const md = `## ♉ Maison 2 — Valeurs
- **SHADOW :** ombre
- **LIGHT :** lumière
- **BALANCE :** équilibre`;
    expect(parseHousesFromMarkdown(md)).toHaveLength(1);
    expect(parseHousesFromMarkdown(md)[0].id).toBe(2);
  });

  it("finds 12 maisons in GLOBAL synthesis when cartographie is index-only", () => {
    const bundle: DbCartographyBundle = {
      id: "b1",
      userId: "u1",
      pole: "balance",
      mode: "analyse",
      status: "published",
      meta: {},
      publishedAt: null,
      sections: [
        {
          id: "s1",
          sectionKey: "cartographie",
          reportCode: "",
          title: "00 | README",
          markdown: `# 00 | CARTOGRAPHIE

## STRUCTURE DU DOSSIER
Ce répertoire contient les rapports.`,
          sortOrder: 10,
        },
        {
          id: "s2",
          sectionKey: "synthesis",
          reportCode: "",
          title: "GLOBAL-MYSS",
          markdown: SAMPLE_CARTO,
          sortOrder: 30,
        },
      ],
    };
    const display = parseBundleToDisplay(bundle);
    expect(display.houses.length).toBeGreaterThanOrEqual(2);
  });
});
