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
  const detectLang = (line: string): "fr" | "en" | null => {
    if (/🇫🇷|\(FR\)|\bFR\s*[:\/\)]|Français|Francais/i.test(line)) return "fr";
    if (/🇬🇧|🇺🇸|\(EN\)|\bEN\s*[:\/\)]|English/i.test(line)) return "en";
    return null;
  };

  const lines = md.split("\n");
  const out: string[] = [];
  let mode: "fr" | "en" | null = null;

  for (const raw of lines) {
    const line = raw;
    const headingMatch = line.match(/^(#{1,6})\s/);
    const lang = detectLang(line);

    // Top-level heading without a marker → neutral again
    if (headingMatch && !lang && headingMatch[1].length <= 2) {
      mode = null;
    }

    if (lang) {
      // Switch mode; if the marker line is a heading, keep it only when
      // it belongs to the current locale (strip the marker text itself).
      mode = lang;
      if (lang === locale && headingMatch) {
        const cleaned = line
          .replace(/🇫🇷|🇬🇧|🇺🇸/g, "")
          .replace(/\s*\((?:FR|EN)\)\s*/gi, " ")
          .replace(/\s{2,}/g, " ")
          .trimEnd();
        out.push(cleaned);
      }
      continue;
    }

    if (mode === null || mode === locale) {
      out.push(line);
    }
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

