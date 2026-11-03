import { useAegisLandingLocale } from "../i18n/AegisLandingLocaleProvider";
import { LandingAccordion } from "../components/LandingAccordion";
import { LandingSection } from "../components/LandingSection";

export function FaqSection() {
  const { copy } = useAegisLandingLocale();

  return (
    <LandingSection id="faq" label={copy.faq.label} title={copy.faq.title}>
      <LandingAccordion items={copy.faq.items} />
    </LandingSection>
  );
}
