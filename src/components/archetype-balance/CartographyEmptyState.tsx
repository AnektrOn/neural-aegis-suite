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
          ? `Aucun rapport publié pour ce compte (${poleLabel} · ${modeLabel}). Vérifiez en admin que l'import a bien ciblé VOTRE utilisateur et que « Publier » était coché.`
          : `No published report for this account (${poleLabel} · ${modeLabel}). Check admin import used YOUR user and Publish was enabled.`}
      </p>
    </NeuralCard>
  );
}
