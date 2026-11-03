import { useEffect, useRef } from "react";
import { usePrismR3fLandingChapter } from "../config/PrismR3fLandingChapterContext";

const WHEEL_THRESHOLD = 72;
const UNLOCK_AFTER_IDLE_MS = 220;

function wheelDeltaY(event: WheelEvent): number {
  if (event.deltaMode === 1) return event.deltaY * 16;
  if (event.deltaMode === 2) return event.deltaY * window.innerHeight;
  return event.deltaY;
}

function navTargetIsBlocked(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest("dialog[open]")) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * Molette / trackpad → même nav que NEXT / PREV.
 * Un geste = un beat ; bloqué pendant le travel Theatre (4 s).
 */
export function usePrismLandingWheelNav(enabled: boolean) {
  const { goNext, goPrev, canGoNext, canGoPrev, isTransitioning, chapterIndex } =
    usePrismR3fLandingChapter();

  const goNextRef = useRef(goNext);
  const goPrevRef = useRef(goPrev);
  const canGoNextRef = useRef(canGoNext);
  const canGoPrevRef = useRef(canGoPrev);
  const transitioningRef = useRef(isTransitioning);
  goNextRef.current = goNext;
  goPrevRef.current = goPrev;
  canGoNextRef.current = canGoNext;
  canGoPrevRef.current = canGoPrev;
  transitioningRef.current = isTransitioning;

  const accRef = useRef(0);
  const busyRef = useRef(false);

  useEffect(() => {
    if (isTransitioning) return;
    const t = window.setTimeout(() => {
      busyRef.current = false;
      accRef.current = 0;
    }, UNLOCK_AFTER_IDLE_MS);
    return () => window.clearTimeout(t);
  }, [isTransitioning, chapterIndex]);

  useEffect(() => {
    if (!enabled) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (navTargetIsBlocked(event.target)) return;
      if (busyRef.current || transitioningRef.current) return;

      accRef.current += wheelDeltaY(event);
      if (accRef.current >= WHEEL_THRESHOLD) {
        accRef.current = 0;
        if (!canGoNextRef.current) return;
        busyRef.current = true;
        goNextRef.current();
        return;
      }
      if (accRef.current <= -WHEEL_THRESHOLD) {
        accRef.current = 0;
        if (!canGoPrevRef.current) return;
        busyRef.current = true;
        goPrevRef.current();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [enabled]);
}
