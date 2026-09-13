import { useCallback, useMemo, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { MicroPracticeConfig } from "@/components/widgets/MicroPracticeWidget";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Locale } from "@/i18n/translations";
import { pickWidgetCatalogCopy } from "@/lib/toolbox-widget-i18n";
import { applySlugTheme } from "@/lib/toolbox-slug-themes";
import type { MicroHeroPreset } from "@/lib/toolbox-slug-themes";
import { usePersistedExerciseTimer } from "@/hooks/usePersistedExerciseTimer";
import { useWidgetAbandonGuard } from "@/hooks/useWidgetAbandonGuard";
import {
  ToolboxNebulaOverlayControls,
  ToolboxNebulaOverlayHeader,
  ToolboxNebulaOverlayPrimaryButton,
  ToolboxNebulaScenePills,
  ToolboxWidgetTimerControls,
  toolboxNebulaOverlayRootClass,
  resolveToolboxAccent,
} from "@/features/toolbox/ui";
import { driveForMatterMovement } from "../toolboxMatterDrives";
import { useLiveElapsedSec } from "../useLiveExerciseElapsed";
import { useToolboxParticleDriveRef } from "../useToolboxParticleDriveRef";
import type { ToolboxNebulaPilotProps } from "./toolboxNebulaPilotTypes";
import { ToolboxMatterShell } from "./ToolboxMatterShell";
import type { ToolboxMatterDrive } from "./ToolboxMatterEngine";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface Props extends Pick<
  ToolboxNebulaPilotProps,
  "embedded" | "variant" | "sessionKey" | "onComplete" | "onAbandon"
> {
  slug: string;
  config: MicroPracticeConfig;
  title: string;
}

export function ToolboxMatterMovement({
  slug,
  config,
  title,
  embedded,
  variant = "panel",
  sessionKey,
  onComplete,
  onAbandon,
}: Props) {
  const { t, locale } = useLanguage();
  const merged = useMemo(
    () => applySlugTheme(slug, config as Record<string, unknown>) as MicroPracticeConfig,
    [slug, config],
  );
  const accent = resolveToolboxAccent(merged.accent_color, 0);
  const hero = (merged.hero ?? "pulse") as MicroHeroPreset;

  const instructionsText = useMemo(
    () =>
      pickWidgetCatalogCopy(locale as Locale, merged.instructions_i18n as unknown, merged.instructions),
    [locale, merged.instructions_i18n, merged.instructions],
  );

  const localizedSteps = useMemo(() => {
    const raw = merged.steps;
    if (!Array.isArray(raw) || raw.length === 0) return null;
    return raw.map((step) =>
      pickWidgetCatalogCopy(locale as Locale, step.text_i18n as unknown, step.text),
    );
  }, [merged.steps, locale]);

  const hasSteps = localizedSteps != null && localizedSteps.length > 0;
  const totalSec = Math.max(0, merged.duration_sec ?? 0);
  const hasDuration = totalSec > 0;

  const [started, setStarted] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const elapsedRef = useRef(0);

  const markCompletedRef = useRef<() => void>(() => {});

  const {
    elapsedSec,
    isRunning,
    completed,
    toggleRunning,
    reset: resetTimer,
    hasStartedRef,
    completedRef,
  } = usePersistedExerciseTimer({
    sessionKey: hasDuration ? sessionKey : undefined,
    totalSeconds: Math.max(1, totalSec || 1),
    onComplete: hasDuration ? () => markCompletedRef.current() : undefined,
  });

  elapsedRef.current = elapsedSec;

  const liveElapsedRef = useLiveElapsedSec(elapsedSec, isRunning, completed);
  const sessionRef = useRef({
    started,
    isRunning,
    completed,
    hero,
    hasDuration,
    totalSec,
  });
  sessionRef.current = { started, isRunning, completed, hero, hasDuration, totalSec };

  const driveRef = useToolboxParticleDriveRef<ToolboxMatterDrive>(() => {
    const s = sessionRef.current;
    const clock = liveElapsedRef.current;
    const progress = s.hasDuration ? clock / Math.max(1, s.totalSec) : 0;
    const active = s.started && !s.completed && (s.isRunning || !s.hasDuration);
    return driveForMatterMovement(s.hero, active, clock, progress);
  });

  const markCompleted = useCallback(() => {
    completedRef.current = true;
    onComplete?.({
      elapsedSec: elapsedRef.current,
      durationBudgetSec: hasDuration ? totalSec : undefined,
    });
  }, [completedRef, hasDuration, onComplete, totalSec]);

  markCompletedRef.current = markCompleted;

  useWidgetAbandonGuard(hasStartedRef, completedRef, onAbandon, () => ({
    elapsedSec: elapsedRef.current,
    durationBudgetSec: hasDuration ? totalSec : undefined,
  }));

  const remaining = Math.max(0, totalSec - elapsedSec);
  const progress = totalSec > 0 ? Math.min(elapsedSec / totalSec, 1) : 0;
  const currentStepText = hasSteps ? localizedSteps![stepIdx] : null;
  const sessionDone = completed || completedRef.current;

  const start = () => {
    hasStartedRef.current = true;
    setStarted(true);
    if (hasDuration) toggleRunning();
  };

  const restart = () => {
    setStarted(false);
    setStepIdx(0);
    resetTimer();
  };

  const nextStep = () => {
    const n = localizedSteps?.length ?? 0;
    if (n === 0) return;
    if (stepIdx >= n - 1) {
      markCompleted();
    } else {
      setStepIdx((i) => i + 1);
    }
  };

  const headline = sessionDone
    ? undefined
    : hasSteps && started
      ? currentStepText ?? instructionsText
      : instructionsText;

  const meta = sessionDone
    ? undefined
    : hasDuration && started
      ? `${formatTime(remaining)} · ${formatTime(elapsedSec)} / ${formatTime(totalSec)}`
      : hasSteps && started
        ? t("toolbox.micro.stepCounter", { current: stepIdx + 1, total: localizedSteps!.length })
        : hasDuration
          ? t("toolbox.micro.duration", { time: formatTime(totalSec) })
          : hasSteps
            ? t("toolbox.micro.stepsCount", { n: localizedSteps!.length })
            : undefined;

  return (
    <ToolboxMatterShell embedded={embedded} variant={variant} driveRef={driveRef}>
      <div className={toolboxNebulaOverlayRootClass}>
        <ToolboxNebulaOverlayHeader
          title={title}
          headline={headline}
          instruction={sessionDone || !started ? undefined : instructionsText}
          meta={meta}
          completed={sessionDone}
          completedLabel={t("toolbox.micro.done")}
        />

        {hasSteps && started ? (
          <ToolboxNebulaScenePills
            scenes={localizedSteps!.map((label, index) => ({
              id: String(index),
              label,
            }))}
            activeIndex={stepIdx}
          />
        ) : null}

        {hasDuration && started && !sessionDone ? (
          <div
            className="mx-auto h-1.5 w-full max-w-[12rem] overflow-hidden rounded-full bg-border/30"
            aria-hidden
          >
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{ width: `${progress * 100}%`, backgroundColor: accent }}
            />
          </div>
        ) : null}

        <ToolboxNebulaOverlayControls>
          {!started && !sessionDone ? (
            <ToolboxNebulaOverlayPrimaryButton type="button" onClick={start}>
              {t("toolbox.launch")}
            </ToolboxNebulaOverlayPrimaryButton>
          ) : null}

          {started && hasDuration ? (
            <ToolboxWidgetTimerControls
              isRunning={isRunning}
              onToggle={() => toggleRunning()}
              onReset={restart}
              disabled={sessionDone}
              playLabel={t("toolbox.launch")}
              pauseLabel={t("toolbox.pause")}
              resetLabel={t("toolbox.restart")}
            />
          ) : null}

          {hasSteps && started && !sessionDone ? (
            <ToolboxNebulaOverlayPrimaryButton type="button" onClick={nextStep}>
              <ChevronRight className="mr-1.5 h-3.5 w-3.5" />
              {stepIdx >= (localizedSteps?.length ?? 1) - 1
                ? t("toolbox.micro.finish")
                : t("toolbox.micro.next")}
            </ToolboxNebulaOverlayPrimaryButton>
          ) : null}

          {started && !sessionDone && (hasDuration || hasSteps) ? (
            <ToolboxNebulaOverlayPrimaryButton type="button" onClick={markCompleted}>
              {t("toolbox.micro.finishEarly")}
            </ToolboxNebulaOverlayPrimaryButton>
          ) : null}

          {!hasDuration && !hasSteps && started && !sessionDone ? (
            <ToolboxNebulaOverlayPrimaryButton type="button" onClick={markCompleted}>
              {t("toolbox.micro.markDone")}
            </ToolboxNebulaOverlayPrimaryButton>
          ) : null}

          {sessionDone ? (
            <ToolboxWidgetTimerControls
              isRunning={false}
              onToggle={restart}
              onReset={restart}
              playLabel={t("toolbox.restart")}
              pauseLabel={t("toolbox.pause")}
              resetLabel={t("toolbox.restart")}
            />
          ) : null}
        </ToolboxNebulaOverlayControls>
      </div>
    </ToolboxMatterShell>
  );
}
