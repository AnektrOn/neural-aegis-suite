/**
 * TrackingQuestionCard
 *
 * Renders a single tracking question.
 * Supports scale (slider), choice (buttons), and text input.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TrackingQuestion, TrackingResponseValue } from "../domain/types";

interface Props {
  question: TrackingQuestion;
  locale?: "fr" | "en";
  onSubmit: (value: TrackingResponseValue) => void;
  isSubmitting?: boolean;
}

const ARCHETYPE_COLOR: Record<string, string> = {
  sovereign: "hsl(45 90% 55%)",
  warrior:   "hsl(0 75% 58%)",
  lover:     "hsl(330 70% 58%)",
  caregiver: "hsl(200 70% 55%)",
  creator:   "hsl(265 65% 60%)",
  explorer:  "hsl(155 60% 50%)",
  rebel:     "hsl(20 80% 55%)",
  sage:      "hsl(220 60% 58%)",
  mystic:    "hsl(280 60% 58%)",
  healer:    "hsl(170 55% 50%)",
  magician:  "hsl(305 60% 58%)",
  jester:    "hsl(55 85% 55%)",
};

export function TrackingQuestionCard({ question, locale = "fr", onSubmit, isSubmitting }: Props) {
  const { t } = useLanguage();
  const [scaleValue, setScaleValue] = useState<number>(Math.ceil((question.scale_min + question.scale_max) / 2));
  const [choiceValue, setChoiceValue] = useState<string | null>(null);
  const [textValue, setTextValue] = useState("");

  const questionText = locale === "fr" ? question.question_fr : question.question_en;
  const archetypeColor = question.archetype_target
    ? ARCHETYPE_COLOR[question.archetype_target] ?? "hsl(var(--primary))"
    : "hsl(var(--primary))";

  const handleSubmit = () => {
    if (question.question_type === "scale") {
      onSubmit({ type: "scale", numeric_value: scaleValue });
    } else if (question.question_type === "choice") {
      if (!choiceValue) return;
      const opt = question.options.find((o) => o.value === choiceValue);
      onSubmit({
        type: "choice",
        choice_value: choiceValue,
        weights_applied: opt?.weights ?? [],
      });
    } else {
      if (!textValue.trim()) return;
      onSubmit({ type: "text", text_value: textValue.trim() });
    }
  };

  const canSubmit = question.question_type === "scale"
    ? true
    : question.question_type === "choice"
      ? choiceValue !== null
      : textValue.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6"
    >
      {/* Question prompt */}
      <div className="space-y-2">
        {question.archetype_target && (
          <span
            className="inline-block text-[10px] uppercase tracking-widest font-display px-2 py-0.5 rounded-full border"
            style={{ color: archetypeColor, borderColor: archetypeColor + "40" }}
          >
            {question.archetype_target}
            {question.house_target ? ` · Maison ${question.house_target}` : ""}
          </span>
        )}
        <p className="text-base font-medium leading-relaxed text-foreground">
          {questionText}
        </p>
      </div>

      {/* Input */}
      {question.question_type === "scale" && (
        <div className="space-y-4">
          <div className="flex justify-between text-xs text-text-tertiary">
            <span>{question.scale_min}</span>
            <span
              className="text-2xl font-bold font-display"
              style={{ color: archetypeColor }}
            >
              {scaleValue}
            </span>
            <span>{question.scale_max}</span>
          </div>
          <Slider
            min={question.scale_min}
            max={question.scale_max}
            step={1}
            value={[scaleValue]}
            onValueChange={([v]) => setScaleValue(v)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-text-tertiary">
            <span>{t("tracking.checkin.scaleLow")}</span>
            <span>{t("tracking.checkin.scaleHigh")}</span>
          </div>
        </div>
      )}

      {question.question_type === "choice" && (
        <div className="flex flex-col gap-2">
          {question.options.map((opt) => {
            const label = locale === "fr" ? opt.label_fr : opt.label_en;
            const isSelected = choiceValue === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setChoiceValue(opt.value)}
                className={[
                  "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-150",
                  isSelected
                    ? "border-[2px] bg-white/5"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]",
                ].join(" ")}
                style={isSelected ? { borderColor: archetypeColor } : {}}
              >
                <span style={isSelected ? { color: archetypeColor } : {}}>{label}</span>
              </button>
            );
          })}
        </div>
      )}

      {question.question_type === "text" && (
        <Textarea
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder={locale === "fr" ? "Votre réponse..." : "Your answer..."}
          className="min-h-[100px] bg-white/[0.03] border-white/10 resize-none"
        />
      )}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit || isSubmitting}
        className="w-full"
        style={{ background: archetypeColor }}
      >
        {isSubmitting ? "..." : t("tracking.checkin.continue")}
      </Button>
    </motion.div>
  );
}
