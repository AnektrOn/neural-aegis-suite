import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Eye } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { pickWidgetCatalogCopy } from "@/lib/toolbox-widget-i18n";
import { usePersistedExerciseTimer } from "@/hooks/usePersistedExerciseTimer";
import { useWidgetAbandonGuard } from "@/hooks/useWidgetAbandonGuard";
import { formatClockMmSs, hydrateToolboxWidgetDuration } from "@/lib/toolbox-widget-duration";
import type { Locale } from "@/i18n/translations";

interface Props {
  config: { duration_min: number; intention: string; intention_i18n?: unknown };
  title: string;
  /** When true, omit the duplicate title row (parent already shows the exercise name). */
  hideTitle?: boolean;
  sessionKey?: string;
  onComplete?: (payload?: { elapsedSec: number; durationBudgetSec?: number }) => void;
  onAbandon?: (payload?: { elapsedSec: number; durationBudgetSec?: number }) => void;
}

export default function FocusIntrospectifWidget({
  config,
  title,
  hideTitle,
  sessionKey,
  onComplete,
  onAbandon,
}: Props) {
  const { t, locale } = useLanguage();
  const intentionDisplay = useMemo(
    () => pickWidgetCatalogCopy(locale as Locale, config.intention_i18n as any, config.intention),
    [locale, config.intention_i18n, config.intention]
  );
  const hydrated = useMemo(
    () => hydrateToolboxWidgetDuration("focus_introspectif", config as unknown as Record<string, unknown>),
    [config],
  );
  const durationMin = Number(hydrated.duration_min) || 10;
  const totalSeconds = durationMin * 60;
  const elapsedRef = useRef(0);

  const {
    elapsedSec: elapsed,
    isRunning,
    completed,
    toggleRunning,
    reset,
    hasStartedRef,
    completedRef,
  } = usePersistedExerciseTimer({
    sessionKey,
    totalSeconds,
    onComplete: () =>
      onComplete?.({
        elapsedSec: elapsedRef.current,
        durationBudgetSec: totalSeconds,
      }),
  });

  elapsedRef.current = elapsed;

  useWidgetAbandonGuard(hasStartedRef, completedRef, onAbandon);

  const remaining = Math.max(0, totalSeconds - elapsed);
  const progress = totalSeconds > 0 ? elapsed / totalSeconds : 0;
  const pulseScale = isRunning ? 1 + Math.sin(elapsed * 0.3) * 0.08 : 1;

  return (
    <div className="flex flex-col items-center space-y-6 py-4">
      {!hideTitle && (
        <div className="flex items-center gap-2 text-neural-label">
          <Eye size={14} className="text-neural-accent" />
          <span className="text-xs uppercase tracking-[0.3em]">{title}</span>
        </div>
      )}

      <p className="text-sm text-foreground/80 italic text-center max-w-sm">
        « {intentionDisplay} »
      </p>

      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="100" cy="100" r="88" fill="none" stroke="hsl(270 50% 60% / 0.1)" strokeWidth="2" />
          <circle cx="100" cy="100" r="88" fill="none" stroke="hsl(270 50% 60% / 0.6)" strokeWidth="2"
            strokeDasharray={2 * Math.PI * 88}
            strokeDashoffset={2 * Math.PI * 88 * (1 - progress)}
            strokeLinecap="round"
            className="transition-all duration-1000" />
        </svg>

        <motion.div className="absolute inset-8 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(270 50% 60% / 0.08) 0%, transparent 70%)" }}
          animate={{ scale: pulseScale }}
          transition={{ duration: 0.1 }} />

        <div className="relative text-center z-10">
          {completed ? (
            <div>
              <p className="text-neural-accent font-cinzel text-lg">{t("toolbox.focus.namaste")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("toolbox.focus.minutesDone", { n: durationMin })}</p>
            </div>
          ) : (
            <div>
              <p className="text-2xl font-cinzel text-foreground">{formatClockMmSs(remaining)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isRunning ? t("toolbox.focus.running") : t("toolbox.focus.ready")}
              </p>
            </div>
          )}
        </div>

        {isRunning && [0, 1, 2].map(i => {
          const angle = (elapsed * 0.02 + i * (Math.PI * 2 / 3));
          const cx = 96 + Math.cos(angle) * 80;
          const cy = 96 + Math.sin(angle) * 80;
          return (
            <div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-neural-accent/40"
              style={{ left: cx, top: cy, transition: "all 0.5s ease" }} />
          );
        })}
      </div>

      <div className="w-full max-w-xs h-1 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full bg-neural-accent/60 transition-all duration-1000"
          style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="flex gap-3">
        <button onClick={toggleRunning}
          className="w-12 h-12 rounded-2xl border border-neural-accent/30 bg-neural-accent/10 flex items-center justify-center text-neural-accent hover:bg-neural-accent/20 transition-colors"
          disabled={completed}>
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button onClick={reset}
          className="w-12 h-12 rounded-2xl border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
