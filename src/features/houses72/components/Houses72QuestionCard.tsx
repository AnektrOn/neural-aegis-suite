/**
 * Houses72QuestionCard — reuses V4 IntensityMultipleChoice for visual parity with Q30.
 */

import { useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { IntensityMultipleChoice } from "../../archetype-assessment/components/IntensityMultipleChoice";
import type { Houses72QuestionSeed } from "../../archetype-assessment/domain/questionsHouses72";
import {
  draftToResponseValue,
  houses72ToRuntimeQuestion,
  responseToDraftSelections,
} from "../../archetype-assessment/domain/houses72RuntimeAdapter";
import type { Houses72DraftAnswer } from "../../archetype-assessment/hooks/useHouses72Session";
import type { ResponseValue } from "../../archetype-assessment/domain/types";

interface Props {
  question: Houses72QuestionSeed;
  draft: Houses72DraftAnswer;
  onDraftSelectionsChange: (selections: Record<number, 1 | 2 | 3>) => void;
  prompt: string;
}

export function Houses72QuestionCard({
  question,
  draft,
  onDraftSelectionsChange,
  prompt,
}: Props) {
  const { locale } = useLanguage();
  const isFR = locale === "fr";

  const runtimeQuestion = useMemo(
    () => houses72ToRuntimeQuestion(question, locale),
    [question, locale],
  );

  const value = useMemo(
    () => draftToResponseValue(question, draft, locale),
    [question, draft, locale],
  );

  const handleChange = (next: ResponseValue) => {
    onDraftSelectionsChange(responseToDraftSelections(question, locale, next));
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-medium leading-snug">{prompt}</h3>
      </div>
      <IntensityMultipleChoice
        question={runtimeQuestion}
        value={value}
        onChange={handleChange}
        isFR={isFR}
      />
    </div>
  );
}
