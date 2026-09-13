import { useState } from "react";
import { AssessmentQuestionRenderer } from "@/features/archetype-assessment/components/AssessmentQuestionRenderer";
import type { ResponseValue } from "@/features/archetype-assessment/domain/types";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { copy, PROMOTE_QUIZ_QUESTION } from "../promoteDemoData";
import { usePromotePlayer } from "../PromotePlayerContext";

export function QuizScene() {
  const { t } = useLanguage();
  const { isFR, goTo } = usePromotePlayer();
  const [value, setValue] = useState<ResponseValue | undefined>({
    questionId: PROMOTE_QUIZ_QUESTION.id,
    selectedOptionIds: ["promote-opt-2"],
    selections: [{ optionIndex: 1, intensity: 2 }],
  });

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-background px-4 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <p className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {copy(isFR, "Quiz V4 · Question 1 / 30", "Quiz V4 · Question 1 / 30")}
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
        <div className="h-full w-[8%] rounded-full bg-primary" />
      </div>
      <div className="mt-6">
        <AssessmentQuestionRenderer
          question={PROMOTE_QUIZ_QUESTION}
          value={value}
          onChange={setValue}
          isFR={isFR}
        />
      </div>
      <div className="mt-auto flex justify-center pt-8">
        <Button
          type="button"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => goTo("results")}
        >
          {t("guardian.skip")}
        </Button>
      </div>
    </div>
  );
}
