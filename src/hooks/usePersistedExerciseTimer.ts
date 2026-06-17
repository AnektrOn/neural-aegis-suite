import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearTimerSession,
  getElapsedSec,
  loadTimerSession,
  materializeRunningTimer,
  saveTimerSession,
  type TimerSessionData,
} from "@/lib/toolbox-session-storage";
import { playToolboxTimerCompleteSound } from "@/lib/toolbox-timer-sound";
import { subscribeWallClockTick } from "@/lib/wall-clock-ticker";

interface Options {
  sessionKey?: string;
  totalSeconds: number;
  onComplete?: () => void;
}

const EMPTY: TimerSessionData = { accumulatedSec: 0, runningSince: null, completed: false };

export function usePersistedExerciseTimer({ sessionKey, totalSeconds, onComplete }: Options) {
  const completedRef = useRef(false);
  const hasStartedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [timerState, setTimerState] = useState<TimerSessionData>(() => {
    if (!sessionKey) return EMPTY;
    const saved = loadTimerSession(sessionKey);
    if (saved && !saved.completed) {
      hasStartedRef.current = saved.accumulatedSec > 0 || saved.runningSince !== null;
      return materializeRunningTimer(saved);
    }
    return EMPTY;
  });

  const [, setTick] = useState(0);

  const elapsedSec = Math.min(getElapsedSec(timerState), totalSeconds);
  const isRunning = timerState.runningSince !== null && !timerState.completed;
  const completed = timerState.completed || elapsedSec >= totalSeconds;

  useEffect(() => {
    if (isRunning || timerState.accumulatedSec > 0) hasStartedRef.current = true;
  }, [isRunning, timerState.accumulatedSec]);

  useEffect(() => {
    if (!sessionKey || !hasStartedRef.current) return;
    if (completed) {
      clearTimerSession(sessionKey);
      return;
    }
    saveTimerSession(sessionKey, timerState);
  }, [sessionKey, timerState, completed]);

  const checkpointWallClock = useCallback(() => {
    setTimerState((prev) => {
      if (prev.completed) return prev;
      const next = materializeRunningTimer(prev);
      if (sessionKey) saveTimerSession(sessionKey, next);
      return next;
    });
    setTick((n) => n + 1);
  }, [sessionKey]);

  useEffect(() => {
    if (!isRunning) return;
    return subscribeWallClockTick(() => setTick((n) => n + 1));
  }, [isRunning]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const onHidden = () => {
      setTimerState((prev) => {
        if (prev.completed) return prev;
        const next = materializeRunningTimer(prev);
        if (sessionKey) saveTimerSession(sessionKey, next);
        return next;
      });
    };

    const onVisible = () => checkpointWallClock();

    const onVisibility = () => {
      if (document.visibilityState === "hidden") onHidden();
      else onVisible();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisible);
    window.addEventListener("pageshow", onVisible);
    window.addEventListener("beforeunload", onHidden);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onVisible);
      window.removeEventListener("beforeunload", onHidden);
    };
  }, [sessionKey, checkpointWallClock]);

  useEffect(() => {
    if (elapsedSec < totalSeconds || completedRef.current) return;
    if (!hasStartedRef.current) return;
    completedRef.current = true;
    setTimerState((prev) => ({ ...prev, completed: true, runningSince: null }));
    playToolboxTimerCompleteSound();
    onCompleteRef.current?.();
  }, [elapsedSec, totalSeconds]);

  const prevSessionKeyRef = useRef(sessionKey);
  useEffect(() => {
    if (prevSessionKeyRef.current === sessionKey) return;
    prevSessionKeyRef.current = sessionKey;
    completedRef.current = false;
    hasStartedRef.current = false;
    if (sessionKey) {
      const saved = loadTimerSession(sessionKey);
      if (saved && !saved.completed) {
        hasStartedRef.current = saved.accumulatedSec > 0 || saved.runningSince !== null;
        setTimerState(materializeRunningTimer(saved));
        return;
      }
    }
    setTimerState(EMPTY);
  }, [sessionKey]);

  const prevTotalRef = useRef(totalSeconds);
  useEffect(() => {
    if (prevTotalRef.current === totalSeconds) return;
    prevTotalRef.current = totalSeconds;
    if (completedRef.current) return;
    completedRef.current = false;
    hasStartedRef.current = false;
    if (sessionKey) clearTimerSession(sessionKey);
    setTimerState(EMPTY);
  }, [totalSeconds, sessionKey]);

  const toggleRunning = useCallback(() => {
    setTimerState((prev) => {
      if (prev.completed) return prev;
      if (prev.runningSince !== null) {
        const materialized = materializeRunningTimer(prev);
        return { ...materialized, runningSince: null };
      }
      hasStartedRef.current = true;
      return { ...prev, runningSince: Date.now() };
    });
  }, []);

  const setRunning = useCallback((running: boolean) => {
    setTimerState((prev) => {
      if (prev.completed) return prev;
      if (running && prev.runningSince === null) {
        hasStartedRef.current = true;
        return { ...prev, runningSince: Date.now() };
      }
      if (!running && prev.runningSince !== null) {
        const materialized = materializeRunningTimer(prev);
        return { ...materialized, runningSince: null };
      }
      return prev;
    });
  }, []);

  const reset = useCallback(() => {
    completedRef.current = false;
    hasStartedRef.current = false;
    if (sessionKey) clearTimerSession(sessionKey);
    setTimerState(EMPTY);
  }, [sessionKey]);

  return {
    elapsedSec,
    isRunning,
    completed,
    toggleRunning,
    setRunning,
    reset,
    hasStartedRef,
    completedRef,
  };
}
