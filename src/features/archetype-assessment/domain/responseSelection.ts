import type { QuestionSelection, ResponseValue, RuntimeQuestion } from "./types";

const INTENSITY_MIN = 1;
const INTENSITY_MAX = 3;

export function clampIntensity(value: number): number {
  if (!Number.isFinite(value)) return INTENSITY_MIN;
  return Math.min(INTENSITY_MAX, Math.max(INTENSITY_MIN, Math.round(value)));
}

export function optionIndexForId(question: RuntimeQuestion, optionId: string): number {
  return question.options.findIndex((o) => o.id === optionId);
}

/** Normalize legacy `selectedOptionIds` + `optionIntensities` into V4 `selections`. */
export function normalizeResponseSelections(
  question: RuntimeQuestion,
  response?: ResponseValue,
): QuestionSelection[] {
  if (!response) return [];

  if (response.selections?.length) {
    return response.selections
      .filter(
        (s) =>
          Number.isInteger(s.optionIndex) &&
          s.optionIndex >= 0 &&
          s.optionIndex < question.options.length,
      )
      .map((s) => ({
        optionIndex: s.optionIndex,
        intensity: clampIntensity(s.intensity),
      }));
  }

  const ids = response.selectedOptionIds ?? [];
  const intensities = response.optionIntensities ?? {};
  return ids
    .map((id) => {
      const optionIndex = optionIndexForId(question, id);
      if (optionIndex < 0) return null;
      return {
        optionIndex,
        intensity: clampIntensity(intensities[id] ?? INTENSITY_MIN),
      };
    })
    .filter((s): s is QuestionSelection => s !== null);
}

export function buildResponseFromSelections(
  questionId: string,
  question: RuntimeQuestion,
  selections: QuestionSelection[],
): ResponseValue {
  const normalized = selections
    .filter(
      (s) =>
        Number.isInteger(s.optionIndex) &&
        s.optionIndex >= 0 &&
        s.optionIndex < question.options.length,
    )
    .map((s) => ({
      optionIndex: s.optionIndex,
      intensity: clampIntensity(s.intensity),
    }));

  const selectedOptionIds = normalized
    .map((s) => question.options[s.optionIndex]?.id)
    .filter((id): id is string => Boolean(id));

  const optionIntensities = Object.fromEntries(
    normalized.map((s) => [
      question.options[s.optionIndex].id,
      s.intensity,
    ]),
  );

  return {
    questionId,
    selections: normalized,
    selectedOptionIds,
    optionIntensities,
  };
}

export function hasChoiceSelections(response?: ResponseValue): boolean {
  if (!response) return false;
  if ((response.selections?.length ?? 0) > 0) return true;
  return (response.selectedOptionIds?.length ?? 0) > 0;
}

export function* iterResponseSelections(
  question: RuntimeQuestion,
  response: ResponseValue,
): Generator<{ optionIndex: number; option: RuntimeQuestion["options"][number]; intensity: number }> {
  for (const selection of normalizeResponseSelections(question, response)) {
    const option = question.options[selection.optionIndex];
    if (!option) continue;
    yield {
      optionIndex: selection.optionIndex,
      option,
      intensity: selection.intensity,
    };
  }
}
