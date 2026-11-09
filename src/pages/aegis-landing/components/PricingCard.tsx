import { useAegisLandingLocale } from "../i18n/AegisLandingLocaleProvider";
import { LandingButton } from "./LandingButton";
import { LandingCard } from "./LandingCard";
import { LandingCheckIcon } from "./LandingCheckIcon";
import { LandingPill } from "./LandingPill";

export function PricingCard() {
  const { copy } = useAegisLandingLocale();

  return (
    <LandingCard className="mx-auto max-w-md text-center">
      <LandingPill tone="bronze" className="mb-6">{copy.tarif.chip}</LandingPill>
      <p className="aegis-landing__headline text-5xl text-[color:var(--aegis-text)]">
        {copy.tarif.price}
        {copy.tarif.period ? (
          <span className="text-xl text-[color:var(--aegis-text-secondary)]">{copy.tarif.period}</span>
        ) : null}
      </p>
      <ul className="mt-8 space-y-3 text-left text-sm text-[color:var(--aegis-muted)]">
        {copy.tarif.features.map((f) => (
          <li key={f} className="flex gap-2">
            <LandingCheckIcon className="mt-0.5 shrink-0 text-[color:var(--aegis-bronze-ink)]" />
            {f}
          </li>
        ))}
      </ul>
      <LandingButton href="#tarif" variant="dark" className="mt-8 w-full">
        {copy.tarif.cta}
      </LandingButton>
      <LandingButton href="/auth" variant="ghost" className="mt-3 w-full">
        {copy.nav.signIn}
      </LandingButton>
    </LandingCard>
  );
}
