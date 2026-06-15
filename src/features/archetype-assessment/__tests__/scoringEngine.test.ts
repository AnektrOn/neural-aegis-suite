import { describe, it, expect } from "vitest";
import {
  computeRawScores,
  normalizeScores,
  rankArchetypes,
  computeDimensionScores,
  detectShadowSignals,
  buildAnalysisResult,
} from "../domain/scoringEngine";
import { selectTopTools, matchTools } from "../domain/recommendationEngine";
import { ARCHETYPE_KEYS } from "../domain/archetypes";
import type { ResponseValue, RuntimeOption, RuntimeQuestion } from "../domain/types";

function opt(
  id: string,
  arch: Record<string, number> = {},
  shadow: Record<string, number> = {},
  value: number | null = null,
  polarity_weights: RuntimeOption["polarity_weights"] = [],
): RuntimeOption {
  return {
    id, position: 0, label_fr: id, label_en: id,
    archetype_weights: arch, shadow_weights: shadow, polarity_weights, value,
  };
}

function q(
  id: string,
  type: RuntimeQuestion["question_type"],
  options: RuntimeOption[],
  dimension: RuntimeQuestion["dimension"] = null
): RuntimeQuestion {
  return {
    id, position: 0, question_type: type,
    prompt_fr: id, prompt_en: id, helper_fr: null, helper_en: null,
    dimension, is_required: true, meta: {}, options,
  };
}

function sumArchetypePercentages(scores: Record<string, number>): number {
  return ARCHETYPE_KEYS.reduce((s, k) => s + (scores[k] ?? 0), 0);
}

describe("computeRawScores", () => {
  it("returns relative percentages for a single major activation", () => {
    const questions = [q("q1", "single_choice", [opt("o1", { sovereign: 3, caregiver: 1 }), opt("o2", { rebel: 2 })])];
    const responses: ResponseValue[] = [{ questionId: "q1", selectedOptionIds: ["o1"] }];
    const { archetypeScores, archetypeScoresRaw } = computeRawScores(questions, responses);
    expect(archetypeScoresRaw.sovereign).toBe(3);
    expect(archetypeScoresRaw.caregiver).toBe(1);
    expect(archetypeScores.sovereign).toBeCloseTo(75);
    expect(archetypeScores.caregiver).toBeCloseTo(25);
    expect(archetypeScores.rebel).toBe(0);
    expect(sumArchetypePercentages(archetypeScores)).toBeCloseTo(100);
  });

  it("sums weights across multiple_choice selections as relative %", () => {
    const questions = [q("q1", "multiple_choice", [
      opt("o1", { sovereign: 2 }), opt("o2", { sovereign: 1, caregiver: 2 }), opt("o3", { rebel: 5 }),
    ])];
    const responses: ResponseValue[] = [{ questionId: "q1", selectedOptionIds: ["o1", "o2"] }];
    const { archetypeScores } = computeRawScores(questions, responses);
    expect(archetypeScores.sovereign).toBeCloseTo(60);
    expect(archetypeScores.caregiver).toBeCloseTo(40);
    expect(archetypeScores.rebel).toBe(0);
    expect(sumArchetypePercentages(archetypeScores)).toBeCloseTo(100);
  });

  it("applies V3 morphic scoring with per-option intensity", () => {
    const questions = [q("q1", "multiple_choice", [
      opt("o1", {}, {}, null, [
        { archetype: "sage", polarity: "light", weight: 1 },
        { archetype: "victim", polarity: "shadow", weight: 0.5 },
      ]),
      opt("o2", {}, {}, null, [
        { archetype: "sovereign", polarity: "light", weight: 1 },
        { archetype: "victim", polarity: "shadow", weight: 1 },
      ]),
    ])];
    const responses: ResponseValue[] = [{
      questionId: "q1",
      selectedOptionIds: ["o1", "o2"],
      optionIntensities: { o1: 3, o2: 2 },
    }];
    const { archetypeScores, shadowSignals } = computeRawScores(questions, responses);
    expect(archetypeScores.sage).toBeCloseTo(60);
    expect(archetypeScores.sovereign).toBeCloseTo(40);
    expect(shadowSignals.victim).toBeCloseTo((3.5 / 1.5) / 6);
    expect(sumArchetypePercentages(archetypeScores)).toBeCloseTo(100);
  });

  it("transfers negative polarity weights into opposite pole resonance", () => {
    const questions = [q("q1", "multiple_choice", [
      opt("o1", {}, {}, null, [
        { archetype: "creator", polarity: "shadow", weight: 0.75 },
        { archetype: "creator", polarity: "light", weight: -1 },
        { archetype: "saboteur", polarity: "shadow", weight: 1 },
      ]),
    ])];
    const responses: ResponseValue[] = [{
      questionId: "q1",
      selectedOptionIds: ["o1"],
      optionIntensities: { o1: 2 },
    }];
    const { archetypeScoresRaw } = computeRawScores(questions, responses);
    // creator: shadow 0.75*2 + light(-1)*2 flipped → 1.5 + 2 = 3.5; saboteur shadow 2
    expect(archetypeScoresRaw.creator).toBeCloseTo(3.5);
  });

  it("maps negative legacy archetype weight on survival key to shadow pool", () => {
    const questions = [q("q1", "single_choice", [
      opt("o1", { victim: -1.5 }),
    ])];
    const responses: ResponseValue[] = [{ questionId: "q1", selectedOptionIds: ["o1"] }];
    const { shadowSignals } = computeRawScores(questions, responses);
    expect(shadowSignals.victim).toBeCloseTo((1.5 / 1.5) / 6);
  });

  it("maps negative legacy shadow weight to survival light (reduces net shadow)", () => {
    const questions = [q("q1", "single_choice", [
      opt("o1", {}, { child: -2 }),
    ])];
    const responses: ResponseValue[] = [{ questionId: "q1", selectedOptionIds: ["o1"] }];
    const { shadowSignals } = computeRawScores(questions, responses);
    expect(shadowSignals.child).toBe(0);
  });

  it("computes net survival shadow with /1.5 correction factor", () => {
    const questions = [q("q1", "single_choice", [opt("o1", {}, { child: 2, saboteur: 1 })])];
    const responses: ResponseValue[] = [{ questionId: "q1", selectedOptionIds: ["o1"] }];
    const { shadowSignals } = computeRawScores(questions, responses);
    expect(shadowSignals.child).toBeCloseTo((2 / 1.5) / 6);
    expect(shadowSignals.saboteur).toBeCloseTo((1 / 1.5) / 6);
  });

  it("applies decreasing rank weight for ranking questions", () => {
    const questions = [q("q1", "ranking", [
      opt("a", { sovereign: 1 }), opt("b", { rebel: 1 }), opt("c", { creator: 1 }), opt("d", { healer: 1 }),
    ])];
    const responses: ResponseValue[] = [{ questionId: "q1", selectedOptionIds: ["a", "b", "c", "d"] }];
    const { archetypeScores, archetypeScoresRaw } = computeRawScores(questions, responses);
    expect(archetypeScoresRaw.sovereign).toBe(4);
    expect(archetypeScoresRaw.rebel).toBe(3);
    expect(archetypeScoresRaw.creator).toBe(2);
    expect(archetypeScoresRaw.healer).toBe(1);
    expect(archetypeScores.sovereign).toBeCloseTo(40);
    expect(sumArchetypePercentages(archetypeScores)).toBeCloseTo(100);
  });

  it("ignores unanswered questions", () => {
    const questions = [q("q1", "single_choice", [opt("o1", { sovereign: 5 })])];
    const { archetypeScores } = computeRawScores(questions, []);
    expect(archetypeScores.sovereign).toBe(0);
  });
});

describe("normalizeScores", () => {
  it("scales values proportionally so the total sums to 100", () => {
    const out = normalizeScores({ a: 2, b: 4, c: 1 });
    const total = out.a + out.b + out.c;
    expect(total).toBeCloseTo(100);
    expect(out.b).toBeCloseTo((4 / 7) * 100);
    expect(out.a).toBeCloseTo((2 / 7) * 100);
    expect(out.c).toBeCloseTo((1 / 7) * 100);
  });
  it("returns zeros when all inputs are 0", () => {
    const out = normalizeScores({ a: 0, b: 0 });
    expect(out.a).toBe(0);
    expect(out.b).toBe(0);
  });
});

describe("rankArchetypes", () => {
  it("orders descending and assigns rank 1..N", () => {
    const norm = { sovereign: 1, magician: 0.8, caregiver: 0.5 } as any;
    const ranked = rankArchetypes(norm);
    expect(ranked[0].key).toBe("sovereign");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].key).toBe("magician");
    expect(ranked[1].rank).toBe(2);
  });
});

describe("computeDimensionScores", () => {
  it("averages likert option values per dimension", () => {
    const questions = [
      q("q1", "likert_scale", [opt("o1", {}, {}, 0.2), opt("o2", {}, {}, 1)], "self_trust"),
      q("q2", "likert_scale", [opt("o3", {}, {}, 0.5)], "self_trust"),
    ];
    const responses: ResponseValue[] = [
      { questionId: "q1", selectedOptionIds: ["o2"] },
      { questionId: "q2", selectedOptionIds: ["o3"] },
    ];
    const dims = computeDimensionScores(questions, responses);
    expect(dims.self_trust).toBeCloseTo((1 + 0.5) / 2);
  });

  it("returns 0 when no answers for a dimension", () => {
    const dims = computeDimensionScores([], []);
    expect(dims.regulation_need ?? 0).toBe(0);
  });
});

describe("detectShadowSignals", () => {
  it("normalizes compensated net shadow into 0..1 with cap at 6", () => {
    const out = detectShadowSignals(
      { child: 12, victim: 3, prostitute: 0, saboteur: 0 },
      { child: 0, victim: 0, prostitute: 0, saboteur: 0 },
    );
    expect(out.child).toBe(1);
    expect(out.victim).toBeCloseTo((3 / 1.5) / 6);
    expect(out.prostitute).toBe(0);
  });

  it("reduces signal when survival light compensates shadow", () => {
    const out = detectShadowSignals(
      { child: 0, victim: 3, prostitute: 0, saboteur: 0 },
      { child: 0, victim: 2, prostitute: 0, saboteur: 0 },
    );
    expect(out.victim).toBeCloseTo(Math.max(0, 3 - 2) / 1.5 / 6);
  });
});

describe("buildAnalysisResult", () => {
  it("returns top 3 archetypes and a non-empty summary", () => {
    const questions = [
      q("q1", "single_choice", [opt("o1", { sovereign: 5 }), opt("o2", { rebel: 2 })]),
      q("q2", "single_choice", [opt("o3", { magician: 4 }), opt("o4", { creator: 1 })]),
      q("q3", "single_choice", [opt("o5", { caregiver: 3 }), opt("o6", { sage: 1 })]),
    ];
    const responses: ResponseValue[] = [
      { questionId: "q1", selectedOptionIds: ["o1"] },
      { questionId: "q2", selectedOptionIds: ["o3"] },
      { questionId: "q3", selectedOptionIds: ["o5"] },
    ];
    const result = buildAnalysisResult(questions, responses);
    expect(result.topArchetypes).toHaveLength(3);
    expect(result.topArchetypes[0]).toBe("sovereign");
    expect(result.topArchetypes).toContain("magician");
    expect(sumArchetypePercentages(result.normalizedScores)).toBeCloseTo(100);
    expect(result.summary_fr.length).toBeGreaterThan(10);
    expect(result.summary_en.length).toBeGreaterThan(10);
    expect(result.strengths_fr).toHaveLength(3);
  });

  it("handles empty responses gracefully", () => {
    const result = buildAnalysisResult([], []);
    expect(result.topArchetypes.length).toBeGreaterThan(0);
    expect(result.normalizedScores.sovereign).toBe(0);
    expect(sumArchetypePercentages(result.normalizedScores)).toBe(0);
  });
});

describe("recommendation engine", () => {
  it("matches tools to top archetypes", () => {
    const analysis = buildAnalysisResult(
      [q("q1", "single_choice", [opt("o1", { sovereign: 5 })])],
      [{ questionId: "q1", selectedOptionIds: ["o1"] }]
    );
    const matched = matchTools(analysis);
    const tool = matched.find((m) => m.tool.archetypes.includes("sovereign"));
    expect(tool).toBeDefined();
    expect(tool!.score).toBeGreaterThan(0);
  });

  it("selectTopTools returns ordered RecommendedTool list with rationales", () => {
    const analysis = buildAnalysisResult(
      [q("q1", "single_choice", [opt("o1", { sovereign: 5 }, { child: 6 })])],
      [{ questionId: "q1", selectedOptionIds: ["o1"] }]
    );
    const recos = selectTopTools(analysis, { limit: 5 });
    expect(recos.length).toBeGreaterThan(0);
    expect(recos.length).toBeLessThanOrEqual(5);
    expect(recos[0].rank).toBe(1);
    expect(recos[0].rationale_fr.length).toBeGreaterThan(0);
    expect(recos[0].rationale_en.length).toBeGreaterThan(0);
    for (let i = 1; i < recos.length; i++) {
      expect(recos[i].score).toBeLessThanOrEqual(recos[i - 1].score);
    }
  });
});
