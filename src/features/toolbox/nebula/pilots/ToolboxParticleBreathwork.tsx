import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { BreathworkConfig } from "@/components/widgets/BreathworkWidget";
import { useLanguage } from "@/i18n/LanguageContext";
import { resolveCyclicSequenceFromElapsed } from "@/lib/exercise-sequence-position";
import { usePersistedExerciseTimer } from "@/hooks/usePersistedExerciseTimer";
import {
  ToolboxNebulaOptionPills,
  ToolboxNebulaOverlayHeader,
  ToolboxWidgetTimerControls,
  toolboxNebulaOverlayRootClass,
  toolboxNebulaOverlayTextShadowClass,
} from "@/features/toolbox/ui";
import {
  BREATHING_ORB_PATTERNS,
  breathOrbExpansion,
  detectBreathingOrbPattern,
  type BreathingOrbPatternId,
  type OrbBreathPhase,
} from "../breathingOrbPatterns";
import { useLiveCyclicPosition, useLiveElapsedSec } from "../useLiveExerciseElapsed";
import { useToolboxParticleDriveRef } from "../useToolboxParticleDriveRef";
import type { ToolboxNebulaPilotProps } from "./toolboxNebulaPilotTypes";
import {
  ToolboxBreathingOrbEngine,
  type BreathingOrbDrive,
} from "./ToolboxBreathingOrbEngine";
import { ToolboxOverlayChrome } from "./ToolboxOverlayChrome";

type Phase = OrbBreathPhase;

const PHASE_LABEL_KEYS: Record<
  Phase,
  "toolbox.breath.phase.in" | "toolbox.breath.phase.hold" | "toolbox.breath.phase.out"
> = {
  breath_in: "toolbox.breath.phase.in",
  pause1: "toolbox.breath.phase.hold",
  breath_out: "toolbox.breath.phase.out",
  pause2: "toolbox.breath.phase.hold",
};

interface Props extends Pick<ToolboxNebulaPilotProps, "embedded" | "variant" | "sessionKey" | "onComplete"> {
  config: BreathworkConfig;
  title: string;
}

export function ToolboxParticleBreathwork({
  config: initialConfig,
  title,
  embedded,
  variant = "panel",
  sessionKey,
  onComplete,
}: Props) {
  const { t } = useLanguage();
  const [activeConfig, setActiveConfig] = useState(initialConfig);
  const [activePattern, setActivePattern] = useState<BreathingOrbPatternId | null>(() =>
    detectBreathingOrbPattern(initialConfig),
  );

  const phases = useMemo(() => {
    const raw: { phase: Phase; duration: number }[] = [
      { phase: "breath_in", duration: activeConfig.breath_in_sec },
      { phase: "pause1", duration: activeConfig.pause1_sec },
      { phase: "breath_out", duration: activeConfig.breath_out_sec },
      { phase: "pause2", duration: activeConfig.pause2_sec },
    ];
    return raw.filter((p) => p.duration > 0);
  }, [activeConfig]);

  const cyclicPhases = useMemo(
    () => phases.map((p) => ({ phase: p.phase, durationSec: p.duration })),
    [phases],
  );

  const totalTime = phases.reduce((sum, p) => sum + p.duration, 0) * activeConfig.cycles;

  const {
    elapsedSec: elapsed,
    isRunning,
    completed,
    toggleRunning,
    reset,
  } = usePersistedExerciseTimer({
    totalSeconds: totalTime,
    sessionKey: sessionKey ?? `toolbox-breath-orb-${activePattern ?? "custom"}`,
    onComplete: () => onComplete?.(),
  });

  const liveElapsedRef = useLiveElapsedSec(elapsed, isRunning, completed);
  const resolvePosition = useLiveCyclicPosition(
    liveElapsedRef,
    cyclicPhases,
    activeConfig.cycles,
  );

  const sessionRef = useMemo(() => ({ isRunning, completed }), [isRunning, completed]);
  const sessionHotRef = useMemo(() => ({ current: sessionRef }), [sessionRef]);
  sessionHotRef.current = { isRunning, completed };

  const driveRef = useToolboxParticleDriveRef<BreathingOrbDrive>(() => {
    const pos = resolvePosition();
    const active = sessionHotRef.current.isRunning && !sessionHotRef.current.completed;
    const breath = active
      ? breathOrbExpansion(pos.phase as Phase, pos.phaseProgress)
      : breathOrbExpansion("pause2", 1);
    return { breath };
  });

  const position = useMemo(
    () => resolveCyclicSequenceFromElapsed(elapsed, cyclicPhases, activeConfig.cycles),
    [elapsed, cyclicPhases, activeConfig.cycles],
  );

  const currentPhase = position.phase as Phase;
  const currentPhaseDuration = phases.find((p) => p.phase === currentPhase)?.duration ?? 4;
  const remainingSec = Math.max(
    1,
    Math.ceil(currentPhaseDuration - position.phaseProgress * currentPhaseDuration),
  );

  const selectPattern = (id: string) => {
    const patternId = id as BreathingOrbPatternId;
    setActivePattern(patternId);
    setActiveConfig(BREATHING_ORB_PATTERNS[patternId].config);
    reset();
  };

  const patternOptions = (Object.keys(BREATHING_ORB_PATTERNS) as BreathingOrbPatternId[]).map(
    (id) => ({
      id,
      label: BREATHING_ORB_PATTERNS[id].label,
    }),
  );

  const frameClass = cn(
    "relative overflow-hidden bg-[#05070d]",
    variant === "modal"
      ? "h-full min-h-[100dvh] rounded-none"
      : cn(
          "rounded-xl border border-border/20",
          embedded ? "min-h-[min(52dvh,520px)]" : "min-h-[min(72dvh,680px)]",
        ),
  );

  const showCenterGuide = isRunning && !completed;

  return (
    <div className={frameClass}>
      <ToolboxBreathingOrbEngine driveRef={driveRef} className="absolute inset-0 h-full w-full">
        {showCenterGuide ? (
          <div
            className={cn(
              "pointer-events-none absolute inset-0 z-[1] flex flex-col items-center justify-center pb-[min(38%,20rem)] text-center",
              toolboxNebulaOverlayTextShadowClass,
            )}
            aria-live="polite"
          >
            <p className="font-cinzel text-2xl text-foreground sm:text-3xl">
              {t(PHASE_LABEL_KEYS[currentPhase])}
            </p>
            <p className="mt-1 text-5xl font-extralight tabular-nums text-foreground/90">
              {remainingSec}
            </p>
          </div>
        ) : null}

        <ToolboxOverlayChrome>
          <div className={toolboxNebulaOverlayRootClass}>
            <ToolboxNebulaOverlayHeader
              title={title}
              headline={
                completed
                  ? undefined
                  : showCenterGuide
                    ? undefined
                    : isRunning
                      ? t(PHASE_LABEL_KEYS[currentPhase])
                      : undefined
              }
              meta={t("toolbox.breath.cycle", {
                current: position.cycle,
                total: activeConfig.cycles,
              })}
              completed={completed}
              completedLabel={t("toolbox.breath.done")}
            />

            <ToolboxNebulaOptionPills
              options={patternOptions}
              activeId={activePattern}
              onSelect={selectPattern}
            />

            <div className="flex items-center justify-center">
              <ToolboxWidgetTimerControls
                isRunning={isRunning}
                onToggle={() => toggleRunning()}
                onReset={() => reset()}
                disabled={completed}
                playLabel={t("toolbox.launch")}
                pauseLabel={t("toolbox.pause")}
                resetLabel={t("toolbox.restart")}
              />
            </div>
          </div>
        </ToolboxOverlayChrome>
      </ToolboxBreathingOrbEngine>
    </div>
  );
}
