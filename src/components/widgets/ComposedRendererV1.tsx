import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock3, ChevronRight, Sparkles, FastForward, List, Focus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { pickWidgetCatalogCopy } from "@/lib/toolbox-widget-i18n";
import type { Locale } from "@/i18n/translations";
import { usePersistedExerciseTimer } from "@/hooks/usePersistedExerciseTimer";
import { useWidgetAbandonGuard } from "@/hooks/useWidgetAbandonGuard";
import type { ToolboxOnAbandon, ToolboxOnComplete } from "@/lib/toolbox-completion";
import { playToolboxTimerCompleteSound } from "@/lib/toolbox-timer-sound";
import {
  ToolboxPrescriptionBanner,
  ToolboxWidgetCard,
  ToolboxWidgetField,
  ToolboxWidgetHeader,
  ToolboxWidgetInput,
  ToolboxWidgetInstructions,
  ToolboxWidgetLaunchButton,
  ToolboxWidgetPrimaryButton,
  ToolboxWidgetProgress,
  ToolboxWidgetRoot,
  ToolboxWidgetSecondaryButton,
  ToolboxWidgetTextarea,
  ToolboxWidgetTimerControls,
  ToolboxWidgetStepCard,
  toolboxWidgetLabelClass,
} from "@/features/toolbox/ui";

type BlockType =
  | "markdown"
  | "step_list"
  | "timer"
  | "checklist"
  | "form_fields"
  | "single_input"
  | "dual_input"
  | "text_input"
  | "single_checkbox"
  | "matrix"
  | "scale";

interface Props {
  config: Record<string, unknown>;
  title: string;
  hideTitle?: boolean;
  sessionKey?: string;
  onComplete?: ToolboxOnComplete;
  onAbandon?: ToolboxOnAbandon;
  blueprint?: { blocks?: BlockType[] } | Record<string, unknown>;
}

function readString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function readNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object" && "text" in item) {
        return readString((item as { text?: unknown }).text).trim();
      }
      return "";
    })
    .filter(Boolean);
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ComposedRendererV1({
  config,
  title,
  hideTitle,
  sessionKey,
  onComplete,
  onAbandon,
  blueprint,
}: Props) {
  const { t, locale } = useLanguage();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState("");
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [fields, setFields] = useState<Record<string, string>>({});
  const [started, setStarted] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [viewMode, setViewMode] = useState<"focus" | "overview">("focus");
  const [expressActive, setExpressActive] = useState(false);
  const markCompletedRef = useRef<() => void>(() => {});

  const instructions = useMemo(
    () =>
      pickWidgetCatalogCopy(
        locale as Locale,
        config.instructions_i18n,
        readString(config.instructions, ""),
      ),
    [config.instructions, config.instructions_i18n, locale],
  );
  const steps = useMemo(() => {
    const rawSteps = toStringArray(config.steps);
    if (rawSteps.length > 0) return rawSteps;
    return toStringArray(config.affirmations);
  }, [config.steps, config.affirmations]);

  const fieldsList = useMemo(
    () => toStringArray(config.fields),
    [config.fields],
  );
  const baseDurationSec = Math.max(0, readNumber(config.duration_sec, 0));
  const fallbackSec = useMemo(() => {
    const raw = config.resistance_fallback_sec;
    const num = typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
    if (num > 0 && (baseDurationSec === 0 || num < baseDurationSec)) return num;
    if (baseDurationSec > 120) return 90;
    return 0;
  }, [config.resistance_fallback_sec, baseDurationSec]);

  const durationSec = expressActive && fallbackSec > 0 ? fallbackSec : baseDurationSec;
  const budgetMode = config.time_budget_mode === true && durationSec > 0;
  const wallClockTimer = budgetMode || Boolean(sessionKey && durationSec > 0);
  const hasSteps = steps.length > 0;
  const blocks: BlockType[] = Array.isArray(
    (blueprint as { blocks?: BlockType[] } | undefined)?.blocks,
  )
    ? ((blueprint as { blocks?: BlockType[] }).blocks as BlockType[])
    : budgetMode && hasSteps
      ? ["markdown", "step_list"]
      : ["markdown", "step_list", "timer"];

  const timer = usePersistedExerciseTimer({
    sessionKey: wallClockTimer ? (expressActive ? `${sessionKey ?? "composed"}:express` : sessionKey) : undefined,
    totalSeconds: Math.max(1, durationSec || 1),
    onComplete: budgetMode
      ? () => markCompletedRef.current()
      : wallClockTimer
        ? () => {
            playToolboxTimerCompleteSound();
            onComplete?.();
          }
        : undefined,
  });

  const markCompleted = useCallback(() => {
    timer.completedRef.current = true;
    onComplete?.({
      elapsedSec: wallClockTimer ? timer.elapsedSec : elapsed,
      durationBudgetSec: budgetMode ? durationSec : undefined,
      notes: notes || (Object.keys(fields).length > 0 ? JSON.stringify(fields) : undefined),
    });
  }, [budgetMode, timer, elapsed, durationSec, onComplete, wallClockTimer, notes, fields]);

  useEffect(() => {
    markCompletedRef.current = markCompleted;
  }, [markCompleted]);

  const timerElapsedRef = useRef(timer.elapsedSec);
  timerElapsedRef.current = timer.elapsedSec;

  useWidgetAbandonGuard(
    timer.hasStartedRef,
    timer.completedRef,
    onAbandon,
    budgetMode || wallClockTimer
      ? () => ({
          elapsedSec: timerElapsedRef.current,
          durationBudgetSec: budgetMode ? durationSec : durationSec || undefined,
        })
      : undefined,
  );

  useEffect(() => {
    if (wallClockTimer || !isRunning || durationSec <= 0) return;
    const id = setInterval(() => {
      setElapsed((value) => {
        const next = value + 1;
        if (next >= durationSec) {
          clearInterval(id);
          setIsRunning(false);
          playToolboxTimerCompleteSound();
          onComplete?.();
          return durationSec;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [durationSec, isRunning, onComplete, wallClockTimer]);

  const displayElapsed = wallClockTimer ? timer.elapsedSec : elapsed;
  const displayRunning = wallClockTimer ? timer.isRunning : isRunning;

  const sessionDone = budgetMode && (timer.completed || timer.completedRef.current);

  const startBudget = () => {
    timer.hasStartedRef.current = true;
    setStarted(true);
    timer.setRunning(true);
  };

  const nextStep = () => {
    if (stepIdx >= steps.length - 1) {
      markCompleted();
    } else {
      setStepIdx(stepIdx + 1);
    }
  };

  const resetBudget = () => {
    setStarted(false);
    setStepIdx(0);
    timer.reset();
  };

  if (budgetMode) {
    const remaining = Math.max(0, durationSec - timer.elapsedSec);
    const progress = durationSec > 0 ? Math.min(timer.elapsedSec / durationSec, 1) : 0;
    const currentStep = hasSteps ? steps[stepIdx] : null;

    return (
      <ToolboxWidgetRoot className="items-center space-y-5">
        {!hideTitle ? (
          <ToolboxWidgetHeader title={title} icon={Sparkles} iconClassName="text-neural-accent" />
        ) : null}

        <ToolboxPrescriptionBanner
          config={config}
          locale={locale === "en" ? "en" : "fr"}
        />

        {!started && !sessionDone ? (
          <div className="w-full space-y-3 text-center">
            {instructions ? (
              <ToolboxWidgetInstructions>{instructions}</ToolboxWidgetInstructions>
            ) : null}
            <p className="text-xs text-muted-foreground">{t("toolbox.micro.totalBudget", { time: fmtTime(durationSec) })}</p>
            {hasSteps && (
              <p className="text-xs text-muted-foreground">{t("toolbox.micro.stepsCount", { n: steps.length })}</p>
            )}
          </div>
        ) : sessionDone ? (
          <div className="text-center space-y-2">
            <CheckCircle2 size={32} className="mx-auto text-primary" />
            <p className="text-sm font-medium text-foreground">{t("toolbox.micro.done")}</p>
            <p className="text-xs text-muted-foreground">{t("toolbox.micro.elapsed", { time: fmtTime(timer.elapsedSec) })}</p>
          </div>
        ) : (
          <div className="w-full space-y-4">
            {hasSteps && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Étape {stepIdx + 1} / {steps.length}
                </span>
                <button
                  type="button"
                  onClick={() => setViewMode((v) => (v === "focus" ? "overview" : "focus"))}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {viewMode === "focus" ? <List className="size-3" /> : <Focus className="size-3" />}
                  {viewMode === "focus"
                    ? locale === "en"
                      ? "Overview list"
                      : "Vue d'ensemble"
                    : locale === "en"
                      ? "Focus step-by-step"
                      : "Focus pas-à-pas"}
                </button>
              </div>
            )}

            {viewMode === "focus" && currentStep ? (
              <ToolboxWidgetStepCard
                stepText={currentStep}
                stepIndex={stepIdx}
                stepTotal={steps.length}
                metaRight={fmtTime(remaining)}
              />
            ) : viewMode === "overview" && hasSteps ? (
              <div className="space-y-2 rounded-xl border border-border/40 bg-secondary/10 p-3">
                {steps.map((step, idx) => (
                  <label key={`${step}-${idx}`} className="flex items-start gap-2.5 text-xs text-foreground/90 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(checked[idx]) || idx <= stepIdx}
                      onChange={(e) =>
                        setChecked((prev) => ({ ...prev, [idx]: e.target.checked }))
                      }
                      className="mt-0.5 size-3.5 rounded border-border"
                    />
                    <span className={checked[idx] || idx < stepIdx ? "line-through text-muted-foreground" : ""}>
                      {step}
                    </span>
                  </label>
                ))}
              </div>
            ) : instructions ? (
              <ToolboxWidgetInstructions className="text-sm text-foreground/80">{instructions}</ToolboxWidgetInstructions>
            ) : null}

            <div className="space-y-1">
              <ToolboxWidgetProgress value={timer.elapsedSec} max={durationSec} />
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>{fmtTime(timer.elapsedSec)}</span>
                <span>{t("toolbox.micro.totalBudgetShort", { time: fmtTime(durationSec) })}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          {!started && !sessionDone ? (
            <>
              <ToolboxWidgetLaunchButton type="button" onClick={startBudget}>
                {t("toolbox.launch")}
              </ToolboxWidgetLaunchButton>
              {fallbackSec > 0 && !expressActive ? (
                <button
                  type="button"
                  onClick={() => {
                    setExpressActive(true);
                    timer.hasStartedRef.current = true;
                    setStarted(true);
                    timer.setRunning(true);
                  }}
                  data-slot="toolbox-express-fallback"
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  <FastForward className="size-3.5 text-primary" />
                  {locale === "en" ? `⚡ Express Mode (${fallbackSec}s)` : `⚡ Mode Express (${fallbackSec}s)`}
                </button>
              ) : null}
            </>
          ) : sessionDone ? (
            <ToolboxWidgetTimerControls
              isRunning={false}
              onToggle={() => {}}
              onReset={resetBudget}
              playLabel={t("toolbox.launch")}
              pauseLabel={t("toolbox.pause")}
              resetLabel="Reset"
            />
          ) : (
            <>
              <ToolboxWidgetTimerControls
                isRunning={timer.isRunning}
                onToggle={() => timer.toggleRunning()}
                onReset={resetBudget}
                playLabel={t("toolbox.launch")}
                pauseLabel={t("toolbox.pause")}
                resetLabel="Reset"
              />
              {hasSteps ? (
                <ToolboxWidgetSecondaryButton type="button" onClick={nextStep} className="font-medium">
                  {stepIdx >= steps.length - 1
                    ? locale === "en"
                      ? "Protocol completed →"
                      : "Étape accomplie →"
                    : locale === "en"
                      ? "Next step →"
                      : "Étape accomplie →"}
                  <ChevronRight size={14} />
                </ToolboxWidgetSecondaryButton>
              ) : null}
              <ToolboxWidgetSecondaryButton type="button" onClick={markCompleted}>
                {t("toolbox.micro.finishEarly")}
              </ToolboxWidgetSecondaryButton>
            </>
          )}
        </div>
      </ToolboxWidgetRoot>
    );
  }

  const renderBlock = (block: BlockType) => {
    switch (block) {
      case "markdown":
        return instructions ? <ToolboxWidgetInstructions>{instructions}</ToolboxWidgetInstructions> : null;
      case "step_list":
      case "checklist":
        if (steps.length === 0) return null;
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{locale === "en" ? `Steps (${steps.length})` : `Étapes (${steps.length})`}</span>
              <button
                type="button"
                onClick={() => setViewMode((v) => (v === "focus" ? "overview" : "focus"))}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                {viewMode === "focus" ? <List className="size-3" /> : <Focus className="size-3" />}
                {viewMode === "focus"
                  ? locale === "en"
                    ? "Overview"
                    : "Vue d'ensemble"
                  : locale === "en"
                    ? "Focus"
                    : "Focus pas-à-pas"}
              </button>
            </div>

            {viewMode === "focus" ? (
              <div className="space-y-3">
                <ToolboxWidgetStepCard
                  stepText={steps[stepIdx]}
                  stepIndex={stepIdx}
                  stepTotal={steps.length}
                />
                <div className="flex items-center justify-end">
                  <ToolboxWidgetSecondaryButton type="button" onClick={nextStep} className="text-xs">
                    {stepIdx >= steps.length - 1
                      ? locale === "en"
                        ? "Protocol completed →"
                        : "Étape accomplie →"
                      : locale === "en"
                        ? "Next step →"
                        : "Étape accomplie →"}
                    <ChevronRight size={13} />
                  </ToolboxWidgetSecondaryButton>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {steps.map((step, idx) => (
                  <label key={`${step}-${idx}`} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(checked[idx])}
                      onChange={(e) =>
                        setChecked((prev) => ({ ...prev, [idx]: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-border"
                    />
                    <span className={checked[idx] ? "line-through text-muted-foreground" : "text-foreground"}>
                      {step}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      case "timer":
        if (!durationSec) return null;
        return (
          <ToolboxWidgetCard className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className={toolboxWidgetLabelClass}>{t("toolbox.duration")}</span>
              <span className="text-sm font-medium">{Math.max(0, durationSec - displayElapsed)}s</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ToolboxWidgetLaunchButton
                type="button"
                className="min-h-[44px] px-4 py-2 text-xs"
                onClick={() => {
                  if (wallClockTimer) {
                    timer.hasStartedRef.current = true;
                    timer.toggleRunning();
                  } else {
                    setIsRunning((v) => !v);
                  }
                }}
              >
                {displayRunning ? t("toolbox.pause") : t("toolbox.launch")}
              </ToolboxWidgetLaunchButton>
              <ToolboxWidgetSecondaryButton
                type="button"
                onClick={() => {
                  if (wallClockTimer) timer.reset();
                  else {
                    setIsRunning(false);
                    setElapsed(0);
                  }
                }}
              >
                {t("toolbox.restart")}
              </ToolboxWidgetSecondaryButton>
              {fallbackSec > 0 && !expressActive ? (
                <button
                  type="button"
                  onClick={() => {
                    setExpressActive(true);
                    if (wallClockTimer) {
                      timer.hasStartedRef.current = true;
                      timer.setRunning(true);
                    } else {
                      setIsRunning(true);
                    }
                  }}
                  data-slot="toolbox-express-fallback"
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  <FastForward className="size-3.5 text-primary" />
                  {locale === "en" ? `⚡ Express (${fallbackSec}s)` : `⚡ Express (${fallbackSec}s)`}
                </button>
              ) : null}
            </div>
          </ToolboxWidgetCard>
        );
      case "single_input":
      case "text_input":
        return (
          <ToolboxWidgetTextarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder={t("journal.writeThoughts")}
          />
        );
      case "dual_input":
      case "form_fields":
      case "matrix":
      case "scale":
        if (fieldsList.length === 0) return null;
        return (
          <div className="space-y-2">
            {fieldsList.map((field) => (
              <ToolboxWidgetField key={field} label={field}>
                <ToolboxWidgetInput
                  type="text"
                  value={fields[field] || ""}
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, [field]: e.target.value }))
                  }
                  placeholder={field}
                />
              </ToolboxWidgetField>
            ))}
          </div>
        );
      case "single_checkbox":
        return (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(checked[0])}
              onChange={(e) => setChecked((prev) => ({ ...prev, 0: e.target.checked }))}
              className="h-4 w-4"
            />
            <span>{readString(config.habit_name, t("toolbox.launch"))}</span>
          </label>
        );
      default:
        return null;
    }
  };

  return (
    <ToolboxWidgetRoot>
      {!hideTitle ? (
        <ToolboxWidgetHeader title={title} icon={Sparkles} iconClassName="text-neural-accent" />
      ) : null}

      <ToolboxPrescriptionBanner
        config={config}
        locale={locale === "en" ? "en" : "fr"}
      />

      <div className="space-y-3">
        {blocks.map((block, idx) => (
          <div key={`${block}-${idx}`}>{renderBlock(block)}</div>
        ))}
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <ToolboxWidgetPrimaryButton type="button" onClick={() => onComplete?.()}>
          {t("toolbox.markDone")}
        </ToolboxWidgetPrimaryButton>
        <ToolboxWidgetSecondaryButton type="button" onClick={() => onAbandon?.()}>
          <Clock3 size={12} /> {t("toolbox.abandoned")}
        </ToolboxWidgetSecondaryButton>
      </div>
    </ToolboxWidgetRoot>
  );
}
