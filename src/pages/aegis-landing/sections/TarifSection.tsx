import { useAegisLandingLocale } from "../i18n/AegisLandingLocaleProvider";
import { LandingSection } from "../components/LandingSection";
import { PricingCard } from "../components/PricingCard";

export function TarifSection() {
  const { copy } = useAegisLandingLocale();
  return (
    <LandingSection
      id="tarif"
      label={copy.tarif.label}
      title={copy.tarif.title}
      className="bg-[#F4F4F5]/40"
    >
      <PricingCard />
    </LandingSection>
  );
}
