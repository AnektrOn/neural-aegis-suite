import { describe, expect, it } from "vitest";
import {
  parseGuardiansFromMarkdown,
  parseHousesFromMarkdown,
  parseSynthesisFromMarkdown,
} from "./cartography-markdown-parse";

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
});
