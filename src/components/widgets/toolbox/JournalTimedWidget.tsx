import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, PenLine, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useWidgetAbandonGuard } from "@/hooks/useWidgetAbandonGuard";
import { usePersistedExerciseTimer } from "@/hooks/usePersistedExerciseTimer";
import { loadTimerSession } from "@/lib/toolbox-session-storage";
import { playToolboxTimerCompleteSound } from "@/lib/toolbox-timer-sound";

export interface JournalTimedConfig {
  prompt?: string;
  duration_sec?: number;
  accent_color?: string;
}

interface Props {
  config: JournalTimedConfig;
  title: string;
  hideTitle?: boolean;
  sessionKey?: string;
  onComplete?: () => void;
  onAbandon?: () => void;
}

const DEFAULT_ACCENT = "hsl(220 70% 60%)";

export default function JournalTimedWidget({
  config,
  title,
  hideTitle,
  sessionKey,
  onComplete,
  onAbandon,
}: Props) {
  const { t } = useLanguage();
  const accent = config.accent_color || DEFAULT_ACCENT;
  const totalSec = Math.max(60, config.duration_sec ?? 600);
  const [body, setBody] = useState("");
  const [started, setStarted] = useState(() => {
    if (!sessionKey) return false;
    const saved = loadTimerSession(sessionKey);
    return Boolean(saved && !saved.completed && (saved.accumulatedSec > 0 || saved.runningSince !== null));
  });
  const completedRef = useRef(false);
  const touchedRef = useRef(false);

  const timer = usePersistedExerciseTimer({
    sessionKey,
    totalSeconds: totalSec,
    onComplete: () => {
      playToolboxTimerCompleteSound();
    },
  });

  const { elapsedSec: elapsed, isRunning: running, toggleRunning, reset: resetTimer } = timer;

  const remaining = Math.max(0, totalSec - elapsed);
  const progress = Math.min(elapsed / totalSec, 1);

  useWidgetAbandonGuard(touchedRef, completedRef, onAbandon);

  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const submit = useCallback(() => {
    if (!body.trim()) return;
    completedRef.current = true;
    onComplete?.();
  }, [body, onComplete]);

  const reset = () => {
    resetTimer();
    setBody("");
    setStarted(false);
    completedRef.current = false;
    touchedRef.current = false;
  };

  const start = () => {
    setStarted(true);
    touchedRef.current = true;
    timer.setRunning(true);
  };

  return (
    <motion.div
      className="flex flex-col items-center space-y-5 py-4 max-w-lg mx-auto w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {!hideTitle && (
        <div className="flex items-center gap-2 text-neural-label">
          <PenLine size={14} style={{ color: accent }} />
          <span className="text-xs uppercase tracking-[0.3em]">{title}</span>
        </div>
      )}

      {config.prompt ? (
        <p className="text-sm text-center text-muted-foreground max-w-sm leading-relaxed">{config.prompt}</p>
      ) : null}

      <div className="w-full max-w-xs h-1 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress * 100}%`, backgroundColor: accent }}
        />
      </div>

      <p className="text-neural-label text-xs font-mono">{fmt(remaining)}</p>

      <textarea
        value={body}
        onChange={(e) => {
          touchedRef.current = true;
          setBody(e.target.value);
        }}
        rows={6}
        placeholder={t("toolbox.journalWriteHere")}
        className="w-full min-h-[140px] bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors resize-y"
      />

      <div className="flex gap-3">
        {!started ? (
          <button
            type="button"
            onClick={start}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border text-sm"
            style={{ borderColor: `${accent}55`, color: accent }}
          >
            <Play size={14} />
            {t("toolbox.launch")}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={toggleRunning}
              className="w-12 h-12 rounded-2xl border flex items-center justify-center"
              style={{ borderColor: `${accent}55`, color: accent }}
            >
              {running ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              type="button"
              onClick={reset}
              className="w-12 h-12 rounded-2xl border border-border/30 flex items-center justify-center text-muted-foreground"
            >
              <RotateCcw size={18} />
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!body.trim()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm disabled:opacity-40"
              style={{ borderColor: `${accent}55`, color: accent }}
            >
              <CheckCircle2 size={14} />
              {t("toolbox.widgetFinishJournal")}
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
