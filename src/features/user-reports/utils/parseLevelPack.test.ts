import { describe, it, expect } from "vitest";
import {
  parseLevelPack,
  detectLevelFromInput,
  checkHasSafeguard,
  parseBilingualMirrorSections,
  parseMermaidDiagrams,
  filterMermaidByLocale,
  cleanBilingualTitle,
} from "./parseLevelPack";
import { parseFrontmatter, extractBilingualContent } from "../parseReportMd";

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

  it("parses unfenced metadata and strips it from body (Caroline Myss Level 1 case)", () => {
    const rawMarkdown = `user: "note"
nom_affiche: "Note"
auteur: "Caroline_Myss"
oeuvre: "Sacred_Archetypes"
prisme: "LIGHT"
level: 1
type: "clinique_user"
data_density_tier: "Tier 1 - Quiz Declarative Snapshot"
caracteres_total: 66517
date_generation: "2026-11-10"
statut: "valide"

Partie 2
# ✨ RAPPORT CLINIQUE LEVEL 1 — Note (Caroline Myss : Sacred Archetypes · Pôle LIGHT)

Notice Clinique : Ce rapport constitue le deuxième volet diagnostique de Niveau 1 pour Note, élaboré selon les lois inviolables d'AEGIS V3 et la doctrine canonique de Caroline Myss (Sacred Contracts, Anatomy of the Spirit, Entering the Castle). Conformément à la Loi AEGIS N°2, ce prisme LIGHT lit exclusivement les données brutes (01_RAW/) pour cartographier les dons spirituels.

## 1. Don Spirituel Majeur
### 🇫🇷 Don du Mystique (FR)
Le Mystique est au cœur de l'expression.
### 🇬🇧 Gift of the Mystic (EN)
The Mystic is at the core of the expression.`;

    const { frontmatter, body } = parseFrontmatter(rawMarkdown);
    expect(frontmatter.user).toBe("note");
    expect(frontmatter.nom_affiche).toBe("Note");
    expect(frontmatter.auteur).toBe("Caroline_Myss");
    expect(frontmatter.prisme).toBe("LIGHT");
    expect(frontmatter.level).toBe(1);
    expect(body).not.toContain('user: "note"');
    expect(body).not.toContain('auteur: "Caroline_Myss"');
    expect(body).toContain("RAPPORT CLINIQUE LEVEL 1");

    const { sectionPairs, safeguardSection } = parseBilingualMirrorSections(body);
    expect(safeguardSection).not.toBeNull();
    expect(safeguardSection?.is_safeguard).toBe(true);
    expect(safeguardSection?.content_fr).toContain("Notice Clinique");

    // Numbered sections should NOT contain dummy introduction with raw metadata
    const analyticalSections = sectionPairs.filter((p) => !p.is_safeguard);
    expect(analyticalSections.length).toBe(1);
    expect(analyticalSections[0].title_fr).toBe("1. Don Spirituel Majeur");
    expect(analyticalSections[0].content_fr).toContain("Le Mystique est au cœur");
    expect(analyticalSections[0].content_fr).not.toContain('user: "note"');
  });

  it("extracts bilingual content for summary, actionable insights and AI prompt", () => {
    const bilingualSummary = `## 🇫🇷 Synthèse Stratégique (FR)
La dynamique de Note est axée sur le Mystique et la Grâce.

## 🇬🇧 Strategic Overview (EN)
Note's dynamics are centered on the Mystic and Grace.`;

    const summaryRes = extractBilingualContent(bilingualSummary);
    expect(summaryRes.hasBilingual).toBe(true);
    expect(summaryRes.fr).toContain("La dynamique de Note");
    expect(summaryRes.fr).not.toContain("Note's dynamics");
    expect(summaryRes.en).toContain("Note's dynamics");
    expect(summaryRes.en).not.toContain("La dynamique de Note");

    const monolingualFr = `Notice uniquement en français.\nPas de traduction anglaise.`;
    const monoRes = extractBilingualContent(monolingualFr);
    expect(monoRes.hasFr).toBe(true);
    expect(monoRes.hasEn).toBe(false);
    expect(monoRes.hasBilingual).toBe(false);
  });

  it("parses multiple Mermaid diagrams with titles, types and companion notes", () => {
    const rawGraphique = `### 01. Topologie Dynamique des Archétypes
\`\`\`mermaid
flowchart TD
  A[Mystique 73] --> B[Guérisseur 66]
  B --> C[Sage 64]
\`\`\`
*Légende : Flux d'amplification de la Grâce.*

### 02. États Internes et Nœuds
\`\`\`mermaid
stateDiagram-v2
  [*] --> Éveil
  Éveil --> Alchimie
\`\`\`
*Notes : Transition d'état psychique.*`;

    const diagrams = parseMermaidDiagrams(rawGraphique);
    expect(diagrams.length).toBe(2);

    expect(diagrams[0].index).toBe(1);
    expect(diagrams[0].title).toContain("Topologie Dynamique des Archétypes");
    expect(diagrams[0].type).toBe("flowchart");
    expect(diagrams[0].typeLabel).toContain("Flowchart");
    expect(diagrams[0].companionTextFr).toContain("Flux d'amplification");

    expect(diagrams[1].index).toBe(2);
    expect(diagrams[1].title).toContain("États Internes et Nœuds");
    expect(diagrams[1].type).toBe("stateDiagram");
    expect(diagrams[1].typeLabel).toContain("State Diagram");
    expect(diagrams[1].companionTextFr).toContain("Transition d'état psychique");
  });

  it("translates and filters bilingual Mermaid labels cleanly by locale (FR/EN)", () => {
    const rawMermaid = `flowchart TD
  A["🇫🇷 Don du Mystique / 🇬🇧 Gift of the Mystic"] -->|Flux Céleste / Celestial Flow| B[Guérisseur / Healer]
  B --> C([Éveil Spirituel / Spiritual Awakening])
  C --> D[[Alchimie / Alchemy]]
  D --> E["🇫🇷 Transmutation Sacrée<br/>🇬🇧 Sacred Transmutation"]
  E -.-> F((Union / Unity))`;

    const frResult = filterMermaidByLocale(rawMermaid, "fr");
    expect(frResult).toContain('A["Don du Mystique"]');
    expect(frResult).toContain("|Flux Céleste|");
    expect(frResult).toContain("B[Guérisseur]");
    expect(frResult).toContain("C([Éveil Spirituel])");
    expect(frResult).toContain("D[[Alchimie]]");
    expect(frResult).toContain('E["Transmutation Sacrée"]');
    expect(frResult).toContain("F((Union))");
    expect(frResult).not.toContain("Gift of the Mystic");
    expect(frResult).not.toContain("Celestial Flow");

    const enResult = filterMermaidByLocale(rawMermaid, "en");
    expect(enResult).toContain('A["Gift of the Mystic"]');
    expect(enResult).toContain("|Celestial Flow|");
    expect(enResult).toContain("B[Healer]");
    expect(enResult).toContain("C([Spiritual Awakening])");
    expect(enResult).toContain("D[[Alchemy]]");
    expect(enResult).toContain('E["Sacred Transmutation"]');
    expect(enResult).toContain("F((Unity))");
    expect(enResult).not.toContain("Don du Mystique");
    expect(enResult).not.toContain("Flux Céleste");
  });

  it("cleans and localizes bilingual diagram titles (cleanBilingualTitle)", () => {
    const rawTitle = "### 🇫🇷 Topologie Dynamique des Archétypes / 🇬🇧 Dynamic Topology of Archetypes";
    expect(cleanBilingualTitle(rawTitle, "fr")).toBe("Topologie Dynamique des Archétypes");
    expect(cleanBilingualTitle(rawTitle, "en")).toBe("Dynamic Topology of Archetypes");

    const simpleTitle = "Diagramme 1 : Vue d'ensemble";
    expect(cleanBilingualTitle(simpleTitle, "fr")).toBe("Diagramme 1 : Vue d'ensemble");
  });
});
