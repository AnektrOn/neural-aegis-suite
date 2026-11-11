import type {
  UserReportV3PackFiles,
  ReportSectionPair,
  UserReportMetadata,
  ParsedReportFrontmatter,
} from "../types";
import { parseFrontmatter } from "../parseReportMd";

export interface LevelPackFileEntry {
  filename: string;
  content: string;
  relativePath?: string;
}

export interface ParsedLevelPackResult {
  valid: boolean;
  level: number;
  levelCode: string;
  prismCode: string;
  scope: "intra" | "trans";
  title: string;
  glyph: string;
  hasSafeguard: boolean;
  safeguardSection: ReportSectionPair | null;
  sectionPairs: ReportSectionPair[];
  cleanFr: string;
  cleanEn: string;
  packFiles: UserReportV3PackFiles;
  metadata: UserReportMetadata;
  errors: string[];
  warnings: string[];
  quotaCheck: {
    passed: boolean;
    requiredMinChars: number;
    actualChars: number;
  };
}

/** Quotas minimaux recommandés selon le niveau clinique AEGIS V3.2 */
export const LEVEL_MIN_CHARS: Record<number, number> = {
  0: 15000,
  1: 25000,
  2: 50000,
  3: 75000,
  4: 90000,
  5: 110000,
  6: 130000,
  7: 150000,
  8: 180000,
  9: 200000,
};

/**
 * Normalise le nom d'un fichier pour matcher la nomenclature des 5 fichiers.
 */
function normalizeFileName(name: string): string {
  return name.trim().toLowerCase().replace(/^[0-9]+[-_.]?/, "").replace(/\.md$/i, "");
}

/**
 * Détecte le numéro de niveau (0 à 9+) depuis le chemin, nom de fichier ou frontmatter.
 */
export function detectLevelFromInput(
  pathOrName: string,
  frontmatterLevel?: unknown,
): { level: number; levelCode: string; scope: "intra" | "trans" } {
  // 1. Valeur numérique directe (ex: level: 2 ou level: "2")
  if (frontmatterLevel !== undefined && frontmatterLevel !== null && frontmatterLevel !== "") {
    const parsedNum = Number(frontmatterLevel);
    if (!isNaN(parsedNum)) {
      const lvl = Math.max(0, Math.min(9, Math.floor(parsedNum)));
      return {
        level: lvl,
        levelCode: `LEVEL_${lvl}`,
        scope: lvl <= 3 ? "intra" : "trans",
      };
    }
  }

  // 2. Recherche de motif LEVEL_X ou TIER_X dans frontmatter ou dans le chemin
  const combined = `${String(frontmatterLevel || "")} ${pathOrName}`.toUpperCase();

  const match = combined.match(/LEVEL[-_ ]?([0-9]+)(\+)?/);
  if (match) {
    const num = parseInt(match[1], 10);
    const clamped = Math.max(0, num);
    const code = match[2] ? `LEVEL_${clamped}+` : `LEVEL_${clamped}`;
    return {
      level: clamped,
      levelCode: code,
      scope: clamped <= 3 ? "intra" : "trans",
    };
  }

  const tierMatch = combined.match(/TIER[-_ ]?([0-9]+)/);
  if (tierMatch) {
    const num = parseInt(tierMatch[1], 10);
    return {
      level: num,
      levelCode: `LEVEL_${num}`,
      scope: num <= 3 ? "intra" : "trans",
    };
  }

  return {
    level: 0,
    levelCode: "LEVEL_0",
    scope: "intra",
  };
}

/**
 * Détecte le prisme (MYSS, JUNG, TAO, BLAVATSKY, etc.).
 */
export function detectPrismFromInput(input: string, frontmatterPrism?: unknown): string {
  if (typeof frontmatterPrism === "string" && frontmatterPrism.trim()) {
    return frontmatterPrism.trim().toUpperCase();
  }
  const str = input.toUpperCase();
  if (str.includes("MYSS") || str.includes("ARCHETYPE")) return "MYSS";
  if (str.includes("JUNG") || str.includes("INCONSCIENT")) return "JUNG";
  if (str.includes("TAO") || str.includes("WU_XING") || str.includes("WUXING")) return "TAO";
  if (str.includes("BLAVATSKY")) return "BLAVATSKY";
  if (str.includes("TRANS") || str.includes("HOLISTIC") || str.includes("GLOBAL")) return "TRANS_PRISM";
  return "MYSS";
}

/**
 * Vérifie si une chaîne contient la section 0. Safeguard Épistémique.
 */
export function checkHasSafeguard(content: string): boolean {
  return (
    /0\.\s*(safeguard\s*épistémique|safeguard\s*epistemique|epistemic\s*safeguard)/i.test(content) ||
    /safeguard\s*épistémique|safeguard\s*epistemique/i.test(content) ||
    /\[aegis\s*v3(\.[0-9]+)?\s*ontology\s*firewall/i.test(content)
  );
}

/**
 * Découpeur Miroir Paragraphe par Paragraphe pour 00_RAPPORT.md.
 * Détecte les blocs `### 🇫🇷 [Titre]` et `### 🇬🇧 [Titre]` ou `## [Titre] / [Title]`
 */
export function parseBilingualMirrorSections(markdown: string): {
  sectionPairs: ReportSectionPair[];
  safeguardSection: ReportSectionPair | null;
  cleanFr: string;
  cleanEn: string;
} {
  const lines = markdown.split("\n");
  const sectionPairs: ReportSectionPair[] = [];
  let safeguardSection: ReportSectionPair | null = null;

  // Découpage par H2 (## ) comme unités majeures
  const h2Indices: Array<{ index: number; title: string }> = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^##\s+(.+)$/);
    if (m) {
      h2Indices.push({ index: i, title: m[1].trim() });
    }
  }

  // S'il n'y a pas de H2, découpons par H1
  if (h2Indices.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const m = line.match(/^#\s+(.+)$/);
      if (m && !line.startsWith("###")) {
        h2Indices.push({ index: i, title: m[1].trim() });
      }
    }
  }

  // Traiter chaque chunk de section
  const chunks: Array<{ rawTitle: string; contentLines: string[] }> = [];
  if (h2Indices.length > 0) {
    // Éventuel prologue avant le 1er H2
    if (h2Indices[0].index > 0) {
      const prologueLines = lines.slice(0, h2Indices[0].index);
      if (prologueLines.some((l) => l.trim().length > 0)) {
        chunks.push({ rawTitle: "Introduction", contentLines: prologueLines });
      }
    }
    for (let k = 0; k < h2Indices.length; k++) {
      const start = h2Indices[k].index + 1;
      const end = k + 1 < h2Indices.length ? h2Indices[k + 1].index : lines.length;
      chunks.push({
        rawTitle: h2Indices[k].title,
        contentLines: lines.slice(start, end),
      });
    }
  } else {
    chunks.push({ rawTitle: "Rapport", contentLines: lines });
  }

  // Analyser chaque chunk pour séparer FR et EN
  for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
    const chunk = chunks[cIdx];
    const chunkId = `sec-${cIdx + 1}`;
    const rawTitle = chunk.rawTitle;
    const isSafeguard = checkHasSafeguard(rawTitle) || (cIdx === 0 && checkHasSafeguard(chunk.contentLines.join("\n")));

    // Découper le titre s'il contient " / "
    let titleFr = rawTitle;
    let titleEn = rawTitle;
    if (rawTitle.includes(" / ")) {
      const parts = rawTitle.split(/\s+\/\s+/);
      if (parts.length >= 2) {
        titleFr = parts[0].trim();
        titleEn = parts.slice(1).join(" / ").trim();
      }
    }

    // Séparer les lignes FR et EN dans le corps
    const frLines: string[] = [];
    const enLines: string[] = [];
    let currentLang: "fr" | "en" | "neutral" = "neutral";

    for (const line of chunk.contentLines) {
      const trimmed = line.trim();
      
      // Détecteurs de langue stricts V3.2
      if (/^(?:###|####|\*\*)\s*(?:🇫🇷|\(FR\)|Français|FR\s*:)/i.test(trimmed)) {
        currentLang = "fr";
        const subTitle = trimmed.replace(/^(?:###|####|\*\*)\s*(?:🇫🇷|\(FR\)|Français|FR\s*:)\s*/i, "").replace(/\*\*$/, "").trim();
        if (subTitle) frLines.push(`### ${subTitle}`);
        continue;
      }
      if (/^(?:###|####|\*\*)\s*(?:🇬🇧|🇺🇸|\(EN\)|English|EN\s*:)/i.test(trimmed)) {
        currentLang = "en";
        const subTitle = trimmed.replace(/^(?:###|####|\*\*)\s*(?:🇬🇧|🇺🇸|\(EN\)|English|EN\s*:)\s*/i, "").replace(/\*\*$/, "").trim();
        if (subTitle) enLines.push(`### ${subTitle}`);
        continue;
      }

      if (currentLang === "fr") {
        frLines.push(line);
      } else if (currentLang === "en") {
        enLines.push(line);
      } else {
        // Neutre (intro, métadonnées, séparateur) : injecté dans les deux
        frLines.push(line);
        enLines.push(line);
      }
    }

    const contentFr = frLines.join("\n").trim();
    const contentEn = enLines.join("\n").trim() || contentFr; // Fallback to FR if EN is empty

    const pair: ReportSectionPair = {
      id: chunkId,
      title_fr: titleFr,
      title_en: titleEn,
      content_fr: contentFr,
      content_en: contentEn,
      is_safeguard: isSafeguard,
    };

    if (isSafeguard && !safeguardSection) {
      safeguardSection = pair;
    }
    sectionPairs.push(pair);
  }

  // Construction de versions FR et EN complètes et propres
  const cleanFrParts: string[] = [];
  const cleanEnParts: string[] = [];

  for (const pair of sectionPairs) {
    cleanFrParts.push(`## ${pair.title_fr}\n\n${pair.content_fr}`);
    cleanEnParts.push(`## ${pair.title_en}\n\n${pair.content_en}`);
  }

  return {
    sectionPairs,
    safeguardSection,
    cleanFr: cleanFrParts.join("\n\n---\n\n"),
    cleanEn: cleanEnParts.join("\n\n---\n\n"),
  };
}

/**
 * Parseur principal d'un pack de fichiers V3.2 (dossier LEVEL_X ou fichiers sélectionnés).
 */
export function parseLevelPack(
  files: LevelPackFileEntry[],
  folderPathOrName = "",
): ParsedLevelPackResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let rapportMd = "";
  let resumeMd = "";
  let bulletPointsMd = "";
  let graphiqueMd = "";
  let promptAiMd = "";

  // Classification des fichiers
  for (const file of files) {
    const rawName = file.filename;
    const norm = normalizeFileName(rawName);

    if (
      norm.includes("rapport") ||
      /^00/.test(rawName) ||
      norm === "report" ||
      norm.includes("cartographie") ||
      /diag/i.test(norm)
    ) {
      if (!rapportMd) rapportMd = file.content;
    } else if (
      norm.includes("resume") ||
      norm.includes("synth") ||
      /^01/.test(rawName) ||
      norm === "summary" ||
      norm.includes("global")
    ) {
      if (!resumeMd) resumeMd = file.content;
    } else if (
      norm.includes("bullet") ||
      norm.includes("axiome") ||
      norm.includes("levier") ||
      /^02/.test(rawName) ||
      norm.includes("action")
    ) {
      if (!bulletPointsMd) bulletPointsMd = file.content;
    } else if (
      norm.includes("graph") ||
      norm.includes("mermaid") ||
      /^03/.test(rawName) ||
      norm === "diagram" ||
      norm.includes("visuel")
    ) {
      if (!graphiqueMd) graphiqueMd = file.content;
    } else if (
      norm.includes("prompt") ||
      norm.includes("ai") ||
      /^04/.test(rawName) ||
      norm === "console"
    ) {
      if (!promptAiMd) promptAiMd = file.content;
    }
  }

  // Fallback 1 : si un seul fichier .md est fourni, on l'utilise comme rapport principal
  if (!rapportMd && files.length === 1 && files[0].filename.endsWith(".md")) {
    rapportMd = files[0].content;
    warnings.push("Un seul fichier Markdown fourni : utilisé comme 00_RAPPORT.md (mode partiel).");
  }

  // Fallback 2 : si aucun fichier 'rapport' explicite, prendre le plus dense en caractères
  if (!rapportMd && files.length > 0) {
    const sorted = [...files].sort((a, b) => (b.content?.length || 0) - (a.content?.length || 0));
    rapportMd = sorted[0]?.content || "";
    if (sorted[0]?.filename) {
      warnings.push(`Rapport principal assigné au fichier le plus dense : ${sorted[0].filename}.`);
    }
  }

  if (!rapportMd) {
    errors.push("Fichier principal '00_RAPPORT.md' introuvable dans le pack.");
  }

  // Frontmatter parsing sur 00_RAPPORT.md
  const { frontmatter, body } = parseFrontmatter(rapportMd);
  const mainMarkdown = body || rapportMd;

  // Détection du Level & Scope
  const { level, levelCode, scope } = detectLevelFromInput(
    folderPathOrName || (frontmatter.slug as string) || (frontmatter.title as string) || "",
    frontmatter.level ?? frontmatter.tier,
  );

  // Détection du Prisme
  const prismCode = detectPrismFromInput(
    folderPathOrName || (frontmatter.orientation as string) || "",
    frontmatter.prism ?? frontmatter.prism_code,
  );

  // Titre & Glyphe
  const title =
    (frontmatter.title as string) ||
    (frontmatter.titre as string) ||
    `Diagnostic ${levelCode} · ${prismCode}`;
  const glyph =
    (frontmatter.glyph as string) ||
    (frontmatter.glyphe as string) ||
    (scope === "trans" ? "✦" : "⚖️");

  // Vérification Safeguard Épistémique
  const hasSafeguard = checkHasSafeguard(mainMarkdown);
  if (!hasSafeguard) {
    warnings.push("Section '0. Safeguard Épistémique' absente ou non détectée dans 00_RAPPORT.md.");
  }

  // Découpage Miroir
  const { sectionPairs, safeguardSection, cleanFr, cleanEn } = parseBilingualMirrorSections(mainMarkdown);

  // Détection des diagrammes Mermaid sur l'ensemble des fichiers du dossier
  const combinedAllContent = files.map((f) => f.content).join("\n\n");
  const mermaidMatches = combinedAllContent.match(/```\s*mermaid/gi) || [];
  const detectedDiagramsCount = mermaidMatches.length;

  // Si graphiqueMd est vide mais des diagrammes existent dans le pack, on les extrait
  if (!graphiqueMd && detectedDiagramsCount > 0) {
    const mermaidBlocks = combinedAllContent.match(/```\s*mermaid[\s\S]*?```/gi);
    if (mermaidBlocks) {
      graphiqueMd = mermaidBlocks.join("\n\n");
    }
  }

  // Quotas & Métriques
  const totalChars = (rapportMd + resumeMd + bulletPointsMd + graphiqueMd + promptAiMd).length;
  const wordCount = mainMarkdown.trim().split(/\s+/).filter(Boolean).length;
  const requiredMinChars = LEVEL_MIN_CHARS[level] ?? 20000;
  const passedQuota = totalChars >= requiredMinChars;

  if (!passedQuota && rapportMd.length > 0) {
    warnings.push(
      `Le volume de caractères (${totalChars.toLocaleString("fr-FR")} car.) est inférieur au quota standard pour ${levelCode} (${requiredMinChars.toLocaleString("fr-FR")} car. min).`,
    );
  }

  // Pack Files consolidé
  const packFiles: UserReportV3PackFiles = {
    rapport_md: rapportMd,
    resume_md: resumeMd || undefined,
    bullet_points_md: bulletPointsMd || undefined,
    graphique_md: graphiqueMd || undefined,
    prompt_ai_md: promptAiMd || undefined,
  };

  const metadata: UserReportMetadata = {
    char_count_total: totalChars,
    char_count_fr: cleanFr.length,
    char_count_en: cleanEn.length,
    word_count_total: wordCount,
    estimated_tokens: Math.round(totalChars / 3.8),
    reading_time_minutes: Math.ceil(wordCount / 200),
    detected_diagrams_count: detectedDiagramsCount,
    has_safeguard_epistemique: hasSafeguard,
    version: "3.2",
  };

  return {
    valid: errors.length === 0,
    level,
    levelCode,
    prismCode,
    scope,
    title,
    glyph,
    hasSafeguard,
    safeguardSection,
    sectionPairs,
    cleanFr,
    cleanEn,
    packFiles,
    metadata,
    errors,
    warnings,
    quotaCheck: {
      passed: passedQuota,
      requiredMinChars,
      actualChars: totalChars,
    },
  };
}
