import { useState } from "react";
import { Houses72QuestionCard } from "@/features/houses72/components/Houses72QuestionCard";
import type { Houses72DraftAnswer } from "@/features/archetype-assessment/hooks/useHouses72Session";
import { getHouse72Question } from "@/features/archetype-assessment/domain/questionsHouses72";
import { getHouse72Prompt, getHouse72Theme, getHouse72Title } from "@/features/archetype-assessment/domain/houses72Locale";
import { useLanguage } from "@/i18n/LanguageContext";
import { copy } from "../promoteDemoData";
import { usePromotePlayer } from "../PromotePlayerContext";

const QUESTION = getHouse72Question(1, 1)!;

export function Houses72Scene() {
  const { locale } = useLanguage();
  const { isFR } = usePromotePlayer();
  const [draft, setDraft] = useState<Houses72DraftAnswer>({
    house: 1,
    questionPosition: 1,
    selections: { 1: 2 },
  });
  return (
    <div className="space-y-4 pb-6 pt-2">
      <p className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {copy(isFR, "Maison I · 1 / 6", "House I · 1 / 6")}
      </p>
      <h1 className="font-cormorant text-3xl font-light">{getHouse72Title(1, locale)}</h1>
      <p className="text-sm text-muted-foreground">{getHouse72Theme(1, locale)}</p>
      <div className="dashboard-panel p-4">
        <Houses72QuestionCard
          question={QUESTION}
          draft={draft}
          onDraftSelectionsChange={(selections) => setDraft((d) => ({ ...d, selections }))}
          prompt={getHouse72Prompt(QUESTION, locale)}
        />
      </div>
    </div>
  );
}
