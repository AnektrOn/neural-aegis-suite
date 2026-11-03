import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_HERO_LAB_CONFIG,
  detectHeroBreakpoint,
  loadHeroLabConfig,
  loadHeroLabViewportDisplay,
  resolveHeroLabPreviewConfigKey,
  saveHeroLabConfig,
  saveHeroLabViewportDisplay,
  type HeroBreakpointKey,
  type HeroLabConfig,
  type HeroLabViewportDisplay,
} from "./bioExecutiveHeroLabConfig";

export function useHeroLabConfig(enabled: boolean) {
  const [config, setConfig] = useState<HeroLabConfig>(() =>
    enabled ? loadHeroLabConfig() : structuredClone(DEFAULT_HERO_LAB_CONFIG),
  );
  const [liveBreakpoint, setLiveBreakpoint] = useState<HeroBreakpointKey>(() => detectHeroBreakpoint());
  const [editBreakpoint, setEditBreakpoint] = useState<HeroBreakpointKey>(() => detectHeroBreakpoint());
  const [viewportDisplay, setViewportDisplayState] = useState<HeroLabViewportDisplay>(() =>
    loadHeroLabViewportDisplay(),
  );

  useEffect(() => {
    if (!enabled) return;
    setConfig(loadHeroLabConfig());
  }, [enabled]);

  useEffect(() => {
    const sync = () => setLiveBreakpoint(detectHeroBreakpoint());
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);

  const persist = useCallback(
    (next: HeroLabConfig) => {
      setConfig(next);
      if (enabled) saveHeroLabConfig(next);
    },
    [enabled],
  );

  const setViewportDisplay = useCallback((next: HeroLabViewportDisplay) => {
    setViewportDisplayState(next);
    saveHeroLabViewportDisplay(next);
    if (next !== "auto") {
      setEditBreakpoint((bp) => resolveHeroLabPreviewConfigKey(next, bp));
    }
  }, []);

  const previewBreakpoint = enabled ? editBreakpoint : liveBreakpoint;

  return {
    config,
    persist,
    liveBreakpoint,
    editBreakpoint,
    setEditBreakpoint,
    previewBreakpoint,
    viewportDisplay,
    setViewportDisplay,
  };
}

export function useHeroLayoutSlice(enabled: boolean) {
  const { config, liveBreakpoint } = useHeroLabConfig(enabled);
  return config[liveBreakpoint];
}
