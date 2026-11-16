import { useAegisLandingLocale } from "../i18n/AegisLandingLocaleProvider";
import { LandingButton } from "./LandingButton";
import { LandingCard } from "./LandingCard";
import { LandingCheckIcon } from "./LandingCheckIcon";
import { LandingPill } from "./LandingPill";
import { SOLO_PRICING } from "../soloPricing";

export function PricingCard() {
  const { copy, locale, audience } = useAegisLandingLocale();
  const isFR = locale === "fr";
  if (audience === "individuel") {
    const features = isFR
      ? [
          ["Bilan archétypal inclus", "Dashboard de pilotage et People Board 3D", "Registre des décisions", "10 outils / semaine", "50 interactions RAG / semaine (min.)"],
          ["Tout AEGIS Solo", "Agent vocal IA LOGOS intégré", "Débriefing oral et préparation vocale", "Connexion Vault et historique décisionnel"],
          ["Accès à vie à AEGIS Solo", "Rapport d’onboarding inclus", "Mises à jour majeures incluses", "Garantie sérénité 30 jours", "LOGOS en option, abonnement séparé"],
        ]
      : [
          ["Archetypal onboarding report included", "Executive dashboard and 3D People Board", "Decision registry", "10 tools / week", "50 RAG interactions / week (min.)"],
          ["Everything in AEGIS Solo", "Integrated LOGOS AI voice agent", "Oral debrief and voice preparation", "Vault and decision history connected"],
          ["Lifetime AEGIS Solo access", "Onboarding report included", "Major updates included", "30-day serenity guarantee", "LOGOS optional, separate subscription"],
        ];
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        {SOLO_PRICING.map((plan, index) => (
          <LandingCard key={plan.id} className="flex min-w-0 flex-col text-left">
            <h3 className="text-xl font-medium text-[color:var(--aegis-text)]">
              {plan.interval === "once" && !isFR ? "Founding Members" : plan.name}
            </h3>
            <p className="mt-4 text-4xl text-[color:var(--aegis-text)]">
              {plan.amount} € <span className="text-base text-[color:var(--aegis-text-secondary)]">{isFR ? "HT" : "excl. tax"}</span>
            </p>
            <p className="mt-2 text-sm text-[color:var(--aegis-muted)]">
              {plan.interval === "month"
                ? isFR ? "par mois" : "per month"
                : isFR ? `Paiement unique · ${plan.maxSeats} places maximum` : `One-time payment · ${plan.maxSeats} seats maximum`}
            </p>
            <ul className="my-8 flex-1 space-y-3 text-sm text-[color:var(--aegis-muted)]">
              {features[index]?.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <LandingCheckIcon className="mt-0.5 shrink-0 text-[color:var(--aegis-bronze-ink)]" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <LandingButton href="/pricing" variant="dark" className="w-full px-3 text-center">
              {isFR ? "Voir l’offre" : "View plan"}
            </LandingButton>
          </LandingCard>
        ))}
      </div>
    );
  }
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
