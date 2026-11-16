import { useAegisLandingLocale } from "../i18n/AegisLandingLocaleProvider";
import { LandingSection } from "../components/LandingSection";
import { PricingCard } from "../components/PricingCard";

export function TarifSection() {
  const { copy, audience, locale } = useAegisLandingLocale();
  return (
    <LandingSection
      id="tarif"
      label={copy.tarif.label}
      title={copy.tarif.title}
      className="bg-[color:var(--aegis-page)]"
    >
      <PricingCard />
      {audience === "individuel" && (
        <p className="mt-6 text-center text-sm text-[color:var(--aegis-muted)]">
          {locale === "fr"
            ? "Prix HT. TVA calculée au paiement selon votre pays. Offres entreprise : sur devis."
            : "Prices exclude tax. VAT calculated at checkout based on your country. Team plans: contact us."}
        </p>
      )}
    </LandingSection>
  );
}
