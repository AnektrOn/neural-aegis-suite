/**
 * Local state manager for the 72Q "Casting des 12 Maisons" flow.
 *
 * Multi-select edition:
 *  - Each question can have multiple options selected simultaneously.
 *  - Each selected option carries its own intensity (1–3).
 *  - `selectOption(pos)` toggles: adds with intensity 1 if not present, removes if present.
 *  - `setIntensity(optionPos, intensity)` updates the intensity for a specific option.
 *  - `confirmAnswer()` commits the current draft selections to the answers array.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getHouse72Questions,
  HOUSES_72_QUESTIONS_PER_HOUSE,
} from "../domain/questionsHouses72";
import {
  computeHouseCompletion,
  getPopulatedHouses,
  isHouseComplete,
} from "../domain/houses72Scoring";
import type { Houses72Answer } from "../domain/houses72Scoring";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Houses72Step = "intro" | "house" | "house_complete" | "review" | "done";

/**
 * Per-question draft state.
 * `selections` maps optionPosition → intensity (1|2|3).
 * An empty selections object means "nothing selected yet for this question".
 */
export interface Houses72DraftAnswer {
  house: number;
  questionPosition: number;
  /** Selected options for this question: optionPosition → intensity. */
  selections: Record<number, 1 | 2 | 3>;
}

export interface UseHouses72SessionInput {
  /** All confirmed answers (from DB or saved locally). */
  initialAnswers?: Houses72Answer[];
}

export interface UseHouses72SessionOutput {
  step: Houses72Step;
  /** House just completed — set when step === "house_complete". */
  completedHouse: number | null;
  /** Current Myss house being displayed (1–12). */
  activeHouse: number;
  /** 0-based question index within the current house. */
  questionIndex: number;
  /** All confirmed answers accumulated so far (current session + loaded). */
  answers: Houses72Answer[];
  /** Draft state for the current question (before confirming). */
  draft: Houses72DraftAnswer;
  /** Completion count per house: number of questions with ≥1 option selected. */
  completionMap: Record<number, number>;
  /** Sorted list of populated house numbers. */
  populatedHouses: number[];

  // Navigation
  goToIntro: () => void;
  goToHouse: (house: number) => void;
  goToQuestion: (index: number) => void;
  goToReview: () => void;
  goToDone: () => void;
  /** Show the post-house completion screen (save must happen before calling). */
  showHouseComplete: (house: number) => void;
  /** Advance to the next house or review after house_complete. */
  continueAfterHouseComplete: () => void;
  nextQuestion: () => void;
  previousQuestion: () => void;

  // Answer interaction
  /** Toggle an option: adds with intensity 1 if not selected, removes if selected. */
  selectOption: (optionPosition: number) => void;
  /** Update the intensity for a specific selected option. */
  setIntensity: (optionPosition: number, intensity: 1 | 2 | 3) => void;
  /** Replace all draft selections at once (used by V4 IntensityMultipleChoice). */
  setDraftSelections: (selections: Record<number, 1 | 2 | 3>) => void;
  /** Commit current draft selections to the answers array. */
  confirmAnswer: () => void;
  /** Commit draft and return the merged answers array (synchronous). */
  commitDraft: () => Houses72Answer[];

  // Helpers
  getHouseAnswers: (house: number) => Houses72Answer[];
  /** True when the current house has all questions answered (≥1 option each). */
  isCurrentHouseComplete: boolean;
  /** True when all populated houses are complete. */
  isAllComplete: boolean;

  // Reset
  resetHouse: (house: number) => void;
  resetAll: () => void;

  /** Navigate to the first unanswered question of any incomplete house. */
  resumeFromIncomplete: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildDraftFromAnswers(
  house: number,
  questionPosition: number,
  answers: Houses72Answer[],
): Houses72DraftAnswer {
  const existing = answers.filter(
    (a) => a.house === house && a.questionPosition === questionPosition,
  );
  const selections: Record<number, 1 | 2 | 3> = {};
  for (const a of existing) {
    selections[a.optionPosition] = a.intensity;
  }
  return { house, questionPosition: questionPosition, selections };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Merge the current draft into answers synchronously (for save before async setState). */
export function mergeDraftIntoAnswers(
  answers: Houses72Answer[],
  draft: Houses72DraftAnswer,
): Houses72Answer[] {
  if (Object.keys(draft.selections).length === 0) return answers;

  const newAnswers: Houses72Answer[] = Object.entries(draft.selections).map(
    ([optPos, intensity]) => ({
      house: draft.house,
      questionPosition: draft.questionPosition,
      optionPosition: Number(optPos),
      intensity: intensity as 1 | 2 | 3,
    }),
  );

  const filtered = answers.filter(
    (a) =>
      !(a.house === draft.house && a.questionPosition === draft.questionPosition),
  );
  return [...filtered, ...newAnswers];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useHouses72Session(
  input: UseHouses72SessionInput = {},
): UseHouses72SessionOutput {
  const populatedHouses = useMemo(() => getPopulatedHouses(), []);
  const firstHouse = populatedHouses[0] ?? 1;

  const [step, setStep] = useState<Houses72Step>("intro");
  const [completedHouse, setCompletedHouse] = useState<number | null>(null);
  const [activeHouse, setActiveHouse] = useState<number>(firstHouse);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Houses72Answer[]>(
    input.initialAnswers ?? [],
  );

  const houseQuestions = useMemo(
    () => getHouse72Questions(activeHouse),
    [activeHouse],
  );

  const currentQuestion = houseQuestions[questionIndex];

  const [draft, setDraft] = useState<Houses72DraftAnswer>(() =>
    buildDraftFromAnswers(firstHouse, currentQuestion?.position ?? 1, []),
  );

  // Sync initial answers when they load asynchronously (after DB fetch)
  useEffect(() => {
    if (input.initialAnswers && input.initialAnswers.length > 0) {
      setAnswers(input.initialAnswers);
    }
  }, [input.initialAnswers]);

  // Rebuild draft whenever house, question, or answers change
  useEffect(() => {
    if (!currentQuestion) return;
    setDraft(
      buildDraftFromAnswers(activeHouse, currentQuestion.position, answers),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHouse, questionIndex, currentQuestion?.position]);

  // Completion map: distinct questions answered per house
  const completionMap = useMemo(
    () => computeHouseCompletion(answers),
    [answers],
  );

  // ── Navigation ─────────────────────────────────────────────────────────────

  const goToIntro = useCallback(() => setStep("intro"), []);
  const goToReview = useCallback(() => setStep("review"), []);
  const goToDone = useCallback(() => setStep("done"), []);

  const goToHouse = useCallback((house: number) => {
    setActiveHouse(house);
    setQuestionIndex(0);
    setCompletedHouse(null);
    setStep("house");
  }, []);

  const showHouseComplete = useCallback((house: number) => {
    setCompletedHouse(house);
    setStep("house_complete");
  }, []);

  const continueAfterHouseComplete = useCallback(() => {
    const house = completedHouse ?? activeHouse;
    const currentHouseIdx = populatedHouses.indexOf(house);
    setCompletedHouse(null);
    if (currentHouseIdx < populatedHouses.length - 1) {
      const nextHouse = populatedHouses[currentHouseIdx + 1];
      setActiveHouse(nextHouse);
      setQuestionIndex(0);
      setStep("house");
    } else {
      setStep("review");
    }
  }, [completedHouse, activeHouse, populatedHouses]);

  const goToQuestion = useCallback(
    (index: number) => {
      setQuestionIndex(Math.max(0, Math.min(houseQuestions.length - 1, index)));
    },
    [houseQuestions.length],
  );

  const nextQuestion = useCallback(() => {
    if (questionIndex < houseQuestions.length - 1) {
      setQuestionIndex((i) => i + 1);
    }
  }, [questionIndex, houseQuestions.length]);

  const previousQuestion = useCallback(() => {
    if (questionIndex > 0) {
      setQuestionIndex((i) => i - 1);
    } else {
      const currentHouseIdx = populatedHouses.indexOf(activeHouse);
      if (currentHouseIdx > 0) {
        const prevHouse = populatedHouses[currentHouseIdx - 1];
        const prevHouseQs = getHouse72Questions(prevHouse);
        setActiveHouse(prevHouse);
        setQuestionIndex(prevHouseQs.length - 1);
      } else {
        setStep("intro");
      }
    }
  }, [questionIndex, populatedHouses, activeHouse]);

  // ── Answer interaction ──────────────────────────────────────────────────────

  /** Toggle an option on/off. Newly selected options default to intensity 1. */
  const selectOption = useCallback((optionPosition: number) => {
    setDraft((d) => {
      const next = { ...d.selections };
      if (next[optionPosition] !== undefined) {
        delete next[optionPosition]; // deselect
      } else {
        next[optionPosition] = 1; // select with default intensity
      }
      return { ...d, selections: next };
    });
  }, []);

  /** Update the intensity for a specific selected option. */
  const setIntensity = useCallback(
    (optionPosition: number, intensity: 1 | 2 | 3) => {
      setDraft((d) => ({
        ...d,
        selections: { ...d.selections, [optionPosition]: intensity },
      }));
    },
    [],
  );

  const setDraftSelections = useCallback((selections: Record<number, 1 | 2 | 3>) => {
    setDraft((d) => ({ ...d, selections }));
  }, []);

  const commitDraft = useCallback((): Houses72Answer[] => {
    const merged = mergeDraftIntoAnswers(answers, draft);
    if (merged !== answers) {
      setAnswers(merged);
    }
    return merged;
  }, [answers, draft]);

  /** Commit the draft to the answers array (replaces previous answers for this question). */
  const confirmAnswer = useCallback(() => {
    if (Object.keys(draft.selections).length === 0) return;
    setAnswers((prev) => mergeDraftIntoAnswers(prev, draft));
  }, [draft]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const getHouseAnswers = useCallback(
    (house: number): Houses72Answer[] => answers.filter((a) => a.house === house),
    [answers],
  );

  const isCurrentHouseComplete = useMemo(
    () => isHouseComplete(activeHouse, answers),
    [activeHouse, answers],
  );

  const isAllComplete = useMemo(
    () => populatedHouses.every((h) => isHouseComplete(h, answers)),
    [populatedHouses, answers],
  );

  const resetHouse = useCallback((house: number) => {
    setAnswers((prev) => prev.filter((a) => a.house !== house));
  }, []);

  const resetAll = useCallback(() => {
    setAnswers([]);
    setStep("intro");
    setActiveHouse(firstHouse);
    setQuestionIndex(0);
  }, [firstHouse]);

  const resumeFromIncomplete = useCallback(() => {
    for (const house of populatedHouses) {
      const houseQs = getHouse72Questions(house);
      const answeredPositions = new Set(
        answers.filter((a) => a.house === house).map((a) => a.questionPosition),
      );
      if (answeredPositions.size < houseQs.length) {
        const firstUnanswered = houseQs.find(
          (q) => !answeredPositions.has(q.position),
        );
        const idx = firstUnanswered ? houseQs.indexOf(firstUnanswered) : 0;
        setActiveHouse(house);
        setQuestionIndex(idx);
        setStep("house");
        return;
      }
    }
    setStep("review");
  }, [populatedHouses, answers]);

  return {
    step,
    completedHouse,
    activeHouse,
    questionIndex,
    answers,
    draft,
    completionMap,
    populatedHouses,
    goToIntro,
    goToHouse,
    goToQuestion,
    goToReview,
    goToDone,
    showHouseComplete,
    continueAfterHouseComplete,
    nextQuestion,
    previousQuestion,
    selectOption,
    setIntensity,
    setDraftSelections,
    confirmAnswer,
    commitDraft,
    getHouseAnswers,
    isCurrentHouseComplete,
    isAllComplete,
    resetHouse,
    resetAll,
    resumeFromIncomplete,
  };
}
