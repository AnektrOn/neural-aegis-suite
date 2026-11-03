import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  subjectVisibilityForBeat,
  type PrismLandingSubjectVisibility,
} from "../landing/prismR3fLandingSubjects";

export type PrismR3fCubeDirector = {
  requestBurst: () => void;
  resetToHold: () => void;
};

type PrismR3fLandingDirectorContextValue = {
  registerCubeDirector: (api: PrismR3fCubeDirector | null) => void;
  requestCubeBurst: () => void;
  resetCubeToHold: () => void;
  subjects: PrismLandingSubjectVisibility;
  setSubjectVisibility: (next: PrismLandingSubjectVisibility) => void;
};

const PrismR3fLandingDirectorContext = createContext<PrismR3fLandingDirectorContextValue | null>(
  null,
);

export function PrismR3fLandingDirectorProvider({ children }: { children: React.ReactNode }) {
  const cubeDirectorRef = useRef<PrismR3fCubeDirector | null>(null);
  const pendingCubeBurstRef = useRef(false);
  const [subjects, setSubjects] = useState<PrismLandingSubjectVisibility>(() =>
    subjectVisibilityForBeat(0),
  );

  const registerCubeDirector = useCallback((api: PrismR3fCubeDirector | null) => {
    cubeDirectorRef.current = api;
    if (api && pendingCubeBurstRef.current) {
      pendingCubeBurstRef.current = false;
      api.requestBurst();
    }
  }, []);

  const requestCubeBurst = useCallback(() => {
    if (cubeDirectorRef.current) {
      cubeDirectorRef.current.requestBurst();
      return;
    }
    pendingCubeBurstRef.current = true;
  }, []);

  const resetCubeToHold = useCallback(() => {
    cubeDirectorRef.current?.resetToHold();
  }, []);

  const setSubjectVisibility = useCallback((next: PrismLandingSubjectVisibility) => {
    setSubjects(next);
  }, []);

  const value = useMemo(
    () => ({
      registerCubeDirector,
      requestCubeBurst,
      resetCubeToHold,
      subjects,
      setSubjectVisibility,
    }),
    [registerCubeDirector, requestCubeBurst, resetCubeToHold, subjects, setSubjectVisibility],
  );

  return (
    <PrismR3fLandingDirectorContext.Provider value={value}>
      {children}
    </PrismR3fLandingDirectorContext.Provider>
  );
}

export function usePrismR3fLandingDirector() {
  const ctx = useContext(PrismR3fLandingDirectorContext);
  if (!ctx) {
    throw new Error("usePrismR3fLandingDirector outside PrismR3fLandingDirectorProvider");
  }
  return ctx;
}

/** Optionnel dans la scène (lab sans provider landing). */
export function useOptionalPrismR3fLandingDirector() {
  return useContext(PrismR3fLandingDirectorContext);
}

/** Lab : toujours visible. Landing : suit le director. */
export function useLandingSubjectVisible(subject: keyof PrismLandingSubjectVisibility): boolean {
  const ctx = useContext(PrismR3fLandingDirectorContext);
  if (!ctx) return true;
  return ctx.subjects[subject];
}
