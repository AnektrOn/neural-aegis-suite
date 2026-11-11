import type { ParsedReportFrontmatter } from "./types";

/** Parses key-value YAML strings (strings, numbers, booleans, and simple `[a, b]` arrays). */
function parseYamlKeyValues(raw: string): ParsedReportFrontmatter {
  const fm: Record<string, unknown> = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || (trimmed.startsWith("#") && !trimmed.startsWith("# "))) continue;
    const kv = trimmed.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let value: unknown = kv[2].trim();
    if (typeof value === "string") {
      // strip surrounding quotes
      value = value.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
      // numeric check
      if (/^-?\d+(\.\d+)?$/.test(value)) {
        value = Number(value);
      } else if (value.toLowerCase() === "true") {
        value = true;
      } else if (value.toLowerCase() === "false") {
        value = false;
      } else if (value.startsWith("[") && value.endsWith("]")) {
        // array literal
        value = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1"))
          .filter(Boolean);
      }
    }
    fm[key] = value;
  }
  return fm as ParsedReportFrontmatter;
}

/** 
 * YAML frontmatter parser supporting:
 * 1. Standard `---` fences
 * 2. ````yaml ... ```` fences
 * 3. Unfenced key-value pairs at the beginning of the file (e.g. `user: "note" \n nom_affiche: "Note" ...`)
 */
export function parseFrontmatter(md: string): {
  frontmatter: ParsedReportFrontmatter;
  body: string;
} {
  if (!md) return { frontmatter: {}, body: "" };
  const cleanMd = md.replace(/^\uFEFF/, "");

  // 1. Standard --- fence
  const mFenced = cleanMd.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (mFenced) {
    return {
      frontmatter: parseYamlKeyValues(mFenced[1]),
      body: mFenced[2],
    };
  }

  // 2. Code-fenced ```yaml ... ```
  const mCode = cleanMd.match(/^```(?:yaml|yml)?\s*\n([\s\S]*?)\n```\s*\n?([\s\S]*)$/i);
  if (mCode) {
    return {
      frontmatter: parseYamlKeyValues(mCode[1]),
      body: mCode[2],
    };
  }

  // 3. Unfenced key-value pairs at the beginning of the file
  const lines = cleanMd.split("\n");
  const kvLines: string[] = [];
  let bodyStartIndex = 0;
  let inKv = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!inKv && trimmed === "") {
      bodyStartIndex = i + 1;
      continue;
    }

    // Comment before or within KV block
    if (trimmed.startsWith("#") && !trimmed.startsWith("# ") && !trimmed.startsWith("##")) {
      kvLines.push(trimmed);
      continue;
    }

    // Markdown heading or horizontal rule ends frontmatter
    if (/^(?:#{1,6}\s+|---|\*\*\*|___)/.test(trimmed)) {
      bodyStartIndex = i;
      break;
    }

    // Match key: value
    const kvMatch = trimmed.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      // Avoid false positive on narrative sentences
      if (key.length <= 40) {
        inKv = true;
        kvLines.push(trimmed);
        bodyStartIndex = i + 1;
        continue;
      }
    }

    if (inKv && trimmed === "") {
      // Look ahead to see if more KV follows
      let nextIsKv = false;
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const next = lines[j].trim();
        if (!next) continue;
        if (/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/.test(next) && !/^(?:#{1,6}\s+)/.test(next)) {
          nextIsKv = true;
        }
        break;
      }
      if (nextIsKv) {
        continue;
      }
    }

    // Non-KV line encountered: stop
    if (inKv) {
      bodyStartIndex = i;
    }
    break;
  }

  if (inKv && kvLines.length >= 2) {
    const body = lines.slice(bodyStartIndex).join("\n").trim();
    return {
      frontmatter: parseYamlKeyValues(kvLines.join("\n")),
      body,
    };
  }

  return { frontmatter: {}, body: cleanMd };
}

/**
 * Filter Markdown body by locale.
 *
 * Reports use language markers such as `🇫🇷`, `🇬🇧`, `(FR)`, `(EN)`,
 * `Français`, `English`, either on a Markdown heading OR as a standalone
 * (bold) label paragraph. Every line following a marker belongs to that
 * language until either the next marker OR a top-level heading (# / ##)
 * without a marker resets the mode to neutral.
 *
 * Neutral content (no marker seen yet, or after a reset) is always kept.
 * Marker lines themselves are stripped so the reader never sees the flag.
 */
export function filterMarkdownByLocale(md: string, locale: "fr" | "en"): string {
  const other: "fr" | "en" = locale === "fr" ? "en" : "fr";

  const detectMarker = (line: string): "fr" | "en" | null => {
    if (/🇫🇷|\(FR\)|\bFR\s*[:\/\)]|Français|Francais/i.test(line)) return "fr";
    if (/🇬🇧|🇺🇸|\(EN\)|\bEN\s*[:\/\)]|English/i.test(line)) return "en";
    return null;
  };

  const scoreLang = (text: string): { fr: number; en: number } => {
    const t = " " + text.toLowerCase() + " ";
    const frAccents = (t.match(/[àâçéèêëîïôùûüœ]/g) || []).length;
    const frWords = (t.match(/\s(le|la|les|des|du|de|un|une|et|ou|est|sont|dans|pour|avec|sur|par|aux?|ce|cette|ces|qui|que|se|sa|son|ses|nous|vous|ils|elles|mais|pas|plus|non|oui|au|aussi|donc|entre|vers|chez|sans)\s/g) || []).length;
    const enWords = (t.match(/\s(the|and|of|is|are|was|were|with|for|from|this|that|these|those|it|its|as|at|by|on|in|to|be|been|has|have|had|not|but|or|an|a|which|who|what|when|where|why|how|we|you|they|our|your|their)\s/g) || []).length;
    return { fr: frAccents * 2 + frWords, en: enWords };
  };

  const splitInline = (line: string): string | null => {
    const prefixMatch = line.match(/^(\s*(?:#{1,6}\s+|[-*+]\s+|\d+\.\s+)?(?:\*\*|__|\*|_)?)(.*?)((?:\*\*|__|\*|_)?\s*)$/);
    if (!prefixMatch) return null;
    const [, prefix, core, suffix] = prefixMatch;
    const parts = core.split(/\s+\/\s+/);
    if (parts.length !== 2) return null;
    const [left, right] = parts.map((s) => s.trim());
    if (!left || !right) return null;
    if (left.length < 3 || right.length < 3) return null;
    if (/https?:|\d{4}-\d{2}-\d{2}/.test(core)) return null;
    const sL = scoreLang(left);
    const sR = scoreLang(right);
    let leftLang: "fr" | "en" | null =
      sL.fr > sL.en ? "fr" : sL.en > sL.fr ? "en" : null;
    let rightLang: "fr" | "en" | null =
      sR.fr > sR.en ? "fr" : sR.en > sR.fr ? "en" : null;
    // If only one side is detected, assume the other is the opposite language.
    if (leftLang && !rightLang) rightLang = leftLang === "fr" ? "en" : "fr";
    if (rightLang && !leftLang) leftLang = rightLang === "fr" ? "en" : "fr";
    if (leftLang && rightLang && leftLang !== rightLang) {
      const keep = leftLang === locale ? left : right;
      return prefix + keep + suffix;
    }
    return null;
  };


  const lines = md.split("\n");
  const out: string[] = [];
  let mode: "fr" | "en" | null = null;

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const headingMatch = raw.match(/^(#{1,6})\s/);
    const marker = detectMarker(raw);

    if (marker) {
      mode = marker;
      if (marker === locale && headingMatch) {
        const cleaned = raw
          .replace(/🇫🇷|🇬🇧|🇺🇸/g, "")
          .replace(/\s*\((?:FR|EN)\)\s*/gi, " ")
          .replace(/\s{2,}/g, " ")
          .trimEnd();
        out.push(cleaned);
      }
      i++;
      continue;
    }

    if (headingMatch && headingMatch[1].length <= 2) {
      mode = null;
    }

    if (headingMatch) {
      const inline = splitInline(raw);
      if (inline) {
        out.push(inline);
      } else {
        // No " / " split: score the heading itself and drop if it's clearly in the other language.
        const headingText = raw.replace(/^#{1,6}\s+/, "");
        const s = scoreLang(headingText);
        const hLang: "fr" | "en" | null =
          s.fr > s.en ? "fr" : s.en > s.fr ? "en" : null;
        if (hLang !== other) {
          out.push(raw);
        }
      }
      i++;
      continue;
    }

    if (raw.trim() === "") {
      out.push(raw);
      i++;
      continue;
    }

    if (mode && mode !== locale) {
      i++;
      continue;
    }

    const inline = splitInline(raw);
    if (inline) {
      out.push(inline);
      i++;
      continue;
    }

    const start = i;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !detectMarker(lines[i])
    ) {
      i++;
    }
    const paragraph = lines.slice(start, i).join("\n");
    const s = scoreLang(paragraph);
    const paraLang: "fr" | "en" | null =
      s.fr > s.en + 1 ? "fr" : s.en > s.fr + 1 ? "en" : null;
    if (paraLang !== other) {
      out.push(paragraph);
    }
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export interface BilingualContent {
  fr: string;
  en: string;
  hasBilingual: boolean;
  hasFr: boolean;
  hasEn: boolean;
}

/**
 * Extracts and separates bilingual content from markdown text.
 * Used for 01_RESUME.md, 02_BULLET_POINTS.md, 04_PROMPT_AI.md and companion notes.
 */
export function extractBilingualContent(md: string): BilingualContent {
  if (!md || !md.trim()) {
    return { fr: "", en: "", hasBilingual: false, hasFr: false, hasEn: false };
  }

  const { body } = parseFrontmatter(md);
  const text = (body || md).trim();

  const hasFrMarker = /🇫🇷|\(FR\)|\bFR\s*[:\/\)]|Français|Francais/i.test(text);
  const hasEnMarker = /🇬🇧|🇺🇸|\(EN\)|\bEN\s*[:\/\)]|English/i.test(text);
  const hasSplitHeading = /^#{1,6}\s+.*?\s+\/\s+/m.test(text);

  const cleanFr = filterMarkdownByLocale(text, "fr");
  const cleanEn = filterMarkdownByLocale(text, "en");

  const hasFrContent = cleanFr.trim().length > 0;
  const hasEnContent = cleanEn.trim().length > 0;

  const isDistinct = cleanFr.trim() !== cleanEn.trim();
  const hasBilingual =
    (hasFrMarker && hasEnMarker) ||
    (hasSplitHeading && isDistinct) ||
    (hasFrContent && hasEnContent && isDistinct);

  return {
    fr: cleanFr,
    en: cleanEn,
    hasBilingual,
    hasFr: hasFrContent,
    hasEn: hasBilingual && hasEnContent,
  };
}


