import { useReducer } from "react";

export type IntroPhase = "entry" | "chapterTitle" | "interact" | "narrate" | "end";

export type IntroState = {
  phase: IntroPhase;
  chapterIndex: number;
};

export type IntroAction =
  | { type: "ENTER" }
  | { type: "TITLE_DONE" }
  | { type: "INTERACT_DONE" }
  | { type: "NARRATE_DONE" }
  | { type: "SKIP_CHAPTER" }
  | { type: "RESTART" };

export const INITIAL_INTRO_STATE: IntroState = { phase: "entry", chapterIndex: 0 };

function nextChapter(state: IntroState, chapterCount: number): IntroState {
  const next = state.chapterIndex + 1;
  if (next >= chapterCount) return { phase: "end", chapterIndex: state.chapterIndex };
  return { phase: "chapterTitle", chapterIndex: next };
}

export function createIntroReducer(chapterCount: number) {
  return function introReducer(state: IntroState, action: IntroAction): IntroState {
    switch (action.type) {
      case "ENTER":
        return state.phase === "entry" ? { phase: "chapterTitle", chapterIndex: 0 } : state;
      case "TITLE_DONE":
        return state.phase === "chapterTitle" ? { ...state, phase: "interact" } : state;
      case "INTERACT_DONE":
        return state.phase === "interact" ? { ...state, phase: "narrate" } : state;
      case "NARRATE_DONE":
        return state.phase === "narrate" ? nextChapter(state, chapterCount) : state;
      case "SKIP_CHAPTER":
        if (state.phase === "entry" || state.phase === "end") return state;
        return nextChapter(state, chapterCount);
      case "RESTART":
        return INITIAL_INTRO_STATE;
      default:
        return state;
    }
  };
}

export function useIntroMachine(chapterCount: number) {
  return useReducer(createIntroReducer(chapterCount), INITIAL_INTRO_STATE);
}
