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
 * The reports use headings such as `### 🇫🇷 ... (FR)` and `### 🇬🇧 ... (EN)`.
 * Everything under a heading of the opposite locale is stripped until the
 * next heading (of same or lower depth) is reached.
 * Neutral content (before any locale marker) is always kept.
 */
export function filterMarkdownByLocale(md: string, locale: "fr" | "en"): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let skip = false;
  let skipDepth = 0;

  const detectLang = (line: string): "fr" | "en" | null => {
    if (/🇫🇷|\(FR\)|\bFR\b\s*[:\)]|Français|Francais/i.test(line)) return "fr";
    if (/🇬🇧|🇺🇸|\(EN\)|\bEN\b\s*[:\)]|English/i.test(line)) return "en";
    return null;
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s/);
    if (headingMatch) {
      const depth = headingMatch[1].length;
      const lang = detectLang(line);
      if (skip && depth <= skipDepth) {
        skip = false;
      }
      if (lang && lang !== locale) {
        skip = true;
        skipDepth = depth;
        continue;
      }
      if (lang === locale) {
        skip = false;
      }
    }
    if (!skip) out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
