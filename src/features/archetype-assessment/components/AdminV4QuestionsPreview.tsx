import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Sun, Moon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import { V4_QUESTIONS, V4_QUESTION_COUNT } from "../domain/questionsV4";
import { getArchetype } from "../domain/archetypes";
import type { V4VectorSlot } from "../domain/types";

const DIMENSION_KEYS: Record<string, TranslationKey> = {
  identity: "admin.assessments.v4.dimension.identity",
  power: "admin.assessments.v4.dimension.power",
  relationship: "admin.assessments.v4.dimension.relationship",
  creation: "admin.assessments.v4.dimension.creation",
  spirituality: "admin.assessments.v4.dimension.spirituality",
};

const LETTERS = ["A", "B", "C", "D", "E", "F"] as const;

function VectorChip({
  slot,
  isFR,
  variant,
}: {
  slot: V4VectorSlot;
  isFR: boolean;
  variant: "light" | "shadow";
}) {
  const meta = getArchetype(slot.archetype);
  const name = isFR ? meta.name_fr : meta.name_en;
  const Icon = variant === "light" ? Sun : Moon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-mono",
        variant === "light"
          ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
          : "border-indigo-500/30 bg-indigo-500/10 text-indigo-200",
      )}
    >
      <Icon className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
      +{slot.points}
      {variant === "light" ? "L" : "S"} {name}
    </span>
  );
}

function optionLetter(position: number): string {
  return LETTERS[position - 1] ?? String(position);
}

export function AdminV4QuestionsPreview() {
  const { t, locale } = useLanguage();
  const [previewLocale, setPreviewLocale] = useState<"fr" | "en">(locale === "en" ? "en" : "fr");
  const [openQuestions, setOpenQuestions] = useState<Set<number>>(() => new Set([1]));
  const isFR = previewLocale === "fr";

  const optionCount = useMemo(
    () => V4_QUESTIONS.reduce((n, q) => n + q.options.length, 0),
    [],
  );

  const toggleQuestion = (position: number) => {
    setOpenQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(position)) next.delete(position);
      else next.add(position);
      return next;
    });
  };

  const expandAll = () => setOpenQuestions(new Set(V4_QUESTIONS.map((q) => q.position)));
  const collapseAll = () => setOpenQuestions(new Set());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif">{t("admin.assessments.v4.preview.title")}</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            {t("admin.assessments.v4.preview.subtitle", {
              questions: V4_QUESTION_COUNT,
              options: optionCount,
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-border/50 p-0.5">
            <Button
              type="button"
              size="sm"
              variant={previewLocale === "fr" ? "secondary" : "ghost"}
              className="h-8 text-xs"
              onClick={() => setPreviewLocale("fr")}
            >
              FR
            </Button>
            <Button
              type="button"
              size="sm"
              variant={previewLocale === "en" ? "secondary" : "ghost"}
              className="h-8 text-xs"
              onClick={() => setPreviewLocale("en")}
            >
              EN
            </Button>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={expandAll}>
            {t("admin.assessments.v4.preview.expandAll")}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={collapseAll}>
            {t("admin.assessments.v4.preview.collapseAll")}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {V4_QUESTIONS.map((q) => {
          const open = openQuestions.has(q.position);
          const dimKey = q.dimension ? DIMENSION_KEYS[q.dimension] : null;
          const dimLabel = dimKey ? t(dimKey) : q.dimension ?? "—";
          const prompt = isFR ? q.prompt_fr : q.prompt_en;

          return (
            <Card
              key={q.position}
              className="overflow-hidden backdrop-blur-3xl bg-card/40 border-border/40"
            >
              <button
                type="button"
                className="flex w-full items-start gap-3 p-4 text-left hover:bg-accent/20 transition"
                onClick={() => toggleQuestion(q.position)}
                aria-expanded={open}
              >
                {open ? (
                  <ChevronDown className="w-4 h-4 mt-1 shrink-0 text-muted-foreground" aria-hidden />
                ) : (
                  <ChevronRight className="w-4 h-4 mt-1 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                      Q{q.position}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {dimLabel}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{prompt}</p>
                  {!open && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("admin.assessments.v4.preview.optionsCount", { count: q.options.length })}
                    </p>
                  )}
                </div>
              </button>

              {open && (
                <ol className="border-t border-border/40 divide-y divide-border/30">
                  {q.options.map((opt) => {
                    const letter = optionLetter(opt.position);
                    const label = isFR ? opt.label_fr : opt.label_en;
                    const { vector } = opt;
                    return (
                      <li key={opt.position} className="px-4 py-3 pl-11">
                        <div className="flex gap-2">
                          <span className="text-xs font-semibold text-muted-foreground shrink-0 w-5">
                            {letter}.
                          </span>
                          <div className="min-w-0 flex-1 space-y-2">
                            <p className="text-sm leading-relaxed">{label}</p>
                            <div className="flex flex-wrap gap-1.5">
                              <VectorChip slot={vector.primaryLight} isFR={isFR} variant="light" />
                              <VectorChip slot={vector.secondaryLight} isFR={isFR} variant="light" />
                              <VectorChip slot={vector.primaryShadow} isFR={isFR} variant="shadow" />
                              <VectorChip slot={vector.secondaryShadow} isFR={isFR} variant="shadow" />
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
