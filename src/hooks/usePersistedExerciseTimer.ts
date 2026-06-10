import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearTimerSession,
  getElapsedSec,
  loadTimerSession,
  saveTimerSession,
  type TimerSessionData,
} from "@/lib/toolbox-session-storage";

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
      return saved;
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

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setTick((n) => n + 1), 500);
    return () => clearInterval(id);
  }, [isRunning]);

  useEffect(() => {
    if (elapsedSec < totalSeconds || completedRef.current) return;
    if (!hasStartedRef.current) return;
    completedRef.current = true;
    setTimerState((prev) => ({ ...prev, completed: true, runningSince: null }));
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
        setTimerState(saved);
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
        const add = Math.floor((Date.now() - prev.runningSince) / 1000);
        return { ...prev, accumulatedSec: prev.accumulatedSec + add, runningSince: null };
      }
      return { ...prev, runningSince: Date.now() };
    });
  }, []);

  const setRunning = useCallback((running: boolean) => {
    setTimerState((prev) => {
      if (prev.completed) return prev;
      if (running && prev.runningSince === null) {
        return { ...prev, runningSince: Date.now() };
      }
      if (!running && prev.runningSince !== null) {
        const add = Math.floor((Date.now() - prev.runningSince) / 1000);
        return { ...prev, accumulatedSec: prev.accumulatedSec + add, runningSince: null };
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
