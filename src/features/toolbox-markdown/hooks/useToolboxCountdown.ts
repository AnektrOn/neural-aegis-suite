import { useCallback, useEffect, useRef, useState } from "react";

export interface UseToolboxCountdownOptions {
  durationSec: number;
  autoStart?: boolean;
  onComplete?: () => void;
}

export function useToolboxCountdown({
  durationSec,
  autoStart = false,
  onComplete,
}: UseToolboxCountdownOptions) {
  const [remainingSec, setRemainingSec] = useState(durationSec);
  const [isRunning, setIsRunning] = useState(autoStart);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setRemainingSec(durationSec);
    setIsRunning(autoStart);
    completedRef.current = false;
  }, [durationSec, autoStart]);

  useEffect(() => {
    if (!isRunning) return;

    const id = window.setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (!completedRef.current) {
            completedRef.current = true;
            onCompleteRef.current?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [isRunning]);

  const start = useCallback(() => {
    completedRef.current = false;
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => setIsRunning(false), []);

  const toggle = useCallback(() => {
    setIsRunning((r) => !r);
  }, []);

  const reset = useCallback(() => {
    completedRef.current = false;
    setRemainingSec(durationSec);
    setIsRunning(false);
  }, [durationSec]);

  const progress = durationSec > 0 ? 1 - remainingSec / durationSec : 0;

  return {
    remainingSec,
    isRunning,
    progress,
    start,
    pause,
    toggle,
    reset,
    isComplete: remainingSec <= 0 && !isRunning,
  };
}

export function formatToolboxCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
