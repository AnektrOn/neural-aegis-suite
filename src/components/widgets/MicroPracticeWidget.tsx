import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronRight, CheckCircle2, Zap } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { pickWidgetCatalogCopy } from "@/lib/toolbox-widget-i18n";
import type { Locale } from "@/i18n/translations";

/**
 * Generic widget for exercises without a dedicated widget.
 *
 * Expected widget_config:
 * {
 *   "instructions": "Main exercise text",
 *   "instructions_i18n": { "fr": "…", "en": "…" },
 *   "duration_sec": 180,
 *   "steps": [ { "text": "…", "text_i18n": { "fr": "…", "en": "…" } } ],
 *   "accent_color": "hsl(176 70% 48%)"
 * }
 */
export interface MicroPracticeConfig {
  instructions?: string;
  instructions_i18n?: unknown;
  duration_sec?: number;
  steps?: Array<{ text: string; text_i18n?: unknown }>;
  accent_color?: string;
}

interface Props {
  config: MicroPracticeConfig;
  title: string;
  hideTitle?: boolean;
  onComplete?: () => void;
  onAbandon?: () => void;
}

const DEFAULT_COLOR = "hsl(176 70% 48%)";

export default function MicroPracticeWidget({ config, title, hideTitle, onComplete, onAbandon }: Props) {
  const { t, locale } = useLanguage();
  const accent = config.accent_color || DEFAULT_COLOR;
  const instructionsText = useMemo(
    () => pickWidgetCatalogCopy(locale as Locale, config.instructions_i18n as any, config.instructions),
    [locale, config.instructions_i18n, config.instructions]
  );
  const localizedSteps = useMemo(() => {
    const raw = config.steps;
    if (!Array.isArray(raw) || raw.length === 0) return null;
    return raw.map((s) => pickWidgetCatalogCopy(locale as Locale, s.text_i18n as any, s.text));
  }, [config.steps, locale]);
  const hasSteps = localizedSteps != null && localizedSteps.length > 0;
  const hasDuration = typeof config.duration_sec === "number" && config.duration_sec > 0;

  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  const hasStartedRef = useRef(false);
  const completedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSec = config.duration_sec ?? 0;
  const remaining = Math.max(0, totalSec - elapsed);
  const progress = totalSec > 0 ? Math.min(elapsed / totalSec, 1) : 0;

  useEffect(() => {
    return () => {
      if (hasStartedRef.current && !completedRef.current) onAbandon?.();
    };
  }, []);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (hasDuration && next >= totalSec) {
          if (!hasSteps) {
            markCompleted();
          }
          return totalSec;
        }
        return next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, hasDuration, hasSteps, totalSec]);

  const markCompleted = useCallback(() => {
    setRunning(false);
    setCompleted(true);
    completedRef.current = true;
    onComplete?.();
  }, [onComplete]);

  const start = () => {
    hasStartedRef.current = true;
    setStarted(true);
    if (hasDuration) setRunning(true);
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
    setCompleted(false);
    setStepIdx(0);
    setElapsed(0);
    setRunning(false);
    hasStartedRef.current = false;
    completedRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const fmtTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const currentStepText = hasSteps ? localizedSteps![stepIdx] : null;

  return (
    <div className="flex flex-col items-center space-y-5 py-4">
      {!hideTitle && (
        <div className="flex items-center gap-2 text-neural-label">
          <Zap size={14} style={{ color: accent }} />
          <span className="text-xs uppercase tracking-[0.3em]">{title}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!started && !completed ? (
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
              <p className="text-xs text-muted-foreground">{t("toolbox.micro.duration", { time: fmtTime(totalSec) })}</p>
            )}
            {hasSteps && (
              <p className="text-xs text-muted-foreground">{t("toolbox.micro.stepsCount", { n: localizedSteps!.length })}</p>
            )}
          </motion.div>
        ) : completed ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-2"
          >
            <CheckCircle2 size={32} className="mx-auto" style={{ color: accent }} />
            <p className="text-sm font-medium text-foreground">{t("toolbox.micro.done")}</p>
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
                <p className="text-sm text-foreground/85 leading-relaxed">
                  {currentStepText}
                </p>
              </div>
            ) : instructionsText ? (
              <p className="text-sm text-center text-foreground/80 leading-relaxed px-2">
                {instructionsText}
              </p>
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
                  <span>{fmtTime(totalSec)}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        {!started && !completed ? (
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
        ) : completed ? (
          <button
            type="button"
            onClick={reset}
            className="w-12 h-12 rounded-2xl border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw size={18} />
          </button>
        ) : (
          <div className="flex gap-3">
            {hasDuration && !hasSteps && (
              <button
                type="button"
                onClick={() => setRunning(!running)}
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
