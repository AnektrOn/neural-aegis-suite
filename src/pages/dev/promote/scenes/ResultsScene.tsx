import { DualLayerRadar } from "@/features/archetype-assessment/components/DualLayerRadar";
import { NarrativeProfileCard } from "@/features/archetype-assessment/components/NarrativeProfileCard";
import type { ArchetypeKey } from "@/features/archetype-assessment/domain/types";
import {
  PROMOTE_LIGHT_SCORES,
  PROMOTE_SHADOW_SIGNALS,
  PROMOTE_TOP_ARCHETYPES,
  PROMOTE_USER,
  copy,
} from "../promoteDemoData";
import { usePromotePlayer } from "../PromotePlayerContext";

export function ResultsScene() {
  const { isFR } = usePromotePlayer();
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-background px-4 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <p className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {copy(isFR, "Profil archétypal", "Archetypal profile")}
      </p>
      <h1 className="mt-1 font-cormorant text-3xl font-light">
        {copy(isFR, `Triade de ${PROMOTE_USER.firstName}`, `${PROMOTE_USER.firstName}’s triad`)}
      </h1>
      <div className="mt-4 w-full">
        <DualLayerRadar isFR={isFR} lightScores={PROMOTE_LIGHT_SCORES} shadowSignals={PROMOTE_SHADOW_SIGNALS} />
      </div>
      <div className="mt-4">
        <NarrativeProfileCard
          isFR={isFR}
          topArchetypes={[...PROMOTE_TOP_ARCHETYPES] as ArchetypeKey[]}
          shadowSignals={PROMOTE_SHADOW_SIGNALS}
        />
      </div>
    </div>
  );
}
