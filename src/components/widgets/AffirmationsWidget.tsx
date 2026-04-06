import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Stars } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  config: { duration_min: number; affirmations?: string[] };
  title: string;
  onComplete?: () => void;
  onAbandon?: () => void;
}

export default function AffirmationsWidget({ config, title, onComplete, onAbandon }: Props) {
  const { t } = useLanguage();
  const raw = config.affirmations?.filter((a) => a.trim()) ?? [];
  const lines = raw.length > 0 ? raw : [t("toolbox.affirmFallback")];

  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const hasStartedRef = useRef(false);
  const completedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSeconds = Math.max(1, config.duration_min * 60);
  const segment = totalSeconds / lines.length;
  const idx = completed ? lines.length - 1 : Math.min(Math.floor(elapsed / segment), lines.length - 1);

  useEffect(() => {
    if (isRunning && !hasStartedRef.current) hasStartedRef.current = true;
  }, [isRunning]);

  useEffect(() => {
    return () => {
      if (hasStartedRef.current && !completedRef.current) onAbandon?.();
    };
  }, []);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= totalSeconds) {
          setIsRunning(false);
          setCompleted(true);
          completedRef.current = true;
          onComplete?.();
          return totalSeconds;
        }
        return prev + 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, totalSeconds, onComplete]);

  const reset = () => {
    setIsRunning(false);
    setElapsed(0);
    setCompleted(false);
    completedRef.current = false;
    hasStartedRef.current = false;
  };

  const progress = elapsed / totalSeconds;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center space-y-6 py-4">
      <div className="flex items-center gap-2 text-neural-label">
        <Stars size={14} className="text-primary" />
        <span className="text-xs uppercase tracking-[0.3em]">{title}</span>
      </div>

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

      <p className="text-neural-label text-xs">
        {completed ? t("toolbox.affirmDone") : `${formatTime(elapsed)} / ${formatTime(totalSeconds)} · ${idx + 1}/${lines.length}`}
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setIsRunning(!isRunning)}
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
