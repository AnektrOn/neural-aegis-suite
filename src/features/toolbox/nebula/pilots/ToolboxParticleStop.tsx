import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { StopProtocolConfig } from "@/components/widgets/StopProtocolWidget";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import {
  ToolboxNebulaOverlayControls,
  ToolboxNebulaOverlayHeader,
  ToolboxNebulaOverlayPrimaryButton,
  ToolboxNebulaStepBadges,
  ToolboxWidgetTimerControls,
  toolboxNebulaOverlayRootClass,
} from "@/features/toolbox/ui";
import { driveForStopStep } from "../toolboxParticleDrives";
import { useToolboxParticleDriveRef } from "../useToolboxParticleDriveRef";
import type { ToolboxNebulaPilotProps } from "./toolboxNebulaPilotTypes";
import { ToolboxParticleShell } from "./ToolboxParticleShell";

const LETTERS = ["S", "T", "O", "P"] as const;

interface StopStep {
  letter: string;
  caption: string;
  subtitle: string;
  instruction: string;
  duration_sec: number;
}

function buildSteps(
  stepDuration: number,
  t: (key: TranslationKey) => string,
): StopStep[] {
  return LETTERS.map((letter) => ({
    letter,
    caption: t(`toolbox.stopV2.${letter}.caption` as TranslationKey),
    subtitle: t(`toolbox.stopV2.${letter}.subtitle` as TranslationKey),
    instruction: t(`toolbox.stopV2.${letter}.instruction` as TranslationKey),
    duration_sec: stepDuration,
  }));
}

interface Props extends Pick<ToolboxNebulaPilotProps, "embedded" | "variant" | "sessionKey" | "onComplete"> {
  config: StopProtocolConfig;
  title: string;
}

export function ToolboxParticleStop({
  config,
  title,
  embedded,
  variant = "panel",
  onComplete,
}: Props) {
  const { t } = useLanguage();
  const stepDuration = config.step_duration_sec ?? 30;
  const mode = config.mode === "timed" ? "timed" : "manual";
  const steps = useMemo(() => buildSteps(stepDuration, t), [stepDuration, t]);
  const totalMin = Math.max(1, Math.round((stepDuration * steps.length) / 60));

  const [isRunning, setIsRunning] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clockRef = useRef(0);
  const completedNotifiedRef = useRef(false);

  const sessionRef = useRef({
    currentIdx,
    phaseProgress,
    isActive: currentIdx >= 0 && !completed,
    clock: 0,
  });
  sessionRef.current = {
    currentIdx,
    phaseProgress,
    isActive: currentIdx >= 0 && !completed,
    clock: clockRef.current,
  };

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      clockRef.current = performance.now() / 1000;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const driveRef = useToolboxParticleDriveRef(() => {
    const s = sessionRef.current;
    return driveForStopStep(s.currentIdx, s.phaseProgress, s.isActive, s.clock);
  });

  const currentStep = currentIdx >= 0 ? steps[currentIdx] : null;
  const started = currentIdx >= 0;

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setCurrentIdx(-1);
    setPhaseProgress(0);
    setCompletedSteps(new Set());
    setCompleted(false);
    completedNotifiedRef.current = false;
  }, []);

  const advance = useCallback(() => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= steps.length) {
      setCompletedSteps((prev) => new Set([...prev, currentIdx]));
      setIsRunning(false);
      setCompleted(true);
    } else {
      if (currentIdx >= 0) {
        setCompletedSteps((prev) => new Set([...prev, currentIdx]));
      }
      setCurrentIdx(nextIdx);
      setPhaseProgress(0);
    }
  }, [currentIdx, steps.length]);

  useEffect(() => {
    if (!isRunning || mode === "manual" || currentIdx < 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    const tickMs = 50;
    const dur = steps[currentIdx]?.duration_sec ?? stepDuration;
    intervalRef.current = setInterval(() => {
      setPhaseProgress((prev) => {
        const next = prev + tickMs / (dur * 1000);
        if (next >= 1) {
          advance();
          return 0;
        }
        return next;
      });
    }, tickMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [advance, currentIdx, isRunning, mode, stepDuration, steps]);

  useEffect(() => {
    if (!completed || completedNotifiedRef.current) return;
    completedNotifiedRef.current = true;
    onComplete?.();
  }, [completed, onComplete]);

  const start = () => {
    if (completed) reset();
    setCurrentIdx(0);
    setPhaseProgress(0);
    setIsRunning(mode === "timed");
  };

  const remainingSec = currentStep
    ? Math.ceil(currentStep.duration_sec * (1 - phaseProgress))
    : stepDuration;

  const meta = started && currentStep
    ? mode === "timed"
      ? `${t("toolbox.stopV2.secondsLeft", { n: remainingSec })} · ${t("toolbox.stopV2.stepOverall", {
          current: currentIdx + 1,
          total: steps.length,
        })}`
      : t("toolbox.stopV2.stepOverall", {
          current: currentIdx + 1,
          total: steps.length,
        })
    : t("toolbox.stopV2.idleMeta", { n: steps.length, min: totalMin });

  return (
    <ToolboxParticleShell
      embedded={embedded}
      variant={variant}
      driveRef={driveRef}
      label={t("toolbox.typeStopProtocol")}
    >
      <div className={toolboxNebulaOverlayRootClass}>
        <ToolboxNebulaOverlayHeader
          title={title}
          headline={
            completed
              ? undefined
              : started && currentStep
                ? currentStep.letter
                : t("toolbox.stopV2.idleTitle")
          }
          headlineClassName={
            started && currentStep && !completed
              ? "font-cinzel text-4xl font-semibold tracking-widest"
              : undefined
          }
          instruction={
            completed
              ? t("toolbox.stopV2.doneSubtitle")
              : started && currentStep
                ? currentStep.instruction
                : undefined
          }
          meta={completed ? undefined : meta}
          completed={completed}
          completedLabel={t("toolbox.stopV2.doneTitle")}
        />

        <ToolboxNebulaStepBadges
          steps={steps.map((step) => ({ id: step.letter, label: step.letter }))}
          activeIndex={started ? currentIdx : -1}
          completedIndexes={completedSteps}
        />

        {!started || completed ? (
          <ToolboxNebulaOverlayControls>
            <ToolboxWidgetTimerControls
              isRunning={false}
              onToggle={reset}
              onReset={reset}
              playLabel={t("toolbox.restart")}
              pauseLabel={t("toolbox.pause")}
              resetLabel={t("toolbox.restart")}
            />
            <ToolboxNebulaOverlayPrimaryButton type="button" onClick={start}>
              {completed ? t("toolbox.restart") : t("toolbox.stopV2.startButton")}
            </ToolboxNebulaOverlayPrimaryButton>
          </ToolboxNebulaOverlayControls>
        ) : mode === "manual" ? (
          <ToolboxNebulaOverlayControls>
            <ToolboxWidgetTimerControls
              isRunning={false}
              onToggle={reset}
              onReset={reset}
              playLabel={t("toolbox.restart")}
              pauseLabel={t("toolbox.pause")}
              resetLabel={t("toolbox.restart")}
            />
            <ToolboxNebulaOverlayPrimaryButton type="button" onClick={advance}>
              <ChevronRight className="mr-1.5 h-3.5 w-3.5" />
              {t("toolbox.stopV2.nextStep")}
            </ToolboxNebulaOverlayPrimaryButton>
          </ToolboxNebulaOverlayControls>
        ) : (
          <ToolboxNebulaOverlayControls>
            <ToolboxWidgetTimerControls
              isRunning={isRunning}
              onToggle={() => setIsRunning((running) => !running)}
              onReset={reset}
              playLabel={t("toolbox.resume")}
              pauseLabel={t("toolbox.pause")}
              resetLabel={t("toolbox.restart")}
            />
          </ToolboxNebulaOverlayControls>
        )}
      </div>
    </ToolboxParticleShell>
  );
}
