import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildLandingScrollKeyframes,
  loadLandingScrollSeed,
  saveLandingScrollSeed,
  sampleLandingScrollLayout,
} from "./landingStageRandomScroll";
import {
  computeLandingStageWorldPositions,
  type LandingStageLayout,
} from "./landingStageLayout";

export function useLandingScrollKeyframes(anchorLayout: LandingStageLayout) {
  const [seed, setSeed] = useState(
    () => loadLandingScrollSeed() ?? Math.floor(Math.random() * 1_000_000_000),
  );
  const [scroll01, setScroll01] = useState(0);

  useEffect(() => {
    saveLandingScrollSeed(seed);
  }, [seed]);

  const keyframes = useMemo(
    () => buildLandingScrollKeyframes(seed, anchorLayout),
    [seed, anchorLayout],
  );

  const scrollLayout = useMemo(
    () => sampleLandingScrollLayout(keyframes, scroll01),
    [keyframes, scroll01],
  );

  const displayLayout =
    scroll01 <= 0.0005 ? anchorLayout : scrollLayout;

  const worldPositions = useMemo(
    () => computeLandingStageWorldPositions(displayLayout),
    [displayLayout],
  );

  const regenerateKeyframes = useCallback(() => {
    const next = Math.floor(Math.random() * 1_000_000_000);
    setSeed(next);
    saveLandingScrollSeed(next);
  }, []);

  const onLandingScrollProgress = useCallback((progress: number, f: number) => {
    setScroll01(progress);
    document.querySelector(".prism-landing-root")?.style.setProperty("--f", String(f));
  }, []);

  return {
    scroll01,
    keyframes,
    displayLayout,
    worldPositions,
    regenerateKeyframes,
    onLandingScrollProgress,
  };
}
