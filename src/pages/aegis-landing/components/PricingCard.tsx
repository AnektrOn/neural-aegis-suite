import { useAegisLandingLocale } from "../i18n/AegisLandingLocaleProvider";
import { LandingButton } from "./LandingButton";
import { LandingCard } from "./LandingCard";
import { LandingCheckIcon } from "./LandingCheckIcon";
import { LandingPill } from "./LandingPill";

export function PricingCard() {
  const { copy } = useAegisLandingLocale();
  const ctaHref = copy.tarif.ctaHref ?? "#tarif";
  const secondaryHref = copy.tarif.secondaryCtaHref ?? "/auth";
  const secondaryLabel = copy.tarif.secondaryCta ?? copy.nav.signIn;

  return (
    <LandingCard className="mx-auto max-w-md text-center">
      {copy.tarif.chip ? (
        <LandingPill tone="bronze" className="mb-6">
          {copy.tarif.chip}
        </LandingPill>
      ) : null}
      {copy.tarif.body ? (
        <p className="mb-6 text-left text-[15px] leading-relaxed text-[color:var(--aegis-muted)] md:text-[16px]">
          {copy.tarif.body}
        </p>
      ) : null}
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
      <LandingButton href={ctaHref} variant="dark" className="mt-8 w-full">
        {copy.tarif.cta}
      </LandingButton>
      {copy.tarif.secondaryCta ? (
        <a
          href={secondaryHref}
          className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center font-mono text-xs tracking-[0.08em] text-[color:var(--aegis-text-secondary)] underline-offset-4 transition-colors hover:text-[color:var(--aegis-text)] hover:underline"
        >
          {secondaryLabel}
        </a>
      ) : (
        <LandingButton href="/auth" variant="ghost" className="mt-3 w-full">
          {copy.nav.signIn}
        </LandingButton>
      )}
    </LandingCard>
  );
}
