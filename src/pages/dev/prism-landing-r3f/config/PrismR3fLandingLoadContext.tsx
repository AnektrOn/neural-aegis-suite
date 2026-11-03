import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

const MIN_LOADER_MS = 800;
const MAX_LOADER_MS = 3000;

type PrismR3fLandingLoadContextValue = {
  reportProgress: (pct: number) => void;
  reportSceneAssetsReady: () => void;
};

const PrismR3fLandingLoadContext = createContext<PrismR3fLandingLoadContextValue | null>(
  null,
);

export function PrismR3fLandingLoadProvider({
  children,
  onAppReady,
}: {
  children: ReactNode;
  onAppReady: () => void;
}) {
  const fired = useRef(false);
  const mountTime = useRef(Date.now());
  const progressRef = useRef(0);
  const sceneAssetsReadyRef = useRef(false);

  const finalize = useCallback(() => {
    if (fired.current) return;
    const elapsed = Date.now() - mountTime.current;
    const delay = Math.max(0, MIN_LOADER_MS - elapsed);
    window.setTimeout(() => {
      if (fired.current) return;
      fired.current = true;
      onAppReady();
    }, delay);
  }, [onAppReady]);

  const tryFinalize = useCallback(() => {
    if (fired.current) return;
    if (!sceneAssetsReadyRef.current) return;
    finalize();
  }, [finalize]);

  const reportProgress = useCallback(
    (pct: number) => {
      progressRef.current = pct;
      if (pct >= 100) tryFinalize();
    },
    [tryFinalize],
  );

  const reportSceneAssetsReady = useCallback(() => {
    sceneAssetsReadyRef.current = true;
    tryFinalize();
  }, [tryFinalize]);

  useEffect(() => {
    const hardCap = window.setTimeout(() => {
      if (!fired.current) finalize();
    }, MAX_LOADER_MS);
    return () => window.clearTimeout(hardCap);
  }, [finalize]);

  const value = useMemo(
    () => ({ reportProgress, reportSceneAssetsReady }),
    [reportProgress, reportSceneAssetsReady],
  );

  return (
    <PrismR3fLandingLoadContext.Provider value={value}>
      {children}
    </PrismR3fLandingLoadContext.Provider>
  );
}

export function usePrismR3fLandingLoad() {
  const ctx = useContext(PrismR3fLandingLoadContext);
  if (!ctx) {
    throw new Error("usePrismR3fLandingLoad outside PrismR3fLandingLoadProvider");
  }
  return ctx;
}

export function useOptionalPrismR3fLandingLoad() {
  return useContext(PrismR3fLandingLoadContext);
}
