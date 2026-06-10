function cloneConfig(cfg: Record<string, unknown>): Record<string, unknown> {
  return typeof structuredClone === "function"
    ? structuredClone(cfg)
    : (JSON.parse(JSON.stringify(cfg)) as Record<string, unknown>);
}

function readPositiveInt(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
}

export function countToolboxGuideSteps(cfg: Record<string, unknown>): number {
  if (Array.isArray(cfg.steps) && cfg.steps.length > 0) return cfg.steps.length;
  if (Array.isArray(cfg.affirmations) && cfg.affirmations.length > 0) return cfg.affirmations.length;
  if (Array.isArray(cfg.segments) && cfg.segments.length > 0) return cfg.segments.length;
  if (Array.isArray(cfg.scenes) && cfg.scenes.length > 0) return cfg.scenes.length;
  if (Array.isArray(cfg.zones) && cfg.zones.length > 0) return cfg.zones.length;
  if (Array.isArray(cfg.cues) && cfg.cues.length > 0) return cfg.cues.length;
  return 0;
}

const MULTI_SEGMENT_CONTENT_TYPES = new Set([
  "visualization",
  "body_scan",
  "stop_protocol",
  "micro_practice",
  "ritual_sequence",
]);

export function usesHabitTimeBudget(
  contentType: string,
  widgetConfig: Record<string, unknown>,
): boolean {
  if (countToolboxGuideSteps(widgetConfig) > 0) return true;
  return MULTI_SEGMENT_CONTENT_TYPES.has(contentType);
}

/** Parse assignment duration label e.g. "15 min", "3×5 min". */
export function parseAssignmentDurationSec(duration: string | null | undefined): number {
  if (!duration?.trim()) return 0;
  const triple = duration.match(/(\d+)\s*[x×]\s*(\d+)\s*min/i);
  if (triple) return parseInt(triple[1], 10) * parseInt(triple[2], 10) * 60;
  const single = duration.match(/(\d+)\s*min/i);
  if (single) return parseInt(single[1], 10) * 60;
  return 0;
}

export interface ToolboxDurationOptions {
  /** Minutes selected in UI (per step when perStepMode). */
  defaultMinutes: number;
  minMinutes: number;
  maxMinutes: number;
  guideStepCount?: number;
  /** When true, chip values are minutes per guide step (3 min → 3×3 min total). */
  perStepMode?: boolean;
}

function withGuideStepCount(
  options: ToolboxDurationOptions,
  widgetConfig: Record<string, unknown> | null | undefined,
  totalSec: number,
): ToolboxDurationOptions {
  const cfg = widgetConfig && typeof widgetConfig === "object" ? widgetConfig : {};
  const guideStepCount = countToolboxGuideSteps(cfg);
  if (guideStepCount <= 1) {
    return { ...options, guideStepCount: undefined, perStepMode: false };
  }
  const totalMin = Math.max(1, Math.round(totalSec / 60));
  const defaultPerStep = Math.max(1, Math.round(totalMin / guideStepCount));
  return {
    ...options,
    defaultMinutes: defaultPerStep,
    minMinutes: 1,
    maxMinutes: Math.max(1, Math.floor(options.maxMinutes / guideStepCount)),
    guideStepCount,
    perStepMode: true,
  };
}

export function perStepMinutesToTotalSec(
  perStepMinutes: number,
  options: Pick<ToolboxDurationOptions, "guideStepCount" | "perStepMode">,
): number {
  const steps = options.perStepMode && options.guideStepCount ? options.guideStepCount : 1;
  return Math.max(30, perStepMinutes * steps * 60);
}

export function getToolboxTotalDurationSec(
  contentType: string,
  widgetConfig: Record<string, unknown> | null | undefined,
  assignmentDuration?: string | null,
): number {
  const cfg = widgetConfig && typeof widgetConfig === "object" ? widgetConfig : {};

  if (typeof cfg.duration_min === "number" && cfg.duration_min > 0) {
    const stepCountEarly = countToolboxGuideSteps(cfg);
    if (stepCountEarly <= 1) {
      return cfg.duration_min * 60;
    }
  }

  if (Array.isArray(cfg.segments) && cfg.segments.length > 0) {
    const segmentTotal = (cfg.segments as { duration_sec?: number }[]).reduce(
      (sum, seg) => sum + readPositiveInt(seg.duration_sec),
      0,
    );
    if (segmentTotal > 0) return segmentTotal;
  }

  const stepCount = countToolboxGuideSteps(cfg);
  if (stepCount > 0) {
    if (typeof cfg.duration_sec === "number" && cfg.duration_sec > 0) {
      return cfg.duration_sec;
    }
    const perStep = readPositiveInt(cfg.step_duration_sec);
    if (perStep > 0) {
      return perStep * stepCount;
    }
    if (typeof cfg.duration_min === "number" && cfg.duration_min > 0) {
      return cfg.duration_min * 60;
    }
  }

  if (typeof cfg.duration_min === "number" && cfg.duration_min > 0) {
    return cfg.duration_min * 60;
  }

  if (typeof cfg.duration_sec === "number" && cfg.duration_sec > 0) {
    if (!Array.isArray(cfg.scenes) && !Array.isArray(cfg.zones)) {
      return cfg.duration_sec;
    }
  }

  if (Array.isArray(cfg.scenes)) {
    return (cfg.scenes as { duration_sec?: number }[]).reduce(
      (sum, scene) => sum + readPositiveInt(scene.duration_sec),
      0,
    );
  }

  if (Array.isArray(cfg.zones)) {
    return (cfg.zones as { duration_sec?: number }[]).reduce(
      (sum, zone) => sum + readPositiveInt(zone.duration_sec),
      0,
    );
  }

  if (contentType === "stop_protocol" || cfg.mode === "timed") {
    const stepDur = readPositiveInt(cfg.step_duration_sec) || 30;
    const stepCount = Array.isArray(cfg.steps) ? cfg.steps.length : 4;
    return stepDur * Math.max(1, stepCount);
  }

  if (contentType === "breathwork") {
    const cycle =
      readPositiveInt(cfg.breath_in_sec) +
      readPositiveInt(cfg.pause1_sec) +
      readPositiveInt(cfg.breath_out_sec) +
      readPositiveInt(cfg.pause2_sec);
    const cycles = readPositiveInt(cfg.cycles) || 1;
    return cycle * cycles;
  }

  const fromAssignment = parseAssignmentDurationSec(assignmentDuration);
  if (fromAssignment > 0) return fromAssignment;

  return 0;
}

export function getToolboxDurationOptions(
  contentType: string,
  widgetConfig: Record<string, unknown> | null | undefined,
  assignmentDuration?: string | null,
): ToolboxDurationOptions | null {
  const totalSec = getToolboxTotalDurationSec(contentType, widgetConfig, assignmentDuration);
  if (totalSec <= 0) return null;

  const defaultMinutes = Math.max(1, Math.round(totalSec / 60));
  return withGuideStepCount(
    {
      defaultMinutes,
      minMinutes: 1,
      maxMinutes: 90,
    },
    widgetConfig,
    totalSec,
  );
}

/** Habits page: always expose duration control for toolbox-linked routines. */
export function getHabitToolboxDurationOptions(
  contentType: string,
  widgetConfig: Record<string, unknown> | null | undefined,
  assignmentDuration?: string | null,
): ToolboxDurationOptions {
  const totalSec =
    getToolboxTotalDurationSec(contentType, widgetConfig, assignmentDuration) ||
    parseAssignmentDurationSec(assignmentDuration) ||
    15 * 60;
  const detected = getToolboxDurationOptions(contentType, widgetConfig, assignmentDuration);
  if (detected) return detected;

  const defaultMinutes = Math.max(1, Math.round(totalSec / 60));
  return withGuideStepCount(
    {
      defaultMinutes,
      minMinutes: 1,
      maxMinutes: 90,
    },
    widgetConfig,
    totalSec,
  );
}

export function mergeToolboxDurationOverride(
  contentType: string,
  widgetConfig: Record<string, unknown>,
  overrideMinutes: number,
  options?: Pick<ToolboxDurationOptions, "guideStepCount" | "perStepMode">,
): Record<string, unknown> {
  const cfg = cloneConfig(widgetConfig);
  const steps = options?.perStepMode && options.guideStepCount ? options.guideStepCount : 1;
  const targetSec = Math.max(30, overrideMinutes * steps * 60);

  if (typeof cfg.duration_min === "number" && cfg.duration_min > 0 && !options?.perStepMode) {
    return { ...cfg, duration_min: overrideMinutes };
  }

  if (typeof cfg.duration_sec === "number" && !Array.isArray(cfg.scenes) && !Array.isArray(cfg.zones)) {
    if (!options?.perStepMode) {
      return { ...cfg, duration_sec: Math.max(30, overrideMinutes * 60) };
    }
  }

  if (cfg.time_budget_mode === true || usesHabitTimeBudget(contentType, cfg)) {
    return {
      ...cfg,
      duration_sec: targetSec,
      time_budget_mode: true,
      mode: "manual",
    };
  }

  const currentTotal = getToolboxTotalDurationSec(contentType, cfg);

  if (Array.isArray(cfg.scenes) && currentTotal > 0 && !options?.perStepMode) {
    const scale = targetSec / currentTotal;
    return {
      ...cfg,
      scenes: (cfg.scenes as Record<string, unknown>[]).map((scene) => ({
        ...scene,
        duration_sec: Math.max(5, Math.round(readPositiveInt(scene.duration_sec) * scale)),
      })),
    };
  }

  if (Array.isArray(cfg.zones) && currentTotal > 0 && !options?.perStepMode) {
    const scale = targetSec / currentTotal;
    return {
      ...cfg,
      zones: (cfg.zones as Record<string, unknown>[]).map((zone) => ({
        ...zone,
        duration_sec: Math.max(5, Math.round(readPositiveInt(zone.duration_sec) * scale)),
      })),
    };
  }

  const guideSteps = countToolboxGuideSteps(cfg);
  if (guideSteps > 0) {
    return {
      ...cfg,
      duration_sec: targetSec,
      time_budget_mode: true,
      mode: "manual",
    };
  }

  if (readPositiveInt(cfg.step_duration_sec) > 0) {
    const stepCount = Array.isArray(cfg.steps) ? cfg.steps.length : 4;
    return {
      ...cfg,
      step_duration_sec: Math.max(10, Math.floor(targetSec / Math.max(1, stepCount))),
    };
  }

  return { ...cfg, duration_sec: targetSec };
}

export function usesTimeBudgetMode(widgetConfig: Record<string, unknown> | null | undefined): boolean {
  const cfg = widgetConfig && typeof widgetConfig === "object" ? widgetConfig : {};
  return cfg.time_budget_mode === true;
}

const PER_STEP_PRESETS = [1, 3, 5, 8, 10, 15, 20];
const TOTAL_PRESETS = [3, 5, 8, 10, 15, 20, 25, 30, 45, 60];

export function buildDurationPresetMinutes(options: ToolboxDurationOptions): number[] {
  const candidates = options.perStepMode ? [...PER_STEP_PRESETS] : [...TOTAL_PRESETS];
  const inRange = candidates.filter(
    (m) => m >= options.minMinutes && m <= options.maxMinutes,
  );
  if (!inRange.includes(options.defaultMinutes)) {
    inRange.push(options.defaultMinutes);
  }
  return [...new Set(inRange)].sort((a, b) => a - b);
}

/** Chip label: "3×5 min" = 3 steps × 5 min each. */
export function formatDurationPresetLabel(
  minutes: number,
  options: ToolboxDurationOptions,
  _locale: "fr" | "en",
): string {
  if (options.perStepMode && options.guideStepCount && options.guideStepCount > 1) {
    return `${options.guideStepCount}×${minutes} min`;
  }
  return `${minutes} min`;
}

/** Badge on habit card, e.g. "3×5 min". */
export function buildHabitEffectiveWidgetConfig(
  contentType: string,
  baseConfig: Record<string, unknown>,
  options: ToolboxDurationOptions,
  perStepMinutes: number,
): Record<string, unknown> {
  const totalSec = perStepMinutesToTotalSec(perStepMinutes, options);
  const merged = mergeToolboxDurationOverride(contentType, baseConfig, perStepMinutes, options);

  if (contentType === "affirmations" || contentType === "affirmations_cycle") {
    const totalMin = Math.max(1, Math.round(totalSec / 60));
    return {
      ...merged,
      duration_min: totalMin,
      duration_sec: totalSec,
    };
  }

  if (contentType === "focus_introspectif") {
    return {
      ...merged,
      duration_min: options.perStepMode
        ? Math.max(1, Math.round(totalSec / 60))
        : perStepMinutes,
    };
  }

  return {
    ...merged,
    time_budget_mode: true,
    duration_sec: totalSec,
    mode: "manual",
  };
}

/** Overlay habit duration fields onto adapter-resolved widget config. */
export function overlayHabitDurationOnWidgetConfig(
  resolvedCfg: Record<string, unknown>,
  itemCfg: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!itemCfg || typeof itemCfg !== "object") return resolvedCfg;

  const out = { ...resolvedCfg };
  if (itemCfg.time_budget_mode === true && typeof itemCfg.duration_sec === "number") {
    out.time_budget_mode = true;
    out.duration_sec = itemCfg.duration_sec;
    out.mode = "manual";
    return out;
  }
  if (typeof itemCfg.duration_sec === "number" && itemCfg.duration_sec > 0) {
    out.duration_sec = itemCfg.duration_sec;
    if (typeof itemCfg.duration_min === "number") {
      out.duration_min = itemCfg.duration_min;
    } else {
      out.duration_min = Math.max(1, Math.round(itemCfg.duration_sec / 60));
    }
    if (itemCfg.time_budget_mode === true) {
      out.time_budget_mode = true;
      out.mode = "manual";
    }
    return out;
  }
  if (typeof itemCfg.duration_min === "number") {
    out.duration_min = itemCfg.duration_min;
  }
  return out;
}

export function habitToolboxSessionKey(
  assignmentId: string,
  habitId: string,
  perStepMinutes: number,
): string {
  return `toolbox:${assignmentId}:habit:${habitId}:dur:${perStepMinutes}`;
}

export function formatHabitDurationBadge(
  perStepMinutes: number,
  options: ToolboxDurationOptions,
): string {
  if (options.perStepMode && options.guideStepCount && options.guideStepCount > 1) {
    return `${options.guideStepCount}×${perStepMinutes} min`;
  }
  return `${perStepMinutes} min`;
}
