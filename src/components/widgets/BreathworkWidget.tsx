import { useState, useEffect, useCallback, useRef, useMemo, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Wind } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export interface BreathworkConfig {
  cycles: number;
  breath_in_sec: number;
  pause1_sec: number;
  breath_out_sec: number;
  pause2_sec: number;
  /** Optional coach copy (e.g. from gallery / proposals). */
  instructions?: string;
}

interface Props {
  config: BreathworkConfig;
  title: string;
  hideTitle?: boolean;
  onComplete?: () => void;
  onAbandon?: () => void;
  /** Box breathing: animated square path; default circle scales like classic guided breath. */
  visualVariant?: "circle" | "box";
}

type Phase = "breath_in" | "pause1" | "breath_out" | "pause2";

const PHASE_LABEL_KEYS: Record<Phase, "toolbox.breath.phase.in" | "toolbox.breath.phase.hold" | "toolbox.breath.phase.out"> = {
  breath_in: "toolbox.breath.phase.in",
  pause1: "toolbox.breath.phase.hold",
  breath_out: "toolbox.breath.phase.out",
  pause2: "toolbox.breath.phase.hold",
};

const PHASE_COLORS: Record<Phase, string> = {
  breath_in: "hsl(176 70% 48%)",
  pause1: "hsl(270 50% 60%)",
  breath_out: "hsl(35 80% 58%)",
  pause2: "hsl(270 50% 60%)",
};

export default function BreathworkWidget({
  config,
  title,
  hideTitle,
  onComplete,
  onAbandon,
  visualVariant = "circle",
}: Props) {
  const { t } = useLanguage();
  const [isRunning, setIsRunning] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<Phase>("breath_in");
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const hasStartedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phases: { phase: Phase; duration: number }[] = ([
    { phase: "breath_in" as Phase, duration: config.breath_in_sec },
    { phase: "pause1" as Phase, duration: config.pause1_sec },
    { phase: "breath_out" as Phase, duration: config.breath_out_sec },
    { phase: "pause2" as Phase, duration: config.pause2_sec },
  ] as { phase: Phase; duration: number }[]).filter(p => p.duration > 0);

  const currentPhaseDuration = phases.find(p => p.phase === currentPhase)?.duration || 4;
  const totalCycleTime = phases.reduce((sum, p) => sum + p.duration, 0);
  const totalTime = totalCycleTime * config.cycles;

  const elapsed = currentCycle * totalCycleTime + 
    phases.slice(0, phases.findIndex(p => p.phase === currentPhase)).reduce((s, p) => s + p.duration, 0) +
    phaseProgress * currentPhaseDuration;

  // Track that user started the exercise
  useEffect(() => {
    if (isRunning && !hasStartedRef.current) {
      hasStartedRef.current = true;
    }
  }, [isRunning]);

  // Notify parent on abandon (unmount while started but not completed)
  useEffect(() => {
    return () => {
      if (hasStartedRef.current && !completed) {
        onAbandon?.();
      }
    };
  }, []); // intentionally empty — cleanup only

  const reset = useCallback(() => {
    setIsRunning(false);
    setCurrentCycle(0);
    setCurrentPhase("breath_in");
    setPhaseProgress(0);
    setCompleted(false);
    hasStartedRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const tickMs = 50;
    intervalRef.current = setInterval(() => {
      setPhaseProgress(prev => {
        const next = prev + tickMs / (currentPhaseDuration * 1000);
        if (next >= 1) {
          const currentIdx = phases.findIndex(p => p.phase === currentPhase);
          const nextIdx = currentIdx + 1;
          if (nextIdx < phases.length) {
            setCurrentPhase(phases[nextIdx].phase);
          } else {
            const nextCycle = currentCycle + 1;
            if (nextCycle >= config.cycles) {
              setIsRunning(false);
              setCompleted(true);
              onComplete?.();
              return 1;
            }
            setCurrentCycle(nextCycle);
            setCurrentPhase(phases[0].phase);
          }
          return 0;
        }
        return next;
      });
    }, tickMs);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, currentPhase, currentCycle, currentPhaseDuration, config.cycles, phases]);

  const getScale = () => {
    if (!isRunning && !completed) return 1;
    switch (currentPhase) {
      case "breath_in": return 1 + phaseProgress * 0.6;
      case "pause1": return 1.6;
      case "breath_out": return 1.6 - phaseProgress * 0.6;
      case "pause2": return 1;
      default: return 1;
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const boxDotPosition = useMemo((): CSSProperties => {
    const inset = 9;
    const span = 100 - 2 * inset;
    const p = phaseProgress;
    switch (currentPhase) {
      case "breath_in":
        return {
          left: `${inset + p * span}%`,
          top: `${inset}%`,
          transform: "translate(-50%, -50%)",
        };
      case "pause1":
        return {
          left: `${100 - inset}%`,
          top: `${inset + p * span}%`,
          transform: "translate(-50%, -50%)",
        };
      case "breath_out":
        return {
          left: `${100 - inset - p * span}%`,
          top: `${100 - inset}%`,
          transform: "translate(-50%, -50%)",
        };
      case "pause2":
        return {
          left: `${inset}%`,
          top: `${100 - inset - p * span}%`,
          transform: "translate(-50%, -50%)",
        };
      default:
        return { left: `${inset}%`, top: `${inset}%`, transform: "translate(-50%, -50%)" };
    }
  }, [currentPhase, phaseProgress]);

  const phaseCaption = (
    <>
      {completed ? (
        <p className="text-sm font-medium text-primary">{t("toolbox.breath.done")}</p>
      ) : isRunning ? (
        <>
          <p
            className={visualVariant === "box" ? "text-base font-cinzel font-medium" : "text-lg font-cinzel"}
            style={{ color: PHASE_COLORS[currentPhase] }}
          >
            {t(PHASE_LABEL_KEYS[currentPhase])}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {Math.ceil(currentPhaseDuration - phaseProgress * currentPhaseDuration)}s
          </p>
        </>
      ) : (
        <Wind size={visualVariant === "box" ? 22 : 24} className="text-primary/40 mx-auto" />
      )}
    </>
  );

  return (
    <div className="flex flex-col items-center space-y-6 py-4">
      {!hideTitle && (
        <div className="flex items-center gap-2 text-neural-label">
          <Wind size={14} className="text-primary" />
          <span className="text-xs uppercase tracking-[0.3em]">{title}</span>
        </div>
      )}
      {config.instructions?.trim() ? (
        <p className="max-w-sm px-2 text-center text-xs leading-relaxed text-muted-foreground">{config.instructions}</p>
      ) : null}

      {visualVariant === "box" ? (
        <div className="relative w-52 h-52 flex items-center justify-center">
          <motion.div
            className="absolute inset-[8%] rounded-[24%] border-2"
            style={{
              borderColor: `${PHASE_COLORS[currentPhase]}aa`,
              boxShadow: isRunning
                ? `0 0 32px ${PHASE_COLORS[currentPhase]}38, inset 0 0 28px ${PHASE_COLORS[currentPhase]}14`
                : `inset 0 0 0 1px ${PHASE_COLORS[currentPhase]}22`,
            }}
            animate={{
              scale: getScale(),
            }}
            transition={{ duration: 0.06, ease: "linear" }}
          />
          <motion.div
            className="absolute z-10 h-3 w-3 rounded-full"
            style={{
              ...boxDotPosition,
              backgroundColor: PHASE_COLORS[currentPhase],
              boxShadow: `0 0 16px ${PHASE_COLORS[currentPhase]}`,
            }}
            transition={{ duration: 0.05, ease: "linear" }}
          />
          <div className="relative z-[5] max-w-[10rem] px-3 text-center pointer-events-none">
            {phaseCaption}
          </div>
        </div>
      ) : (
        <div className="relative flex h-48 w-48 items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: `radial-gradient(circle, ${PHASE_COLORS[currentPhase]}15 0%, transparent 70%)` }}
            animate={{ scale: getScale() }}
            transition={{ duration: 0.05, ease: "linear" }}
          />
          <motion.div
            className="flex h-32 w-32 items-center justify-center rounded-full border-2"
            style={{
              borderColor: PHASE_COLORS[currentPhase],
              boxShadow: isRunning ? `0 0 30px ${PHASE_COLORS[currentPhase]}40, inset 0 0 20px ${PHASE_COLORS[currentPhase]}10` : "none",
            }}
            animate={{ scale: getScale() }}
            transition={{ duration: 0.05, ease: "linear" }}
          >
            <div className="text-center">{phaseCaption}</div>
          </motion.div>

          {phases.map((p, i) => {
            const angle = (i / phases.length) * Math.PI * 2 - Math.PI / 2;
            const cx = 96 + Math.cos(angle) * 88;
            const cy = 96 + Math.sin(angle) * 88;
            const isActive = currentPhase === p.phase;
            return (
              <div
                key={p.phase}
                className="absolute h-3 w-3 rounded-full transition-all duration-300"
                style={{
                  left: cx - 6,
                  top: cy - 6,
                  backgroundColor: isActive ? PHASE_COLORS[p.phase] : `${PHASE_COLORS[p.phase]}30`,
                  boxShadow: isActive ? `0 0 8px ${PHASE_COLORS[p.phase]}80` : "none",
                }}
              />
            );
          })}
        </div>
      )}

      <div className="text-center space-y-1">
        <p className="text-sm text-foreground font-medium">
          {t("toolbox.breath.cycle", { current: Math.min(currentCycle + 1, config.cycles), total: config.cycles })}
        </p>
        <p className="text-neural-label">{formatTime(elapsed)} / {formatTime(totalTime)}</p>
      </div>

      <div className="w-full max-w-xs h-1 rounded-full bg-secondary overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: PHASE_COLORS[currentPhase] }}
          animate={{ width: `${Math.min((elapsed / totalTime) * 100, 100)}%` }}
          transition={{ duration: 0.1 }} />
      </div>

      <div className="flex gap-3">
        <button onClick={() => setIsRunning(!isRunning)}
          className="w-12 h-12 rounded-2xl border border-primary/30 bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors glow-node"
          disabled={completed}>
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button onClick={reset}
          className="w-12 h-12 rounded-2xl border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="flex items-center gap-3 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>{t("toolbox.breath.legendIn", { n: config.breath_in_sec })}</span>
        {config.pause1_sec > 0 && <span>{t("toolbox.breath.legendHold", { n: config.pause1_sec })}</span>}
        <span>{t("toolbox.breath.legendOut", { n: config.breath_out_sec })}</span>
        {config.pause2_sec > 0 && <span>{t("toolbox.breath.legendHold", { n: config.pause2_sec })}</span>}
      </div>
    </div>
  );
}
