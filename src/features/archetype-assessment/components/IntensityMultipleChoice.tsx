import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  buildResponseFromSelections,
  clampIntensity,
  normalizeResponseSelections,
  optionIndexForId,
} from "../domain/responseSelection";
import type { QuestionSelection, ResponseValue, RuntimeQuestion } from "../domain/types";

const INTENSITY_LEVELS = [
  { value: 1, fr: "Occasionnel", en: "Occasional" },
  { value: 2, fr: "Fréquent", en: "Frequent" },
  { value: 3, fr: "Systématique", en: "Systematic" },
] as const;

const DEFAULT_INTENSITY = 1;

export function IntensityMultipleChoice({
  question,
  value,
  onChange,
  isFR,
}: {
  question: RuntimeQuestion;
  value?: ResponseValue;
  onChange: (v: ResponseValue) => void;
  isFR: boolean;
}) {
  const { t } = useLanguage();
  const meta = question.meta as {
    maxSelect?: number;
    intensityEnabled?: boolean;
    scoringModel?: string;
  };
  const intensityEnabled = meta.intensityEnabled !== false;
  const unlimited = meta.maxSelect == null;
  const max = unlimited ? question.options.length : meta.maxSelect!;
  const selections = normalizeResponseSelections(question, value);

  const selectionByIndex = new Map(
    selections.map((s) => [s.optionIndex, s.intensity] as const),
  );

  const emit = (next: QuestionSelection[]) => {
    onChange(buildResponseFromSelections(question.id, question, next));
  };

  const toggle = (optionId: string) => {
    const optionIndex = optionIndexForId(question, optionId);
    if (optionIndex < 0) return;

    if (selectionByIndex.has(optionIndex)) {
      emit(selections.filter((s) => s.optionIndex !== optionIndex));
      return;
    }
    if (!unlimited && selections.length >= max) return;
    emit([
      ...selections,
      { optionIndex, intensity: DEFAULT_INTENSITY },
    ]);
  };

  const setIntensity = (optionIndex: number, level: number) => {
    if (!selectionByIndex.has(optionIndex)) return;
    emit(
      selections.map((s) =>
        s.optionIndex === optionIndex
          ? { ...s, intensity: clampIntensity(level) }
          : s,
      ),
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground leading-relaxed">
        {intensityEnabled
          ? t("assessment.intensityHelper")
          : t("assessment.maxSelect", { max: String(max) })}
      </p>
      {question.options.map((o) => {
        const optionIndex = optionIndexForId(question, o.id);
        const isSelected = selectionByIndex.has(optionIndex);
        const intensity = selectionByIndex.get(optionIndex) ?? DEFAULT_INTENSITY;
        return (
          <div
            key={o.id}
            className={cn(
              "rounded-lg border border-border/40 p-3 space-y-2",
              isSelected && "bg-accent/10 border-primary/30",
            )}
          >
            <Label className="flex items-start gap-3 cursor-pointer hover:bg-accent/20 rounded-md -m-1 p-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggle(o.id)}
                className="mt-0.5"
              />
              <span className="text-sm leading-snug">{isFR ? o.label_fr : o.label_en}</span>
            </Label>
            {intensityEnabled && isSelected ? (
              <div className="flex flex-wrap items-center gap-2 pl-7">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wide w-full sm:w-auto">
                  {t("assessment.intensityLabel")}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {INTENSITY_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      aria-label={isFR ? level.fr : level.en}
                      title={isFR ? level.fr : level.en}
                      onClick={() => setIntensity(optionIndex, level.value)}
                      className={cn(
                        "h-8 px-2.5 rounded-md text-xs font-medium border transition-colors",
                        intensity === level.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background/60 text-muted-foreground border-border/50 hover:border-primary/40",
                      )}
                    >
                      <span className="tabular-nums">{level.value}</span>
                      <span className="hidden sm:inline ml-1 opacity-80">
                        · {isFR ? level.fr : level.en}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
