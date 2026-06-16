import {
  sanitizeCartographyMarkdown,
  stripDocumentFrontmatter,
} from "@/lib/cartography-document-parse";

export interface TaoPortraitFrontmatter {
  titre?: string;
  stade?: string;
  domaine?: string;
  glyphe?: string;
  principeDominant?: string;
  principesSecondaires?: string[];
  tags?: string[];
}

export function parseFrontmatterValue(raw: string): string | string[] {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      /* keep string fallback */
    }
  }
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/_/g, "-");
}

export function parseTaoPortraitFrontmatter(
  lines: Record<string, string>,
): TaoPortraitFrontmatter | null {
  if (!Object.keys(lines).length) return null;

  const fm: TaoPortraitFrontmatter = {};

  for (const [key, raw] of Object.entries(lines)) {
    const value = parseFrontmatterValue(raw);
    switch (normalizeKey(key)) {
      case "titre":
        if (typeof value === "string") fm.titre = value;
        break;
      case "stade":
        if (typeof value === "string") fm.stade = value;
        break;
      case "domaine":
        if (typeof value === "string") fm.domaine = value;
        break;
      case "glyphe":
        if (typeof value === "string") fm.glyphe = value;
        break;
      case "principe-dominant":
        if (typeof value === "string") fm.principeDominant = value;
        break;
      case "principes-secondaires":
        if (Array.isArray(value)) fm.principesSecondaires = value;
        break;
      case "tags":
        if (Array.isArray(value)) fm.tags = value;
        break;
      default:
        break;
    }
  }

  return Object.keys(fm).length ? fm : null;
}

export function prepareTaoPortraitMarkdown(markdown: string): {
  frontmatter: TaoPortraitFrontmatter | null;
  body: string;
} {
  const { frontmatter } = stripDocumentFrontmatter(markdown);
  const body = sanitizeCartographyMarkdown(markdown);
  const parsed = frontmatter?.lines ? parseTaoPortraitFrontmatter(frontmatter.lines) : null;
  return { frontmatter: parsed, body };
}
