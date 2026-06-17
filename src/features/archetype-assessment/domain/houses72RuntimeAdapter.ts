/**
 * Adapts Houses72 question seeds to RuntimeQuestion so the V4 UI
 * (IntensityMultipleChoice) can be reused without duplication.
 */

import type { Locale } from "@/i18n/LanguageContext";
import type { Houses72DraftAnswer } from "../hooks/useHouses72Session";
import type { Houses72QuestionSeed } from "./questionsHouses72";
import { getHouse72OptionLabel, getHouse72Prompt } from "./houses72Locale";
import {
  buildResponseFromSelections,
  clampIntensity,
  normalizeResponseSelections,
} from "./responseSelection";
import type { ResponseValue, RuntimeQuestion } from "./types";

export function houses72QuestionId(house: number, position: number): string {
  return `houses72-${house}-${position}`;
}

export function houses72ToRuntimeQuestion(
  question: Houses72QuestionSeed,
  locale: Locale,
): RuntimeQuestion {
  const id = houses72QuestionId(question.house, question.position);
  return {
    id,
    position: question.position,
    question_type: "multiple_choice",
    prompt_fr: question.prompt_fr,
    prompt_en: question.prompt_en ?? getHouse72Prompt(question, "en"),
    helper_fr: null,
    helper_en: null,
    dimension: null,
    is_required: true,
    meta: {
      intensityEnabled: true,
      scoringModel: "houses72",
    },
    options: question.options.map((o) => ({
      id: `${id}-opt-${o.position}`,
      position: o.position,
      label_fr: o.label_fr,
      label_en: o.label_en ?? getHouse72OptionLabel(o, "en", question.house, question.position),
      archetype_weights: {},
      shadow_weights: {},
      polarity_weights: [],
      value: null,
    })),
  };
}

export function draftToResponseValue(
  question: Houses72QuestionSeed,
  draft: Houses72DraftAnswer,
  locale: Locale,
): ResponseValue | undefined {
  const runtime = houses72ToRuntimeQuestion(question, locale);
  const selections = Object.entries(draft.selections)
    .map(([optPos, intensity]) => {
      const optionIndex = question.options.findIndex(
        (o) => o.position === Number(optPos),
      );
      return { optionIndex, intensity };
    })
    .filter((s) => s.optionIndex >= 0);

  if (selections.length === 0) return undefined;
  return buildResponseFromSelections(runtime.id, runtime, selections);
}

export function responseToDraftSelections(
  question: Houses72QuestionSeed,
  locale: Locale,
  value?: ResponseValue,
): Record<number, 1 | 2 | 3> {
  const runtime = houses72ToRuntimeQuestion(question, locale);
  const normalized = normalizeResponseSelections(runtime, value);
  const out: Record<number, 1 | 2 | 3> = {};
  for (const s of normalized) {
    const opt = question.options[s.optionIndex];
    if (opt) out[opt.position] = clampIntensity(s.intensity) as 1 | 2 | 3;
  }
  return out;
}
