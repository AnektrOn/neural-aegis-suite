import { useAegisLandingLocale } from "../i18n/AegisLandingLocaleProvider";
import { LandingSection } from "../components/LandingSection";
import { OrgNetworkDiagram } from "../components/OrgNetworkDiagram";

export function ProblemSection() {
  const { copy } = useAegisLandingLocale();
  const points = copy.problem.points;

  return (
    <LandingSection id="probleme" label={copy.problem.label} title={copy.problem.title}>
      {points && points.length > 0 ? (
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <ul className="space-y-4 text-base leading-[1.6] text-[color:var(--aegis-muted)] md:text-[17px]">
            {points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <OrgNetworkDiagram
            className="mx-auto w-full max-w-md"
            label={copy.problem.diagramLabel ?? copy.problem.title}
          />
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <p className="text-base leading-[1.6] text-[color:var(--aegis-muted)] md:text-[17px]">{copy.problem.col1}</p>
          <p className="text-base leading-[1.6] text-[color:var(--aegis-muted)] md:text-[17px]">{copy.problem.col2}</p>
        </div>
      )}
    </LandingSection>
  );
}
