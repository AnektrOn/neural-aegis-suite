import { useCallback, useMemo, useRef, useState } from "react";
import type { ResponseValue, RuntimeQuestion } from "../domain/types";

export type AssessmentStep = "welcome" | "questions" | "review" | "submit";

interface UseAssessmentSessionInput {
  questions: RuntimeQuestion[];
}

/**
 * Local state for the multi-step assessment flow.
 * No Supabase here — calling code wires submission via assessmentService.
 */
export function useAssessmentSession({ questions }: UseAssessmentSessionInput) {
  const [step, setStep] = useState<AssessmentStep>("welcome");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, ResponseValue>>({});
  const startedAtRef = useRef<number>(Date.now());

  const totalQuestions = questions.length;
  const currentQuestion = questions[questionIndex];
  const progress = totalQuestions > 0 ? (questionIndex + 1) / totalQuestions : 0;

  const setResponse = useCallback((value: ResponseValue) => {
    setResponses((prev) => ({ ...prev, [value.questionId]: value }));
  }, []);

  const goToWelcome = useCallback(() => setStep("welcome"), []);
  const goToQuestions = useCallback(() => {
    startedAtRef.current = Date.now();
    setStep("questions");
    setQuestionIndex(0);
  }, []);
  const goToReview = useCallback(() => setStep("review"), []);

  const next = useCallback(() => {
    if (questionIndex < totalQuestions - 1) {
      setQuestionIndex((i) => i + 1);
    } else {
      setStep("review");
    }
  }, [questionIndex, totalQuestions]);

  const previous = useCallback(() => {
    if (questionIndex > 0) {
      setQuestionIndex((i) => i - 1);
    } else {
      setStep("welcome");
    }
  }, [questionIndex]);

  const goToQuestion = useCallback((idx: number) => {
    setQuestionIndex(Math.max(0, Math.min(totalQuestions - 1, idx)));
    setStep("questions");
  }, [totalQuestions]);

  const responsesArray = useMemo<ResponseValue[]>(
    () => Object.values(responses),
    [responses]
  );

  const isCurrentAnswered = useMemo(() => {
    if (!currentQuestion) return false;
    if (currentQuestion.is_required === false) return true;
    const r = responses[currentQuestion.id];
    if (!r) return false;
    if (currentQuestion.question_type === "short_text") {
      return Boolean(r.textValue && r.textValue.trim().length > 0);
    }
    return (r.selectedOptionIds?.length ?? 0) > 0;
  }, [currentQuestion, responses]);

  const requiredAnswered = useMemo(() => {
    return questions.every((q) => {
      if (q.is_required === false) return true;
      const r = responses[q.id];
      if (!r) return false;
      if (q.question_type === "short_text") {
        return Boolean(r.textValue && r.textValue.trim().length > 0);
      }
      return (r.selectedOptionIds?.length ?? 0) > 0;
    });
  }, [questions, responses]);

  return {
    step,
    setStep,
    questionIndex,
    currentQuestion,
    totalQuestions,
    progress,
    responses,
    responsesArray,
    setResponse,
    next,
    previous,
    goToWelcome,
    goToQuestions,
    goToReview,
    goToQuestion,
    isCurrentAnswered,
    requiredAnswered,
    startedAt: startedAtRef.current,
  };
}
