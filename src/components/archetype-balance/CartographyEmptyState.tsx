import { FileQuestion } from "lucide-react";
import { NeuralCard } from "@/components/ui/neural-card";
import type { AnalysisMode, ArchetypePole } from "@/lib/archetype-cartography/types";
import { POLE_THEMES } from "@/lib/archetype-cartography/pole-theme";

interface CartographyEmptyStateProps {
  pole: ArchetypePole;
  mode: AnalysisMode;
  locale: "fr" | "en";
}

export function CartographyEmptyState({ pole, mode, locale }: CartographyEmptyStateProps) {
  const isFR = locale === "fr";
  const poleLabel = POLE_THEMES[pole][isFR ? "labelFr" : "labelEn"];
  const modeLabel =
    mode === "clinique"
      ? isFR
        ? "Analyse clinique"
        : "Clinical analysis"
      : isFR
        ? "Analyse"
        : "Analysis";

  return (
    <NeuralCard variant="premium" className="p-8 text-center">
      <FileQuestion
        size={32}
        strokeWidth={1.2}
        className="mx-auto mb-4 text-text-tertiary"
        aria-hidden
      />
      <h2 className="font-display text-sm uppercase tracking-[0.12em] text-text-primary">
        {isFR ? "Contenu à venir" : "Content coming soon"}
      </h2>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-text-secondary">
        {isFR
          ? `Le rapport ${modeLabel} · Pôle ${poleLabel} n'est pas encore disponible. Seul le rapport Balance · Analyse est chargé pour l'instant.`
          : `The ${modeLabel} · ${poleLabel} pole report is not available yet. Only the Balance · Analysis report is loaded for now.`}
      </p>
    </NeuralCard>
  );
}
