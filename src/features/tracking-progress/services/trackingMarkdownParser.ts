/**
 * Tracking Progress — Markdown Parser
 *
 * Parses a Markdown file containing tracking questions into
 * ParsedTrackingQuestion[].
 *
 * ## Expected format
 *
 * ```markdown
 * # Questionnaire de Tracking — Perspective Myss
 *
 * ## TQ-M-001
 * type: scale
 * scale_min: 1
 * scale_max: 10
 * archetype_target: sovereign
 * house_target: 10
 * dimension_target: light
 * weight: 1.5
 *
 * question_fr: Dans quelle mesure vous sentez-vous aligné avec votre rôle de leader cette semaine ?
 * question_en: To what extent do you feel aligned with your leadership role this week?
 *
 * ---
 *
 * ## TQ-M-002
 * type: choice
 * archetype_target: warrior
 * house_target: 6
 * dimension_target: general
 *
 * question_fr: Comment décririez-vous votre relation au conflit cette semaine ?
 * question_en: How would you describe your relationship with conflict this week?
 *
 * options:
 *   - value: avoid
 *     label_fr: J'ai évité les tensions
 *     label_en: I avoided tensions
 *     weights: [{archetype: warrior, polarity: shadow, weight: 2}]
 *   - value: navigate
 *     label_fr: J'ai navigué les défis avec clarté
 *     label_en: I navigated challenges with clarity
 *     weights: [{archetype: warrior, polarity: light, weight: 2}]
 * ```
 */

import type {
  ParsedTrackingQuestion,
  TrackingMarkdownParseResult,
  TrackingQuestionType,
  TrackingQuestionOption,
} from "../domain/types";
import type { AnyArchetypeKey } from "@/features/archetype-deepdive-v2/domain/types";

const VALID_TYPES: TrackingQuestionType[] = ["scale", "choice", "text"];

const VALID_ARCHETYPES = new Set<string>([
  "sovereign", "warrior", "lover", "caregiver",
  "creator", "explorer", "rebel", "sage",
  "mystic", "healer", "magician", "jester",
  "child", "victim", "saboteur", "prostitute",
]);

const VALID_DIMENSIONS = new Set<string>(["light", "shadow", "general"]);

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function trim(s: string): string {
  return s.trim();
}

function parseKeyValue(line: string): [string, string] | null {
  const colonIdx = line.indexOf(":");
  if (colonIdx < 0) return null;
  return [trim(line.slice(0, colonIdx)), trim(line.slice(colonIdx + 1))];
}

/**
 * Very lightweight JSON-like parser for the weights field.
 * Handles: [{archetype: warrior, polarity: light, weight: 2}]
 */
function parseWeightsField(raw: string): TrackingQuestionOption["weights"] {
  try {
    // Normalise bare keys → quoted JSON keys
    const jsonStr = raw
      .replace(/(\b\w+)(?=\s*:)/g, '"$1"')
      .replace(/:\s*([a-z_]+)(?=[,}\]])/gi, ': "$1"');
    return JSON.parse(jsonStr) as TrackingQuestionOption["weights"];
  } catch {
    return [];
  }
}

/** Parse a YAML-ish list of options starting after "options:" */
function parseOptions(lines: string[], startIdx: number): { options: TrackingQuestionOption[]; endIdx: number } {
  const options: TrackingQuestionOption[] = [];
  let i = startIdx;
  let current: Partial<TrackingQuestionOption> | null = null;

  while (i < lines.length) {
    const raw = lines[i];
    const line = trim(raw);

    // Blank or separator → skip
    if (line === "" || line === "---") {
      // If we hit a new question block, stop
      if (line === "---") break;
      i++;
      continue;
    }

    // Next question starts
    if (line.startsWith("## ")) break;

    // New option item
    if (line.startsWith("- value:")) {
      if (current) options.push(current as TrackingQuestionOption);
      current = {
        value: trim(line.slice("- value:".length)),
        label_fr: "",
        label_en: "",
        weights: [],
      };
    } else if (current && line.startsWith("label_fr:")) {
      current.label_fr = trim(line.slice("label_fr:".length));
    } else if (current && line.startsWith("label_en:")) {
      current.label_en = trim(line.slice("label_en:".length));
    } else if (current && line.startsWith("weights:")) {
      const weightsRaw = trim(line.slice("weights:".length));
      current.weights = parseWeightsField(weightsRaw);
    }

    i++;
  }

  if (current) options.push(current as TrackingQuestionOption);
  return { options, endIdx: i };
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

export function parseTrackingMarkdown(md: string): TrackingMarkdownParseResult {
  const lines = md.split("\n");
  const errors: string[] = [];
  const questions: ParsedTrackingQuestion[] = [];

  let i = 0;
  let currentKey: string | null = null;
  let currentBlock: Record<string, string> = {};
  let currentOptions: TrackingQuestionOption[] = [];
  let currentFr = "";
  let currentEn = "";
  let inOptions = false;
  let inQuestionFr = false;
  let inQuestionEn = false;

  const flushBlock = () => {
    if (!currentKey) return;

    const q = buildQuestion(
      currentKey,
      currentBlock,
      currentFr,
      currentEn,
      currentOptions,
      errors,
    );
    if (q) questions.push(q);

    currentKey = null;
    currentBlock = {};
    currentOptions = [];
    currentFr = "";
    currentEn = "";
    inOptions = false;
    inQuestionFr = false;
    inQuestionEn = false;
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = trim(raw);

    // New question block
    if (line.startsWith("## ")) {
      flushBlock();
      currentKey = trim(line.slice(3));
      i++;
      continue;
    }

    // Separator
    if (line === "---") {
      flushBlock();
      i++;
      continue;
    }

    if (!currentKey) {
      i++;
      continue;
    }

    // Blank line → reset inline mode
    if (line === "") {
      inQuestionFr = false;
      inQuestionEn = false;
      i++;
      continue;
    }

    // Options block
    if (line === "options:") {
      inOptions = true;
      inQuestionFr = false;
      inQuestionEn = false;
      i++;
      const result = parseOptions(lines, i);
      currentOptions = result.options;
      i = result.endIdx;
      inOptions = false;
      continue;
    }

    if (inOptions) {
      i++;
      continue;
    }

    // Multi-line question text
    if (line.startsWith("question_fr:")) {
      currentFr = trim(line.slice("question_fr:".length));
      inQuestionFr = true;
      inQuestionEn = false;
      i++;
      continue;
    }
    if (line.startsWith("question_en:")) {
      currentEn = trim(line.slice("question_en:".length));
      inQuestionEn = true;
      inQuestionFr = false;
      i++;
      continue;
    }

    if (inQuestionFr) {
      currentFr += " " + line;
      i++;
      continue;
    }
    if (inQuestionEn) {
      currentEn += " " + line;
      i++;
      continue;
    }

    // Key: value metadata lines
    const kv = parseKeyValue(line);
    if (kv) {
      currentBlock[kv[0]] = kv[1];
    }

    i++;
  }

  flushBlock();

  return {
    total: questions.length + errors.filter((e) => e.startsWith("[")).length,
    valid: questions.length,
    errors,
    questions,
  };
}

function buildQuestion(
  externalKey: string,
  block: Record<string, string>,
  frText: string,
  enText: string,
  options: TrackingQuestionOption[],
  errors: string[],
): ParsedTrackingQuestion | null {
  if (!frText || !enText) {
    errors.push(`[${externalKey}] Missing question_fr or question_en`);
    return null;
  }

  const rawType = block["type"] ?? "scale";
  if (!VALID_TYPES.includes(rawType as TrackingQuestionType)) {
    errors.push(`[${externalKey}] Invalid type "${rawType}"`);
    return null;
  }

  const archetypeTarget = block["archetype_target"];
  if (archetypeTarget && !VALID_ARCHETYPES.has(archetypeTarget)) {
    errors.push(`[${externalKey}] Unknown archetype_target "${archetypeTarget}"`);
  }

  const dimensionTarget = block["dimension_target"];
  if (dimensionTarget && !VALID_DIMENSIONS.has(dimensionTarget)) {
    errors.push(`[${externalKey}] Unknown dimension_target "${dimensionTarget}"`);
  }

  const houseTarget = block["house_target"] ? parseInt(block["house_target"], 10) : undefined;
  if (houseTarget !== undefined && (isNaN(houseTarget) || houseTarget < 1 || houseTarget > 12)) {
    errors.push(`[${externalKey}] house_target must be 1..12`);
  }

  return {
    external_key:     externalKey,
    question_fr:      trim(frText),
    question_en:      trim(enText),
    question_type:    rawType as TrackingQuestionType,
    scale_min:        block["scale_min"] ? parseInt(block["scale_min"], 10) : 1,
    scale_max:        block["scale_max"] ? parseInt(block["scale_max"], 10) : 10,
    options,
    archetype_target: archetypeTarget as AnyArchetypeKey | undefined,
    house_target:     houseTarget,
    dimension_target: dimensionTarget as "light" | "shadow" | "general" | undefined,
    weight:           block["weight"] ? parseFloat(block["weight"]) : 1.0,
  };
}
