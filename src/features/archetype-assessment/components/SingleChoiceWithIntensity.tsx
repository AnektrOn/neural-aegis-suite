import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import type { ResponseValue, RuntimeQuestion } from "../domain/types";

const INTENSITY_LEVELS = [
  { value: 1, fr: "Faible — c'est un peu moi", en: "Low — somewhat me" },
  { value: 2, fr: "Moyen — c'est souvent moi", en: "Medium — often me" },
  { value: 3, fr: "Fort — c'est mon cœur identitaire", en: "Strong — core identity" },
] as const;

export function SingleChoiceWithIntensity({
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
  const selectedId = value?.selectedOptionIds?.[0] ?? "";
  const intensity = value?.optionIntensities?.[selectedId] ?? 2;

  const emit = (optionId: string, nextIntensity: number) => {
    onChange({
      questionId: question.id,
      selectedOptionIds: [optionId],
      optionIntensities: { [optionId]: nextIntensity },
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground leading-relaxed">{t("assessment.intensityHelperSimple")}</p>
      <RadioGroup
        value={selectedId}
        onValueChange={(id) => emit(id, intensity)}
        className="space-y-2"
      >
        {question.options.map((o) => (
          <Label
            key={o.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border border-border/40 cursor-pointer transition-colors",
              selectedId === o.id ? "bg-accent/10 border-primary/30" : "hover:bg-accent/20",
            )}
          >
            <RadioGroupItem value={o.id} className="mt-0.5" />
            <span className="text-sm leading-snug">{isFR ? o.label_fr : o.label_en}</span>
          </Label>
        ))}
      </RadioGroup>

      {selectedId ? (
        <div className="rounded-lg border border-border/40 bg-background/40 p-3 space-y-2">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
            {t("assessment.intensityChoiceLabel")}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {INTENSITY_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => emit(selectedId, level.value)}
                className={cn(
                  "h-9 px-3 rounded-md text-xs font-medium border transition-colors text-left",
                  intensity === level.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background/60 text-muted-foreground border-border/50 hover:border-primary/40",
                )}
              >
                <span className="tabular-nums font-semibold">{level.value}</span>
                <span className="ml-1.5 opacity-90">{isFR ? level.fr : level.en}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
