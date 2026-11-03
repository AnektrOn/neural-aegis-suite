import { useAegisLandingLocale } from "../i18n/AegisLandingLocaleProvider";
import { LandingCard } from "../components/LandingCard";
import { LandingSection } from "../components/LandingSection";

export function PourQuiSection() {
  const { copy } = useAegisLandingLocale();
  return (
    <LandingSection id="pour-qui" label={copy.pourQui.label} title={copy.pourQui.title}>
      <div className="grid gap-6 md:grid-cols-2">
        {copy.pourQui.cards.map((card) => (
          <LandingCard key={card.title}>
            <h3 className="font-cormorant text-2xl">{card.title}</h3>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[color:var(--aegis-muted)]">
              {card.bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="text-[color:var(--aegis-bronze-ink)]" aria-hidden>
                    ·
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </LandingCard>
        ))}
      </div>
    </LandingSection>
  );
}
