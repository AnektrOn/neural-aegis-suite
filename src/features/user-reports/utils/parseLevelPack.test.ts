import { describe, it, expect } from "vitest";
import {
  parseLevelPack,
  detectLevelFromInput,
  checkHasSafeguard,
  parseBilingualMirrorSections,
} from "./parseLevelPack";

describe("parseLevelPack utility (AEGIS V3.2)", () => {
  it("detects level and scope accurately", () => {
    expect(detectLevelFromInput("LEVEL_0")).toEqual({
      level: 0,
      levelCode: "LEVEL_0",
      scope: "intra",
    });
    expect(detectLevelFromInput("LEVEL_2/00_RAPPORT.md")).toEqual({
      level: 2,
      levelCode: "LEVEL_2",
      scope: "intra",
    });
    expect(detectLevelFromInput("LEVEL_5_TRANS")).toEqual({
      level: 5,
      levelCode: "LEVEL_5",
      scope: "trans",
    });
    expect(detectLevelFromInput("LEVEL_9+")).toEqual({
      level: 9,
      levelCode: "LEVEL_9+",
      scope: "trans",
    });
  });

  it("identifies epistemic safeguards correctly", () => {
    expect(checkHasSafeguard("## 0. Safeguard Épistémique\nCadre éthique")).toBe(true);
    expect(checkHasSafeguard("## 0. Epistemic Safeguard\nBoundaries")).toBe(true);
    expect(checkHasSafeguard("[AEGIS V3 ONTOLOGY FIREWALL ACTIVE]")).toBe(true);
    expect(checkHasSafeguard("Simple diagnostic without notice")).toBe(false);
  });

  it("splits bilingual mirror sections into pairs and clean texts", () => {
    const rawMarkdown = `## 0. Safeguard Épistémique / Epistemic Safeguard
### 🇫🇷 Avertissement Déontologique (FR)
Ceci est une analyse herméneutique et non un acte médical.
### 🇬🇧 Ethical Notice (EN)
This is an interpretative analysis and not a medical diagnosis.

## 1. Cadre Ontologique / Ontological Framework
### 🇫🇷 Architecture (FR)
L'architecture de Djanan33 repose sur le pôle Ombre.
### 🇬🇧 Architecture (EN)
The architecture is grounded in the Shadow pole.`;

    const { sectionPairs, safeguardSection, cleanFr, cleanEn } = parseBilingualMirrorSections(rawMarkdown);

    expect(sectionPairs.length).toBe(2);
    expect(safeguardSection).not.toBeNull();
    expect(safeguardSection?.is_safeguard).toBe(true);
    expect(cleanFr).toContain("Ceci est une analyse herméneutique");
    expect(cleanFr).not.toContain("This is an interpretative analysis");
    expect(cleanEn).toContain("This is an interpretative analysis");
    expect(cleanEn).not.toContain("Ceci est une analyse herméneutique");
  });

  it("parses a full 5-file pack into structured result", () => {
    const files = [
      {
        filename: "00_RAPPORT.md",
        content: `---
title: "DIAGNOSTIC NIVEAU 2 · MYSS"
tier: "2"
level: 2
prism: "MYSS"
---
## 0. Safeguard Épistémique
### 🇫🇷 Règle d'or (FR)
Non substituable à un suivi médical.
### 🇬🇧 Golden Rule (EN)
Non substitutable for medical care.

## 1. Nœuds Fondamentaux
### 🇫🇷 Analyse (FR)
Texte français étendu...
### 🇬🇧 Analysis (EN)
Extended English text...`,
      },
      {
        filename: "01_RESUME.md",
        content: "Synthèse exécutive du niveau 2.",
      },
      {
        filename: "02_BULLET_POINTS.md",
        content: "- Axiome 1\n- Axiome 2",
      },
      {
        filename: "03_GRAPHIQUE.md",
        content: "```mermaid\ngraph TD\nA --> B\n```",
      },
      {
        filename: "04_PROMPT_AI.md",
        content: "Tu es l'analyste AEGIS pour Djanan33.",
      },
    ];

    const result = parseLevelPack(files, "LEVEL_2");

    expect(result.valid).toBe(true);
    expect(result.level).toBe(2);
    expect(result.levelCode).toBe("LEVEL_2");
    expect(result.scope).toBe("intra");
    expect(result.prismCode).toBe("MYSS");
    expect(result.hasSafeguard).toBe(true);
    expect(result.packFiles.resume_md).toBe("Synthèse exécutive du niveau 2.");
    expect(result.packFiles.graphique_md).toContain("```mermaid");
    expect(result.packFiles.prompt_ai_md).toBe("Tu es l'analyste AEGIS pour Djanan33.");
    expect(result.metadata.detected_diagrams_count).toBe(1);
  });

  it("handles a single diagnostic file like DIAG-BALANCE-elena.md without crashing", () => {
    const fs = require("fs");
    const content = fs.readFileSync("exports/diagnostics/DIAG-BALANCE-elena.md", "utf8");
    const files = [{ filename: "DIAG-BALANCE-elena.md", content }];

    const result = parseLevelPack(files, "DIAG-BALANCE-elena");
    expect(result.valid).toBe(true);
    expect(result.level).toBe(2);
    expect(result.scope).toBe("intra");
    expect(result.sectionPairs.length).toBeGreaterThan(0);
  });

  it("handles legacy Myss folder files without crashing", () => {
    const files = [
      { filename: "00-Cartographie-Integrale-Myss.md", content: "# Cartographie Integrale\nContenu 00" },
      { filename: "GLOBAL-MYSS-ANALYSE-BALANCE.md", content: "# Global Myss\n```mermaid\ngraph TD\nA-->B\n```" },
      { filename: "P01·ARC-1·⚖️-BALANCE.md", content: "# P01 Maisons\nActions et leviers" },
      { filename: "P02·ARC-2·⚖️-BALANCE.md", content: "# P02\nActions" },
    ];

    const result = parseLevelPack(files, "⚖️ BALANCE");
    expect(result.valid).toBe(true);
    expect(result.packFiles.rapport_md).toContain("Cartographie Integrale");
    expect(result.packFiles.resume_md).toContain("Global Myss");
    expect(result.packFiles.graphique_md).toContain("```mermaid");
    expect(result.metadata.detected_diagrams_count).toBe(1);
  });

  it("falls back to largest file if no 00 or rapport prefix exists", () => {
    const files = [
      { filename: "notes.md", content: "Short note" },
      { filename: "analytique-dense.md", content: "# Grand Rapport Clinique\n".repeat(50) },
    ];

    const result = parseLevelPack(files, "DOSSIER_AUTONOME");
    expect(result.valid).toBe(true);
    expect(result.packFiles.rapport_md).toContain("Grand Rapport Clinique");
    expect(result.warnings.some((w) => w.includes("analytique-dense.md"))).toBe(true);
  });
});
