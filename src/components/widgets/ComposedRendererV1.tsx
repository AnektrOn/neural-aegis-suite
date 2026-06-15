import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock3, Play, Pause, RotateCcw, ChevronRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { pickWidgetCatalogCopy } from "@/lib/toolbox-widget-i18n";
import type { Locale } from "@/i18n/translations";
import { usePersistedExerciseTimer } from "@/hooks/usePersistedExerciseTimer";
import { useWidgetAbandonGuard } from "@/hooks/useWidgetAbandonGuard";
import type { ToolboxOnAbandon, ToolboxOnComplete } from "@/lib/toolbox-completion";
import { shouldTreatUnmountAsAbandon } from "@/lib/widget-lifecycle";

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
  const durationSec = Math.max(0, readNumber(config.duration_sec, 0));
  const budgetMode = config.time_budget_mode === true && durationSec > 0;
  const hasSteps = steps.length > 0;
  const blocks: BlockType[] = Array.isArray(
    (blueprint as { blocks?: BlockType[] } | undefined)?.blocks,
  )
    ? ((blueprint as { blocks?: BlockType[] }).blocks as BlockType[])
    : budgetMode && hasSteps
      ? ["markdown", "step_list"]
      : ["markdown", "step_list", "timer"];

  const timer = usePersistedExerciseTimer({
    sessionKey: budgetMode ? sessionKey : undefined,
    totalSeconds: Math.max(1, durationSec || 1),
    onComplete: budgetMode ? () => markCompletedRef.current() : undefined,
  });

  const markCompleted = useCallback(() => {
    timer.completedRef.current = true;
    onComplete?.({
      elapsedSec: budgetMode ? timer.elapsedSec : elapsed,
      durationBudgetSec: budgetMode ? durationSec : undefined,
    });
  }, [budgetMode, timer, elapsed, durationSec, onComplete]);

  useEffect(() => {
    markCompletedRef.current = markCompleted;
  }, [markCompleted]);

  useWidgetAbandonGuard(timer.hasStartedRef, timer.completedRef, budgetMode ? undefined : onAbandon);

  useEffect(() => {
    if (!budgetMode) return;
    return () => {
      if (timer.hasStartedRef.current && !timer.completedRef.current && shouldTreatUnmountAsAbandon()) {
        onAbandon?.({
          elapsedSec: timer.elapsedSec,
          durationBudgetSec: durationSec,
        });
      }
    };
  }, [budgetMode, timer.elapsedSec, durationSec, onAbandon, timer.hasStartedRef, timer.completedRef]);

  useEffect(() => {
    if (budgetMode || !isRunning || durationSec <= 0) return;
    const id = setInterval(() => {
      setElapsed((value) => {
        const next = value + 1;
        if (next >= durationSec) {
          clearInterval(id);
          setIsRunning(false);
          onComplete?.();
          return durationSec;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [durationSec, isRunning, onComplete, budgetMode]);

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
      <div className="flex flex-col items-center space-y-5 py-4">
        {!hideTitle && <h3 className="text-sm font-medium text-foreground">{title}</h3>}

        {!started && !sessionDone ? (
          <div className="text-center space-y-3 max-w-[300px]">
            {instructions ? (
              <p className="text-sm text-muted-foreground leading-relaxed">{instructions}</p>
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
          <div className="w-full max-w-[300px] space-y-4">
            {currentStep ? (
              <div className="rounded-2xl border border-border/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    {t("toolbox.micro.stepCounter", { current: stepIdx + 1, total: steps.length })}
                  </span>
                  <span className="text-[10px] font-mono text-primary">{fmtTime(remaining)}</span>
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed">{currentStep}</p>
              </div>
            ) : instructions ? (
              <p className="text-sm text-center text-foreground/80 leading-relaxed px-2">{instructions}</p>
            ) : null}
            <div className="space-y-1">
              <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress * 100}%` }} />
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>{fmtTime(timer.elapsedSec)}</span>
                <span>{t("toolbox.micro.totalBudgetShort", { time: fmtTime(durationSec) })}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 flex-wrap justify-center">
          {!started && !sessionDone ? (
            <button
              type="button"
              onClick={startBudget}
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] px-4 py-2.5 rounded border border-primary/30 text-primary"
            >
              <Play size={12} /> {t("toolbox.launch")}
            </button>
          ) : sessionDone ? (
            <button
              type="button"
              onClick={resetBudget}
              className="w-12 h-12 rounded-2xl border border-border/30 flex items-center justify-center text-muted-foreground"
            >
              <RotateCcw size={18} />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => timer.toggleRunning()}
                className="w-12 h-12 rounded-2xl border border-primary/30 flex items-center justify-center text-primary"
              >
                {timer.isRunning ? <Pause size={18} /> : <Play size={18} />}
              </button>
              {hasSteps && (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] px-4 py-2.5 rounded border border-primary/30 text-primary"
                >
                  {stepIdx >= steps.length - 1 ? t("toolbox.micro.finish") : t("toolbox.micro.next")}
                  <ChevronRight size={12} />
                </button>
              )}
              <button
                type="button"
                onClick={markCompleted}
                className="text-[10px] uppercase tracking-[0.2em] px-3 py-2 rounded border border-border/40 text-muted-foreground"
              >
                {t("toolbox.micro.finishEarly")}
              </button>
              <button
                type="button"
                onClick={resetBudget}
                className="w-12 h-12 rounded-2xl border border-border/30 flex items-center justify-center text-muted-foreground"
              >
                <RotateCcw size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const renderBlock = (block: BlockType) => {
    switch (block) {
      case "markdown":
        return instructions ? (
          <p className="text-sm text-muted-foreground leading-relaxed">{instructions}</p>
        ) : null;
      case "step_list":
      case "checklist":
        if (steps.length === 0) return null;
        return (
          <div className="space-y-2">
            {steps.map((step, idx) => (
              <label key={`${step}-${idx}`} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(checked[idx])}
                  onChange={(e) =>
                    setChecked((prev) => ({ ...prev, [idx]: e.target.checked }))
                  }
                  className="h-4 w-4"
                />
                <span className={checked[idx] ? "line-through text-muted-foreground" : "text-foreground"}>
                  {step}
                </span>
              </label>
            ))}
          </div>
        );
      case "timer":
        if (!durationSec) return null;
        return (
          <div className="rounded-lg border border-border/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{t("toolbox.duration")}</span>
              <span className="text-sm font-medium">{Math.max(0, durationSec - elapsed)}s</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRunning((v) => !v)}
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] px-3 py-2 rounded border border-primary/30 text-primary"
              >
                {isRunning ? <Pause size={12} /> : <Play size={12} />}
                {isRunning ? t("toolbox.pause") : t("toolbox.launch")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRunning(false);
                  setElapsed(0);
                }}
                className="text-[10px] uppercase tracking-[0.2em] px-3 py-2 rounded border border-border/40 text-muted-foreground"
              >
                {t("toolbox.restart")}
              </button>
            </div>
          </div>
        );
      case "single_input":
      case "text_input":
        return (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm"
            placeholder={t("journal.placeholder" as never)}
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
              <input
                key={field}
                type="text"
                value={fields[field] || ""}
                onChange={(e) =>
                  setFields((prev) => ({ ...prev, [field]: e.target.value }))
                }
                placeholder={field}
                className="w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm"
              />
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
    <div className="space-y-4 rounded-xl border border-border/30 bg-secondary/20 p-4">
      {!hideTitle && <h3 className="text-sm font-medium text-foreground">{title}</h3>}

      <div className="space-y-3">
        {blocks.map((block, idx) => (
          <div key={`${block}-${idx}`}>{renderBlock(block)}</div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <button
          type="button"
          onClick={() => onComplete?.()}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] px-3 py-2 rounded border border-primary/30 text-primary"
        >
          <CheckCircle2 size={12} /> {t("toolbox.markDone")}
        </button>
        <button
          type="button"
          onClick={() => onAbandon?.()}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] px-3 py-2 rounded border border-border/40 text-muted-foreground"
        >
          <Clock3 size={12} /> {t("toolbox.abandoned")}
        </button>
      </div>
    </div>
  );
}
