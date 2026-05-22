/**
 * Import newsletter « blog » depuis fichiers .md
 * — avec frontmatter YAML (recommandé admin)
 * — ou article brut : # titre + > accroche + corps (comme les exports Notion/Obsidian)
 */

export type NewsletterLocale = "fr" | "en";

export interface ParsedNewsletterMarkdown {
  slug: string;
  titleFr: string;
  titleEn: string;
  excerptFr: string;
  excerptEn: string;
  bodyFr: string;
  bodyEn: string;
  publishedAt: string | null;
  sourcePath: string | null;
}

export interface NewsletterImportPreview {
  edition: ParsedNewsletterMarkdown;
  issues: string[];
  files: string[];
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
const ACCROCHE_RE = /^\*\*Accroche\s*:\*\*\s*/i;
const PROTOCOLE_LINK_PLACEHOLDER_RE =
  /\*\*\[Lien vers le Protocole Nomos\]\*\*|\[Lien vers le Protocole Nomos\]/gi;
const DEFAULT_PROTOCOLE_LINK = "https://aegis.humancatalystbeacon.com";

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripMarkdownInline(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#+\s*/, "")
    .trim();
}

function normalizeArticleBody(body: string): string {
  return body.replace(
    PROTOCOLE_LINK_PLACEHOLDER_RE,
    `[Protocole Nomos](${DEFAULT_PROTOCOLE_LINK})`,
  );
}

function parseYamlLine(line: string): { key: string; value: string } | null {
  const m = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
  if (!m) return null;
  let value = m[2].trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return { key: m[1].toLowerCase().replace(/-/g, "_"), value };
}

function parseFrontmatter(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parsed = parseYamlLine(trimmed);
    if (parsed) out[parsed.key] = parsed.value;
  }
  return out;
}

function detectLocaleFromPath(path: string): NewsletterLocale | null {
  const base = path.split("/").pop()?.toLowerCase() ?? "";
  if (/(\.fr|_fr|-fr)\.md$/.test(base) || base.includes(".fr.")) return "fr";
  if (/(\.en|_en|-en)\.md$/.test(base) || base.includes(".en.")) return "en";
  return null;
}

function localeFromMeta(meta: Record<string, string>, path: string): NewsletterLocale {
  const loc = (meta.locale || meta.lang || "").toLowerCase();
  if (loc === "en" || loc === "english") return "en";
  if (loc === "fr" || loc === "french") return "fr";
  const fromPath = detectLocaleFromPath(path);
  return fromPath ?? "fr";
}

/** Infère titre, brief et slug depuis un .md sans frontmatter. */
export function inferMetadataFromMarkdownBody(
  rawBody: string,
  options?: { fallbackSlug?: string; sourcePath?: string },
): {
  titleFr: string;
  excerptFr: string;
  slug: string;
  bodyFr: string;
} {
  const normalized = normalizeArticleBody(rawBody.replace(/^\uFEFF/, "").trim());
  const lines = normalized.split(/\r?\n/);

  let titleFr = "";
  let excerptFr = "";
  const keptLines: string[] = [];
  let i = 0;

  while (i < lines.length && !lines[i].trim()) i++;

  if (/^#\s+/.test(lines[i] ?? "")) {
    titleFr = stripMarkdownInline(lines[i].replace(/^#\s+/, ""));
    i++;
  }

  while (i < lines.length && !lines[i].trim()) i++;

  if ((lines[i] ?? "").startsWith(">")) {
    const quoteParts: string[] = [];
    while (i < lines.length && lines[i].startsWith(">")) {
      let line = lines[i].replace(/^>\s*/, "");
      line = line.replace(ACCROCHE_RE, "");
      quoteParts.push(stripMarkdownInline(line));
      i++;
    }
    excerptFr = quoteParts.join(" ").replace(/\s+/g, " ").trim();
  }

  while (i < lines.length && !lines[i].trim()) i++;
  keptLines.push(...lines.slice(i));

  let bodyFr = keptLines.join("\n").trim();

  if (!excerptFr) {
    const para = bodyFr
      .split(/\n\n+/)
      .map((p) => p.trim())
      .find((p) => p && !p.startsWith("#") && !p.startsWith("---"));
    if (para) {
      excerptFr = stripMarkdownInline(para).slice(0, 280);
    }
  }

  if (!titleFr && options?.fallbackSlug) {
    titleFr = options.fallbackSlug.replace(/[-_]/g, " ");
  }

  const slug =
    slugify(titleFr) ||
    slugify(options?.fallbackSlug ?? "") ||
    slugify(options?.sourcePath?.split("/").pop()?.replace(/\.md$/i, "") ?? "") ||
    "edition";

  return { titleFr, excerptFr, slug, bodyFr };
}

/** Parse un fichier .md (frontmatter optionnel). */
export function parseNewsletterMarkdownFile(
  content: string,
  sourcePath?: string,
): { meta: Record<string, string>; body: string } {
  const trimmed = content.replace(/^\uFEFF/, "").trim();
  const match = trimmed.match(FRONTMATTER_RE);
  if (!match) {
    return { meta: {}, body: trimmed };
  }
  return {
    meta: parseFrontmatter(match[1]),
    body: match[2].trim(),
  };
}

function buildEditionFromMetaAndBody(
  meta: Record<string, string>,
  body: string,
  path: string,
  locale: NewsletterLocale,
): Partial<ParsedNewsletterMarkdown> {
  const pathSlug = slugify(path.split("/").pop()?.replace(/\.md$/i, "") ?? "");
  const inferred = inferMetadataFromMarkdownBody(body, {
    fallbackSlug: pathSlug || undefined,
    sourcePath: path,
  });

  const titleFr = meta.title_fr || meta.title || inferred.titleFr;
  const titleEn = meta.title_en || meta.title || titleFr;
  const excerptFr =
    meta.excerpt_fr || meta.excerpt || meta.description || inferred.excerptFr;
  const excerptEn = meta.excerpt_en || meta.excerpt || meta.description || excerptFr;
  let slugRaw = meta.slug || meta.id || "";
  if (!slugRaw) {
    if (inferred.titleFr && !(meta.title_fr || meta.title)) {
      slugRaw = inferred.slug;
    } else if (meta.title_fr || meta.title) {
      slugRaw = slugify(meta.title_fr || meta.title);
    } else {
      slugRaw = inferred.slug || pathSlug;
    }
  }
  const slug = slugify(slugRaw);
  const dateRaw = meta.date || meta.published_at || meta.published || "";

  const bodyStored =
    meta.title_fr || meta.title || meta.slug
      ? normalizeArticleBody(body)
      : inferred.bodyFr;

  const partial: Partial<ParsedNewsletterMarkdown> = {
    slug,
    titleFr,
    titleEn,
    excerptFr,
    excerptEn,
    publishedAt: dateRaw || null,
    sourcePath: path,
  };

  if (locale === "en") {
    partial.bodyEn = bodyStored;
  } else {
    partial.bodyFr = bodyStored;
  }

  return partial;
}

/** Fusionne plusieurs fichiers (ex. paire fr + en) en une édition. */
export function mergeNewsletterMarkdownEntries(
  entries: Array<{ path: string; content: string }>,
): NewsletterImportPreview {
  const issues: string[] = [];
  const files = entries.map((e) => e.path);

  if (entries.length === 0) {
    return {
      edition: emptyEdition(),
      issues: ["no_files"],
      files: [],
    };
  }

  let merged: ParsedNewsletterMarkdown = emptyEdition();

  for (const entry of entries) {
    const { meta, body } = parseNewsletterMarkdownFile(entry.content, entry.path);
    const loc = localeFromMeta(meta, entry.path);
    const part = buildEditionFromMetaAndBody(meta, body, entry.path, loc);

    const slug = part.slug || slugify(entry.path);
    if (!slug) {
      issues.push(`missing_slug:${entry.path}`);
      continue;
    }

    if (!merged.slug) {
      merged = {
        ...merged,
        slug,
        titleFr: part.titleFr || merged.titleFr,
        titleEn: part.titleEn || merged.titleEn,
        excerptFr: part.excerptFr || merged.excerptFr,
        excerptEn: part.excerptEn || merged.excerptEn,
        publishedAt: part.publishedAt ?? merged.publishedAt,
        sourcePath: part.sourcePath,
      };
    } else if (part.slug !== merged.slug) {
      issues.push(`slug_mismatch:${entry.path}:${part.slug}!=${merged.slug}`);
    }

    if (loc === "en") {
      merged.bodyEn = part.bodyEn ?? "";
      if (part.titleEn) merged.titleEn = part.titleEn;
      if (part.excerptEn) merged.excerptEn = part.excerptEn;
    } else {
      merged.bodyFr = part.bodyFr ?? "";
      if (part.titleFr) merged.titleFr = part.titleFr;
      if (part.excerptFr) merged.excerptFr = part.excerptFr;
    }
  }

  if (!merged.slug) issues.push("slug_required");
  if (!merged.titleFr.trim()) issues.push("title_fr_required");
  if (!merged.bodyFr.trim() && !merged.bodyEn.trim()) issues.push("body_required");

  if (!merged.excerptFr.trim() && !merged.excerptEn.trim()) {
    const briefSource = merged.bodyFr.trim() || merged.bodyEn.trim();
    const auto = stripMarkdownInline(briefSource).slice(0, 280);
    merged.excerptFr = auto;
    merged.excerptEn = auto;
    issues.push("excerpt_auto_generated");
  }

  const hasFrontmatter = entries.some((e) =>
    FRONTMATTER_RE.test(e.content.replace(/^\uFEFF/, "").trim()),
  );
  if (!hasFrontmatter) {
    issues.push("format_inferred_from_markdown");
    if (merged.excerptFr.trim()) issues.push("excerpt_inferred_from_article");
  }

  return { edition: merged, issues, files };
}

function emptyEdition(): ParsedNewsletterMarkdown {
  return {
    slug: "",
    titleFr: "",
    titleEn: "",
    excerptFr: "",
    excerptEn: "",
    bodyFr: "",
    bodyEn: "",
    publishedAt: null,
    sourcePath: null,
  };
}

export async function readNewsletterMdFromFileList(
  fileList: FileList,
): Promise<Array<{ path: string; content: string }>> {
  const entries: Array<{ path: string; content: string }> = [];
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    if (!file.name.toLowerCase().endsWith(".md")) continue;
    const path = file.webkitRelativePath || file.name;
    const content = await file.text();
    entries.push({ path, content });
  }
  return entries;
}

export async function readNewsletterMdZip(
  file: File,
): Promise<Array<{ path: string; content: string }>> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(file);
  const entries: Array<{ path: string; content: string }> = [];

  for (const [path, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;
    if (!path.toLowerCase().endsWith(".md")) continue;
    if (path.includes("__MACOSX")) continue;
    const content = await zipEntry.async("string");
    entries.push({ path, content });
  }

  return entries;
}

export const NEWSLETTER_MD_TEMPLATE = `---
slug: grand-malentendu-succes
title_fr: Titre de l'édition
title_en: Edition title
excerpt_fr: Brief pour l'e-mail et la notification (obligatoire pour l'envoi).
excerpt_en: Brief for email and notification.
date: 2026-05-21
locale: fr
---

# Titre affiché dans l'app

> **Accroche :** Phrase d'accroche optionnelle (sinon = 1er paragraphe).

Corps de l'article en Markdown…

**[Lien vers le Protocole Nomos]**
`;

/** Exemple d'article brut (sans frontmatter) — import automatique. */
export const NEWSLETTER_RAW_ARTICLE_EXAMPLE = `# Le grand malentendu : Quand le succès devient une erreur système.

> **Accroche :** Votre succès est peut-être le signe que vous avez définitivement accepté la boucle.

Contenu de l'article…
`;
