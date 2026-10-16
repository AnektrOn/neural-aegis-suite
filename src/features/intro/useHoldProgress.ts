import { useEffect, useRef, type MutableRefObject } from "react";
import type { IntroPhase } from "@/features/intro/useIntroMachine";

export type HoldState = {
  /** 0..1, grows while holding, decays slowly on release. */
  progress: number;
  /** Peak progress this chapter; never decreases until reset — drives scene visuals. */
  latched: number;
  holding: boolean;
  /** Normalized pointer, 0..1 with origin at bottom-left (shader convention). */
  pointer: { x: number; y: number };
  /** Client-space pointer for DOM overlays. */
  client: { x: number; y: number };
};

type Options = {
  enabled: boolean;
  /** Seconds of continuous holding needed to reach 1. */
  duration?: number;
  onComplete: () => void;
};

const DECAY_PER_SECOND = 0.12;

/** Hold-driven visuals: latched level persists through narrate after release or completion. */
export function holdChapterMix(s: HoldState, phase: IntroPhase): number {
  if (phase !== "interact" && phase !== "narrate") return 0;
  const live = phase === "interact" && s.holding ? s.progress : 0;
  return Math.max(s.latched, live);
}

/**
 * Tracks press-and-hold (mouse, touch, pen, Space key) in a ref so that
 * WebGL scenes and DOM overlays can read it every frame without re-rendering.
 */
export function useHoldProgress({ enabled, duration = 3.2, onComplete }: Options): MutableRefObject<HoldState> {
  const state = useRef<HoldState>({
    progress: 0,
    latched: 0,
    holding: false,
    pointer: { x: 0.5, y: 0.5 },
    client: { x: 0, y: 0 },
  });
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const s = state.current;
    s.client = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    const layoutSize = () => {
      const vv = window.visualViewport;
      return {
        w: Math.max(1, vv?.width ?? window.innerWidth),
        h: Math.max(1, vv?.height ?? window.innerHeight),
        ox: vv?.offsetLeft ?? 0,
        oy: vv?.offsetTop ?? 0,
      };
    };
    const move = (e: PointerEvent) => {
      const { w, h, ox, oy } = layoutSize();
      s.client = { x: e.clientX, y: e.clientY };
      s.pointer = { x: (e.clientX - ox) / w, y: 1 - (e.clientY - oy) / h };
    };
    const isUiTarget = (e: Event) =>
      (e.target as HTMLElement | null)?.closest?.("button, a, [data-intro-hold-ignore]") != null;
    const down = (e: PointerEvent) => {
      move(e);
      if (!isUiTarget(e)) s.holding = true;
    };
    const up = () => {
      s.holding = false;
    };
    const keyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && !isUiTarget(e)) {
        e.preventDefault();
        s.holding = true;
      }
    };
    const keyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") s.holding = false;
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("pointercancel", up, { passive: true });
    window.addEventListener("blur", up);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("blur", up);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, []);

  useEffect(() => {
    const s = state.current;
    if (!enabled) return;
    s.progress = 0;
    s.latched = 0;
    let completed = false;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!completed) {
        if (s.holding) {
          const base = Math.max(s.progress, s.latched);
          s.progress = Math.min(1, base + dt / duration);
        } else {
          s.progress = Math.max(0, s.progress - dt * DECAY_PER_SECOND);
        }
        s.latched = Math.max(s.latched, s.progress);
        if (s.progress >= 1) {
          completed = true;
          s.latched = 1;
          s.progress = 1;
          s.holding = false;
          onCompleteRef.current();
        }
      } else {
        s.latched = 1;
        s.progress = 1;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, duration]);

  return state;
}
