import { useAegisLandingLocale } from "../i18n/AegisLandingLocaleProvider";
import { ComparisonTable } from "../components/ComparisonTable";
import { LandingSection } from "../components/LandingSection";

export function ComparatifSection() {
  const { copy } = useAegisLandingLocale();
  return (
    <LandingSection
      id="comparatif"
      label={copy.comparatif.label}
      title={copy.comparatif.title}
      className="bg-white/40"
    >
      <ComparisonTable />
    </LandingSection>
  );
}
