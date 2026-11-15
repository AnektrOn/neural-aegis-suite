import { useEffect, useState } from "react";
import {
  detectHeroBreakpoint,
  type HeroBreakpointKey,
} from "@/features/bio-executive-dashboard/bioExecutiveHeroLabConfig";

/** Same 5 breakpoints as Hero Lab — use for dashboard layout + shell gabarits. */
export function useHeroBreakpoint(): HeroBreakpointKey {
  const [breakpoint, setBreakpoint] = useState<HeroBreakpointKey>(() => detectHeroBreakpoint());

  useEffect(() => {
    const sync = () => setBreakpoint(detectHeroBreakpoint());
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);

  return breakpoint;
}

export function isBioExecutiveDesktopLayout(breakpoint: HeroBreakpointKey): boolean {
  return breakpoint === "desktop";
}