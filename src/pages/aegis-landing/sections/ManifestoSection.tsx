import { useAegisLandingLocale } from "../i18n/AegisLandingLocaleProvider";
import { LandingCard } from "../components/LandingCard";
import { LandingSection } from "../components/LandingSection";

export function ManifestoSection() {
  const { copy } = useAegisLandingLocale();
  if (!copy.manifesto) return null;
  const m = copy.manifesto;

  return (
    <LandingSection label={m.label}>
      <div className="grid items-start gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:gap-16">
        <div>
          <h2 className="aegis-landing__headline whitespace-pre-line text-[clamp(2rem,4vw,3.25rem)]">
            {m.title}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-[1.6] text-[color:var(--aegis-muted)] md:text-[17px]">{m.body}</p>
        </div>
        <LandingCard>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--aegis-bronze-ink)]">{m.cardLabel}</p>
          <p className="mt-4 font-cormorant text-2xl leading-snug text-[color:var(--aegis-text)]">{m.cardBody}</p>
        </LandingCard>
      </div>
    </LandingSection>
  );
}
