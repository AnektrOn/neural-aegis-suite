/**
 * Deep Dive (70 questions) — pure scoring engine.
 *
 * Input  : raw answers from `deepdive_responses` (question_code + option_codes[])
 * Output : aggregated scores per archetype (light & shadow), ranking, top houses,
 *          per-house breakdown.
 *
 * No I/O, no React. Safe to call from any environment.
 */
import { QUESTIONS_70 } from "./questions70";
import { HOUSES, type AnyArchetypeKey, type Polarity } from "./types";

export interface RawAnswer {
  question_code: string;
  option_codes: string[];
}

export interface ArchetypeScore {
  archetype: AnyArchetypeKey;
  light: number;        // raw light weight sum
  shadow: number;       // raw shadow weight sum
  total: number;        // light + shadow
  lightPct: number;     // 0..100, share of this archetype across the whole light pool
  shadowPct: number;    // 0..100, share of this archetype across the whole shadow pool
  intensity: number;    // 0..1, normalised vs the strongest archetype overall
  net: number;          // light - shadow (positive = healthy expression)
}

export interface HouseScore {
  house: number;
  label_fr: string;
  label_en: string;
  answered: number;
  total: number;
  topArchetype: AnyArchetypeKey | null;
  topArchetypeWeight: number;
  archetypeBreakdown: Record<string, { light: number; shadow: number }>;
}

export interface DeepDiveResult {
  totalQuestions: number;
  answeredCount: number;
  completionPct: number;          // 0..100
  archetypes: ArchetypeScore[];   // sorted by total desc
  topThree: AnyArchetypeKey[];
  shadowAlerts: AnyArchetypeKey[]; // archetypes where shadow > light
  houses: HouseScore[];
  computedAt: string;
}

/* -------------------------------------------------------------------------- */

export function computeDeepDiveScores(answers: RawAnswer[]): DeepDiveResult {
  const answerMap = new Map<string, Set<string>>();
  for (const a of answers) {
    answerMap.set(a.question_code, new Set(a.option_codes ?? []));
  }

  // Aggregate per archetype × polarity, plus per house breakdown.
  const lightByArch = new Map<AnyArchetypeKey, number>();
  const shadowByArch = new Map<AnyArchetypeKey, number>();
  const houseAgg = new Map<number, HouseScore>();

  let answeredCount = 0;

  for (const q of QUESTIONS_70) {
    const selected = answerMap.get(q.id);
    const houseEntry = houseAgg.get(q.house) ?? makeHouseEntry(q.house);
    houseEntry.total += 1;

    if (selected && selected.size > 0) {
      answeredCount += 1;
      houseEntry.answered += 1;

      for (const opt of q.options) {
        if (!selected.has(opt.id)) continue;
        for (const w of opt.weights) {
          addWeight(w.archetype, w.polarity, w.weight, lightByArch, shadowByArch);

          const hb = houseEntry.archetypeBreakdown[w.archetype] ?? { light: 0, shadow: 0 };
          if (w.polarity === "light") hb.light += w.weight;
          else hb.shadow += w.weight;
          houseEntry.archetypeBreakdown[w.archetype] = hb;
        }
      }
    }

    // Find top archetype for this house
    let topArch: AnyArchetypeKey | null = null;
    let topW = 0;
    for (const [arch, vals] of Object.entries(houseEntry.archetypeBreakdown)) {
      const sum = vals.light + vals.shadow;
      if (sum > topW) {
        topW = sum;
        topArch = arch as AnyArchetypeKey;
      }
    }
    houseEntry.topArchetype = topArch;
    houseEntry.topArchetypeWeight = topW;

    houseAgg.set(q.house, houseEntry);
  }

  // Build ArchetypeScore[] with normalised pcts.
  const allArchKeys = new Set<AnyArchetypeKey>([...lightByArch.keys(), ...shadowByArch.keys()]);
  const totalLight = sumValues(lightByArch);
  const totalShadow = sumValues(shadowByArch);

  let archetypes: ArchetypeScore[] = [...allArchKeys].map((k) => {
    const light = lightByArch.get(k) ?? 0;
    const shadow = shadowByArch.get(k) ?? 0;
    return {
      archetype: k,
      light,
      shadow,
      total: light + shadow,
      lightPct: totalLight > 0 ? (light / totalLight) * 100 : 0,
      shadowPct: totalShadow > 0 ? (shadow / totalShadow) * 100 : 0,
      intensity: 0,
      net: light - shadow,
    };
  });

  const maxTotal = archetypes.reduce((m, a) => Math.max(m, a.total), 0);
  archetypes = archetypes
    .map((a) => ({ ...a, intensity: maxTotal > 0 ? a.total / maxTotal : 0 }))
    .sort((a, b) => b.total - a.total);

  const topThree = archetypes.slice(0, 3).map((a) => a.archetype);
  const shadowAlerts = archetypes
    .filter((a) => a.shadow > a.light && a.shadow > 0)
    .map((a) => a.archetype);

  const houses = HOUSES.map((meta) => {
    const entry = houseAgg.get(meta.number);
    if (entry) {
      entry.label_fr = meta.label_fr;
      entry.label_en = meta.label_en;
      return entry;
    }
    return makeHouseEntry(meta.number, meta.label_fr, meta.label_en);
  });

  return {
    totalQuestions: QUESTIONS_70.length,
    answeredCount,
    completionPct: QUESTIONS_70.length > 0 ? (answeredCount / QUESTIONS_70.length) * 100 : 0,
    archetypes,
    topThree,
    shadowAlerts,
    houses,
    computedAt: new Date().toISOString(),
  };
}

/* -------------------------------------------------------------------------- */

function makeHouseEntry(houseNum: number, label_fr = "", label_en = ""): HouseScore {
  const meta = HOUSES.find((h) => h.number === houseNum);
  return {
    house: houseNum,
    label_fr: label_fr || meta?.label_fr || `Maison ${houseNum}`,
    label_en: label_en || meta?.label_en || `House ${houseNum}`,
    answered: 0,
    total: 0,
    topArchetype: null,
    topArchetypeWeight: 0,
    archetypeBreakdown: {},
  };
}

function addWeight(
  arch: AnyArchetypeKey,
  polarity: Polarity,
  weight: number,
  light: Map<AnyArchetypeKey, number>,
  shadow: Map<AnyArchetypeKey, number>,
) {
  const bag = polarity === "light" ? light : shadow;
  bag.set(arch, (bag.get(arch) ?? 0) + weight);
}

function sumValues(m: Map<AnyArchetypeKey, number>): number {
  let s = 0;
  for (const v of m.values()) s += v;
  return s;
}
