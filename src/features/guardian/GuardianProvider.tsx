import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getGuardianAudioSrc } from "./guardianAudio";
import { clearGuardianState, loadGuardianState, saveGuardianState } from "./guardianStorage";
import {
  fetchGuardianState,
  guardianProgressRank,
  persistGuardianState,
} from "./guardianRemoteState";
import {
  GUARDIAN_DEFAULT_STATE,
  type GuardianGender,
  type GuardianLocale,
  type GuardianPersistedState,
  type GuardianPostQuizChoice,
  type GuardianStep,
  type GuardianUiPhase,
} from "./types";

interface GuardianContextValue {
  state: GuardianPersistedState;
  phase: GuardianUiPhase;
  audioSrc: string | null;
  speaking: boolean;
  setSpeaking: (value: boolean) => void;
  acceptGuardian: () => void;
  declineGuardian: () => void;
  selectGender: (gender: GuardianGender) => void;
  selectLocale: (locale: GuardianLocale) => void;
  skipGuardian: () => void;
  goToQuiz: () => void;
  markQuizComplete: () => void;
  choosePostQuiz: (choice: GuardianPostQuizChoice) => void;
  advanceFromStep2: () => void;
  completeDailyLog: () => void;
  completeDecisionLog: () => void;
  completeGuardian: () => void;
  openActivateIfNeeded: () => void;
  /** Dev/admin: wipe local Guardian progress and show activate modal again. */
  resetOnboardingFlow: () => void;
  /** Admin only (caller must gate): skip quiz + post-quiz and jump to part 2 audio. */
  adminSkipToPart2: () => boolean;
}

const GuardianContext = createContext<GuardianContextValue | null>(null);

function derivePhase(
  state: GuardianPersistedState,
  activateRequested: boolean,
): GuardianUiPhase {
  if (
    state.status === "declined" ||
    state.status === "skipped" ||
    state.status === "completed"
  ) {
    return "done";
  }
  if (state.status === "pending") {
    return activateRequested ? "activate" : "idle";
  }
  if (state.status === "active" && !state.gender) {
    return "gender";
  }
  if (state.status === "active" && state.gender && !state.locale) {
    return "language";
  }
  if (state.awaitingPostQuiz && !state.postQuizChoice) {
    return "post_quiz";
  }
  if (state.postQuizChoice === "autonomous") {
    return "done";
  }
  if (state.step === 1) return "step1";
  if (state.step === 2) return "step2";
  if (state.step === 3) return "step3";
  if (state.step === 4) return state.decisionDone ? "step4" : "step4";
  return "done";
}

export function GuardianProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<GuardianPersistedState>(GUARDIAN_DEFAULT_STATE);
  const [activateRequested, setActivateRequested] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!userId) {
      setState(GUARDIAN_DEFAULT_STATE);
      setActivateRequested(false);
      setHydrated(false);
      return;
    }
    let alive = true;
    const local = loadGuardianState(userId);
    setState(local);
    setHydrated(false);

    (async () => {
      const remote = await fetchGuardianState(userId);
      if (!alive) return;
      // Keep whichever source is further along (new device = empty local).
      const winner =
        remote && guardianProgressRank(remote) >= guardianProgressRank(local)
          ? remote
          : local;
      setState(winner);
      saveGuardianState(userId, winner);
      if (!remote || guardianProgressRank(local) > guardianProgressRank(remote)) {
        void persistGuardianState(userId, winner).catch(() => undefined);
      }
      setActivateRequested(winner.status === "pending");
      setHydrated(true);
    })().catch(() => {
      if (!alive) return;
      setActivateRequested(local.status === "pending");
      setHydrated(true);
    });

    return () => {
      alive = false;
    };
  }, [userId]);

  const persist = useCallback(
    (next: GuardianPersistedState) => {
      setState(next);
      if (userId) {
        saveGuardianState(userId, next);
        void persistGuardianState(userId, next).catch(() => undefined);
      }
    },
    [userId],
  );

  const phase = useMemo(
    () => derivePhase(state, activateRequested),
    [state, activateRequested],
  );

  const audioSrc = useMemo(() => {
    if (!state.gender || !state.locale || state.status !== "active") return null;
    if (phase === "step1" || phase === "step2" || phase === "step3" || phase === "step4") {
      return getGuardianAudioSrc(state.gender, state.locale, state.step as GuardianStep);
    }
    return null;
  }, [state.gender, state.locale, state.status, state.step, phase]);

  const acceptGuardian = useCallback(() => {
    persist({
      ...state,
      status: "active",
      gender: null,
      locale: null,
      step: 1,
    });
  }, [persist, state]);

  const declineGuardian = useCallback(() => {
    setActivateRequested(false);
    persist({
      ...GUARDIAN_DEFAULT_STATE,
      status: "declined",
    });
  }, [persist]);

  const selectGender = useCallback(
    (gender: GuardianGender) => {
      persist({
        ...state,
        status: "active",
        gender,
        locale: null,
        step: 1,
      });
    },
    [persist, state],
  );

  const selectLocale = useCallback(
    (locale: GuardianLocale) => {
      persist({
        ...state,
        status: "active",
        locale,
        step: 1,
      });
      setSpeaking(true);
    },
    [persist, state],
  );

  const skipGuardian = useCallback(() => {
    setActivateRequested(false);
    setSpeaking(false);
    persist({
      ...state,
      status: "skipped",
      awaitingPostQuiz: false,
    });
  }, [persist, state]);

  const goToQuiz = useCallback(() => {
    setSpeaking(false);
  }, []);

  const markQuizComplete = useCallback(() => {
    if (state.status !== "active") return;
    if (state.awaitingPostQuiz || state.postQuizChoice) return;
    persist({
      ...state,
      awaitingPostQuiz: true,
    });
  }, [persist, state]);

  const choosePostQuiz = useCallback(
    (choice: GuardianPostQuizChoice) => {
      if (choice === "autonomous") {
        persist({
          ...state,
          postQuizChoice: choice,
          awaitingPostQuiz: false,
          status: "completed",
        });
        setSpeaking(false);
        return;
      }
      persist({
        ...state,
        postQuizChoice: choice,
        awaitingPostQuiz: false,
        step: 2,
      });
      setSpeaking(true);
    },
    [persist, state],
  );

  const advanceFromStep2 = useCallback(() => {
    persist({ ...state, step: 3 });
    setSpeaking(true);
  }, [persist, state]);

  const completeDailyLog = useCallback(() => {
    persist({ ...state, step: 4, decisionDone: false });
    setSpeaking(true);
  }, [persist, state]);

  const completeDecisionLog = useCallback(() => {
    persist({ ...state, step: 4, decisionDone: true });
    setSpeaking(false);
  }, [persist, state]);

  const completeGuardian = useCallback(() => {
    setSpeaking(false);
    persist({
      ...state,
      status: "completed",
      step: 4,
      decisionDone: true,
      awaitingPostQuiz: false,
    });
  }, [persist, state]);

  const openActivateIfNeeded = useCallback(() => {
    if (state.status === "pending") setActivateRequested(true);
  }, [state.status]);

  const resetOnboardingFlow = useCallback(() => {
    setSpeaking(false);
    setActivateRequested(true);
    const next = { ...GUARDIAN_DEFAULT_STATE };
    setState(next);
    if (userId) {
      clearGuardianState(userId);
      saveGuardianState(userId, next);
      void persistGuardianState(userId, next).catch(() => undefined);
    }
  }, [userId]);

  /** Jumps to step 2 as if quiz + “return to Guardian” were done. Caller must ensure admin. */
  const adminSkipToPart2 = useCallback((): boolean => {
    if (state.status !== "active" || !state.gender || !state.locale) {
      return false;
    }
    persist({
      ...state,
      awaitingPostQuiz: false,
      postQuizChoice: "guardian",
      step: 2,
      decisionDone: false,
    });
    setSpeaking(true);
    return true;
  }, [persist, state]);

  const value = useMemo<GuardianContextValue>(
    () => ({
      state,
      phase,
      audioSrc,
      speaking,
      setSpeaking,
      acceptGuardian,
      declineGuardian,
      selectGender,
      selectLocale,
      skipGuardian,
      goToQuiz,
      markQuizComplete,
      choosePostQuiz,
      advanceFromStep2,
      completeDailyLog,
      completeDecisionLog,
      completeGuardian,
      openActivateIfNeeded,
      resetOnboardingFlow,
      adminSkipToPart2,
    }),
    [
      state,
      phase,
      audioSrc,
      speaking,
      acceptGuardian,
      declineGuardian,
      selectGender,
      selectLocale,
      skipGuardian,
      goToQuiz,
      markQuizComplete,
      choosePostQuiz,
      advanceFromStep2,
      completeDailyLog,
      completeDecisionLog,
      completeGuardian,
      openActivateIfNeeded,
      resetOnboardingFlow,
      adminSkipToPart2,
    ],
  );

  return (
    <GuardianContext.Provider value={value}>{children}</GuardianContext.Provider>
  );
}

export function useGuardian(): GuardianContextValue {
  const ctx = useContext(GuardianContext);
  if (!ctx) {
    throw new Error("useGuardian must be used within GuardianProvider");
  }
  return ctx;
}

/** Safe hook when provider may be absent (e.g. public routes). */
export function useGuardianOptional(): GuardianContextValue | null {
  return useContext(GuardianContext);
}
