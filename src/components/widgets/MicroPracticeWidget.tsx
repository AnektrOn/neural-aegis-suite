import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useWidgetAbandonGuard } from "@/hooks/useWidgetAbandonGuard";
import { usePersistedExerciseTimer } from "@/hooks/usePersistedExerciseTimer";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronRight, CheckCircle2, Zap } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { pickWidgetCatalogCopy } from "@/lib/toolbox-widget-i18n";
import type { Locale } from "@/i18n/translations";
import type { MicroHeroPreset } from "@/lib/toolbox-slug-themes";
import type { ToolboxOnAbandon, ToolboxOnComplete } from "@/lib/toolbox-completion";

export interface MicroPracticeConfig {
  instructions?: string;
  instructions_i18n?: unknown;
  duration_sec?: number;
  steps?: Array<{ text: string; text_i18n?: unknown }>;
  accent_color?: string;
  hero?: MicroHeroPreset;
  time_budget_mode?: boolean;
}

interface Props {
  config: MicroPracticeConfig;
  title: string;
  hideTitle?: boolean;
  sessionKey?: string;
  onComplete?: ToolboxOnComplete;
  onAbandon?: ToolboxOnAbandon;
}

const DEFAULT_COLOR = "hsl(176 70% 48%)";

function MicroHeroVisual({
  hero,
  accent,
  running,
}: {
  hero: MicroHeroPreset;
  accent: string;
  running: boolean;
}) {
  const base = "relative flex items-center justify-center w-28 h-28 mx-auto";
  switch (hero) {
    case "shake":
      return (
        <motion.div
          className={base}
          animate={running ? { rotate: [-2, 2, -2, 2, 0], x: [-2, 2, -2, 2, 0] } : {}}
          transition={{ duration: 0.4, repeat: running ? Infinity : 0 }}
        >
          <motion.div
            className="w-16 h-16 rounded-full border-2"
            style={{ borderColor: accent, boxShadow: `0 0 24px color-mix(in srgb, ${accent} 40%, transparent)` }}
          />
        </motion.div>
      );
    case "flame":
      return (
        <motion.div
          className={base}
          animate={running ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          <motion.div
            className="w-12 h-20 rounded-full"
            style={{
              background: `linear-gradient(to top, ${accent}, color-mix(in srgb, ${accent} 30%, transparent))`,
              filter: `drop-shadow(0 0 12px color-mix(in srgb, ${accent} 50%, transparent))`,
            }}
          />
        </motion.div>
      );
    case "shield":
      return (
        <motion.div className={base} animate={running ? { scale: [1, 1.05, 1] } : {}} transition={{ duration: 2, repeat: Infinity }}>
          <div
            className="w-14 h-16 rounded-t-full rounded-b-lg border-2"
            style={{ borderColor: accent, background: `color-mix(in srgb, ${accent} 12%, transparent)` }}
          />
        </motion.div>
      );
    case "spark":
      return (
        <motion.div className={base}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: accent }}
              animate={running ? { opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] } : { opacity: 0.4 }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              initial={{ x: Math.cos((i / 3) * Math.PI * 2) * 36, y: Math.sin((i / 3) * Math.PI * 2) * 36 }}
            />
          ))}
          <motion.div className="w-10 h-10 rounded-full" style={{ background: `color-mix(in srgb, ${accent} 25%, transparent)` }} />
        </motion.div>
      );
    case "ink":
      return (
        <motion.div className={base}>
          <motion.div
            className="w-20 h-1 rounded-full"
            style={{ backgroundColor: accent }}
            animate={running ? { width: ["20%", "100%", "20%"] } : {}}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.div>
      );
    case "steps":
      return (
        <motion.div className={`${base} gap-1 flex-row`}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 rounded-sm"
              style={{ backgroundColor: accent, height: 12 + i * 8 }}
              animate={running ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.5 }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      );
    case "orbit":
      return (
        <motion.div className={base}>
          <motion.div
            className="absolute w-20 h-20 rounded-full border"
            style={{ borderColor: `color-mix(in srgb, ${accent} 40%, transparent)` }}
            animate={running ? { rotate: 360 } : {}}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          <motion.div className="w-3 h-3 rounded-full" style={{ backgroundColor: accent }} />
        </motion.div>
      );
    case "pulse":
    default:
      return (
        <motion.div
          className={base}
          animate={running ? { scale: [1, 1.12, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="absolute inset-4 rounded-full"
            style={{ background: `radial-gradient(circle, color-mix(in srgb, ${accent} 35%, transparent), transparent)` }}
          />
          <motion.div className="w-14 h-14 rounded-full border-2" style={{ borderColor: accent }} />
        </motion.div>
      );
  }
}

export default function MicroPracticeWidget({
  config,
  title,
  hideTitle,
  sessionKey,
  onComplete,
  onAbandon,
}: Props) {
  const { t, locale } = useLanguage();
  const accent = config.accent_color || DEFAULT_COLOR;
  const hero = config.hero ?? "pulse";
  const instructionsText = useMemo(
    () => pickWidgetCatalogCopy(locale as Locale, config.instructions_i18n as any, config.instructions),
    [locale, config.instructions_i18n, config.instructions],
  );
  const localizedSteps = useMemo(() => {
    const raw = config.steps;
    if (!Array.isArray(raw) || raw.length === 0) return null;
    return raw.map((s) => pickWidgetCatalogCopy(locale as Locale, s.text_i18n as any, s.text));
  }, [config.steps, locale]);
  const hasSteps = localizedSteps != null && localizedSteps.length > 0;
  const totalSec = Math.max(0, config.duration_sec ?? 0);
  const hasDuration = totalSec > 0;

  const [started, setStarted] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const markCompletedRef = useRef<() => void>(() => {});

  const timer = usePersistedExerciseTimer({
    sessionKey: hasDuration ? sessionKey : undefined,
    totalSeconds: Math.max(1, totalSec || 1),
    onComplete: hasDuration ? () => markCompletedRef.current() : undefined,
  });

  const { elapsedSec: elapsed, isRunning: running, completed, toggleRunning, reset: resetTimer, hasStartedRef, completedRef } = timer;
  const elapsedRef = useRef(elapsed);
  elapsedRef.current = elapsed;

  const markCompleted = useCallback(() => {
    completedRef.current = true;
    onComplete?.({
      elapsedSec: elapsed,
      durationBudgetSec: hasDuration ? totalSec : undefined,
    });
  }, [completedRef, elapsed, hasDuration, onComplete, totalSec]);

  useEffect(() => {
    markCompletedRef.current = markCompleted;
  }, [markCompleted]);

  const remaining = Math.max(0, totalSec - elapsed);
  const progress = totalSec > 0 ? Math.min(elapsed / totalSec, 1) : 0;

  useEffect(() => {
    if (running || elapsed > 0) hasStartedRef.current = true;
  }, [running, elapsed, hasStartedRef]);

  useWidgetAbandonGuard(
    hasStartedRef,
    completedRef,
    onAbandon,
    () => ({
      elapsedSec: elapsedRef.current,
      durationBudgetSec: hasDuration ? totalSec : undefined,
    }),
  );

  const start = () => {
    hasStartedRef.current = true;
    setStarted(true);
    if (hasDuration) timer.setRunning(true);
  };

  const nextStep = () => {
    const n = localizedSteps?.length ?? 0;
    if (n === 0) return;
    if (stepIdx >= n - 1) {
      markCompleted();
    } else {
      setStepIdx(stepIdx + 1);
    }
  };

  const reset = () => {
    setStarted(false);
    setStepIdx(0);
    resetTimer();
  };

  const fmtTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const currentStepText = hasSteps ? localizedSteps![stepIdx] : null;
  const sessionDone = completed || completedRef.current;

  return (
    <div className="flex flex-col items-center space-y-5 py-4">
      {!hideTitle && (
        <div className="flex items-center gap-2 text-neural-label">
          <Zap size={14} style={{ color: accent }} />
          <span className="text-xs uppercase tracking-[0.3em]">{title}</span>
        </div>
      )}

      <MicroHeroVisual hero={hero} accent={accent} running={started && !sessionDone} />

      <AnimatePresence mode="wait">
        {!started && !sessionDone ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-3 max-w-[300px]"
          >
            {instructionsText ? (
              <p className="text-sm text-foreground/80 leading-relaxed">{instructionsText}</p>
            ) : null}
            {hasDuration && (
              <p className="text-xs text-muted-foreground">
                {hasSteps
                  ? t("toolbox.micro.totalBudget", { time: fmtTime(totalSec) })
                  : t("toolbox.micro.duration", { time: fmtTime(totalSec) })}
              </p>
            )}
            {hasSteps && (
              <p className="text-xs text-muted-foreground">{t("toolbox.micro.stepsCount", { n: localizedSteps!.length })}</p>
            )}
          </motion.div>
        ) : sessionDone ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-2"
          >
            <CheckCircle2 size={32} className="mx-auto" style={{ color: accent }} />
            <p className="text-sm font-medium text-foreground">{t("toolbox.micro.done")}</p>
            {hasDuration && (
              <p className="text-xs text-muted-foreground">{t("toolbox.micro.elapsed", { time: fmtTime(elapsed) })}</p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key={hasSteps ? `step-${stepIdx}` : "running"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[300px] space-y-4"
          >
            {currentStepText ? (
              <div
                className="rounded-2xl p-4 space-y-2"
                style={{
                  background: `color-mix(in srgb, ${accent} 8%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${accent} 25%, transparent)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: accent }}>
                    {t("toolbox.micro.stepCounter", { current: stepIdx + 1, total: localizedSteps!.length })}
                  </span>
                  {hasDuration && (
                    <span className="text-[10px] font-mono" style={{ color: accent }}>
                      {fmtTime(remaining)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed">{currentStepText}</p>
              </div>
            ) : instructionsText ? (
              <p className="text-sm text-center text-foreground/80 leading-relaxed px-2">{instructionsText}</p>
            ) : null}

            {hasDuration && (
              <div className="space-y-1">
                <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: accent }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>{fmtTime(elapsed)}</span>
                  <span>{t("toolbox.micro.totalBudgetShort", { time: fmtTime(totalSec) })}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        {!started && !sessionDone ? (
          <button
            type="button"
            onClick={start}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-medium transition-all active:scale-95"
            style={{
              background: `color-mix(in srgb, ${accent} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${accent} 35%, transparent)`,
              color: accent,
            }}
          >
            <Play size={14} />
            {t("toolbox.micro.start")}
          </button>
        ) : sessionDone ? (
          <button
            type="button"
            onClick={reset}
            className="w-12 h-12 rounded-2xl border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw size={18} />
          </button>
        ) : (
          <div className="flex gap-3 flex-wrap justify-center">
            {hasDuration && (
              <button
                type="button"
                onClick={toggleRunning}
                className="w-12 h-12 rounded-2xl border flex items-center justify-center transition-colors"
                style={{
                  borderColor: `color-mix(in srgb, ${accent} 40%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`,
                  color: accent,
                }}
              >
                {running ? <Pause size={18} /> : <Play size={18} />}
              </button>
            )}
            {hasSteps && (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all active:scale-95 border"
                style={{
                  borderColor: `color-mix(in srgb, ${accent} 40%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`,
                  color: accent,
                }}
              >
                {stepIdx >= (localizedSteps?.length ?? 1) - 1 ? t("toolbox.micro.finish") : t("toolbox.micro.next")}
                <ChevronRight size={14} />
              </button>
            )}
            {!hasSteps && !hasDuration && (
              <button
                type="button"
                onClick={markCompleted}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all active:scale-95 border"
                style={{
                  borderColor: `color-mix(in srgb, ${accent} 40%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`,
                  color: accent,
                }}
              >
                <CheckCircle2 size={14} />
                {t("toolbox.micro.markDone")}
              </button>
            )}
            {(hasSteps || hasDuration) && (
              <button
                type="button"
                onClick={markCompleted}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] uppercase tracking-[0.18em] border border-border/30 text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("toolbox.micro.finishEarly")}
              </button>
            )}
            <button
              type="button"
              onClick={reset}
              className="w-12 h-12 rounded-2xl border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
