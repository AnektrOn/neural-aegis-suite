import { useEffect, useRef, type MutableRefObject } from "react";
import {
  resolveCyclicSequenceFromElapsed,
  resolveSequenceFromElapsed,
} from "@/lib/exercise-sequence-position";

interface CyclicPhase<T extends string> {
  phase: T;
  durationSec: number;
}

interface SequenceSegment {
  id: string;
  durationSec: number;
}

/** Sub-second elapsed ref for particle drive (wall-clock timer ticks at 250ms). */
export function useLiveElapsedSec(
  elapsedSec: number,
  isRunning: boolean,
  completed: boolean,
): MutableRefObject<number> {
  const anchorRef = useRef<{ t0: number; base: number } | null>(null);
  const liveRef = useRef(elapsedSec);

  useEffect(() => {
    if (isRunning && !completed) {
      anchorRef.current = { t0: performance.now(), base: elapsedSec };
    } else {
      anchorRef.current = null;
      liveRef.current = elapsedSec;
    }
  }, [isRunning, completed, elapsedSec]);

  const syncRef = useRef({ elapsedSec, isRunning, completed });
  syncRef.current = { elapsedSec, isRunning, completed };

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const { elapsedSec: e, isRunning: run, completed: done } = syncRef.current;
      const anchor = anchorRef.current;
      liveRef.current =
        run && !done && anchor
          ? anchor.base + (performance.now() - anchor.t0) / 1000
          : e;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return liveRef;
}

export function useLiveCyclicPosition<T extends string>(
  liveElapsedRef: MutableRefObject<number>,
  phases: CyclicPhase<T>[],
  cycles: number,
) {
  const phasesRef = useRef(phases);
  const cyclesRef = useRef(cycles);
  phasesRef.current = phases;
  cyclesRef.current = cycles;

  return () =>
    resolveCyclicSequenceFromElapsed(
      liveElapsedRef.current,
      phasesRef.current,
      cyclesRef.current,
    );
}

export function useLiveSequencePosition(
  liveElapsedRef: MutableRefObject<number>,
  segments: SequenceSegment[],
) {
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  return () => resolveSequenceFromElapsed(liveElapsedRef.current, segmentsRef.current);
}
