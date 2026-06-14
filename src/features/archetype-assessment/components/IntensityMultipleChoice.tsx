import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ResponseValue, RuntimeQuestion } from "../domain/types";

const INTENSITY_LEVELS = [
  { value: 1, fr: "Occasionnel", en: "Occasional" },
  { value: 2, fr: "Fréquent", en: "Frequent" },
  { value: 3, fr: "Systématique", en: "Systematic" },
] as const;

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
  const meta = question.meta as {
    maxSelect?: number;
    intensityEnabled?: boolean;
    scoringModel?: string;
  };
  const intensityEnabled = meta.intensityEnabled === true;
  const unlimited = meta.maxSelect == null;
  const max = unlimited ? question.options.length : meta.maxSelect!;
  const selected = value?.selectedOptionIds ?? [];
  const intensities = value?.optionIntensities ?? {};

  const emit = (nextSelected: string[], nextIntensities: Record<string, number>) => {
    const payload: ResponseValue = {
      questionId: question.id,
      selectedOptionIds: nextSelected,
    };
    if (intensityEnabled && nextSelected.length > 0) {
      payload.optionIntensities = Object.fromEntries(
        nextSelected.map((id) => [id, nextIntensities[id] ?? 2]),
      );
    }
    onChange(payload);
  };

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      const nextSelected = selected.filter((x) => x !== id);
      const nextIntensities = { ...intensities };
      delete nextIntensities[id];
      emit(nextSelected, nextIntensities);
      return;
    }
    if (!unlimited && selected.length >= max) return;
    emit([...selected, id], { ...intensities, [id]: intensities[id] ?? 2 });
  };

  const setIntensity = (id: string, level: number) => {
    if (!selected.includes(id)) return;
    emit(selected, { ...intensities, [id]: level });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground leading-relaxed">
        {intensityEnabled
          ? isFR
            ? "Cochez toutes les réactions qui résonnent — plusieurs archétypes peuvent coexister. Pour chaque option, indiquez l'intensité (1 = occasionnel, 2 = fréquent, 3 = systématique)."
            : "Check every reaction that resonates — several archetypes can coexist. For each option, set intensity (1 = occasional, 2 = frequent, 3 = systematic)."
          : isFR
            ? `Sélection max : ${max}`
            : `Max select: ${max}`}
      </p>
      {question.options.map((o) => {
        const isSelected = selected.includes(o.id);
        const intensity = intensities[o.id] ?? 2;
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
                  {isFR ? "Intensité" : "Intensity"}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {INTENSITY_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      aria-label={isFR ? level.fr : level.en}
                      title={isFR ? level.fr : level.en}
                      onClick={() => setIntensity(o.id, level.value)}
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
