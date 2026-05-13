import { describe, expect, it } from "vitest";
import {
  buildAnalysisResultV2,
  computeRawScoresV2,
} from "../domain/scoringEngine.v2";
import type { ResponseValue, RuntimeOption, RuntimeQuestion } from "../domain/types";

function opt(
  id: string,
  arch: Record<string, number> = {},
  shadow: Record<string, number> = {},
  value: number | null = null
): RuntimeOption {
  return {
    id,
    position: 0,
    label_fr: id,
    label_en: id,
    archetype_weights: arch,
    shadow_weights: shadow,
    value,
  };
}

function q(
  id: string,
  type: RuntimeQuestion["question_type"],
  options: RuntimeOption[],
  dimension: RuntimeQuestion["dimension"] = null
): RuntimeQuestion {
  return {
    id,
    position: 0,
    question_type: type,
    prompt_fr: id,
    prompt_en: id,
    helper_fr: null,
    helper_en: null,
    dimension,
    is_required: true,
    meta: {},
    options,
  };
}

describe("scoringEngine v2", () => {
  it("keeps scoring compatibility for selected options", () => {
    const questions = [
      q("q1", "single_choice", [opt("o1", { sovereign: 3 }), opt("o2", { rebel: 1 })]),
    ];
    const responses: ResponseValue[] = [{ questionId: "q1", selectedOptionIds: ["o1"] }];
    const { archetypeScores } = computeRawScoresV2(questions, responses);
    expect(archetypeScores.sovereign).toBe(3);
    expect(archetypeScores.rebel).toBe(0);
  });

  it("returns empty top archetypes when no usable answers", () => {
    const result = buildAnalysisResultV2([], []);
    expect(result.topArchetypes).toEqual([]);
    expect(result.summary_en).toContain("No usable response");
    expect(result.summary_fr).toContain("Aucune réponse exploitable");
  });

  it("keeps top archetypes when there are positive scores", () => {
    const questions = [
      q("q1", "single_choice", [opt("o1", { sovereign: 5 })]),
      q("q2", "single_choice", [opt("o2", { magician: 4 })]),
      q("q3", "single_choice", [opt("o3", { caregiver: 3 })]),
    ];
    const responses: ResponseValue[] = [
      { questionId: "q1", selectedOptionIds: ["o1"] },
      { questionId: "q2", selectedOptionIds: ["o2"] },
      { questionId: "q3", selectedOptionIds: ["o3"] },
    ];
    const result = buildAnalysisResultV2(questions, responses);
    expect(result.topArchetypes.length).toBe(3);
    expect(result.topArchetypes[0]).toBe("sovereign");
  });
});
