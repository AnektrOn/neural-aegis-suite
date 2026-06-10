import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePersistedExerciseTimer } from "@/hooks/usePersistedExerciseTimer";
import { useWidgetAbandonGuard } from "@/hooks/useWidgetAbandonGuard";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Stars } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Locale } from "@/i18n/translations";
import { pickWidgetCatalogCopy } from "@/lib/toolbox-widget-i18n";
import type { ToolboxCompletionPayload, ToolboxOnAbandon, ToolboxOnComplete } from "@/lib/toolbox-completion";

interface Props {
  config: {
    duration_min?: number;
    duration_sec?: number;
    affirmations?: string[];
    affirmations_i18n?: { fr: string[]; en: string[] };
  };
  title: string;
  hideTitle?: boolean;
  sessionKey?: string;
  onComplete?: ToolboxOnComplete;
  onAbandon?: ToolboxOnAbandon;
}

function resolveAffirmationsTotalSec(config: Props["config"]): number {
  if (typeof config.duration_sec === "number" && config.duration_sec > 0) {
    return Math.floor(config.duration_sec);
  }
  if (typeof config.duration_min === "number" && config.duration_min > 0) {
    return config.duration_min * 60;
  }
  return 180;
}

export default function AffirmationsWidget({
  config,
  title,
  hideTitle,
  sessionKey,
  onComplete,
  onAbandon,
}: Props) {
  const { t, locale } = useLanguage();
  const lines = useMemo(() => {
    const i18n = config.affirmations_i18n;
    const rawFr = config.affirmations?.map((a) => a.trim()).filter(Boolean) ?? [];

    if (i18n && ((i18n.fr?.length ?? 0) > 0 || (i18n.en?.length ?? 0) > 0)) {
      if (locale === "fr") {
        const primary = (i18n.fr ?? []).map((s) => s.trim()).filter(Boolean);
        const fallback = (i18n.en ?? []).map((s) => s.trim()).filter(Boolean);
        if (primary.length) return primary;
        if (fallback.length) return fallback;
      } else {
        const enLines = (i18n.en ?? []).map((s) => s.trim()).filter(Boolean);
        if (enLines.length) return enLines;
        const frLines = (i18n.fr ?? []).map((s) => s.trim()).filter(Boolean);
        if (frLines.length) return frLines.map((line) => pickWidgetCatalogCopy(locale as Locale, {}, line));
      }
    }

    if (locale === "en" && rawFr.length) {
      return rawFr.map((line) => pickWidgetCatalogCopy(locale as Locale, {}, line));
    }
    if (rawFr.length) return rawFr;
    return [t("toolbox.affirmFallback")];
  }, [config.affirmations, config.affirmations_i18n, locale, t]);

  const totalSeconds = resolveAffirmationsTotalSec(config);
  const segmentSec = Math.max(1, totalSeconds / Math.max(1, lines.length));
  const markCompletedRef = useRef<() => void>(() => {});
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
    onComplete: () => markCompletedRef.current(),
  });

  elapsedRef.current = elapsed;

  const markCompleted = useCallback(() => {
    completedRef.current = true;
    onComplete?.({
      elapsedSec: elapsedRef.current,
      durationBudgetSec: totalSeconds,
    });
  }, [completedRef, onComplete, totalSeconds]);

  const handleAbandon = useCallback(() => {
    onAbandon?.({
      elapsedSec: elapsedRef.current,
      durationBudgetSec: totalSeconds,
    });
  }, [onAbandon, totalSeconds]);

  useEffect(() => {
    markCompletedRef.current = markCompleted;
  }, [markCompleted]);

  useWidgetAbandonGuard(hasStartedRef, completedRef, handleAbandon);

  const idx = completed ? lines.length - 1 : Math.min(Math.floor(elapsed / segmentSec), lines.length - 1);
  const segmentElapsed = Math.min(segmentSec, Math.max(0, elapsed - idx * segmentSec));
  const progress = elapsed / totalSeconds;
  const formatTime = (s: number) => {
    const sec = Math.max(0, Math.floor(s));
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center space-y-6 py-4">
      {!hideTitle && (
        <div className="flex items-center gap-2 text-neural-label">
          <Stars size={14} className="text-primary" />
          <span className="text-xs uppercase tracking-[0.3em]">{title}</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center max-w-sm">{t("toolbox.affirmHint")}</p>

      <div className="relative min-h-[8rem] w-full max-w-md flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <motion.p
            key={`${idx}-${completed}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="text-center text-lg text-foreground font-medium leading-relaxed"
          >
            « {lines[idx]} »
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="w-full max-w-xs h-1 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full bg-primary/50 transition-all duration-1000" style={{ width: `${progress * 100}%` }} />
      </div>

      <p className="text-neural-label text-xs text-center leading-relaxed">
        {completed ? (
          t("toolbox.affirmDone")
        ) : (
          <>
            {formatTime(segmentElapsed)} / {formatTime(segmentSec)} · {idx + 1}/{lines.length}
            <span className="block text-[10px] text-muted-foreground/70 mt-1">
              {formatTime(elapsed)} / {formatTime(totalSeconds)} {t("toolbox.affirmTotalSuffix")}
            </span>
          </>
        )}
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={toggleRunning}
          className="w-12 h-12 rounded-2xl border border-primary/30 bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
          disabled={completed}
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          type="button"
          onClick={reset}
          className="w-12 h-12 rounded-2xl border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
