import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { IntensityMultipleChoice } from "./IntensityMultipleChoice";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageContext";
import type { ResponseValue, RuntimeQuestion } from "../domain/types";

export function AssessmentQuestionRenderer({
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
  const prompt = isFR ? question.prompt_fr : question.prompt_en;
  const helper = isFR ? question.helper_fr : question.helper_en;
  const intensityEnabled =
    (question.meta as { intensityEnabled?: boolean } | undefined)?.intensityEnabled === true;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-medium leading-snug">{prompt}</h3>
        {helper && <p className="text-xs text-muted-foreground mt-1">{helper}</p>}
      </div>

      {intensityEnabled &&
      (question.question_type === "single_choice" || question.question_type === "multiple_choice") ? (
        <IntensityMultipleChoice question={question} value={value} onChange={onChange} isFR={isFR} />
      ) : null}

      {question.question_type === "single_choice" && !intensityEnabled ? (
        <RadioGroup
          value={value?.selectedOptionIds?.[0] ?? ""}
          onValueChange={(v) =>
            onChange({ questionId: question.id, selectedOptionIds: [v] })
          }
          className="space-y-2"
        >
          {question.options.map((o) => (
            <Label
              key={o.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border/40 hover:bg-accent/20 cursor-pointer"
            >
              <RadioGroupItem value={o.id} className="mt-0.5" />
              <span className="text-sm">{isFR ? o.label_fr : o.label_en}</span>
            </Label>
          ))}
        </RadioGroup>
      ) : null}

      {question.question_type === "multiple_choice" && !intensityEnabled ? (
        <IntensityMultipleChoice question={question} value={value} onChange={onChange} isFR={isFR} />
      ) : null}

      {question.question_type === "likert_scale" && (
        <LikertScale question={question} value={value} onChange={onChange} isFR={isFR} t={t} />
      )}

      {question.question_type === "ranking" && (
        <Ranking question={question} value={value} onChange={onChange} isFR={isFR} t={t} />
      )}

      {question.question_type === "short_text" && (
        <Textarea
          value={value?.textValue ?? ""}
          maxLength={(question.meta as { maxLength?: number })?.maxLength ?? 280}
          onChange={(e) =>
            onChange({ questionId: question.id, textValue: e.target.value })
          }
          placeholder={t("assessment.answerPlaceholder")}
          rows={4}
        />
      )}
    </div>
  );
}

function LikertScale({
  question,
  value,
  onChange,
  isFR,
  t,
}: {
  question: RuntimeQuestion;
  value?: ResponseValue;
  onChange: (v: ResponseValue) => void;
  isFR: boolean;
  t: (key: string, vars?: Record<string, string>) => string;
}) {
  const options = question.options;
  const selectedIdx = options.findIndex((o) => value?.selectedOptionIds?.includes(o.id));
  const idx = selectedIdx >= 0 ? selectedIdx : Math.floor(options.length / 2);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("assessment.likertMin")}</span>
        <span>{t("assessment.likertMax")}</span>
      </div>
      <Slider
        value={[idx]}
        min={0}
        max={options.length - 1}
        step={1}
        onValueChange={(v) => {
          const o = options[v[0]];
          if (o)
            onChange({
              questionId: question.id,
              selectedOptionIds: [o.id],
              numericValue: o.value ?? undefined,
            });
        }}
      />
      <p className="text-center text-sm font-medium">
        {selectedIdx >= 0 ? (isFR ? options[selectedIdx].label_fr : options[selectedIdx].label_en) : "—"}
      </p>
    </div>
  );
}

function Ranking({
  question,
  value,
  onChange,
  isFR,
  t,
}: {
  question: RuntimeQuestion;
  value?: ResponseValue;
  onChange: (v: ResponseValue) => void;
  isFR: boolean;
  t: (key: string, vars?: Record<string, string>) => string;
}) {
  const order =
    value?.selectedOptionIds && value.selectedOptionIds.length === question.options.length
      ? value.selectedOptionIds
      : question.options.map((o) => o.id);

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange({ questionId: question.id, selectedOptionIds: next });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{t("assessment.rankingHint")}</p>
      {order.map((id, idx) => {
        const o = question.options.find((x) => x.id === id);
        if (!o) return null;
        return (
          <div
            key={id}
            className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-background/40"
          >
            <span className="text-xs font-mono w-6 text-muted-foreground">#{idx + 1}</span>
            <span className="flex-1 text-sm">{isFR ? o.label_fr : o.label_en}</span>
            <Button size="sm" variant="ghost" onClick={() => move(idx, -1)} disabled={idx === 0}>
              ▲
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => move(idx, 1)}
              disabled={idx === order.length - 1}
            >
              ▼
            </Button>
          </div>
        );
      })}
    </div>
  );
}
