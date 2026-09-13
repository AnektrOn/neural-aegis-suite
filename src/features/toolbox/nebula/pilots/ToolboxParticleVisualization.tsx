import { useCallback, useMemo, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  DEFAULT_VISUALIZATION_SCENES,
  type VisualizationConfig,
  type VisualizationScene,
} from "@/components/widgets/VisualizationWidget";
import { useLanguage } from "@/i18n/LanguageContext";
import { resolveSequenceFromElapsed } from "@/lib/exercise-sequence-position";
import { usePersistedExerciseTimer } from "@/hooks/usePersistedExerciseTimer";
import {
  ToolboxNebulaOverlayControls,
  ToolboxNebulaOverlayHeader,
  ToolboxNebulaOverlayPrimaryButton,
  ToolboxNebulaScenePills,
  ToolboxWidgetTimerControls,
  toolboxNebulaOverlayRootClass,
} from "@/features/toolbox/ui";
import { driveForVisualizationScene } from "../toolboxParticleDrives";
import { useLiveElapsedSec, useLiveSequencePosition } from "../useLiveExerciseElapsed";
import { useToolboxParticleDriveRef } from "../useToolboxParticleDriveRef";
import type { ToolboxNebulaPilotProps } from "./toolboxNebulaPilotTypes";
import { ToolboxParticleShell } from "./ToolboxParticleShell";

function resolveScenes(config: VisualizationConfig): VisualizationScene[] {
  const scenes = config.scenes;
  if (Array.isArray(scenes) && scenes.length > 0 && typeof scenes[0]?.instruction === "string") {
    return scenes.map((s) => ({ ...s, label: s.label || s.id }));
  }
  return DEFAULT_VISUALIZATION_SCENES;
}

interface Props extends Pick<ToolboxNebulaPilotProps, "embedded" | "variant" | "sessionKey" | "onComplete"> {
  config: VisualizationConfig;
  title: string;
}

export function ToolboxParticleVisualization({
  config,
  title,
  embedded,
  variant = "panel",
  sessionKey,
  onComplete,
}: Props) {
  const { t } = useLanguage();
  const scenes = useMemo(() => resolveScenes(config), [config]);
  const mode = config.mode === "manual" ? "manual" : "timed";
  const totalSec = scenes.reduce((s, sc) => s + sc.duration_sec, 0);

  const cyclicPhases = useMemo(
    () => scenes.map((s) => ({ id: s.id, durationSec: s.duration_sec })),
    [scenes],
  );

  const {
    elapsedSec,
    isRunning,
    completed,
    toggleRunning,
    reset,
  } = usePersistedExerciseTimer({
    totalSeconds: totalSec,
    sessionKey,
    onComplete: () => onComplete?.(),
  });

  const [manualIdx, setManualIdx] = useState(0);
  const liveElapsedRef = useLiveElapsedSec(elapsedSec, isRunning, completed);
  const resolveTimedPosition = useLiveSequencePosition(liveElapsedRef, cyclicPhases);

  const sessionRef = useRef({ manualIdx, mode, isRunning, completed });
  sessionRef.current = { manualIdx, mode, isRunning, completed };

  const scenesRef = useRef(scenes);
  scenesRef.current = scenes;

  const driveRef = useToolboxParticleDriveRef(() => {
    const s = sessionRef.current;
    const clock = liveElapsedRef.current;
    if (s.mode === "manual") {
      const scene = scenesRef.current[s.manualIdx] ?? scenesRef.current[0];
      return driveForVisualizationScene(scene.id, 0, true, clock);
    }
    const pos = resolveTimedPosition();
    const scene = scenesRef.current[pos.index] ?? scenesRef.current[0];
    return driveForVisualizationScene(
      scene.id,
      pos.phaseProgress,
      s.isRunning && !s.completed,
      clock,
    );
  });

  const timedPosition = useMemo(
    () => resolveSequenceFromElapsed(elapsedSec, cyclicPhases),
    [elapsedSec, cyclicPhases],
  );

  const sceneIndex = mode === "manual" ? manualIdx : timedPosition.index;
  const sceneProgress = mode === "manual" ? 0 : timedPosition.phaseProgress;
  const currentScene = scenes[sceneIndex] ?? scenes[0];
  const remainingSec = Math.ceil(
    currentScene.duration_sec - sceneProgress * currentScene.duration_sec,
  );

  const advanceManual = useCallback(() => {
    setManualIdx((i) => {
      const next = Math.min(i + 1, scenes.length - 1);
      if (next >= scenes.length - 1 && mode === "manual") {
        onComplete?.();
      }
      return next;
    });
  }, [mode, onComplete, scenes.length]);

  const restart = () => {
    reset();
    setManualIdx(0);
  };

  const meta =
    mode === "timed" && isRunning
      ? `${remainingSec}s · ${t("toolbox.vizSceneProgress", {
          current: sceneIndex + 1,
          total: scenes.length,
        })}`
      : t("toolbox.vizSceneProgress", {
          current: sceneIndex + 1,
          total: scenes.length,
        });

  return (
    <ToolboxParticleShell
      embedded={embedded}
      variant={variant}
      driveRef={driveRef}
      label={t("toolbox.typeVisualization")}
    >
      <div className={toolboxNebulaOverlayRootClass}>
        <ToolboxNebulaOverlayHeader
          title={title}
          headline={completed && mode === "timed" ? undefined : currentScene.label}
          instruction={completed && mode === "timed" ? undefined : currentScene.instruction}
          meta={completed && mode === "timed" ? undefined : meta}
          completed={completed && mode === "timed"}
          completedLabel={t("toolbox.vizDone")}
        />

        <ToolboxNebulaScenePills
          scenes={scenes.map((scene) => ({ id: scene.id, label: scene.label }))}
          activeIndex={sceneIndex}
        />

        {mode === "manual" ? (
          <ToolboxNebulaOverlayControls>
            <ToolboxWidgetTimerControls
              isRunning={false}
              onToggle={restart}
              onReset={restart}
              playLabel={t("toolbox.restart")}
              pauseLabel={t("toolbox.pause")}
              resetLabel={t("toolbox.restart")}
            />
            <ToolboxNebulaOverlayPrimaryButton
              type="button"
              onClick={advanceManual}
              disabled={sceneIndex >= scenes.length - 1}
            >
              <ChevronRight className="mr-1.5 h-3.5 w-3.5" />
              {t("toolbox.stopNext")}
            </ToolboxNebulaOverlayPrimaryButton>
          </ToolboxNebulaOverlayControls>
        ) : (
          <ToolboxNebulaOverlayControls>
            <ToolboxWidgetTimerControls
              isRunning={isRunning}
              onToggle={() => toggleRunning()}
              onReset={restart}
              disabled={completed}
              playLabel={t("toolbox.launch")}
              pauseLabel={t("toolbox.pause")}
              resetLabel={t("toolbox.restart")}
            />
          </ToolboxNebulaOverlayControls>
        )}
      </div>
    </ToolboxParticleShell>
  );
}
