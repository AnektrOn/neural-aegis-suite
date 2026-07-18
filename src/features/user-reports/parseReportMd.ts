import type { ParsedReportFrontmatter } from "./types";

/** Very small YAML frontmatter parser (strings, numbers, and simple `[a, b]` arrays). */
export function parseFrontmatter(md: string): {
  frontmatter: ParsedReportFrontmatter;
  body: string;
} {
  const m = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!m) return { frontmatter: {}, body: md };
  const [, raw, body] = m;
  const fm: Record<string, unknown> = {};
  for (const line of raw.split("\n")) {
    const kv = line.match(/^([\w-]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let value: unknown = kv[2].trim();
    if (typeof value === "string") {
      // strip surrounding quotes
      value = value.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
      // array literal
      if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
        value = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1"))
          .filter(Boolean);
      }
    }
    fm[key] = value;
  }
  return { frontmatter: fm as ParsedReportFrontmatter, body };
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


