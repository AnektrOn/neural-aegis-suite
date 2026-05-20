import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, PenLine, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export interface JournalTimedConfig {
  prompt?: string;
  duration_sec?: number;
  accent_color?: string;
}

interface Props {
  config: JournalTimedConfig;
  title: string;
  hideTitle?: boolean;
  onComplete?: () => void;
  onAbandon?: () => void;
}

const DEFAULT_ACCENT = "hsl(220 70% 60%)";

export default function JournalTimedWidget({
  config,
  title,
  hideTitle,
  onComplete,
  onAbandon,
}: Props) {
  const { t } = useLanguage();
  const accent = config.accent_color || DEFAULT_ACCENT;
  const totalSec = Math.max(60, config.duration_sec ?? 600);
  const [body, setBody] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const completedRef = useRef(false);
  const touchedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const remaining = Math.max(0, totalSec - elapsed);
  const progress = Math.min(elapsed / totalSec, 1);

  useEffect(() => {
    return () => {
      if (touchedRef.current && !completedRef.current) onAbandon?.();
    };
  }, [onAbandon]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= totalSec) {
          setRunning(false);
          return totalSec;
        }
        return next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, totalSec]);

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
    setBody("");
    setElapsed(0);
    setRunning(false);
    setStarted(false);
    completedRef.current = false;
    touchedRef.current = false;
  };

  const circumference = 2 * Math.PI * 52;

  return (
    <motion.div
      className="flex flex-col items-center space-y-5 py-4 max-w-lg mx-auto w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {!hideTitle && (
        <motion.div
          className="flex items-center gap-2 text-neural-label"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <PenLine size={14} style={{ color: accent }} />
          <span className="text-xs uppercase tracking-[0.3em]">{title}</span>
        </motion.div>
      )}

      {config.prompt ? (
        <p
          className="text-sm text-center leading-relaxed px-2"
          style={{ color: `color-mix(in srgb, ${accent} 85%, var(--foreground))` }}
        >
          {config.prompt}
        </p>
      ) : null}

      <motion.div
        className="relative w-36 h-36"
        animate={running ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" className="text-secondary" strokeWidth="4" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={accent}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ transition: "stroke-dashoffset 0.5s linear" }}
          />
        </svg>
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          key={remaining}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-2xl font-cinzel tabular-nums" style={{ color: accent }}>
            {fmt(remaining)}
          </span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
            {running ? t("toolbox.journalTimed.writing") : started ? t("toolbox.pause") : ""}
          </span>
        </motion.div>
      </motion.div>

      <textarea
        value={body}
        onChange={(e) => {
          touchedRef.current = true;
          setBody(e.target.value);
        }}
        rows={6}
        disabled={!started}
        placeholder={t("toolbox.journalTimed.placeholder")}
        className="w-full min-h-[120px] rounded-xl border bg-background/50 px-4 py-3 text-sm resize-y disabled:opacity-50"
        style={{ borderColor: `color-mix(in srgb, ${accent} 30%, transparent)` }}
      />

      <motion.div className="flex gap-3" layout>
        {!started ? (
          <button
            type="button"
            onClick={() => {
              setStarted(true);
              setRunning(true);
              touchedRef.current = true;
            }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-medium"
            style={{
              background: `color-mix(in srgb, ${accent} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${accent} 35%, transparent)`,
              color: accent,
            }}
          >
            <Play size={14} />
            {t("toolbox.journalTimed.start")}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setRunning(!running)}
              className="w-12 h-12 rounded-2xl border flex items-center justify-center"
              style={{
                borderColor: `color-mix(in srgb, ${accent} 40%, transparent)`,
                color: accent,
              }}
            >
              {running ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!body.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium disabled:opacity-40"
              style={{
                border: `1px solid color-mix(in srgb, ${accent} 40%, transparent)`,
                color: accent,
              }}
            >
              <CheckCircle2 size={14} />
              {t("toolbox.markDone")}
            </button>
            <button type="button" onClick={reset} className="w-12 h-12 rounded-2xl border border-border/30 text-muted-foreground">
              <RotateCcw size={18} />
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
