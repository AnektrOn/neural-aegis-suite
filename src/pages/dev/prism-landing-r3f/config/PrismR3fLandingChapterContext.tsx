import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import {
  PRISM_R3F_LANDING_CHAPTERS,
  type PrismR3fLandingChapter,
} from "../landing/prismR3fLandingChapters";
import {
  PRISM_LANDING_BEAT_COUNT,
  resolveNextBeatIndex,
  resolvePrevBeatIndex,
} from "../landing/prismR3fLandingBeats";

const CHAPTER_COUNT = PRISM_LANDING_BEAT_COUNT;

type PrismR3fLandingChapterContextValue = {
  chapterIndex: number;
  chapterIndexRef: MutableRefObject<number>;
  chapter: PrismR3fLandingChapter;
  isTransitioning: boolean;
  setIsTransitioning: (v: boolean) => void;
  goNext: () => void;
  goPrev: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
};

const PrismR3fLandingChapterContext = createContext<PrismR3fLandingChapterContextValue | null>(
  null,
);

export function PrismR3fLandingChapterProvider({ children }: { children: React.ReactNode }) {
  const [chapterIndex, setChapterIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const chapterIndexRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const navLockRef = useRef(false);
  chapterIndexRef.current = chapterIndex;
  isTransitioningRef.current = isTransitioning;

  const goNext = useCallback(() => {
    if (navLockRef.current || isTransitioningRef.current) return;
    const next = resolveNextBeatIndex(chapterIndexRef.current);
    if (next == null) return;
    navLockRef.current = true;
    isTransitioningRef.current = true;
    chapterIndexRef.current = next;
    setIsTransitioning(true);
    setChapterIndex(next);
  }, []);

  const goPrev = useCallback(() => {
    if (navLockRef.current || isTransitioningRef.current) return;
    const prev = resolvePrevBeatIndex(chapterIndexRef.current);
    if (prev == null) return;
    navLockRef.current = true;
    isTransitioningRef.current = true;
    chapterIndexRef.current = prev;
    setIsTransitioning(true);
    setChapterIndex(prev);
  }, []);

  useEffect(() => {
    if (!isTransitioning) {
      navLockRef.current = false;
      return;
    }
    navLockRef.current = true;
    const failSafe = window.setTimeout(() => {
      isTransitioningRef.current = false;
      navLockRef.current = false;
      setIsTransitioning(false);
    }, 4500);
    return () => window.clearTimeout(failSafe);
  }, [isTransitioning]);

  const chapter = PRISM_R3F_LANDING_CHAPTERS[chapterIndex] ?? PRISM_R3F_LANDING_CHAPTERS[0];
  const canGoPrev = resolvePrevBeatIndex(chapterIndex) !== null;
  const canGoNext = resolveNextBeatIndex(chapterIndex) !== null;

  const value = useMemo(
    () => ({
      chapterIndex,
      chapterIndexRef,
      chapter,
      isTransitioning,
      setIsTransitioning,
      goNext,
      goPrev,
      canGoPrev,
      canGoNext,
    }),
    [chapterIndex, chapter, isTransitioning, goNext, goPrev, canGoPrev, canGoNext],
  );

  return (
    <PrismR3fLandingChapterContext.Provider value={value}>
      {children}
    </PrismR3fLandingChapterContext.Provider>
  );
}

export function usePrismR3fLandingChapter() {
  const ctx = useContext(PrismR3fLandingChapterContext);
  if (!ctx) {
    throw new Error("usePrismR3fLandingChapter outside PrismR3fLandingChapterProvider");
  }
  return ctx;
}

export function useOptionalPrismR3fLandingChapter() {
  return useContext(PrismR3fLandingChapterContext);
}
