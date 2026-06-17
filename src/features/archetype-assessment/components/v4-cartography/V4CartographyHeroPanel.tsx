import { useLanguage } from "@/i18n/LanguageContext";
import type { V4PoleAnalysis } from "@/features/archetype-assessment/domain/types";
import { V4CartographyConstellation } from "./V4CartographyConstellation";

interface Props {
  isFR?: boolean;
  analysis: V4PoleAnalysis;
}

export function V4CartographyHeroPanel({ isFR: isFRProp, analysis }: Props) {
  const { locale, t } = useLanguage();
  const isFR = isFRProp ?? locale === "fr";
  const { totalPolePoints } = analysis;

  return (
    <section
      className="deep-dive-v4-hero rounded-2xl border border-white/10"
      aria-label={t("assessment.v4CartographyShort")}
    >
      <header className="border-b border-white/[0.06] px-6 py-5 sm:px-8 sm:py-6 space-y-2">
        <p className="font-display text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--aegis-warm)/0.85)]">
          {t("assessment.v4CartographyShort")}
        </p>
        <h2 className="font-display text-xl sm:text-2xl tracking-[0.1em] uppercase text-text-primary leading-tight">
          {t("assessment.v4ConstellationTitle")}
        </h2>
        <p className="text-sm text-text-tertiary leading-relaxed max-w-md">
          {t("assessment.v4HoverHint")}
        </p>
      </header>

      <div className="deep-dive-v4-hero-body overflow-visible px-2 py-5 sm:px-4 sm:py-7">
        <V4CartographyConstellation isFR={isFR} analysis={analysis} />
        {totalPolePoints > 0 && (
          <p className="mt-2 text-center text-[11px] text-text-tertiary/75 tabular-nums">
            {t("assessment.v4TotalScore", { total: totalPolePoints.toFixed(0) })}
          </p>
        )}
      </div>
    </section>
  );
}
