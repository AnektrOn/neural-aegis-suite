import { useAegisLandingLocale } from "../i18n/AegisLandingLocaleProvider";
import { LandingCard } from "../components/LandingCard";
import { LandingSection } from "../components/LandingSection";
import { OrgReportMockup } from "../components/OrgReportMockup";
import { WeeklyReportMockup } from "../components/WeeklyReportMockup";

export function RecevezSection() {
  const { copy } = useAegisLandingLocale();
  return (
    <LandingSection
      id="recevez"
      dark
      label={copy.recevez.label}
      title={copy.recevez.title}
      className="relative overflow-hidden"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 70% 20%, rgba(211,157,123,0.15), transparent)",
        }}
        aria-hidden
      />
      <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {copy.recevez.cards.map((card, i) => (
          <LandingCard key={card.title} dark className="!p-5">
            <p className="font-mono text-[10px] text-[color:var(--aegis-bronze)]">0{i + 1}</p>
            <h3 className="mt-2 font-cormorant text-xl text-[color:var(--aegis-dark-text)]">{card.title}</h3>
            <p className="mt-2 text-sm text-[color:var(--aegis-dark-secondary)]">{card.body}</p>
          </LandingCard>
        ))}
      </div>
      {copy.recevez.mockup.heatmapRows ? <OrgReportMockup /> : <WeeklyReportMockup />}
    </LandingSection>
  );
}
