/**
 * Parses toolbox item Markdown (Obsidian-style) into catalog import payloads.
 * Mirrors pulseMarkdownParser conventions.
 */

import { isLikelyVideoUrl } from "@/lib/video-links";
import {
  TOOLBOX_CONTENT_TYPES,
  validateToolboxCatalogPayload,
  type ToolboxCatalogImportPayload,
  type ToolboxContentType,
  type ToolboxUserDeliveryStatus,
  type ValidationIssue,
  normalizeToolboxUserDeliveryStatus,
} from "@/services/programBuilderService";
import { getBuiltinToolboxContentTypeDefinition } from "@/lib/toolbox-content-type-definitions";

const REQUIRED_LOCALES = ["fr", "en"] as const;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ToolboxDistributionMode = "catalog" | "individual" | "group" | "global";

export interface ParsedToolboxMarkdownItem {
  source: string;
  external_key: string;
  content_type: string;
  title_i18n: Record<string, string>;
  description_i18n: Record<string, string>;
  duration?: string;
  is_active: boolean;
  archetype_targets: string[];
  shadow_targets: string[];
  widget_config: Record<string, unknown>;
  distribution: {
    mode: ToolboxDistributionMode;
    user_id?: string;
    user_ids: string[];
    company_id?: string;
    locale: "fr" | "en" | "all";
    assignment_status: ToolboxUserDeliveryStatus;
  };
}

export interface ToolboxMarkdownParseResult {
  total: number;
  valid: number;
  errors: string[];
  importIssues: ValidationIssue[];
  items: ParsedToolboxMarkdownItem[];
  payload: ToolboxCatalogImportPayload;
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
    if (line.trim() === "") {
      i++;
      continue;
    }
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
    if (line.trim() === "") {
      parts.push("");
      i++;
      continue;
    }
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
    if (line.trim() === "" || line.trim().startsWith("#")) {
      i++;
      continue;
    }
    const indent = line.search(/\S/);
    if (indent < baseIndent) break;
    if (indent > baseIndent && i > startIdx) break;
    if (line.match(/^(\s*)- (.*)$/)) break;

    const kvMatch = line.match(/^(\s*)([\w_]+)\s*:\s*(.*)$/);
    if (!kvMatch) {
      i++;
      continue;
    }

    const key = kvMatch[2];
    const val = kvMatch[3].trim();

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
        }
        if (nextIndent > indent) {
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

function slugFromFileName(fileName: string): string {
  return fileName.replace(/\.md$/i, "").trim().toLowerCase();
}

/** Marqueur de lot : ligne seule `<!-- toolbox-item -->` (pas dans un paragraphe). */
const BATCH_ITEM_LINE =
  /^\s*<!--\s*toolbox-item(?:\s*:\s*[^>]*?)?\s*-->\s*$/im;

function isIndexFile(fileName: string, meta: Record<string, unknown> | null): boolean {
  if (meta?.external_key) return false;
  const slug = slugFromFileName(fileName);
  return (
    slug === "readme" ||
    slug === "index" ||
    slug === "toolbox-item-template" ||
    slug === "toolbox-batch-template"
  );
}

/** Découpe un .md en plusieurs items (batch de 10, etc.). */
export function splitToolboxMarkdownFile(
  raw: string,
  fileName: string,
): Array<{ content: string; source: string }> {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  let body = trimmed;
  const opening = trimmed.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (opening) {
    const meta = parseYamlBlock(opening[1].split("\n"), 0, 0).value;
    if (meta.version === "toolbox-md-batch-v1") {
      body = trimmed.slice(opening[0].length).trim();
    }
  }

  if (!BATCH_ITEM_LINE.test(body)) {
    BATCH_ITEM_LINE.lastIndex = 0;
    return [{ content: trimmed, source: fileName }];
  }
  BATCH_ITEM_LINE.lastIndex = 0;

  const segments = body
    .split(/^\s*<!--\s*toolbox-item(?:\s*:\s*[^>]*?)?\s*-->\s*$/im)
    .map((part) => part.trim())
    .filter((part) => part.startsWith("---"));

  return segments.map((content, index) => ({
    content,
    source: `${fileName}#${index + 1}`,
  }));
}

function parseBodySections(body: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = body.split("\n");
  let currentKey: string | null = null;
  let currentLines: string[] = [];

  const headingRe =
    /^#{1,3}[ \t]+([\w_]+)(?:[ \t]*(?:\(?(FR|EN)\)?|[—–-][ \t]*(FR|EN)|:[ \t]*(FR|EN)|[ \t]+(FR|EN)))?[ \t]*$/i;

  for (const line of lines) {
    const m = line.match(headingRe);
    if (m) {
      const locale = (m[2] || m[3] || m[4] || m[5] || "").toLowerCase();
      if (locale !== "fr" && locale !== "en") {
        if (currentKey) currentLines.push(line);
        continue;
      }
      if (currentKey) sections[currentKey] = currentLines.join("\n").trim();
      currentKey = `${m[1].toLowerCase()}_${locale}`;
      currentLines = [];
    } else if (currentKey) {
      currentLines.push(line);
    }
  }
  if (currentKey) sections[currentKey] = currentLines.join("\n").trim();
  return sections;
}

function parseBulletList(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function parseStopSteps(text: string): { title: string; hint: string }[] {
  return parseBulletList(text).map((line) => {
    const m = line.match(/^(.+?)\s*[—–-]\s*(.+)$/);
    if (m) return { title: m[1].trim(), hint: m[2].trim() };
    return { title: line, hint: "" };
  });
}

function parseScenes(text: string): { title: string; sec: number }[] {
  const scenes: { title: string; sec: number }[] = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^##\s+(.+?)\s*\|\s*(\d+)\s*$/);
    if (m) scenes.push({ title: m[1].trim(), sec: parseInt(m[2], 10) });
  }
  return scenes;
}

function readI18nBlock(meta: Record<string, unknown>, key: string): Record<string, string> {
  const raw = meta[key];
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  return {
    fr: String(o.fr ?? "").trim(),
    en: String(o.en ?? "").trim(),
  };
}

function buildWidgetConfig(
  contentType: string,
  config: Record<string, unknown>,
  sections: Record<string, string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...config };

  const instrFr = sections.instructions_fr || "";
  const instrEn = sections.instructions_en || "";
  if (instrFr || instrEn) {
    out.instructions = instrFr || instrEn;
    out.instructions_i18n = { fr: instrFr || instrEn, en: instrEn || instrFr };
  }

  const stepsFr = sections.steps_fr ? parseStopSteps(sections.steps_fr) : [];
  const stepsEn = sections.steps_en ? parseStopSteps(sections.steps_en) : [];
  if (stepsFr.length || stepsEn.length) {
    const len = Math.max(stepsFr.length, stepsEn.length);
    out.steps = Array.from({ length: len }, (_, i) => {
      const titleFr = stepsFr[i]?.title || stepsEn[i]?.title || "";
      const titleEn = stepsEn[i]?.title || stepsFr[i]?.title || "";
      const hintFr = stepsFr[i]?.hint || stepsEn[i]?.hint || "";
      const hintEn = stepsEn[i]?.hint || stepsFr[i]?.hint || "";
      return {
        text: titleFr || titleEn,
        title: titleFr || titleEn,
        hint: hintFr || hintEn,
        text_i18n: { fr: titleFr || titleEn, en: titleEn || titleFr },
        title_i18n: { fr: titleFr || titleEn, en: titleEn || titleFr },
        hint_i18n: { fr: hintFr || hintEn, en: hintEn || hintFr },
      };
    });
  }

  const affFr = sections.affirmations_fr ? parseBulletList(sections.affirmations_fr) : [];
  const affEn = sections.affirmations_en ? parseBulletList(sections.affirmations_en) : [];
  if (affFr.length || affEn.length) {
    out.affirmations_i18n = { fr: affFr, en: affEn };
    out.affirmations = affFr.length ? affFr : affEn;
  }

  const promptFr = sections.prompt_fr || "";
  const promptEn = sections.prompt_en || "";
  if (promptFr || promptEn) {
    out.prompt = promptFr || promptEn;
    out.prompt_i18n = { fr: promptFr || promptEn, en: promptEn || promptFr };
  }

  const intentFr = sections.intention_fr || "";
  const intentEn = sections.intention_en || "";
  if (intentFr || intentEn) {
    out.intention = intentFr || intentEn;
    out.intention_i18n = { fr: intentFr || intentEn, en: intentEn || intentFr };
  }

  const scenesFr = sections.scenes_fr ? parseScenes(sections.scenes_fr) : [];
  const scenesEn = sections.scenes_en ? parseScenes(sections.scenes_en) : [];
  if (scenesFr.length || scenesEn.length) {
    const scenes = scenesFr.length ? scenesFr : scenesEn;
    out.scenes = scenes;
    out.total_sec = scenes.reduce((s, x) => s + x.sec, 0);
  }

  if (contentType === "focus_introspectif" && (intentFr || intentEn)) {
    out.intention = intentFr || intentEn;
    out.intention_i18n = { fr: intentFr || intentEn, en: intentEn || intentFr };
  }

  return out;
}

function parseDistribution(meta: Record<string, unknown>): ParsedToolboxMarkdownItem["distribution"] {
  const dist =
    meta.distribution && typeof meta.distribution === "object"
      ? (meta.distribution as Record<string, unknown>)
      : {};

  const modeRaw = String(dist.mode ?? meta.distribution_mode ?? "catalog").toLowerCase();
  const mode: ToolboxDistributionMode =
    modeRaw === "individual" || modeRaw === "group" || modeRaw === "global" ? modeRaw : "catalog";

  const userIds = Array.isArray(dist.user_ids)
    ? (dist.user_ids as unknown[]).map((x) => String(x).trim()).filter(Boolean)
    : [];

  const status =
    normalizeToolboxUserDeliveryStatus(dist.assignment_status) ??
    normalizeToolboxUserDeliveryStatus(meta.assignment_status) ??
    "active";

  const localeRaw = String(dist.locale ?? "all").toLowerCase();
  const locale: "fr" | "en" | "all" =
    localeRaw === "fr" || localeRaw === "en" ? localeRaw : "all";

  return {
    mode,
    user_id: typeof dist.user_id === "string" ? dist.user_id.trim() : undefined,
    user_ids: userIds,
    company_id: typeof dist.company_id === "string" ? dist.company_id.trim() : undefined,
    locale,
    assignment_status: status,
  };
}

export function parseToolboxMarkdownDocument(
  raw: string,
  source: string,
): { item: ParsedToolboxMarkdownItem | null; errors: string[] } {
  if (isIndexFile(source, null)) {
    const { meta } = parseFrontmatter(raw);
    if (isIndexFile(source, meta)) {
      return { item: null, errors: [`${source}: fichier index/template ignoré.`] };
    }
  }

  const { meta, body } = parseFrontmatter(raw);
  const errors: string[] = [];

  if (!meta || !meta.external_key) {
    return {
      item: null,
      errors: [`${source}: external_key manquant dans le frontmatter.`],
    };
  }

  const contentType = String(meta.content_type ?? "").trim();
  if (!contentType) {
    errors.push(`${source}: content_type manquant.`);
  } else if (
    !(TOOLBOX_CONTENT_TYPES as readonly string[]).includes(contentType) &&
    !getBuiltinToolboxContentTypeDefinition(contentType)
  ) {
    errors.push(`${source}: content_type '${contentType}' inconnu.`);
  }

  const titleI18n = readI18nBlock(meta, "title");
  const descI18n = readI18nBlock(meta, "description");
  for (const loc of REQUIRED_LOCALES) {
    if (!titleI18n[loc]) errors.push(`${source}: title.${loc} vide.`);
    if (!descI18n[loc]) errors.push(`${source}: description.${loc} vide.`);
  }

  const config =
    meta.config && typeof meta.config === "object"
      ? (meta.config as Record<string, unknown>)
      : {};

  const externalUrl = String(config.external_url ?? meta.external_url ?? "").trim();
  if (contentType === "external_link" && externalUrl && isLikelyVideoUrl(externalUrl)) {
    errors.push(`${source}: URL vidéo — utiliser la bibliothèque, pas toolbox.`);
  }

  const sections = parseBodySections(body);
  const widget_config = buildWidgetConfig(contentType, config, sections);
  if (externalUrl) widget_config.external_url = externalUrl;

  const distribution = parseDistribution(meta);
  if (distribution.mode === "individual") {
    if (!distribution.user_id || !UUID_RE.test(distribution.user_id)) {
      errors.push(`${source}: distribution.user_id UUID requis en mode individual.`);
    }
  }
  if (distribution.mode === "group") {
    if (!distribution.user_ids.length && !distribution.company_id) {
      errors.push(`${source}: user_ids ou company_id requis en mode group.`);
    }
  }

  if (errors.length > 0) return { item: null, errors };

  return {
    item: {
      source,
      external_key: String(meta.external_key),
      content_type: contentType,
      title_i18n: titleI18n,
      description_i18n: descI18n,
      duration: typeof meta.duration === "string" ? meta.duration : undefined,
      is_active: meta.is_active !== false,
      archetype_targets: Array.isArray(meta.archetype_targets)
        ? (meta.archetype_targets as string[])
        : [],
      shadow_targets: Array.isArray(meta.shadow_targets)
        ? (meta.shadow_targets as string[])
        : [],
      widget_config,
      distribution,
    },
    errors: [],
  };
}

export function parsedItemsToCatalogPayload(
  items: ParsedToolboxMarkdownItem[],
): ToolboxCatalogImportPayload {
  const toolbox_items = items.map((item) => {
    const base = {
      external_key: item.external_key,
      content_type: item.content_type as ToolboxContentType,
      title: item.title_i18n.fr || item.title_i18n.en,
      title_i18n: item.title_i18n,
      description: item.description_i18n.fr || item.description_i18n.en,
      description_i18n: item.description_i18n,
      duration: item.duration,
      widget_config: item.widget_config,
      is_active: item.is_active,
      assignment_status: item.distribution.assignment_status,
    };

    if (item.distribution.mode === "individual" && item.distribution.user_id) {
      return { ...base, user_ids: [item.distribution.user_id] };
    }
    if (item.distribution.mode === "group" && item.distribution.user_ids.length) {
      return { ...base, user_ids: item.distribution.user_ids };
    }
    return base;
  });

  return {
    version: "toolbox-catalog-v1",
    toolbox_items,
  };
}

export function parseToolboxMarkdownBatch(
  files: Array<{ name: string; content: string }>,
): ToolboxMarkdownParseResult {
  const errors: string[] = [];
  const items: ParsedToolboxMarkdownItem[] = [];
  let total = 0;

  for (const file of files) {
    const chunks = splitToolboxMarkdownFile(file.content, file.name);
    for (const chunk of chunks) {
      total += 1;
      const { item, errors: fileErrors } = parseToolboxMarkdownDocument(
        chunk.content,
        chunk.source,
      );
      errors.push(...fileErrors);
      if (item) items.push(item);
    }
  }

  const payload = parsedItemsToCatalogPayload(items);
  const importIssues = items.length > 0 ? validateToolboxCatalogPayload(payload) : [];

  return {
    total,
    valid: items.length,
    errors,
    importIssues,
    items,
    payload,
  };
}
