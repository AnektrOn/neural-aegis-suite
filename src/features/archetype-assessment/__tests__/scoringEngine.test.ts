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
import type { ResponseValue, RuntimeOption, RuntimeQuestion } from "../domain/types";

function opt(
  id: string,
  arch: Record<string, number> = {},
  shadow: Record<string, number> = {},
  value: number | null = null
): RuntimeOption {
  return {
    id, position: 0, label_fr: id, label_en: id,
    archetype_weights: arch, shadow_weights: shadow, value,
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

describe("computeRawScores", () => {
  it("aggregates archetype weights from selected single_choice options", () => {
    const questions = [q("q1", "single_choice", [opt("o1", { sovereign: 3, caregiver: 1 }), opt("o2", { rebel: 2 })])];
    const responses: ResponseValue[] = [{ questionId: "q1", selectedOptionIds: ["o1"] }];
    const { archetypeScores } = computeRawScores(questions, responses);
    expect(archetypeScores.sovereign).toBe(3);
    expect(archetypeScores.caregiver).toBe(1);
    expect(archetypeScores.rebel).toBe(0);
  });

  it("sums weights across multiple_choice selections", () => {
    const questions = [q("q1", "multiple_choice", [
      opt("o1", { sovereign: 2 }), opt("o2", { sovereign: 1, caregiver: 2 }), opt("o3", { rebel: 5 }),
    ])];
    const responses: ResponseValue[] = [{ questionId: "q1", selectedOptionIds: ["o1", "o2"] }];
    const { archetypeScores } = computeRawScores(questions, responses);
    expect(archetypeScores.sovereign).toBe(3);
    expect(archetypeScores.caregiver).toBe(2);
    expect(archetypeScores.rebel).toBe(0);
  });

  it("collects shadow signals from selected options", () => {
    const questions = [q("q1", "single_choice", [opt("o1", {}, { control: 2, saboteur: 1 })])];
    const responses: ResponseValue[] = [{ questionId: "q1", selectedOptionIds: ["o1"] }];
    const { shadowSignals } = computeRawScores(questions, responses);
    expect(shadowSignals.control).toBe(2);
    expect(shadowSignals.saboteur).toBe(1);
  });

  it("applies decreasing rank weight for ranking questions", () => {
    const questions = [q("q1", "ranking", [
      opt("a", { sovereign: 1 }), opt("b", { rebel: 1 }), opt("c", { creator: 1 }), opt("d", { healer: 1 }),
    ])];
    const responses: ResponseValue[] = [{ questionId: "q1", selectedOptionIds: ["a", "b", "c", "d"] }];
    const { archetypeScores } = computeRawScores(questions, responses);
    expect(archetypeScores.sovereign).toBe(4);
    expect(archetypeScores.rebel).toBe(3);
    expect(archetypeScores.creator).toBe(2);
    expect(archetypeScores.healer).toBe(1);
  });

  it("ignores unanswered questions", () => {
    const questions = [q("q1", "single_choice", [opt("o1", { sovereign: 5 })])];
    const { archetypeScores } = computeRawScores(questions, []);
    expect(archetypeScores.sovereign).toBe(0);
  });
});

describe("normalizeScores", () => {
  it("scales max to 1 and proportional values below", () => {
    const out = normalizeScores({ a: 2, b: 4, c: 1 });
    expect(out.b).toBe(1);
    expect(out.a).toBe(0.5);
    expect(out.c).toBe(0.25);
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
  it("normalizes raw shadow scores into 0..1 with cap at 6", () => {
    const out = detectShadowSignals({
      control: 12, victim: 3, prostitute: 0, saboteur: 0,
    });
    expect(out.control).toBe(1);
    expect(out.victim).toBe(0.5);
    expect(out.prostitute).toBe(0);
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
    expect(result.summary_fr.length).toBeGreaterThan(10);
    expect(result.summary_en.length).toBeGreaterThan(10);
    expect(result.strengths_fr).toHaveLength(3);
  });

  it("handles empty responses gracefully", () => {
    const result = buildAnalysisResult([], []);
    expect(result.topArchetypes.length).toBeGreaterThan(0);
    expect(result.normalizedScores.sovereign).toBe(0);
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
      [q("q1", "single_choice", [opt("o1", { sovereign: 5 }, { control: 6 })])],
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
