import { useLanguage } from "@/i18n/LanguageContext";
import type { V4PoleAnalysis } from "@/features/archetype-assessment/domain/types";
import { cn } from "@/lib/utils";
import { V4CartographyConstellation } from "./V4CartographyConstellation";

interface Props {
  isFR?: boolean;
  analysis: V4PoleAnalysis;
  className?: string;
}

export function V4CartographyHeroPanel({ isFR: isFRProp, analysis, className }: Props) {
  const { locale, t } = useLanguage();
  const isFR = isFRProp ?? locale === "fr";

  return (
    <section
      data-slot="v4-cartography"
      className={cn(
        "deep-dive-v4-hero relative rounded-xl border border-border/40 p-3 sm:rounded-2xl sm:p-6",
        className,
      )}
      aria-label={t("assessment.v4CartographyShort")}
    >
      <V4CartographyConstellation isFR={isFR} analysis={analysis} />
    </section>
  );
}
