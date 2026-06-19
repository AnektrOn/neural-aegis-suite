/**
 * Parses toolbox item Markdown (Obsidian-style) into catalog import payloads.
 * Mirrors pulseMarkdownParser conventions.
 */

import { isLikelyVideoUrl } from "@/lib/video-links";
import {
  TOOLBOX_CONTENT_TYPES,
  isKnownToolboxContentType,
  validateToolboxCatalogPayload,
  type ToolboxCatalogImportPayload,
  type ToolboxContentType,
  type ToolboxUserDeliveryStatus,
  type ValidationIssue,
  normalizeToolboxUserDeliveryStatus,
} from "@/services/programBuilderService";
import { parseArchetypeTargets } from "@/pages/admin/pulse/pulsePrinciples";

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
  let activeLocale: "fr" | "en" | null = null;

  const headingRe =
    /^#{1,3}[ \t]+([\w_]+)(?:[ \t]*(?:\(?(FR|EN)\)?|[—–-][ \t]*(FR|EN)|:[ \t]*(FR|EN)|[ \t]+(FR|EN)))?[ \t]*$/i;
  const localeBlockRe = /^#{1,3}[ \t]+(FR|EN)[ \t]*$/i;
  const sectionOnlyRe = /^#{1,3}[ \t]+([\w_]+)[ \t]*$/i;

  const flush = () => {
    if (currentKey) sections[currentKey] = currentLines.join("\n").trim();
    currentKey = null;
    currentLines = [];
  };

  for (const line of lines) {
    const localeBlock = line.match(localeBlockRe);
    if (localeBlock) {
      flush();
      activeLocale = localeBlock[1].toLowerCase() as "fr" | "en";
      continue;
    }

    const m = line.match(headingRe);
    if (m) {
      const locale = (m[2] || m[3] || m[4] || m[5] || "").toLowerCase();
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
      currentKey = `${m[1].toLowerCase()}_${locale}`;
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

  // Pulse card sections → toolbox instructions
  for (const locale of REQUIRED_LOCALES) {
    if (!sections[`instructions_${locale}`]) {
      const hook = sections[`hook_${locale}`] || "";
      const concept = sections[`concept_${locale}`] || "";
      const action = sections[`action_${locale}`] || "";
      const merged = [hook, concept, action].filter(Boolean).join("\n\n");
      if (merged) sections[`instructions_${locale}`] = merged;
    }
    if (!sections[`steps_${locale}`] && sections[`action_${locale}`]) {
      sections[`steps_${locale}`] = `- ${sections[`action_${locale}`].replace(/\n/g, "\n- ")}`;
    }
  }

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

/** STOP steps embedded in Instructions prose: `**S — Stop (subtitle)**` + body. */
const STOP_PROSE_HEADER_RE =
  /^\*\*([STOPS])\s*[—–-]\s*([^\n*]+?)(?:\s*\(([^)]+)\))?\*\*/im;

function parseStopStepsFromProse(text: string): { title: string; hint: string }[] {
  const trimmed = text.trim();
  if (!trimmed || !STOP_PROSE_HEADER_RE.test(trimmed)) return [];

  const steps: { title: string; hint: string }[] = [];
  const blocks = trimmed.split(/\n(?=\*\*[STOPS]\s*[—–-])/i).filter(Boolean);

  for (const block of blocks) {
    const headerMatch = block.match(STOP_PROSE_HEADER_RE);
    if (!headerMatch) continue;
    const letter = headerMatch[1].toUpperCase();
    const mainTitle = headerMatch[2].trim();
    const paren = headerMatch[3]?.trim();
    const label = paren ? `${mainTitle} (${paren})` : mainTitle;
    const hint = block.slice(headerMatch[0].length).trim();
    steps.push({ title: `${letter} — ${label}`, hint });
  }
  return steps;
}

function splitInstructionsIntroAndStopSteps(text: string): {
  intro: string;
  steps: { title: string; hint: string }[];
} {
  const trimmed = text.trim();
  const marker = trimmed.search(/\*\*[STOPS]\s*[—–-]/i);
  if (marker < 0) return { intro: trimmed, steps: [] };
  return {
    intro: trimmed.slice(0, marker).trim(),
    steps: parseStopStepsFromProse(trimmed.slice(marker)),
  };
}

const CONTENT_TYPE_ALIASES: Record<string, string> = {
  actionable_tool: "micro_practice",
  regulation_tool: "stop_protocol",
  boundary_practice: "boundary_practice",
};

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
  if (typeof raw === "string") {
    const s = raw.trim();
    return { fr: s, en: s };
  }
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  return {
    fr: String(o.fr ?? "").trim(),
    en: String(o.en ?? "").trim(),
  };
}

function readI18nWithFallback(meta: Record<string, unknown>, keys: string[]): Record<string, string> {
  for (const key of keys) {
    const block = readI18nBlock(meta, key);
    if (block.fr || block.en) {
      return {
        fr: block.fr || block.en,
        en: block.en || block.fr,
      };
    }
  }
  return { fr: "", en: "" };
}

function humanizeExternalKey(externalKey: string): Record<string, string> {
  const slug = externalKey
    .replace(/^toolbox_/i, "")
    .replace(/^tool_/i, "")
    .trim();
  const title = slug
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
  if (!title) return { fr: "", en: "" };
  return { fr: title, en: title };
}

function resolveToolboxContentType(
  meta: Record<string, unknown>,
  source: string,
  sections: Record<string, string> = {},
): string {
  const explicit = [meta.content_type, meta.type, meta.tool_type]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean);

  const haystack = [
    String(meta.external_key ?? ""),
    slugFromFileName(source),
    String(meta.rune ?? ""),
    String(meta.glyph ?? ""),
    String(meta.category ?? ""),
  ]
    .join(" ")
    .toLowerCase();

  for (const raw of explicit) {
    const slug = raw.toLowerCase().replace(/[\s-]+/g, "_");
    if (slug === "actionable_tool") {
      const instr = `${sections.instructions_fr || ""}\n${sections.instructions_en || ""}`;
      const hasStopProse = STOP_PROSE_HEADER_RE.test(instr);
      const hasStepsSection = Boolean(sections.steps_fr || sections.steps_en);
      if (hasStopProse || hasStepsSection || haystack.includes("stop") || haystack.includes("rumination")) {
        return "stop_protocol";
      }
      return CONTENT_TYPE_ALIASES.actionable_tool;
    }
    if (CONTENT_TYPE_ALIASES[slug] && isKnownToolboxContentType(CONTENT_TYPE_ALIASES[slug])) {
      return CONTENT_TYPE_ALIASES[slug];
    }
    if (isKnownToolboxContentType(slug)) return slug;
  }

  if (haystack.includes("boundary") || haystack.includes("shielding") || haystack.includes("shield")) {
    return "boundary_practice";
  }
  if (haystack.includes("breath")) return "breathwork";
  if (haystack.includes("stop") || haystack.includes("rumination")) return "stop_protocol";
  if (haystack.includes("journal")) return "journal_prompt";
  if (haystack.includes("affirm")) return "affirmations";
  if (haystack.includes("gratitude")) return "gratitude";
  if (haystack.includes("visual")) return "visualization";
  if (haystack.includes("body_scan") || haystack.includes("bodyscan")) return "body_scan";
  if (haystack.includes("focus") || haystack.includes("introspect")) return "focus_introspectif";

  return "micro_practice";
}

function buildWidgetConfig(
  contentType: string,
  config: Record<string, unknown>,
  sections: Record<string, string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...config };
  const sectionCopy = { ...sections };

  let instrFr = sectionCopy.instructions_fr || "";
  let instrEn = sectionCopy.instructions_en || "";

  const stepsFrFromBullets = sectionCopy.steps_fr ? parseStopSteps(sectionCopy.steps_fr) : [];
  const stepsEnFromBullets = sectionCopy.steps_en ? parseStopSteps(sectionCopy.steps_en) : [];

  let stepsFr = stepsFrFromBullets;
  let stepsEn = stepsEnFromBullets;

  if (contentType === "stop_protocol") {
    if (!stepsFr.length && instrFr) {
      const split = splitInstructionsIntroAndStopSteps(instrFr);
      if (split.steps.length) {
        stepsFr = split.steps;
        instrFr = split.intro;
      }
    }
    if (!stepsEn.length && instrEn) {
      const split = splitInstructionsIntroAndStopSteps(instrEn);
      if (split.steps.length) {
        stepsEn = split.steps;
        instrEn = split.intro;
      }
    }

    if (typeof out.duration_min === "number" && out.duration_min > 0) {
      if (out.duration_sec == null) out.duration_sec = out.duration_min * 60;
      if (out.step_duration_sec == null) out.step_duration_sec = 30;
      if (!out.mode) out.mode = "timed";
    }
  }

  if (instrFr || instrEn) {
    out.instructions = instrFr || instrEn;
    out.instructions_i18n = { fr: instrFr || instrEn, en: instrEn || instrFr };
  }

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
    if (contentType === "stop_protocol") {
      out.usage_prompt_i18n = { fr: promptFr || promptEn, en: promptEn || promptFr };
    }
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

  const modeRaw = String(dist.mode ?? meta.distribution_mode ?? "").toLowerCase();
  const mode: ToolboxDistributionMode =
    modeRaw === "individual" || modeRaw === "group" || modeRaw === "global"
      ? modeRaw
      : typeof meta.user_id === "string" && meta.user_id.trim()
        ? "individual"
        : "catalog";

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
    user_id:
      typeof dist.user_id === "string"
        ? dist.user_id.trim()
        : typeof meta.user_id === "string"
          ? meta.user_id.trim()
          : undefined,
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

  const sections = parseBodySections(body);
  const contentTypeRaw = resolveToolboxContentType(meta, source, sections);
  const contentType = contentTypeRaw.trim();
  if (!contentType) {
    errors.push(`${source}: content_type manquant.`);
  } else if (!isKnownToolboxContentType(contentType)) {
    errors.push(`${source}: content_type '${contentType}' inconnu.`);
  }

  let titleI18n = readI18nWithFallback(meta, ["title", "name", "label"]);
  if (!titleI18n.fr && !titleI18n.en) {
    titleI18n = humanizeExternalKey(String(meta.external_key));
  }

  let descI18n = readI18nWithFallback(meta, ["description", "problem", "summary", "subtitle"]);
  if (!descI18n.fr && !descI18n.en) {
    const bullets = meta.bullets;
    if (bullets && typeof bullets === "object") {
      const b = bullets as Record<string, unknown>;
      const frList = Array.isArray(b.fr) ? (b.fr as string[]).map((s) => String(s).trim()).filter(Boolean) : [];
      const enList = Array.isArray(b.en) ? (b.en as string[]).map((s) => String(s).trim()).filter(Boolean) : [];
      if (frList.length || enList.length) {
        descI18n = {
          fr: frList[0] || enList[0] || "",
          en: enList[0] || frList[0] || "",
        };
      }
    }
  }
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

  const widget_config = buildWidgetConfig(contentType, config, sections);
  if (externalUrl) widget_config.external_url = externalUrl;

  const distribution = parseDistribution(meta);
  if (distribution.mode === "individual" && distribution.user_id && !UUID_RE.test(distribution.user_id)) {
    errors.push(`${source}: distribution.user_id UUID invalide.`);
  }
  if (distribution.mode === "group") {
    if (!distribution.user_ids.length && !distribution.company_id) {
      errors.push(`${source}: user_ids ou company_id requis en mode group.`);
    }
  }

  const { slugs: archetypeTargets, invalid: invalidArchetypes } = parseArchetypeTargets(
    meta.archetype_targets,
  );
  for (const a of invalidArchetypes) {
    errors.push(`${source}: archetype invalide '${a}'.`);
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
      archetype_targets: archetypeTargets,
      shadow_targets: Array.isArray(meta.shadow_targets)
        ? (meta.shadow_targets as string[]).map((s) => String(s).trim().toLowerCase())
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
