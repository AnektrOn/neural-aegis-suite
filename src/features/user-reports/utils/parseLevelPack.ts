import type {
  UserReportV3PackFiles,
  ReportSectionPair,
  UserReportMetadata,
  ParsedReportFrontmatter,
} from "../types";
import { parseFrontmatter, extractBilingualContent, filterMarkdownByLocale } from "../parseReportMd";

export interface LevelPackFileEntry {
  filename: string;
  content: string;
  relativePath?: string;
}

export interface ParsedDiagramEntry {
  id: string;
  index: number;
  title: string;
  type: "flowchart" | "stateDiagram" | "xychart" | "classDiagram" | "pie" | "sequence" | "diagram";
  typeLabel: string;
  mermaidSource: string;
  lang?: "fr" | "en" | "neutral";
  companionTextFr?: string;
  companionTextEn?: string;
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
 * Vérifie si une chaîne contient la section 0. Safeguard Épistémique ou Notice Clinique.
 */
export function checkHasSafeguard(content: string): boolean {
  if (!content) return false;
  return (
    /0\.\s*(safeguard\s*épistémique|safeguard\s*epistemique|epistemic\s*safeguard)/i.test(content) ||
    /safeguard\s*(?:épistémique|epistemique|deontologique|déontologique|clinique)/i.test(content) ||
    /epistemic\s*safeguard/i.test(content) ||
    /notice\s*clinique/i.test(content) ||
    /cadre\s*(?:déontologique|deontologique)/i.test(content) ||
    /\[aegis\s*v3(\.[0-9]+)?\s*ontology\s*firewall/i.test(content) ||
    /loi\s*aegis|lois\s*aegis/i.test(content)
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
  const { body } = parseFrontmatter(markdown);
  const cleanMarkdown = (body || markdown).trim();
  const lines = cleanMarkdown.split("\n");
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
      // Nettoyer les lignes d'en-tête de document H1 et les artefacts "Partie X"
      const filteredPrologueLines = prologueLines.filter((l) => {
        const tr = l.trim();
        if (/^#\s+/.test(tr) && !tr.startsWith("###")) return false; // H1 document title
        if (/^Partie\s*\d*$/i.test(tr) || /^Part\s*\d*$/i.test(tr)) return false; // "Partie 2" lone artifact
        return true;
      });
      const prologueText = filteredPrologueLines.join("\n").trim();

      if (checkHasSafeguard(prologueText)) {
        const biling = extractBilingualContent(prologueText);
        safeguardSection = {
          id: "sec-safeguard-preamble",
          title_fr: "Notice Clinique & Cadre Déontologique",
          title_en: "Clinical Notice & Ethical Framework",
          content_fr: biling.fr || prologueText,
          content_en: biling.hasEn ? biling.en : biling.fr || prologueText,
          is_safeguard: true,
        };
      } else if (prologueText.length > 30) {
        chunks.push({ rawTitle: "Introduction", contentLines: filteredPrologueLines });
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
    const cleanRawTitle = rawTitle.replace(/^Partie\s*\d*\s*[-:—.]\s*/i, "").replace(/^Part\s*\d*\s*[-:—.]\s*/i, "").trim() || rawTitle;
    const isSafeguard = checkHasSafeguard(cleanRawTitle) || checkHasSafeguard(chunk.contentLines.join("\n"));

    // Découper le titre s'il contient " / "
    let titleFr = cleanRawTitle;
    let titleEn = cleanRawTitle;
    if (cleanRawTitle.includes(" / ")) {
      const parts = cleanRawTitle.split(/\s+\/\s+/);
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
 * Détecte le type d'un diagramme Mermaid à partir de sa première instruction.
 */
function detectDiagramType(source: string): {
  type: ParsedDiagramEntry["type"];
  label: string;
} {
  const s = source.trim();
  if (/^flowchart|^graph\s+(?:TD|TB|BT|RL|LR)/i.test(s)) {
    return { type: "flowchart", label: "Flowchart · Flux Dynamique" };
  }
  if (/^stateDiagram/i.test(s)) {
    return { type: "stateDiagram", label: "State Diagram · États Cliniques" };
  }
  if (/^xychart/i.test(s)) {
    return { type: "xychart", label: "XY-Chart · Métrique Polaire" };
  }
  if (/^classDiagram/i.test(s)) {
    return { type: "classDiagram", label: "Class Diagram · Modèle Ontologique" };
  }
  if (/^pie/i.test(s)) {
    return { type: "pie", label: "Pie Chart · Répartition" };
  }
  if (/^sequenceDiagram/i.test(s)) {
    return { type: "sequence", label: "Sequence · Flux Temporel" };
  }
  return { type: "diagram", label: "Diagramme Topologique" };
}

function detectDiagramLanguage(title: string, companion: string, source: string): "fr" | "en" | "neutral" {
  const combined = `${title} ${companion}`.toLowerCase();
  if (/🇫🇷|\(fr\)|français|francais/i.test(combined)) return "fr";
  if (/🇬🇧|🇺🇸|\(en\)|english/i.test(combined)) return "en";

  // Score language in title and source
  if (/🇫🇷|\(fr\)/i.test(source)) return "fr";
  if (/🇬🇧|🇺🇸|\(en\)/i.test(source)) return "en";

  return "neutral";
}

/**
 * Traduit et filtre les labels bilingues dans le code source Mermaid.
 * Remplace les motifs `["Texte FR / English Text"]`, `|Texte FR / English Text|`, `[Texte FR / English Text]`
 * par la version correspondant à la langue demandée (fr ou en).
 */
export function filterMermaidByLocale(source: string, locale: "fr" | "en"): string {
  if (!source) return "";

  const cleanFlagText = (text: string): string => {
    return text.replace(/^[🇫🇷🇬🇧🇺🇸\s:—\-·]+/, "").trim();
  };

  const lines = source.split("\n");
  const filteredLines: string[] = [];

  for (const line of lines) {
    let updatedLine = line;

    // Ne pas toucher aux commentaires purement techniques, styles, ou URLs
    if (/^\s*%%(?!\s*(?:@tip|title|description|accTitle))/i.test(updatedLine)) {
      filteredLines.push(updatedLine);
      continue;
    }

    // 1. Quoted labels: "left / right" or 'left / right' or with flags / <br/>
    // Matches: "🇫🇷 Text FR<br/>🇬🇧 Text EN" or "🇫🇷 Text FR / 🇬🇧 Text EN" or "Text FR / Text EN"
    updatedLine = updatedLine.replace(/(["'])([^"'\n]+?)\1/g, (match, quote, inner) => {
      if (/https?:|www\./i.test(inner)) return match;

      // Cas 1.1: Présence explicite des drapeaux 🇫🇷 et (🇬🇧 ou 🇺🇸)
      if (inner.includes("🇫🇷") && (inner.includes("🇬🇧") || inner.includes("🇺🇸"))) {
        const parts = inner.split(/(?:<br\s*\/?>|\n|\s*\/\s*|\s*\/\/\s*)+/i);
        const frPart = parts.find((p: string) => p.includes("🇫🇷"));
        const enPart = parts.find((p: string) => p.includes("🇬🇧") || p.includes("🇺🇸"));
        if (locale === "fr" && frPart) {
          return `${quote}${cleanFlagText(frPart)}${quote}`;
        }
        if (locale === "en" && enPart) {
          return `${quote}${cleanFlagText(enPart)}${quote}`;
        }
      }

      // Cas 1.2: Séparateur slash "left / right" ou "left // right"
      const slashMatch = inner.match(/^([^/]+?)\s*(?:\/|\/\/)\s*([^/]+)$/);
      if (slashMatch) {
        const left = slashMatch[1].trim();
        const right = slashMatch[2].trim();
        const chosen = locale === "en" ? cleanFlagText(right) : cleanFlagText(left);
        return `${quote}${chosen}${quote}`;
      }

      return match;
    });

    // 2. Edge labels with pipe: |left / right|
    updatedLine = updatedLine.replace(/\|([^|\n]+?)\s*(?:\/|\/\/)\s*([^|\n]+?)\|/g, (match, left, right) => {
      if (/https?:/i.test(match)) return match;
      const chosen = locale === "en" ? cleanFlagText(right.trim()) : cleanFlagText(left.trim());
      return `|${chosen}|`;
    });

    // 3. Formes spéciales imbriquées (Stadium [(), Subroutine [[]], Cylinder [()], Circle (()), Hexagon {{}})
    // Stadium: ([left / right])
    updatedLine = updatedLine.replace(/\(\[([^"'\n\[\]\(\)]+?)\s*(?:\/|\/\/)\s*([^"'\n\[\]\(\)]+?)\]\)/g, (_, l, r) => {
      const chosen = locale === "en" ? cleanFlagText(r.trim()) : cleanFlagText(l.trim());
      return `([${chosen}])`;
    });

    // Subroutine: [[left / right]]
    updatedLine = updatedLine.replace(/\[\[([^"'\n\[\]]+?)\s*(?:\/|\/\/)\s*([^"'\n\[\]]+?)\]\]/g, (_, l, r) => {
      const chosen = locale === "en" ? cleanFlagText(r.trim()) : cleanFlagText(l.trim());
      return `[[${chosen}]]`;
    });

    // Cylinder: [(left / right)]
    updatedLine = updatedLine.replace(/\[\(([^"'\n\[\]\(\)]+?)\s*(?:\/|\/\/)\s*([^"'\n\[\]\(\)]+?)\)\]/g, (_, l, r) => {
      const chosen = locale === "en" ? cleanFlagText(r.trim()) : cleanFlagText(l.trim());
      return `[(${chosen})]`;
    });

    // Circle: ((left / right))
    updatedLine = updatedLine.replace(/\(\(([^"'\n\(\)]+?)\s*(?:\/|\/\/)\s*([^"'\n\(\)]+?)\)\)/g, (_, l, r) => {
      const chosen = locale === "en" ? cleanFlagText(r.trim()) : cleanFlagText(l.trim());
      return `((${chosen}))`;
    });

    // Hexagon: {{left / right}}
    updatedLine = updatedLine.replace(/\{\{([^"'\n\{\}]+?)\s*(?:\/|\/\/)\s*([^"'\n\{\}]+?)\}\}/g, (_, l, r) => {
      const chosen = locale === "en" ? cleanFlagText(r.trim()) : cleanFlagText(l.trim());
      return `{{${chosen}}}`;
    });

    // Asymmetric: >left / right]
    updatedLine = updatedLine.replace(/>([^"'\n\[\]>]+?)\s*(?:\/|\/\/)\s*([^"'\n\[\]>]+?)\]/g, (_, l, r) => {
      const chosen = locale === "en" ? cleanFlagText(r.trim()) : cleanFlagText(l.trim());
      return `>${chosen}]`;
    });

    // 4. Formes standards simples sans guillemets
    // Square brackets: [left / right]
    updatedLine = updatedLine.replace(/\[([^"'\n\[\]\(\)\{\}]+?)\s*(?:\/|\/\/)\s*([^"'\n\[\]\(\)\{\}]+?)\]/g, (match, left, right) => {
      if (/https?:/i.test(match)) return match;
      const chosen = locale === "en" ? cleanFlagText(right.trim()) : cleanFlagText(left.trim());
      return `[${chosen}]`;
    });

    // Parentheses: (left / right)
    updatedLine = updatedLine.replace(/\(([^"'\n\(\)\[\]\{\}]+?)\s*(?:\/|\/\/)\s*([^"'\n\(\)\[\]\{\}]+?)\)/g, (match, left, right) => {
      if (/https?:/i.test(match)) return match;
      const chosen = locale === "en" ? cleanFlagText(right.trim()) : cleanFlagText(left.trim());
      return `(${chosen})`;
    });

    // Curly braces: {left / right}
    updatedLine = updatedLine.replace(/\{([^"'\n\{\}\[\]\(\)]+?)\s*(?:\/|\/\/)\s*([^"'\n\{\}\[\]\(\)]+?)\}/g, (match, left, right) => {
      if (/https?:/i.test(match)) return match;
      const chosen = locale === "en" ? cleanFlagText(right.trim()) : cleanFlagText(left.trim());
      return `{${chosen}}`;
    });

    filteredLines.push(updatedLine);
  }

  return filteredLines.join("\n");
}

/**
 * Nettoie et sélectionne la langue appropriée pour les titres bilingues de diagrammes.
 * Ex: "🇫🇷 Topologie Dynamique / 🇬🇧 Dynamic Topology" -> FR: "Topologie Dynamique", EN: "Dynamic Topology"
 */
export function cleanBilingualTitle(title: string, locale: "fr" | "en"): string {
  if (!title) return "";

  const cleanFlags = (s: string) =>
    s
      .replace(/^#{1,6}\s*/, "")
      .replace(/^\*\*(.*)\*\*$/, "$1")
      .replace(/^[🇫🇷🇬🇧🇺🇸\s:—\-·]+/, "")
      .trim();

  if (title.includes(" / ") || title.includes(" // ")) {
    const parts = title.split(/\s*(?:\/|\/\/)\s*/);
    if (parts.length >= 2) {
      const chosen = locale === "en" ? parts[1] : parts[0];
      return cleanFlags(chosen);
    }
  }

  // Présence de drapeaux explicites
  if (title.includes("🇫🇷") && (title.includes("🇬🇧") || title.includes("🇺🇸"))) {
    const parts = title.split(/(?:<br\s*\/?>|\n|\s*\/\s*|\s*\/\/\s*)+/i);
    const frPart = parts.find((p) => p.includes("🇫🇷"));
    const enPart = parts.find((p) => p.includes("🇬🇧") || p.includes("🇺🇸"));
    if (locale === "fr" && frPart) return cleanFlags(frPart);
    if (locale === "en" && enPart) return cleanFlags(enPart);
  }

  return cleanFlags(title);
}

function cleanHeadingTitle(headingLine: string, fallbackIndex: number): string {
  const cleaned = headingLine
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\*\*(.*)\*\*$/, "$1")
    .replace(/^Diagramme\s*\d*\s*[-:—.]\s*/i, "")
    .replace(/^\d+\.\s*/, "")
    .trim();
  return cleaned || `Diagramme ${fallbackIndex}`;
}

/**
 * Extrait et structure les blocs Mermaid de 03_GRAPHIQUE.md ou du rapport complet.
 */
export function parseMermaidDiagrams(graphiqueMd: string): ParsedDiagramEntry[] {
  if (!graphiqueMd || !graphiqueMd.trim()) return [];

  const { body } = parseFrontmatter(graphiqueMd);
  const text = (body || graphiqueMd).trim();

  const regex = /```\s*mermaid\s*([\s\S]*?)```/gi;
  const matches: Array<{ start: number; end: number; source: string }> = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: regex.lastIndex,
      source: match[1].trim(),
    });
  }

  // Fallback si la syntaxe Mermaid est brute sans les balises ```mermaid
  if (matches.length === 0 && /^(?:flowchart|graph\s+|stateDiagram|xychart|classDiagram|pie|sequenceDiagram)/im.test(text)) {
    const rawType = detectDiagramType(text);
    return [
      {
        id: "diag-1",
        index: 1,
        title: "Modélisation Topologique Principale",
        type: rawType.type,
        typeLabel: rawType.label,
        mermaidSource: text,
        lang: "neutral",
      },
    ];
  }

  const companionTexts: string[] = new Array(matches.length).fill("");
  const titles: string[] = new Array(matches.length).fill("");

  // Détection des titres et légendes entre diagrammes successifs
  for (let i = 0; i < matches.length; i++) {
    const prevEnd = i === 0 ? 0 : matches[i - 1].end;
    const interText = text.slice(prevEnd, matches[i].start).trim();

    if (i === 0) {
      const headingLines = interText.split("\n").filter((l) => /^(?:#{1,6}\s+|\*\*[^*]+\*\*)/.test(l.trim()));
      titles[0] = headingLines.length > 0 ? cleanHeadingTitle(headingLines[headingLines.length - 1], 1) : "Diagramme 1";
    } else {
      const lines = interText.split("\n");
      let headingIndex = -1;
      for (let j = lines.length - 1; j >= 0; j--) {
        if (/^(?:#{1,6}\s+|\*\*[^*]+\*\*)/.test(lines[j].trim())) {
          headingIndex = j;
          break;
        }
      }

      if (headingIndex !== -1) {
        companionTexts[i - 1] = lines.slice(0, headingIndex).join("\n").trim();
        titles[i] = cleanHeadingTitle(lines[headingIndex], i + 1);
      } else {
        companionTexts[i - 1] = interText;
        titles[i] = `Diagramme ${i + 1}`;
      }
    }
  }

  if (matches.length > 0) {
    companionTexts[matches.length - 1] = text.slice(matches[matches.length - 1].end).trim();
  }

  const diagrams: ParsedDiagramEntry[] = [];

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const { type, label } = detectDiagramType(m.source);
    const companion = companionTexts[i];
    const bilingualCompanion = companion ? extractBilingualContent(companion) : null;
    const diagTitle = titles[i] || `Diagramme ${i + 1}`;
    const diagLang = detectDiagramLanguage(diagTitle, companion || "", m.source);

    diagrams.push({
      id: `diag-${i + 1}`,
      index: i + 1,
      title: diagTitle,
      type,
      typeLabel: label,
      mermaidSource: m.source,
      lang: diagLang,
      companionTextFr: bilingualCompanion?.fr || companion,
      companionTextEn: bilingualCompanion?.en || companion,
    });
  }

  return diagrams;
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
    folderPathOrName || (frontmatter.orientation as string) || (frontmatter.oeuvre as string) || "",
    frontmatter.prism ?? frontmatter.prism_code ?? frontmatter.prisme,
  );

  // Titre & Glyphe
  // Détecte si le markdown principal contient un titre H1 (ex: # ✨ RAPPORT CLINIQUE LEVEL 1...)
  const h1Match = mainMarkdown.match(/^#\s+(.+)$/m);
  const detectedH1 = h1Match ? h1Match[1].replace(/^[✨✦⚖️🛡️]\s*/, "").trim() : "";

  const title =
    (frontmatter.title as string) ||
    (frontmatter.titre as string) ||
    (detectedH1 ? detectedH1 : "") ||
    (frontmatter.nom_affiche ? `Diagnostic ${levelCode} · ${frontmatter.nom_affiche}` : "") ||
    `Diagnostic ${levelCode} · ${prismCode}`;
  const glyph =
    (frontmatter.glyph as string) ||
    (frontmatter.glyphe as string) ||
    (scope === "trans" ? "✦" : "⚖️");

  // Découpage Miroir
  const { sectionPairs, safeguardSection, cleanFr, cleanEn } = parseBilingualMirrorSections(mainMarkdown);

  // Vérification Safeguard Épistémique
  const hasSafeguard = checkHasSafeguard(mainMarkdown) || Boolean(safeguardSection);
  if (!hasSafeguard) {
    warnings.push("Section '0. Safeguard Épistémique' absente ou non détectée dans 00_RAPPORT.md.");
  }

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
