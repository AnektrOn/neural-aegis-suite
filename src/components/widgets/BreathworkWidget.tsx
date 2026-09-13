import { useMemo, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { Wind } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { resolveCyclicSequenceFromElapsed } from "@/lib/exercise-sequence-position";
import { usePersistedExerciseTimer } from "@/hooks/usePersistedExerciseTimer";
import { useWidgetAbandonGuard } from "@/hooks/useWidgetAbandonGuard";
import {
  TOOLBOX_PHASE_COLORS,
  ToolboxWidgetHeader,
  ToolboxWidgetInstructions,
  ToolboxWidgetProgress,
  ToolboxWidgetRoot,
  ToolboxWidgetTimerControls,
  hslWithAlpha,
} from "@/features/toolbox/ui";

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
  sessionKey?: string;
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
  breath_in: TOOLBOX_PHASE_COLORS.inhale,
  pause1: TOOLBOX_PHASE_COLORS.hold,
  breath_out: TOOLBOX_PHASE_COLORS.exhale,
  pause2: TOOLBOX_PHASE_COLORS.hold,
};

export default function BreathworkWidget({
  config,
  title,
  hideTitle,
  sessionKey,
  onComplete,
  onAbandon,
  visualVariant = "circle",
}: Props) {
  const { t } = useLanguage();

  const phases: { phase: Phase; duration: number }[] = ([
    { phase: "breath_in" as Phase, duration: config.breath_in_sec },
    { phase: "pause1" as Phase, duration: config.pause1_sec },
    { phase: "breath_out" as Phase, duration: config.breath_out_sec },
    { phase: "pause2" as Phase, duration: config.pause2_sec },
  ] as { phase: Phase; duration: number }[]).filter(p => p.duration > 0);

  const cyclicPhases = useMemo(
    () => phases.map((p) => ({ phase: p.phase, durationSec: p.duration })),
    [phases],
  );

  const totalCycleTime = phases.reduce((sum, p) => sum + p.duration, 0);
  const totalTime = totalCycleTime * config.cycles;

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
    totalSeconds: totalTime,
    onComplete,
  });

  useWidgetAbandonGuard(hasStartedRef, completedRef, onAbandon);

  const position = useMemo(
    () => resolveCyclicSequenceFromElapsed(elapsed, cyclicPhases, config.cycles),
    [elapsed, cyclicPhases, config.cycles],
  );

  const currentCycle = position.cycle;
  const currentPhase = position.phase;
  const phaseProgress = position.phaseProgress;
  const currentPhaseDuration = phases.find(p => p.phase === currentPhase)?.duration || 4;

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
    <ToolboxWidgetRoot className="items-center">
      {!hideTitle ? (
        <ToolboxWidgetHeader title={title} icon={Wind} iconClassName="text-primary" />
      ) : null}
      <ToolboxWidgetInstructions>{config.instructions?.trim() ? config.instructions : null}</ToolboxWidgetInstructions>

      {visualVariant === "box" ? (
        <div className="relative w-52 h-52 flex items-center justify-center">
          <motion.div
            className="absolute inset-[8%] rounded-[24%] border-2"
            style={{
              borderColor: hslWithAlpha(PHASE_COLORS[currentPhase], 0.65),
              boxShadow: isRunning
                ? `0 0 32px ${hslWithAlpha(PHASE_COLORS[currentPhase], 0.22)}, inset 0 0 28px ${hslWithAlpha(PHASE_COLORS[currentPhase], 0.08)}`
                : `inset 0 0 0 1px ${hslWithAlpha(PHASE_COLORS[currentPhase], 0.13)}`,
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
            style={{ background: `radial-gradient(circle, ${hslWithAlpha(PHASE_COLORS[currentPhase], 0.15)} 0%, transparent 70%)` }}
            animate={{ scale: getScale() }}
            transition={{ duration: 0.05, ease: "linear" }}
          />
          <motion.div
            className="flex h-32 w-32 items-center justify-center rounded-full border-2"
            style={{
              borderColor: PHASE_COLORS[currentPhase],
              boxShadow: isRunning ? `0 0 30px ${hslWithAlpha(PHASE_COLORS[currentPhase], 0.25)}, inset 0 0 20px ${hslWithAlpha(PHASE_COLORS[currentPhase], 0.06)}` : "none",
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
                  backgroundColor: isActive ? PHASE_COLORS[p.phase] : hslWithAlpha(PHASE_COLORS[p.phase], 0.3),
                  boxShadow: isActive ? `0 0 8px ${hslWithAlpha(PHASE_COLORS[p.phase], 0.5)}` : "none",
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

      <ToolboxWidgetProgress
        className="max-w-xs"
        value={elapsed}
        max={totalTime}
        accentColor={PHASE_COLORS[currentPhase]}
      />

      <ToolboxWidgetTimerControls
        isRunning={isRunning}
        onToggle={toggleRunning}
        onReset={reset}
        disabled={completed}
        playLabel={t("toolbox.launch")}
        pauseLabel={t("toolbox.pause")}
        resetLabel="Reset"
      />

      <div className="flex items-center gap-3 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>{t("toolbox.breath.legendIn", { n: config.breath_in_sec })}</span>
        {config.pause1_sec > 0 && <span>{t("toolbox.breath.legendHold", { n: config.pause1_sec })}</span>}
        <span>{t("toolbox.breath.legendOut", { n: config.breath_out_sec })}</span>
        {config.pause2_sec > 0 && <span>{t("toolbox.breath.legendHold", { n: config.pause2_sec })}</span>}
      </div>
    </ToolboxWidgetRoot>
  );
}
