import {
  extractToolboxMarkdownDocument,
  parseToolboxMarkdownBulletList,
} from "@/features/toolbox-admin/toolboxMarkdownParser";
import type {
  ToolboxDistributionMode,
  ToolboxItem,
  ToolboxItemConfig,
  ToolboxItemDistribution,
  ToolboxItemI18nText,
  ToolboxItemLocale,
  ParseToolboxItemOptions,
} from "./types";

function readI18nBlock(meta: Record<string, unknown>, key: string): ToolboxItemI18nText {
  const raw = meta[key];
  if (typeof raw === "string") {
    const s = raw.trim();
    return { fr: s, en: s };
  }
  if (!raw || typeof raw !== "object") return { fr: "", en: "" };
  const o = raw as Record<string, unknown>;
  return {
    fr: String(o.fr ?? "").trim(),
    en: String(o.en ?? "").trim(),
  };
}

function readStringArray(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.map((x) => String(x).trim().toLowerCase()).filter(Boolean);
  }
  if (typeof val === "string" && val.trim()) {
    const trimmed = val.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      return trimmed
        .slice(1, -1)
        .split(",")
        .map((p) => p.replace(/^['"]|['"]$/g, "").trim().toLowerCase())
        .filter(Boolean);
    }
  }
  return [];
}

function parseDistribution(meta: Record<string, unknown>): ToolboxItemDistribution {
  const dist =
    meta.distribution && typeof meta.distribution === "object"
      ? (meta.distribution as Record<string, unknown>)
      : {};

  const modeRaw = String(dist.mode ?? "catalog").toLowerCase();
  const mode: ToolboxDistributionMode =
    modeRaw === "individual" || modeRaw === "group" || modeRaw === "global" ? modeRaw : "catalog";

  const localeRaw = String(dist.locale ?? "all").toLowerCase();
  const locale = localeRaw === "fr" || localeRaw === "en" ? localeRaw : "all";

  const userIds = Array.isArray(dist.user_ids)
    ? (dist.user_ids as unknown[]).map((x) => String(x).trim()).filter(Boolean)
    : undefined;

  return {
    mode,
    assignment_status: String(dist.assignment_status ?? "active").trim(),
    user_id: typeof dist.user_id === "string" ? dist.user_id.trim() : undefined,
    user_ids: userIds?.length ? userIds : undefined,
    company_id: typeof dist.company_id === "string" ? dist.company_id.trim() : undefined,
    locale,
  };
}

function parseConfig(meta: Record<string, unknown>): ToolboxItemConfig {
  const raw =
    meta.config && typeof meta.config === "object" ? (meta.config as Record<string, unknown>) : {};
  const durationSec =
    typeof raw.duration_sec === "number"
      ? raw.duration_sec
      : typeof raw.duration_sec === "string"
        ? parseInt(raw.duration_sec, 10)
        : 0;

  return {
    ...raw,
    duration_sec: Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 120,
  };
}

function padSteps(steps: string[], count: number): string[] {
  if (steps.length >= count) return steps.slice(0, count);
  return [...steps, ...Array.from({ length: count - steps.length }, () => "")];
}

/**
 * Parse un fichier .md toolbox (frontmatter YAML + sections # Instructions / # Steps).
 * Structure garantie par le template IA — pas de validation souple côté runtime.
 */
export function parseToolboxItemMarkdown(
  raw: string,
  options: ParseToolboxItemOptions = {},
): ToolboxItem {
  const { meta, sections } = extractToolboxMarkdownDocument(raw);
  const expectedStepCount = options.expectedStepCount ?? 4;

  const instructionsFr = (sections.instructions_fr ?? "").trim();
  const instructionsEn = (sections.instructions_en ?? "").trim();
  const stepsFr = padSteps(
    parseToolboxMarkdownBulletList(sections.steps_fr ?? ""),
    expectedStepCount,
  );
  const stepsEn = padSteps(
    parseToolboxMarkdownBulletList(sections.steps_en ?? ""),
    expectedStepCount,
  );

  return {
    external_key: String(meta.external_key ?? "").trim(),
    content_type: String(meta.content_type ?? "").trim(),
    is_active: meta.is_active !== false,
    duration: String(meta.duration ?? "").trim(),
    category: String(meta.category ?? "custom").trim(),
    priority: meta.priority != null ? String(meta.priority).trim() : undefined,
    archetype_targets: readStringArray(meta.archetype_targets),
    shadow_targets: readStringArray(meta.shadow_targets),
    title: readI18nBlock(meta, "title"),
    description: readI18nBlock(meta, "description"),
    distribution: parseDistribution(meta),
    config: parseConfig(meta),
    instructionsFr,
    instructionsEn,
    stepsFr,
    stepsEn,
    source: options.source,
  };
}

export function pickToolboxItemCopy(
  item: ToolboxItem,
  locale: ToolboxItemLocale,
): {
  title: string;
  description: string;
  instructions: string;
  steps: string[];
} {
  const isFr = locale === "fr";
  return {
    title: isFr ? item.title.fr || item.title.en : item.title.en || item.title.fr,
    description: isFr
      ? item.description.fr || item.description.en
      : item.description.en || item.description.fr,
    instructions: isFr
      ? item.instructionsFr || item.instructionsEn
      : item.instructionsEn || item.instructionsFr,
    steps: isFr
      ? item.stepsFr.some(Boolean)
        ? item.stepsFr
        : item.stepsEn
      : item.stepsEn.some(Boolean)
        ? item.stepsEn
        : item.stepsFr,
  };
}
