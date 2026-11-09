import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseDoctrinalGlossary, cleanTitleAndTerm, cleanWikilink } from "./parseDoctrinalGlossary";

const rawMarkdown = fs.readFileSync(
  path.resolve(__dirname, "./content/01_GLOSSAIRE_DOCTRINAL_JUNG.md"),
  "utf-8",
);

describe("parseDoctrinalGlossary", () => {
  it("cleans wikilinks and emojis accurately", () => {
    expect(cleanWikilink("[[🌌·ConscienceSouveraine]]")).toBe("Conscience Souveraine");
    expect(cleanWikilink("[[🔷·MorphologieInconscientEtComplexes]]")).toBe(
      "Morphologie Inconscient Et Complexes",
    );
  });

  it("extracts clean title and original foreign term in parentheses", () => {
    const res1 = cleanTitleAndTerm("LE COMPLEXE AUTONOME À TONALITÉ AFFECTIVE (*Gefühlsbetonter Komplex*)");
    expect(res1.title).toBe("LE COMPLEXE AUTONOME À TONALITÉ AFFECTIVE");
    expect(res1.originalTerm).toBe("Gefühlsbetonter Komplex");

    const res2 = cleanTitleAndTerm("⚡ 1. LE COMPLEXE AUTONOME");
    expect(res2.title).toBe("LE COMPLEXE AUTONOME");

    const res3 = cleanTitleAndTerm("### 📌 Qu'est-ce qu'un Complexe ?");
    expect(res3.title).toBe("Qu'est-ce qu'un Complexe ?");
  });

  it("parses 01_GLOSSAIRE_DOCTRINAL_JUNG.md completely", () => {
    const data = parseDoctrinalGlossary(rawMarkdown);

    // Frontmatter validation
    expect(data.frontmatter.auteur).toBe("Carl Gustav Jung");
    expect(data.frontmatter.oeuvre).toBe("L'Homme à la découverte de son âme");
    expect(data.frontmatter.poupeesRusses).toHaveLength(4);
    expect(data.frontmatter.poupeesRusses[0]).toBe("Morphologie Inconscient Et Complexes");

    // Header validation
    expect(data.header.title).toContain("GLOSSAIRE DOCTRINAL");
    expect(data.header.subtitle).toContain("L'Homme à la découverte de son âme");

    // Chapters validation
    expect(data.chapters).toHaveLength(5);
    expect(data.chapters[0].title).toBe("LE COMPLEXE AUTONOME À TONALITÉ AFFECTIVE");
    expect(data.chapters[0].originalTerm).toBe("Gefühlsbetonter Komplex");
    expect(data.chapters[1].title).toBe("LA TOPOGRAPHIE DE LA PSYCHÉ");
    expect(data.chapters[2].title).toBe("LES FIGURES ARCHÉTYPALES ET INSTANCES INTERNES");
    expect(data.chapters[3].title).toBe("TYPOLOGIE PSYCHOLOGIQUE ET FONCTION INFÉRIEURE");
    expect(data.chapters[4].title).toBe("ONIRO-DYNAMIQUE ET MORPHOLOGIE DES RÊVES");

    // Concepts count
    expect(data.allConcepts.length).toBeGreaterThanOrEqual(18);

    // Concept specific checks
    const moi = data.allConcepts.find((c) => c.title.includes("Le Moi"));
    expect(moi).toBeDefined();
    expect(moi?.originalTerm).toBe("Das Ich");
    expect(moi?.essence.length).toBeGreaterThan(15);

    const ombre = data.allConcepts.find((c) => c.title.includes("L'Ombre"));
    expect(ombre).toBeDefined();
    expect(ombre?.originalTerm).toBe("Der Schatten");

    const soi = data.allConcepts.find((c) => c.title.includes("Le Soi"));
    expect(soi).toBeDefined();
    expect(soi?.originalTerm).toBe("Das Selbst");

    // Firewall check
    expect(data.firewallNotice).toContain("AEGIS V3 ONTOLOGY FIREWALL ACTIVE");
  });
});
