import { useAegisLandingLocale } from "../i18n/AegisLandingLocaleProvider";
import { LandingCard } from "../components/LandingCard";
import { LandingSection } from "../components/LandingSection";

export function DonneesSection() {
  const { copy } = useAegisLandingLocale();
  return (
    <LandingSection
      id="donnees"
      dark
      label={copy.donnees.label}
      title={copy.donnees.title}
    >
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <p className="text-base leading-relaxed text-[color:var(--aegis-dark-secondary)] md:text-[17px]">
          {copy.donnees.body}
        </p>
        <LandingCard dark className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[color:var(--aegis-bronze)]/60"
            aria-hidden
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect
                x="5"
                y="11"
                width="14"
                height="10"
                rx="2"
                stroke="var(--aegis-bronze)"
                strokeWidth="1.2"
              />
              <path
                d="M8 11V8a4 4 0 118 0v3"
                stroke="var(--aegis-bronze)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <ul className="space-y-2 text-sm text-[color:var(--aegis-dark-secondary)]">
            {copy.donnees.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </LandingCard>
      </div>
    </LandingSection>
  );
}
