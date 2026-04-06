import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ShieldAlert, ChevronRight, Check } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import { hslWithAlpha } from "@/components/widgets/VisualizationWidget";

export interface StopStepLegacy {
  title: string;
  hint: string;
}

export interface StopProtocolConfig {
  mode?: "timed" | "manual";
  step_duration_sec?: number;
  /** Ancien format admin : « titre — indication » */
  steps?: StopStepLegacy[];
}

interface Props {
  config: StopProtocolConfig;
  title: string;
  onComplete?: () => void;
  onAbandon?: () => void;
}

interface Step {
  letter: string;
  caption: string;
  subtitle: string;
  instruction: string;
  color: string;
  duration_sec: number;
}

const DEFAULT_COLORS = ["hsl(0 70% 55%)", "hsl(35 80% 58%)", "hsl(220 70% 60%)", "hsl(176 70% 48%)"];
const LETTERS = ["S", "T", "O", "P"] as const;

function buildDefaultSteps(duration: number, t: (key: TranslationKey, params?: Record<string, string | number>) => string): Step[] {
  return LETTERS.map((letter, i) => ({
    letter,
    caption: t(`toolbox.stopV2.${letter}.caption` as TranslationKey),
    subtitle: t(`toolbox.stopV2.${letter}.subtitle` as TranslationKey),
    instruction: t(`toolbox.stopV2.${letter}.instruction` as TranslationKey),
    color: DEFAULT_COLORS[i],
    duration_sec: duration,
  }));
}

function legacyToSteps(legacy: StopStepLegacy[], stepDuration: number): Step[] {
  return legacy.map((s, i) => ({
    letter: LETTERS[i] ?? String(i + 1),
    caption: s.title.split(/\s+/)[0] || s.title,
    subtitle: s.title,
    instruction: s.hint?.trim() ? s.hint : s.title,
    color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    duration_sec: stepDuration,
  }));
}

function normalizeSteps(config: StopProtocolConfig, t: (key: TranslationKey, params?: Record<string, string | number>) => string): Step[] {
  const stepDuration = config.step_duration_sec ?? 30;
  const raw = config.steps;
  if (Array.isArray(raw) && raw.length > 0 && raw[0] && typeof raw[0] === "object" && "title" in raw[0]) {
    return legacyToSteps(raw as StopStepLegacy[], stepDuration);
  }
  return buildDefaultSteps(stepDuration, t);
}

export default function StopProtocolWidget({ config, title, onComplete, onAbandon }: Props) {
  const { t } = useLanguage();
  const stepDuration = config.step_duration_sec ?? 30;
  const mode = config.mode === "timed" ? "timed" : "manual";
  const steps = useMemo(() => normalizeSteps(config, t), [config, t]);

  const [isRunning, setIsRunning] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [completed, setCompleted] = useState(false);
  const hasStartedRef = useRef(false);
  const completedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = currentIdx >= 0 ? steps[currentIdx] : null;
  const started = currentIdx >= 0;

  useEffect(() => {
    if (isRunning && !hasStartedRef.current) hasStartedRef.current = true;
  }, [isRunning]);

  useEffect(() => {
    return () => {
      if (hasStartedRef.current && !completedRef.current) onAbandon?.();
    };
  }, []);

  const advance = useCallback(() => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= steps.length) {
      setCompletedSteps((prev) => new Set([...prev, currentIdx]));
      setIsRunning(false);
      setCompleted(true);
      completedRef.current = true;
      onComplete?.();
    } else {
      if (currentIdx >= 0) {
        setCompletedSteps((prev) => new Set([...prev, currentIdx]));
      }
      setCurrentIdx(nextIdx);
      setPhaseProgress(0);
    }
  }, [currentIdx, steps.length, onComplete]);

  useEffect(() => {
    if (!isRunning || mode === "manual" || currentIdx < 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    const tickMs = 50;
    const dur = steps[currentIdx]?.duration_sec ?? stepDuration;
    intervalRef.current = setInterval(() => {
      setPhaseProgress((prev) => {
        const next = prev + tickMs / (dur * 1000);
        if (next >= 1) {
          advance();
          return 0;
        }
        return next;
      });
    }, tickMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, currentIdx, mode, stepDuration, advance, steps]);

  const start = () => {
    hasStartedRef.current = true;
    setCurrentIdx(0);
    setPhaseProgress(0);
    if (mode === "timed") setIsRunning(true);
  };

  const reset = useCallback(() => {
    setIsRunning(false);
    setCurrentIdx(-1);
    setPhaseProgress(0);
    setCompletedSteps(new Set());
    setCompleted(false);
    completedRef.current = false;
    hasStartedRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const remaining = currentStep ? Math.ceil(currentStep.duration_sec * (1 - phaseProgress)) : stepDuration;

  const totalSeconds = Math.max(1, steps.reduce((s, st) => s + st.duration_sec, 0));
  const elapsedSeconds =
    (currentIdx >= 0 ? steps.slice(0, currentIdx).reduce((s, st) => s + st.duration_sec, 0) : 0) +
    phaseProgress * (currentStep?.duration_sec ?? stepDuration);
  const overallProgress = elapsedSeconds / totalSeconds;

  const totalMinRounded = Math.round(totalSeconds / 60);

  return (
    <div className="flex flex-col items-center space-y-5 py-4">
      <div className="flex items-center gap-2 text-neural-label">
        <ShieldAlert size={14} className="text-destructive" />
        <span className="text-xs uppercase tracking-[0.3em]">{title}</span>
      </div>

      <div className="flex items-center gap-3">
        {steps.map((step, i) => {
          const isDone = completedSteps.has(i);
          const isActive = currentIdx === i && !completed;
          return (
            <motion.div
              key={step.letter + String(i)}
              className="flex flex-col items-center gap-1"
              animate={isActive ? { y: [0, -3, 0] } : { y: 0 }}
              transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
            >
              <motion.div
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-cinzel text-xl font-bold transition-all duration-300"
                style={{
                  background: isDone || isActive ? hslWithAlpha(step.color, 0.12) : "hsl(220 15% 10%)",
                  border: `1.5px solid ${
                    isDone ? hslWithAlpha(step.color, 0.35) : isActive ? step.color : "hsl(220 15% 18%)"
                  }`,
                  color: isDone ? hslWithAlpha(step.color, 0.75) : isActive ? step.color : "hsl(220 10% 35%)",
                  boxShadow: isActive ? `0 0 20px ${hslWithAlpha(step.color, 0.2)}` : "none",
                }}
                layout
              >
                {isDone ? <Check size={18} style={{ color: step.color }} /> : step.letter}
              </motion.div>
              <span
                className="text-[8px] uppercase tracking-[0.1em] transition-all duration-300"
                style={{
                  color: isActive ? step.color : isDone ? hslWithAlpha(step.color, 0.55) : "hsl(220 10% 30%)",
                }}
              >
                {step.caption}
              </span>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {!started && !completed ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-1 max-w-[260px]"
          >
            <p className="text-sm text-muted-foreground">{t("toolbox.stopV2.idleTitle")}</p>
            <p className="text-xs text-muted-foreground/50">
              {t("toolbox.stopV2.idleMeta", { n: steps.length, min: totalMinRounded })}
            </p>
          </motion.div>
        ) : completed ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-2"
          >
            <p className="text-sm font-cinzel text-primary">{t("toolbox.stopV2.doneTitle")}</p>
            <p className="text-xs text-muted-foreground/60">{t("toolbox.stopV2.doneSubtitle")}</p>
          </motion.div>
        ) : currentStep ? (
          <motion.div
            key={currentStep.letter}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-[280px] rounded-2xl p-4 space-y-2"
            style={{
              background: hslWithAlpha(currentStep.color, 0.06),
              border: `1px solid ${hslWithAlpha(currentStep.color, 0.2)}`,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-[0.2em] font-medium" style={{ color: currentStep.color }}>
                {currentStep.subtitle}
              </span>
              {mode === "timed" && (
                <span className="ml-auto text-[10px] font-cinzel" style={{ color: currentStep.color }}>
                  {remaining}s
                </span>
              )}
            </div>
            <p className="text-xs text-foreground/75 italic leading-relaxed">« {currentStep.instruction} »</p>
            {mode === "timed" && (
              <div className="w-full h-0.5 rounded-full bg-white/5 overflow-hidden mt-2">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: currentStep.color }}
                  animate={{ width: `${phaseProgress * 100}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {mode === "timed" && started && !completed && (
        <div className="w-full max-w-[260px] space-y-1">
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>{t("toolbox.stopV2.stepOverall", { current: currentIdx + 1, total: steps.length })}</span>
            <span>{t("toolbox.stopV2.secondsLeft", { n: Math.ceil(totalSeconds - elapsedSeconds) })}</span>
          </div>
          <div className="w-full h-1 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, hsl(0 70% 55%), hsl(176 70% 48%))",
              }}
              animate={{ width: `${overallProgress * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {!started && !completed ? (
          <button
            type="button"
            onClick={start}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-medium transition-all active:scale-95"
            style={{
              background: "hsl(0 70% 55% / 0.15)",
              border: "1px solid hsl(0 70% 55% / 0.35)",
              color: "hsl(0 70% 65%)",
            }}
          >
            <ShieldAlert size={14} />
            {t("toolbox.stopV2.startButton")}
          </button>
        ) : completed ? (
          <button
            type="button"
            onClick={reset}
            className="w-12 h-12 rounded-2xl border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw size={18} />
          </button>
        ) : (
          <>
            {mode === "timed" ? (
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className="w-12 h-12 rounded-2xl border flex items-center justify-center transition-colors hover:opacity-90"
                style={{
                  borderColor: currentStep ? hslWithAlpha(currentStep.color, 0.4) : undefined,
                  backgroundColor: currentStep ? hslWithAlpha(currentStep.color, 0.1) : undefined,
                  color: currentStep?.color,
                }}
              >
                {isRunning ? <Pause size={18} /> : <Play size={18} />}
              </button>
            ) : (
              <button
                type="button"
                onClick={advance}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all active:scale-95 border"
                style={{
                  borderColor: currentStep ? hslWithAlpha(currentStep.color, 0.4) : undefined,
                  backgroundColor: currentStep ? hslWithAlpha(currentStep.color, 0.1) : undefined,
                  color: currentStep?.color,
                }}
              >
                {currentIdx === steps.length - 1 ? t("toolbox.stopV2.finishStep") : t("toolbox.stopV2.nextStep")}
                <ChevronRight size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={reset}
              className="w-12 h-12 rounded-2xl border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
