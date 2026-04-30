import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Eye } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  config: { duration_min: number; intention: string };
  title: string;
  onComplete?: () => void;
  onAbandon?: () => void;
}

export default function FocusIntrospectifWidget({ config, title, onComplete, onAbandon }: Props) {
  const { t } = useLanguage();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const hasStartedRef = useRef(false);
  const completedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSeconds = config.duration_min * 60;

  useEffect(() => {
    if (isRunning && !hasStartedRef.current) {
      hasStartedRef.current = true;
    }
  }, [isRunning]);

  // Notify parent on abandon (unmount while started but not completed)
  useEffect(() => {
    return () => {
      if (hasStartedRef.current && !completedRef.current) {
        onAbandon?.();
      }
    };
  }, []);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
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
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, totalSeconds]);

  const reset = () => {
    setIsRunning(false);
    setElapsed(0);
    setCompleted(false);
    completedRef.current = false;
    hasStartedRef.current = false;
  };

  const remaining = totalSeconds - elapsed;
  const progress = elapsed / totalSeconds;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const pulseScale = isRunning ? 1 + Math.sin(elapsed * 0.3) * 0.08 : 1;

  return (
    <div className="flex flex-col items-center space-y-6 py-4">
      <div className="flex items-center gap-2 text-neural-label">
        <Eye size={14} className="text-neural-accent" />
        <span className="text-xs uppercase tracking-[0.3em]">{title}</span>
      </div>

      <p className="text-sm text-foreground/80 italic text-center max-w-sm">
        « {config.intention} »
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
              <p className="text-xs text-muted-foreground mt-1">{t("toolbox.focus.minutesDone", { n: config.duration_min })}</p>
            </div>
          ) : (
            <div>
              <p className="text-2xl font-cinzel text-foreground">{formatTime(remaining)}</p>
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
        <button onClick={() => setIsRunning(!isRunning)}
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
