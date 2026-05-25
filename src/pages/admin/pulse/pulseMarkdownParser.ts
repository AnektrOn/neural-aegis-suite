/**
 * Client-side parser for Pulse card Markdown files (Obsidian format).
 * Mirrors the logic from scripts/pulse-sync/sync-obsidian.mjs.
 */

import type { PulseCardImportPayload } from "./pulseAdminService";

const VALID_PRINCIPLES = [
  "MENTALISM", "CORRESPONDENCE", "VIBRATION",
  "POLARITY", "RHYTHM", "CAUSE_EFFECT", "GENDER",
];

const VALID_ARCHETYPES = [
  "sage", "warrior", "lover", "sovereign", "magician", "healer",
  "creator", "rebel", "caregiver", "explorer", "mystic", "jester",
];

const ARCHETYPE_SLUGS = new Set(VALID_ARCHETYPES);
const REQUIRED_LOCALES = ["fr", "en"];

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

function splitMultiCardDocuments(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("---")) return [raw];

  const parts: string[] = [];
  const re = /\n---\n(?=[\w_]+:\s)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(trimmed)) !== null) {
    parts.push(trimmed.slice(lastIndex, match.index + 1));
    lastIndex = match.index + 1;
  }
  parts.push(trimmed.slice(lastIndex));

  return parts.length > 1 ? parts : [raw];
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
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { meta: null as Record<string, unknown> | null, body: raw };
  const yamlStr = match[1];
  const body = raw.slice(match[0].length).trim();
  const meta = parseYamlBlock(yamlStr.split("\n"), 0, 0).value;
  return { meta, body };
}

/* ── Body section parser ─────────────────────────────────────────── */

function parseCourseBody(body: string): Record<string, { hook?: string; concept?: string; action?: string }> {
  const sections: Record<string, string> = {};
  const lines = body.split("\n");
  let currentKey: string | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(
      /^#{1,3}\s+(Hook|Concept|Action)\s*(?:\(?(FR|EN)\)?|--|—|:)?\s*$/i,
    );
    if (headingMatch) {
      if (currentKey) {
        sections[currentKey] = currentLines.join("\n").trim();
      }
      const section = headingMatch[1].toLowerCase();
      const locale = headingMatch[2].toLowerCase();
      currentKey = `${section}_${locale}`;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentKey) {
    sections[currentKey] = currentLines.join("\n").trim();
  }

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

/* ── Validation ──────────────────────────────────────────────────── */

interface ParseResult {
  card: PulseCardImportPayload | null;
  errors: string[];
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

  if (!meta.principle || !VALID_PRINCIPLES.includes(meta.principle as string)) {
    errors.push(`${source}: principle invalide (${String(meta.principle)}) — attendu: MENTALISM, POLARITY, etc.`);
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

  // user → content_type (e.g. "note", "exercise")
  const contentType = typeof meta.user === "string" ? (meta.user as string) : "card";

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
      is_active: true,
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
  const { meta, body } = parseFrontmatter(rawContent);
  if (isLikelyIndexFile(fileName, meta)) {
    return {
      card: null,
      errors: [
        `${fileName}: fichier index archétype ignoré — importez les cartes numérotées (001-xxx.md).`,
      ],
    };
  }
  if (!meta) {
    return { card: null, errors: consolidatedErrors(fileName, null) };
  }

  const courseContent = parseCourseBody(body);
  return validateAndBuild(meta, courseContent, fileName);
}

function parseMarkdownSegment(rawContent: string, label: string): ParseResult {
  const { meta, body } = parseFrontmatter(rawContent);
  if (!meta) {
    return { card: null, errors: consolidatedErrors(label, null) };
  }
  const courseContent = parseCourseBody(body);
  return validateAndBuild(meta, courseContent, label);
}

/**
 * Parse multiple `.md` contents. Each entry is { name, content }.
 */
export function parseMarkdownCards(
  files: { name: string; content: string }[],
): MarkdownParseResult {
  const errors: string[] = [];
  const cards: PulseCardImportPayload[] = [];
  let total = 0;

  for (const f of files) {
    const segments = splitMultiCardDocuments(f.content);
    total += segments.length;

    if (segments.length > 1) {
      segments.forEach((seg, idx) => {
        const label = `${f.name} [carte ${idx + 1}]`;
        const result = parseMarkdownSegment(seg, label);
        if (result.errors.length > 0) errors.push(...result.errors);
        if (result.card) cards.push(result.card);
      });
      continue;
    }

    const result = parseMarkdownCard(f.content, f.name);
    if (result.errors.length > 0) errors.push(...result.errors);
    if (result.card) cards.push(result.card);
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

  const result = parseMarkdownCard(content, fileName);
  return {
    total: 1,
    valid: result.card ? 1 : 0,
    errors: result.errors,
    cards: result.card ? [result.card] : [],
  };
}
