import { useEffect, useRef, type MutableRefObject } from "react";
import type { QuantumNebulaHeroWordDrive } from "@/components/ui/quantum-nebula-hero-v3";
import {
  computeWelcomeNebulaWordState,
  queryWelcomeNebulaSections,
} from "@/features/welcome/welcomeNebulaScrollStory";
import { getWelcomeNebulaWorldLayout, readWelcomeNebulaViewport } from "@/features/welcome/welcomeNebulaWordLayout";

export function useWelcomeLandingNebulaWordDrive(): MutableRefObject<QuantumNebulaHeroWordDrive> {
  const initialRight = getWelcomeNebulaWorldLayout(readWelcomeNebulaViewport()).right;
  const driveRef = useRef<QuantumNebulaHeroWordDrive>({
    text: "AEGIS",
    offsetX: initialRight.offsetX,
    offsetY: initialRight.offsetY,
    reveal: 1,
  });

  useEffect(() => {
    let rafId = 0;

    const tick = () => {
      const sections = queryWelcomeNebulaSections();
      const next = computeWelcomeNebulaWordState(sections);
      Object.assign(driveRef.current, next);
    };

    const onScrollOrResize = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        tick();
      });
    };

    tick();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return driveRef;
}