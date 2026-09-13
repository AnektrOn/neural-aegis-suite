import { useMemo } from "react";
import type { BreathworkConfig } from "@/components/widgets/BreathworkWidget";
import { useLanguage } from "@/i18n/LanguageContext";
import { resolveCyclicSequenceFromElapsed } from "@/lib/exercise-sequence-position";
import { usePersistedExerciseTimer } from "@/hooks/usePersistedExerciseTimer";
import {
  ToolboxNebulaOverlayControls,
  ToolboxNebulaOverlayHeader,
  ToolboxWidgetTimerControls,
  toolboxNebulaOverlayRootClass,
} from "@/features/toolbox/ui";
import { TOOLBOX_PHASE_COLORS } from "@/features/toolbox/ui/toolboxPhaseColors";
import { driveForMatterBreath } from "../toolboxMatterDrives";
import { useLiveCyclicPosition, useLiveElapsedSec } from "../useLiveExerciseElapsed";
import { useToolboxParticleDriveRef } from "../useToolboxParticleDriveRef";
import type { ToolboxNebulaPilotProps } from "./toolboxNebulaPilotTypes";
import { ToolboxMatterShell } from "./ToolboxMatterShell";
import type { ToolboxMatterDrive } from "./ToolboxMatterEngine";

type Phase = "breath_in" | "pause1" | "breath_out" | "pause2";

const PHASE_LABEL_KEYS: Record<
  Phase,
  "toolbox.breath.phase.in" | "toolbox.breath.phase.hold" | "toolbox.breath.phase.out"
> = {
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

interface Props extends Pick<ToolboxNebulaPilotProps, "embedded" | "variant" | "sessionKey" | "onComplete"> {
  config: BreathworkConfig;
  title: string;
}

export function ToolboxMatterBreathwork({
  config,
  title,
  embedded,
  variant = "panel",
  sessionKey,
  onComplete,
}: Props) {
  const { t } = useLanguage();

  const phases = useMemo(() => {
    const raw: { phase: Phase; duration: number }[] = [
      { phase: "breath_in", duration: config.breath_in_sec },
      { phase: "pause1", duration: config.pause1_sec },
      { phase: "breath_out", duration: config.breath_out_sec },
      { phase: "pause2", duration: config.pause2_sec },
    ];
    return raw.filter((p) => p.duration > 0);
  }, [config]);

  const cyclicPhases = useMemo(
    () => phases.map((p) => ({ phase: p.phase, durationSec: p.duration })),
    [phases],
  );

  const totalTime = phases.reduce((sum, p) => sum + p.duration, 0) * config.cycles;

  const {
    elapsedSec: elapsed,
    isRunning,
    completed,
    toggleRunning,
    reset,
  } = usePersistedExerciseTimer({
    totalSeconds: totalTime,
    sessionKey,
    onComplete: () => onComplete?.(),
  });

  const liveElapsedRef = useLiveElapsedSec(elapsed, isRunning, completed);
  const resolvePosition = useLiveCyclicPosition(liveElapsedRef, cyclicPhases, config.cycles);

  const sessionRef = useMemo(
    () => ({ isRunning, completed }),
    [isRunning, completed],
  );
  const sessionHotRef = useMemo(() => ({ current: sessionRef }), [sessionRef]);
  sessionHotRef.current = { isRunning, completed };

  const driveRef = useToolboxParticleDriveRef<ToolboxMatterDrive>(() => {
    const pos = resolvePosition();
    const active = sessionHotRef.current.isRunning && !sessionHotRef.current.completed;
    return driveForMatterBreath(pos.phase as Phase, pos.phaseProgress, active);
  });

  const position = useMemo(
    () => resolveCyclicSequenceFromElapsed(elapsed, cyclicPhases, config.cycles),
    [elapsed, cyclicPhases, config.cycles],
  );

  const currentPhase = position.phase as Phase;
  const currentPhaseDuration = phases.find((p) => p.phase === currentPhase)?.duration ?? 4;
  const remainingSec = Math.ceil(
    currentPhaseDuration - position.phaseProgress * currentPhaseDuration,
  );

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const meta = `${formatTime(elapsed)} / ${formatTime(totalTime)}${
    config.cycles > 1
      ? ` · ${t("toolbox.breath.cycle", { current: position.cycle, total: config.cycles })}`
      : ""
  }${isRunning ? ` · ${remainingSec}s` : ""}`;

  return (
    <ToolboxMatterShell embedded={embedded} variant={variant} driveRef={driveRef}>
      <div className={toolboxNebulaOverlayRootClass}>
        <ToolboxNebulaOverlayHeader
          title={title}
          headline={completed ? undefined : t(PHASE_LABEL_KEYS[currentPhase])}
          instruction={completed || !isRunning ? undefined : `${remainingSec}s`}
          meta={completed ? undefined : meta}
          completed={completed}
          completedLabel={t("toolbox.breath.done")}
        />

        <div
          className="mx-auto h-1.5 w-full max-w-[12rem] overflow-hidden rounded-full bg-border/30"
          aria-hidden
        >
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{
              width: `${Math.min(100, (elapsed / Math.max(totalTime, 1)) * 100)}%`,
              backgroundColor: PHASE_COLORS[currentPhase],
            }}
          />
        </div>

        <ToolboxNebulaOverlayControls>
          <ToolboxWidgetTimerControls
            isRunning={isRunning}
            onToggle={() => toggleRunning()}
            onReset={() => reset()}
            disabled={completed}
            playLabel={t("toolbox.launch")}
            pauseLabel={t("toolbox.pause")}
            resetLabel={t("toolbox.restart")}
          />
        </ToolboxNebulaOverlayControls>
      </div>
    </ToolboxMatterShell>
  );
}
