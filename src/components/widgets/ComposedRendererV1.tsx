import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Play, Pause } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { pickWidgetCatalogCopy } from "@/lib/toolbox-widget-i18n";
import type { Locale } from "@/i18n/translations";

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
  onComplete?: () => void;
  onAbandon?: () => void;
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

export default function ComposedRendererV1({
  config,
  title,
  hideTitle,
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
  const blocks: BlockType[] = Array.isArray(
    (blueprint as { blocks?: BlockType[] } | undefined)?.blocks,
  )
    ? ((blueprint as { blocks?: BlockType[] }).blocks as BlockType[])
    : ["markdown", "step_list", "timer"];

  useEffect(() => {
    if (!isRunning || durationSec <= 0) return;
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
  }, [durationSec, isRunning, onComplete]);

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
            placeholder={t("journal.placeholder")}
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
