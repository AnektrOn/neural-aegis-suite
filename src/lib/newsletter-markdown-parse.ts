/**
 * Import newsletter « blog » depuis fichiers .md (frontmatter YAML + corps).
 *
 * Exemple :
 * ---
 * slug: lettre-mai-2026
 * title_fr: Titre
 * title_en: Title
 * excerpt_fr: Brief pour e-mail / notif
 * excerpt_en: Brief for email / notif
 * locale: fr
 * date: 2026-05-21
 * ---
 * # Contenu Markdown…
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

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
  const titleFr = meta.title_fr || meta.title || "";
  const titleEn = meta.title_en || meta.title || titleFr;
  const excerptFr = meta.excerpt_fr || meta.excerpt || meta.description || "";
  const excerptEn = meta.excerpt_en || meta.excerpt || meta.description || excerptFr;
  const slugRaw = meta.slug || meta.id || path.split("/").pop()?.replace(/\.md$/i, "") || "";
  const slug = slugify(slugRaw);
  const dateRaw = meta.date || meta.published_at || meta.published || "";

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
    partial.bodyEn = body;
  } else {
    partial.bodyFr = body;
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

    if (!part.slug) {
      issues.push(`missing_slug:${entry.path}`);
      continue;
    }

    if (!merged.slug) {
      merged = {
        ...merged,
        slug: part.slug,
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
      merged.bodyEn = body;
      if (part.titleEn) merged.titleEn = part.titleEn;
      if (part.excerptEn) merged.excerptEn = part.excerptEn;
    } else {
      merged.bodyFr = body;
      if (part.titleFr) merged.titleFr = part.titleFr;
      if (part.excerptFr) merged.excerptFr = part.excerptFr;
    }
  }

  if (!merged.slug) issues.push("slug_required");
  if (!merged.titleFr.trim()) issues.push("title_fr_required");
  if (!merged.bodyFr.trim() && !merged.bodyEn.trim()) issues.push("body_required");
  if (!merged.excerptFr.trim() && !merged.excerptEn.trim()) {
    const briefSource = merged.bodyFr.trim() || merged.bodyEn.trim();
    const auto = briefSource.replace(/^#+\s+/gm, "").replace(/\n+/g, " ").trim().slice(0, 280);
    merged.excerptFr = merged.excerptFr || auto;
    merged.excerptEn = merged.excerptEn || auto;
    issues.push("excerpt_auto_generated");
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

export async function readNewsletterMdZip(file: File): Promise<Array<{ path: string; content: string }>> {
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
slug: lettre-exemple-2026
title_fr: Titre de l'édition
title_en: Edition title
excerpt_fr: Brief affiché dans l'e-mail et la notification (pas le corps complet).
excerpt_en: Brief shown in email and push (not the full article).
date: 2026-05-21
locale: fr
---

# Titre principal

Votre contenu Markdown ici. Les **gras**, listes et citations sont supportés.

> Citation ou encadré

## Section

Paragraphe suivant…
`;
