import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Locale } from "@/i18n/translations";
import { pickWidgetCatalogCopy } from "@/lib/toolbox-widget-i18n";
import { applySlugTheme } from "@/lib/toolbox-slug-themes";
import { hydrateToolboxWidgetDuration } from "@/lib/toolbox-widget-duration";
import { usePersistedExerciseTimer } from "@/hooks/usePersistedExerciseTimer";
import { useWidgetAbandonGuard } from "@/hooks/useWidgetAbandonGuard";
import { playToolboxTimerCompleteSound } from "@/lib/toolbox-timer-sound";
import {
  useSaveToolboxWritingToJournal,
  type ToolboxJournalMeta,
} from "@/features/journal/useSaveToolboxWritingToJournal";
import {
  ToolboxNebulaOverlayControls,
  ToolboxNebulaOverlayHeader,
  ToolboxNebulaOverlayPrimaryButton,
  ToolboxNebulaScenePills,
  ToolboxWidgetTextarea,
  ToolboxWidgetTimerControls,
  resolveToolboxAccent,
  toolboxNebulaOverlayRootClass,
} from "@/features/toolbox/ui";
import { journalNebulaMode } from "../toolboxJournalNebula";
import { driveForParticleEngine } from "../toolboxParticleDrives";
import { useLiveElapsedSec } from "../useLiveExerciseElapsed";
import { useToolboxParticleDriveRef } from "../useToolboxParticleDriveRef";
import type { ToolboxNebulaPilotProps } from "./toolboxNebulaPilotTypes";
import { ToolboxParticleShell } from "./ToolboxParticleShell";
import type { ToolboxV3Drive } from "./ToolboxParticleEngine";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function readPosInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

interface Props extends Pick<
  ToolboxNebulaPilotProps,
  "slug" | "embedded" | "variant" | "sessionKey" | "onComplete" | "onAbandon"
> {
  config: Record<string, unknown>;
  title: string;
  journal: ToolboxJournalMeta;
}

export function ToolboxParticleJournal({
  slug,
  config,
  title,
  journal,
  embedded,
  variant = "panel",
  sessionKey,
  onComplete,
  onAbandon,
}: Props) {
  const { t, locale } = useLanguage();
  const mode = journalNebulaMode(slug);
  const merged = useMemo(
    () => hydrateToolboxWidgetDuration(slug, applySlugTheme(slug, config)),
    [slug, config],
  );
  const accent = resolveToolboxAccent(
    typeof merged.accent_color === "string" ? merged.accent_color : undefined,
    1,
  );

  const promptText = useMemo(() => {
    if (mode === "prompt") {
      return pickWidgetCatalogCopy(locale as Locale, merged.prompt_i18n, merged.prompt as string);
    }
    const instructions = pickWidgetCatalogCopy(
      locale as Locale,
      merged.instructions_i18n,
      merged.instructions as string,
    );
    const explicitPrompt = pickWidgetCatalogCopy(
      locale as Locale,
      merged.prompt_i18n,
      merged.prompt as string,
    );
    return explicitPrompt || instructions;
  }, [locale, merged, mode]);

  const localizedSteps = useMemo(() => {
    const raw = merged.steps;
    if (!Array.isArray(raw) || raw.length === 0) return null;
    return raw.map((step) => {
      const row = step as { text?: string; text_i18n?: unknown };
      return pickWidgetCatalogCopy(locale as Locale, row.text_i18n, row.text ?? "");
    });
  }, [locale, merged.steps]);

  const totalSec =
    mode === "timed"
      ? Math.max(60, readPosInt(merged.duration_sec, slug === "morning_pages" ? 900 : 600))
      : 0;
  const hasDuration = mode === "timed";

  const [started, setStarted] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [body, setBody] = useState("");
  const completedRef = useRef(false);
  const touchedRef = useRef(false);
  const elapsedRef = useRef(0);

  const markCompletedRef = useRef<() => void>(() => {});

  const {
    elapsedSec,
    isRunning,
    completed,
    toggleRunning,
    reset: resetTimer,
    hasStartedRef,
  } = usePersistedExerciseTimer({
    sessionKey: hasDuration ? sessionKey : undefined,
    totalSeconds: Math.max(1, totalSec || 1),
    onComplete: hasDuration
      ? () => {
          playToolboxTimerCompleteSound();
          markCompletedRef.current();
        }
      : undefined,
  });

  elapsedRef.current = elapsedSec;

  const { saveWriting, saving } = useSaveToolboxWritingToJournal(journal);

  const liveElapsedRef = useLiveElapsedSec(elapsedSec, isRunning, completed);
  const sessionRef = useRef({ started, isRunning, completed, hasDuration });
  sessionRef.current = { started, isRunning, completed, hasDuration };

  const driveRef = useToolboxParticleDriveRef<ToolboxV3Drive>(() => {
    const s = sessionRef.current;
    const active = s.started && !s.completed && (s.isRunning || !s.hasDuration);
    return driveForParticleEngine(slug, liveElapsedRef.current, active);
  });

  const markCompleted = useCallback(async () => {
    if (!body.trim() || saving) return;
    const header =
      mode === "prompt" && promptText.trim()
        ? `## ${t("toolbox.journalPromptLabel")}\n${promptText.trim()}\n\n## ${t("toolbox.journalYourReflection")}\n`
        : promptText.trim()
          ? `${promptText.trim()}\n\n`
          : "";
    const ok = await saveWriting(`${header}${body.trim()}`);
    if (!ok) return;
    completedRef.current = true;
    onComplete?.({
      elapsedSec: elapsedRef.current,
      durationBudgetSec: hasDuration ? totalSec : undefined,
    });
  }, [body, hasDuration, mode, onComplete, promptText, saveWriting, saving, t, totalSec]);

  markCompletedRef.current = () => {
    void markCompleted();
  };

  useWidgetAbandonGuard(touchedRef, completedRef, onAbandon, () => ({
    elapsedSec: elapsedRef.current,
    durationBudgetSec: hasDuration ? totalSec : undefined,
  }));

  useEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7734/ingest/5c724db7-3dd7-4e14-aa0c-d7fe395f7450", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c757ff" },
      body: JSON.stringify({
        sessionId: "c757ff",
        runId: "journal-panel-post-fix",
        hypothesisId: "H5-fix",
        location: "ToolboxParticleJournal.tsx:mount",
        message: "journal pilot mounted",
        data: {
          slug,
          mode,
          hasPrompt: Boolean(promptText?.trim()),
          stepCount: localizedSteps?.length ?? 0,
          hasDuration,
          totalSec,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [slug, mode, promptText, localizedSteps, hasDuration, totalSec]);

  const sessionDone = completed || completedRef.current;
  const remaining = Math.max(0, totalSec - elapsedSec);
  const progress = totalSec > 0 ? Math.min(elapsedSec / totalSec, 1) : 0;

  const start = () => {
    hasStartedRef.current = true;
    touchedRef.current = true;
    setStarted(true);
    if (hasDuration) toggleRunning();
  };

  const restart = () => {
    setStarted(false);
    setStepIdx(0);
    setBody("");
    completedRef.current = false;
    touchedRef.current = false;
    resetTimer();
  };

  const nextStep = () => {
    const n = localizedSteps?.length ?? 0;
    if (n === 0) return;
    if (stepIdx >= n - 1) {
      void markCompleted();
    } else {
      setStepIdx((i) => i + 1);
    }
  };

  const headline =
    sessionDone || !started
      ? promptText
      : mode === "steps" && localizedSteps
        ? localizedSteps[stepIdx]
        : promptText;

  const meta =
    sessionDone || !started
      ? mode === "timed"
        ? t("toolbox.micro.duration", { time: formatTime(totalSec) })
        : mode === "steps" && localizedSteps
          ? t("toolbox.micro.stepsCount", { n: localizedSteps.length })
          : undefined
      : hasDuration
        ? `${formatTime(remaining)} · ${formatTime(elapsedSec)} / ${formatTime(totalSec)}`
        : mode === "steps" && localizedSteps
          ? t("toolbox.micro.stepCounter", {
              current: stepIdx + 1,
              total: localizedSteps.length,
            })
          : undefined;

  return (
    <ToolboxParticleShell
      embedded={embedded}
      variant={variant}
      driveRef={driveRef}
      overlay="split"
      initialShape="column"
      label={t("toolbox.typeJournalPrompt")}
    >
      <div
        data-slot="toolbox-journal-writing-panel"
        className="flex min-h-[14rem] flex-col gap-3"
      >
        <div className={toolboxNebulaOverlayRootClass}>
          <ToolboxNebulaOverlayHeader
            title={title}
            headline={headline}
            instruction={sessionDone || !started ? undefined : promptText}
            meta={meta}
            completed={sessionDone}
            completedLabel={t("toolbox.micro.done")}
          />

          {mode === "steps" && localizedSteps && started && !sessionDone ? (
            <ToolboxNebulaScenePills
              scenes={localizedSteps.map((label, index) => ({
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
        </div>

        {!sessionDone ? (
          <ToolboxWidgetTextarea
            value={body}
            onChange={(e) => {
              if (e.target.value.trim()) touchedRef.current = true;
              setBody(e.target.value);
            }}
            rows={8}
            className="min-h-[10rem] flex-1 resize-y"
            placeholder={t("toolbox.journalWriteHere")}
          />
        ) : null}

        <ToolboxNebulaOverlayControls>
          {!started && !sessionDone && mode !== "prompt" ? (
            <ToolboxNebulaOverlayPrimaryButton type="button" onClick={start}>
              {t("toolbox.launch")}
            </ToolboxNebulaOverlayPrimaryButton>
          ) : null}

          {started && hasDuration && !sessionDone ? (
            <ToolboxWidgetTimerControls
              isRunning={isRunning}
              onToggle={() => toggleRunning()}
              onReset={restart}
              playLabel={t("toolbox.launch")}
              pauseLabel={t("toolbox.pause")}
              resetLabel={t("toolbox.restart")}
            />
          ) : null}

          {(started || mode === "prompt") && !sessionDone ? (
            <>
              {mode === "steps" && localizedSteps ? (
                <ToolboxNebulaOverlayPrimaryButton type="button" onClick={nextStep}>
                  <ChevronRight className="mr-1.5 h-3.5 w-3.5" />
                  {stepIdx >= localizedSteps.length - 1
                    ? t("toolbox.micro.finish")
                    : t("toolbox.micro.next")}
                </ToolboxNebulaOverlayPrimaryButton>
              ) : null}
              <ToolboxNebulaOverlayPrimaryButton
                type="button"
                onClick={() => void markCompleted()}
                disabled={!body.trim() || saving}
              >
                {t("toolbox.widgetFinishJournal")}
              </ToolboxNebulaOverlayPrimaryButton>
            </>
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
    </ToolboxParticleShell>
  );
}
