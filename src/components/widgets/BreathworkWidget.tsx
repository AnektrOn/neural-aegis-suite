import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Wind } from "lucide-react";

interface BreathworkConfig {
  cycles: number;
  breath_in_sec: number;
  pause1_sec: number;
  breath_out_sec: number;
  pause2_sec: number;
}

interface Props {
  config: BreathworkConfig;
  title: string;
}

type Phase = "breath_in" | "pause1" | "breath_out" | "pause2";

const PHASE_LABELS: Record<Phase, string> = {
  breath_in: "Inspirez",
  pause1: "Retenez",
  breath_out: "Expirez",
  pause2: "Retenez",
};

const PHASE_COLORS: Record<Phase, string> = {
  breath_in: "hsl(176 70% 48%)",
  pause1: "hsl(270 50% 60%)",
  breath_out: "hsl(35 80% 58%)",
  pause2: "hsl(270 50% 60%)",
};

export default function BreathworkWidget({ config, title }: Props) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<Phase>("breath_in");
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
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

  const reset = useCallback(() => {
    setIsRunning(false);
    setCurrentCycle(0);
    setCurrentPhase("breath_in");
    setPhaseProgress(0);
    setCompleted(false);
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
          // Move to next phase
          const currentIdx = phases.findIndex(p => p.phase === currentPhase);
          const nextIdx = currentIdx + 1;
          if (nextIdx < phases.length) {
            setCurrentPhase(phases[nextIdx].phase);
          } else {
            // End of cycle
            const nextCycle = currentCycle + 1;
            if (nextCycle >= config.cycles) {
              setIsRunning(false);
              setCompleted(true);
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

  // Breathing circle scale: expand on inhale, contract on exhale
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

  return (
    <div className="flex flex-col items-center space-y-6 py-4">
      <div className="flex items-center gap-2 text-neural-label">
        <Wind size={14} className="text-primary" />
        <span className="text-xs uppercase tracking-[0.3em]">{title}</span>
      </div>

      {/* Breathing circle */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${PHASE_COLORS[currentPhase]}15 0%, transparent 70%)`,
          }}
          animate={{ scale: getScale() }}
          transition={{ duration: 0.05, ease: "linear" }}
        />

        {/* Main circle */}
        <motion.div
          className="w-32 h-32 rounded-full border-2 flex items-center justify-center"
          style={{
            borderColor: PHASE_COLORS[currentPhase],
            boxShadow: isRunning ? `0 0 30px ${PHASE_COLORS[currentPhase]}40, inset 0 0 20px ${PHASE_COLORS[currentPhase]}10` : "none",
          }}
          animate={{ scale: getScale() }}
          transition={{ duration: 0.05, ease: "linear" }}
        >
          <div className="text-center">
            {completed ? (
              <p className="text-sm font-medium text-primary">Terminé ✦</p>
            ) : isRunning ? (
              <>
                <p className="text-lg font-cinzel" style={{ color: PHASE_COLORS[currentPhase] }}>
                  {PHASE_LABELS[currentPhase]}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.ceil(currentPhaseDuration - phaseProgress * currentPhaseDuration)}s
                </p>
              </>
            ) : (
              <Wind size={24} className="text-primary/40" />
            )}
          </div>
        </motion.div>

        {/* Phase dots around the circle */}
        {phases.map((p, i) => {
          const angle = (i / phases.length) * Math.PI * 2 - Math.PI / 2;
          const cx = 96 + Math.cos(angle) * 88;
          const cy = 96 + Math.sin(angle) * 88;
          const isActive = currentPhase === p.phase;
          return (
            <div key={p.phase} className="absolute w-3 h-3 rounded-full transition-all duration-300"
              style={{
                left: cx - 6, top: cy - 6,
                backgroundColor: isActive ? PHASE_COLORS[p.phase] : `${PHASE_COLORS[p.phase]}30`,
                boxShadow: isActive ? `0 0 8px ${PHASE_COLORS[p.phase]}80` : "none",
              }} />
          );
        })}
      </div>

      {/* Progress info */}
      <div className="text-center space-y-1">
        <p className="text-sm text-foreground font-medium">
          Cycle {Math.min(currentCycle + 1, config.cycles)} / {config.cycles}
        </p>
        <p className="text-neural-label">{formatTime(elapsed)} / {formatTime(totalTime)}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs h-1 rounded-full bg-secondary overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: PHASE_COLORS[currentPhase] }}
          animate={{ width: `${Math.min((elapsed / totalTime) * 100, 100)}%` }}
          transition={{ duration: 0.1 }} />
      </div>

      {/* Controls */}
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

      {/* Cycle pattern legend */}
      <div className="flex items-center gap-3 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>In {config.breath_in_sec}s</span>
        {config.pause1_sec > 0 && <span>Hold {config.pause1_sec}s</span>}
        <span>Out {config.breath_out_sec}s</span>
        {config.pause2_sec > 0 && <span>Hold {config.pause2_sec}s</span>}
      </div>
    </div>
  );
}
