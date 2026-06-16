/**
 * Client-side parser for Pulse card Markdown files (Obsidian format).
 * Mirrors the logic from scripts/pulse-sync/sync-obsidian.mjs.
 */

import type { PulseCardImportPayload } from "./pulseAdminService";
import { isValidPrinciple } from "./pulsePrinciples";

const VALID_ARCHETYPES = [
  "sage", "warrior", "lover", "sovereign", "magician", "healer",
  "creator", "rebel", "caregiver", "explorer", "mystic", "jester",
];

const ARCHETYPE_SLUGS = new Set(VALID_ARCHETYPES);
const REQUIRED_LOCALES = ["fr", "en"];
const KNOWN_CONTENT_TYPES = new Set(["card", "note", "exercise", "course"]);
const MAX_BATCH_CARDS = 10;

/** Marqueur de lot : ligne seule `<!-- pulse-item -->` (hors commentaire doc). */
const BATCH_MARKER_LINE =
  /^\s*<!--\s*(?:toolbox-item|pulse-item)(?:\s*:\s*[^>]*?)?\s*-->\s*$/i;

function countMatches(line: string, re: RegExp): number {
  return [...line.matchAll(re)].length;
}

/**
 * Découpe par marqueurs pulse-item sur leur propre ligne, en ignorant ceux cités
 * dans un bloc <!-- doc --> (ex. « … : <!-- pulse-item --> » dans l'en-tête).
 */
function splitByBatchMarkerLines(raw: string): string[] {
  const segments: string[] = [];
  let current: string[] = [];
  let inDocComment = false;

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();

    if (inDocComment) {
      const opens = countMatches(line, /<!--/g);
      const closes = countMatches(line, /-->/g);
      // Commentaire inline dans le bloc doc (ex. exemple <!-- pulse-item -->)
      if (opens > 0 && closes > 0) {
        continue;
      }
      if (closes > opens) {
        inDocComment = false;
      }
      continue;
    }

    if (trimmed.startsWith("<!--") && !BATCH_MARKER_LINE.test(trimmed)) {
      const opens = countMatches(line, /<!--/g);
      const closes = countMatches(line, /-->/g);
      if (opens > closes) {
        inDocComment = true;
      }
      continue;
    }

    if (BATCH_MARKER_LINE.test(trimmed)) {
      if (current.length > 0) {
        segments.push(current.join("\n").trim());
        current = [];
      }
      continue;
    }

    current.push(line);
  }

  if (current.length > 0) {
    segments.push(current.join("\n").trim());
  }

  return segments;
}

function slugFromFileName(fileName: string): string {
  return fileName.replace(/\.md$/i, "").trim().toLowerCase().replace(/\s+/g, "_");
}

function isLikelyIndexFile(fileName: string, meta: Record<string, unknown> | null): boolean {
  if (meta?.external_key) return false;
  const slug = slugFromFileName(fileName);
  return ARCHETYPE_SLUGS.has(slug) || slug === "readme" || slug === "index";
}

function consolidatedErrors(source: string, meta: Record<string, unknown> | null): string[] {
  if (!meta || Object.keys(meta).length === 0) {
    return [
      `${source}: pas une carte Pulse — frontmatter YAML manquant ou vide. ` +
        `Utilisez le template scripts/pulse-sync/templates/pulse-card-template.md`,
    ];
  }
  if (!meta.external_key) {
    const slug = slugFromFileName(source);
    if (ARCHETYPE_SLUGS.has(slug)) {
      return [
        `${source}: fichier index archétype "${slug}" ignoré — ce n'est pas une carte. ` +
          `Importez les fichiers .md numérotés du dossier (ex: 001-titre.md).`,
      ];
    }
    return [
      `${source}: external_key manquant dans le frontmatter. ` +
        `Chaque fichier .md = 1 carte avec external_key, principle, title, etc.`,
    ];
  }
  return [];
}

/** Vrai segment carte (pas un en-tête de lot type pulse_batch_header_bypass). */
function isPulseCardMeta(meta: Record<string, unknown> | null): boolean {
  if (!meta?.external_key) return false;
  const principle = typeof meta.principle === "string" ? meta.principle : "";
  if (!isValidPrinciple(principle)) return false;
  const title = meta.title;
  if (!title || typeof title !== "object") return false;
  const t = title as Record<string, string>;
  return Boolean(t.fr && t.en);
}

/** En-tête de lot en tête de fichier (métadonnées sans principle/title carte). */
function stripOptionalBatchFrontmatter(raw: string): string {
  const opening = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!opening) return raw;
  const meta = parseYamlBlock(opening[1].split("\n"), 0, 0).value;
  if (isPulseCardMeta(meta)) return raw;
  return raw.slice(opening[0].length).trim();
}

function splitByBatchMarkers(raw: string): string[] {
  let trimmed = raw.trim();
  if (!trimmed) return [];

  trimmed = stripOptionalBatchFrontmatter(trimmed);

  const hasMarker = trimmed.split("\n").some((line) => BATCH_MARKER_LINE.test(line.trim()));
  if (!hasMarker) return [];

  return splitByBatchMarkerLines(trimmed);
}

function splitByYamlBoundaries(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("---")) return [];

  const parts: string[] = [];
  const re = /\n---\n(?=[\w_]+:\s)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(trimmed)) !== null) {
    parts.push(trimmed.slice(lastIndex, match.index + 1));
    lastIndex = match.index + 1;
  }
  parts.push(trimmed.slice(lastIndex));

  return parts.length > 1 ? parts : [];
}

function splitMultiCardDocuments(raw: string): string[] {
  const batch = splitByBatchMarkers(raw);
  if (batch.length > 0) return batch;

  const yamlSplit = splitByYamlBoundaries(raw);
  if (yamlSplit.length > 0) return yamlSplit;

  return [raw.trim()];
}

function unquote(s: string): string | boolean | number {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  return s;
}

function parseYamlArray(lines: string[], startIdx: number, baseIndent: number) {
  const arr: unknown[] = [];
  let i = startIdx;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") { i++; continue; }
    const indent = line.search(/\S/);
    if (indent < baseIndent) break;

    const match = line.match(/^(\s*)- (.*)$/);
    if (!match || match[1].length !== baseIndent) break;

    arr.push(unquote(match[2].trim()));
    i++;
  }

  return { value: arr, endIdx: i };
}

function parseYamlMultiline(lines: string[], startIdx: number, baseIndent: number) {
  const parts: string[] = [];
  let i = startIdx;

  while (i < lines.length) {
    const line = lines[i];
    const indent = line.search(/\S/);
    if (line.trim() === "") { parts.push(""); i++; continue; }
    if (indent < baseIndent) break;
    parts.push(line.slice(baseIndent));
    i++;
  }

  return { value: parts.join("\n").trim(), endIdx: i };
}

function parseYamlBlock(
  lines: string[],
  startIdx: number,
  baseIndent: number,
): { value: Record<string, unknown>; endIdx: number } {
  const result: Record<string, unknown> = {};
  let i = startIdx;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "" || line.trim().startsWith("#")) { i++; continue; }

    const indent = line.search(/\S/);
    if (indent < baseIndent) break;
    if (indent > baseIndent && i > startIdx) break;

    if (line.match(/^(\s*)- (.*)$/)) break;

    const kvMatch = line.match(/^(\s*)([\w_]+)\s*:\s*(.*)$/);
    if (!kvMatch) { i++; continue; }

    const key = kvMatch[2];
    let val = kvMatch[3].trim();

    if (val === "" || val === "|" || val === ">") {
      const nextLineIdx = i + 1;
      if (nextLineIdx < lines.length) {
        const nextLine = lines[nextLineIdx];
        const nextIndent = nextLine.search(/\S/);
        if (nextIndent > indent && nextLine.trim().startsWith("- ")) {
          const arr = parseYamlArray(lines, nextLineIdx, nextIndent);
          result[key] = arr.value;
          i = arr.endIdx;
          continue;
        } else if (nextIndent > indent) {
          if (val === "|" || val === ">") {
            const block = parseYamlMultiline(lines, nextLineIdx, nextIndent);
            result[key] = block.value;
            i = block.endIdx;
            continue;
          }
          const nested = parseYamlBlock(lines, nextLineIdx, nextIndent);
          result[key] = nested.value;
          i = nested.endIdx;
          continue;
        }
      }
      result[key] = "";
      i++;
    } else {
      result[key] = unquote(val);
      i++;
    }
  }

  return { value: result, endIdx: i };
}

function parseFrontmatter(raw: string) {
  const trimmed = raw.trim();
  const match = trimmed.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { meta: null as Record<string, unknown> | null, body: trimmed };
  const yamlStr = match[1];
  const body = trimmed.slice(match[0].length).trim();
  const meta = parseYamlBlock(yamlStr.split("\n"), 0, 0).value;
  return { meta, body };
}

/* ── Body section parser ─────────────────────────────────────────── */

function parseCourseBody(body: string): Record<string, { hook?: string; concept?: string; action?: string }> {
  const sections: Record<string, string> = {};
  const lines = body.split("\n");
  let currentKey: string | null = null;
  let currentLines: string[] = [];
  let activeLocale: "fr" | "en" | null = null;

  const flush = () => {
    if (currentKey) {
      sections[currentKey] = currentLines.join("\n").trim();
    }
    currentKey = null;
    currentLines = [];
  };

  // # Hook FR · # Hook — FR · # Hook (FR)
  const headingRe =
    /^#{1,3}[ \t]+(Hook|Concept|Action)(?:[ \t]*(?:\(?(FR|EN)\)?|[—–-][ \t]*(FR|EN)|:[ \t]*(FR|EN)|[ \t]+(FR|EN)))?[ \t]*$/i;
  const localeBlockRe = /^#{1,3}[ \t]+(FR|EN)[ \t]*$/i;
  const sectionOnlyRe = /^#{1,3}[ \t]+(Hook|Concept|Action)[ \t]*$/i;

  for (const line of lines) {
    const localeBlock = line.match(localeBlockRe);
    if (localeBlock) {
      flush();
      activeLocale = localeBlock[1].toLowerCase() as "fr" | "en";
      continue;
    }

    const headingMatch = line.match(headingRe);
    if (headingMatch) {
      let locale = (headingMatch[2] || headingMatch[3] || headingMatch[4] || headingMatch[5] || "")
        .toLowerCase();
      if (locale !== "fr" && locale !== "en") {
        const nested = line.match(sectionOnlyRe);
        if (nested && activeLocale) {
          flush();
          currentKey = `${nested[1].toLowerCase()}_${activeLocale}`;
          continue;
        }
        if (currentKey) currentLines.push(line);
        continue;
      }
      flush();
      const section = headingMatch[1].toLowerCase();
      currentKey = `${section}_${locale}`;
      continue;
    }

    const nestedSection = line.match(sectionOnlyRe);
    if (nestedSection && activeLocale) {
      flush();
      currentKey = `${nestedSection[1].toLowerCase()}_${activeLocale}`;
      continue;
    }

    if (currentKey) currentLines.push(line);
  }
  flush();

  const course: Record<string, { hook?: string; concept?: string; action?: string }> = {};
  for (const locale of REQUIRED_LOCALES) {
    const hook = sections[`hook_${locale}`] || "";
    const concept = sections[`concept_${locale}`] || "";
    const action = sections[`action_${locale}`] || "";
    if (hook || concept || action) {
      course[locale] = {};
      if (hook) course[locale].hook = hook;
      if (concept) course[locale].concept = concept;
      if (action) course[locale].action = action;
    }
  }

  return course;
}

function isPulseCardSegment(segment: string): boolean {
  const trimmed = segment.trim();
  if (!/^---\r?\n/.test(trimmed)) return false;
  const { meta, body } = parseFrontmatter(trimmed);
  if (!isPulseCardMeta(meta)) return false;
  const course = parseCourseBody(body);
  return REQUIRED_LOCALES.every((locale) => Boolean(course[locale]));
}

/* ── Validation ──────────────────────────────────────────────────── */

interface ParseResult {
  card: PulseCardImportPayload | null;
  errors: string[];
}

function isCourseFile(meta: Record<string, unknown> | null): boolean {
  if (!meta) return false;
  const type = typeof meta.type === "string" ? meta.type.toLowerCase() : "";
  return type === "course" || Array.isArray(meta.cards);
}

function validateAndBuild(
  meta: Record<string, unknown>,
  courseContent: Record<string, { hook?: string; concept?: string; action?: string }>,
  source: string,
): ParseResult {
  const early = consolidatedErrors(source, meta);
  if (early.length > 0) {
    return { card: null, errors: early };
  }

  const errors: string[] = [];

  if (!meta.principle || !isValidPrinciple(meta.principle as string)) {
    errors.push(
      `${source}: principle invalide (${String(meta.principle)}) — attendu: Kybalion (MENTALISM, …) ou Myss (REBEL, CREATOR, …)`,
    );
  }

  const i18nFields = ["title", "format", "problem"] as const;
  for (const field of i18nFields) {
    if (!meta[field] || typeof meta[field] !== "object") {
      errors.push(`${source}: champ i18n '${field}' manquant`);
      continue;
    }
    const obj = meta[field] as Record<string, string>;
    for (const locale of REQUIRED_LOCALES) {
      if (!obj[locale]) {
        errors.push(`${source}: '${field}.${locale}' vide`);
      }
    }
  }

  if (meta.bullets && typeof meta.bullets === "object") {
    const b = meta.bullets as Record<string, unknown[]>;
    for (const locale of REQUIRED_LOCALES) {
      if (!Array.isArray(b[locale]) || b[locale].length === 0) {
        errors.push(`${source}: 'bullets.${locale}' doit être un tableau non-vide`);
      }
    }
  } else {
    errors.push(`${source}: champ 'bullets' manquant`);
  }

  for (const locale of REQUIRED_LOCALES) {
    if (!courseContent[locale]) {
      errors.push(`${source}: sections cours manquantes pour '${locale}' (# Hook, # Concept, # Action)`);
    }
  }

  const archetypes = Array.isArray(meta.archetype_targets) ? (meta.archetype_targets as string[]) : [];
  const slug = slugFromFileName(source);
  if (archetypes.length === 0 && ARCHETYPE_SLUGS.has(slug)) {
    archetypes.push(slug);
  }
  for (const a of archetypes) {
    if (!VALID_ARCHETYPES.includes(a)) {
      errors.push(`${source}: archetype invalide '${a}'`);
    }
  }

  // user_id → target_user_ids
  const userId = typeof meta.user_id === "string" ? (meta.user_id as string).trim() : "";
  const targetUserIds = userId ? [userId] : [];

  const explicitType =
    typeof meta.content_type === "string" ? (meta.content_type as string).trim().toLowerCase() : "";
  const legacyUserType = typeof meta.user === "string" ? (meta.user as string).trim().toLowerCase() : "";
  const contentType =
    (explicitType && KNOWN_CONTENT_TYPES.has(explicitType) && explicitType) ||
    (legacyUserType && KNOWN_CONTENT_TYPES.has(legacyUserType) && legacyUserType) ||
    "card";

  if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    errors.push(`${source}: user_id invalide (doit être un UUID)`);
  }

  if (errors.length > 0) return { card: null, errors };

  return {
    card: {
      external_key: meta.external_key as string,
      principle: meta.principle as string,
      archetype_targets: archetypes,
      target_user_ids: targetUserIds,
      content_type: contentType,
      sort_order: (meta.sort_order as number) ?? 0,
      time_label: (meta.time_label as string) ?? "2 MIN",
      is_active: meta.is_active !== false,
      title: meta.title as Record<string, string>,
      format: (meta.format as Record<string, string>) ?? { fr: "MICRO-CONCEPT", en: "MICRO-CONCEPT" },
      problem: meta.problem as Record<string, string>,
      bullets: meta.bullets as Record<string, string[]>,
      course_content: courseContent,
    },
    errors: [],
  };
}

/* ── Public API ──────────────────────────────────────────────────── */

export interface MarkdownParseResult {
  total: number;
  valid: number;
  errors: string[];
  cards: PulseCardImportPayload[];
}

/**
 * Parse a single `.md` file content (Obsidian frontmatter + body).
 */
export function parseMarkdownCard(rawContent: string, fileName: string): ParseResult {
  try {
    const { meta, body } = parseFrontmatter(rawContent);
    if (isLikelyIndexFile(fileName, meta)) {
      return {
        card: null,
        errors: [
          `${fileName}: fichier index archétype ignoré — importez les cartes numérotées (001-xxx.md).`,
        ],
      };
    }
    if (isCourseFile(meta)) {
      return {
        card: null,
        errors: [
          `${fileName}: fichier course (type: course) — n'est pas une carte Pulse. ` +
            `Importez les fichiers cartes (001-xxx.md dans MENTALISM/, POLARITY/, etc.).`,
        ],
      };
    }
    if (!meta) {
      return { card: null, errors: consolidatedErrors(fileName, null) };
    }

    const courseContent = parseCourseBody(body);
    return validateAndBuild(meta, courseContent, fileName);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { card: null, errors: [`${fileName}: erreur de parsing — ${msg}`] };
  }
}

function parseMarkdownSegment(rawContent: string, label: string): ParseResult {
  try {
    const { meta, body } = parseFrontmatter(rawContent);
    if (isCourseFile(meta)) {
      return {
        card: null,
        errors: [
          `${label}: fichier course (type: course) — n'est pas une carte Pulse. ` +
            `Importez les fichiers cartes (001-xxx.md).`,
        ],
      };
    }
    if (!meta) {
      return { card: null, errors: consolidatedErrors(label, null) };
    }
    const courseContent = parseCourseBody(body);
    return validateAndBuild(meta, courseContent, label);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { card: null, errors: [`${label}: erreur de parsing — ${msg}`] };
  }
}

/**
 * Parse multiple `.md` contents. Each entry is { name, content }.
 */
function parseMarkdownSegments(
  segments: string[],
  fileName: string,
): MarkdownParseResult {
  const errors: string[] = [];
  const cards: PulseCardImportPayload[] = [];
  const cardSegments: string[] = [];

  for (const seg of segments) {
    if (isPulseCardSegment(seg)) {
      cardSegments.push(seg);
      continue;
    }
    const trimmed = seg.trim();
    if (!/^---\r?\n/.test(trimmed)) continue;
    const { meta } = parseFrontmatter(trimmed);
    if (isCourseFile(meta)) {
      errors.push(
        `${fileName}: fichier course (type: course) — n'est pas une carte Pulse. ` +
          `Importez les fichiers cartes (001-xxx.md dans MENTALISM/, POLARITY/, etc.).`,
      );
    }
  }

  if (cardSegments.length > MAX_BATCH_CARDS) {
    errors.push(
      `${fileName}: lot de ${cardSegments.length} cartes — maximum ${MAX_BATCH_CARDS} par fichier.`,
    );
  }

  cardSegments.slice(0, MAX_BATCH_CARDS).forEach((seg, idx) => {
    const { meta } = parseFrontmatter(seg);
    const key = typeof meta?.external_key === "string" ? meta.external_key : "?";
    const label =
      cardSegments.length > 1
        ? `${fileName} [carte ${idx + 1}: ${key}]`
        : fileName;
    const result = parseMarkdownSegment(seg, label);
    if (result.errors.length > 0) errors.push(...result.errors);
    if (result.card) cards.push(result.card);
  });

  return { total: cardSegments.length, valid: cards.length, errors, cards };
}

export function parseMarkdownCards(
  files: { name: string; content: string }[],
): MarkdownParseResult {
  const errors: string[] = [];
  const cards: PulseCardImportPayload[] = [];
  let total = 0;

  for (const f of files) {
    const result = parseMarkdownSegments(splitMultiCardDocuments(f.content), f.name);
    total += result.total;
    errors.push(...result.errors);
    cards.push(...result.cards);
  }

  return { total, valid: cards.length, errors, cards };
}

/**
 * Detect whether raw text is JSON or Markdown, then parse accordingly.
 */
export function detectAndParse(
  content: string,
  fileName: string,
): MarkdownParseResult {
  const trimmed = content.trim();

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    // Delegate to JSON parser — caller should use parseAndPreviewImport
    return { total: 0, valid: 0, errors: ["__JSON__"], cards: [] };
  }

  return parseMarkdownSegments(splitMultiCardDocuments(content), fileName);
}
