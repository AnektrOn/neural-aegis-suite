import { useAegisLandingLocale } from "../i18n/AegisLandingLocaleProvider";
import { LandingSection } from "../components/LandingSection";

function StepIcon({ index }: { index: number }) {
  const paths = [
    "M4 12h16M12 4v16",
    "M4 6h16M4 12h10M4 18h16",
    "M6 6l12 12M18 6L6 18",
    "M5 12h14M12 5l7 7-7 7",
  ];
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--aegis-bronze)]/50">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d={paths[index]} stroke="var(--aegis-bronze-ink)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function CommentCaMarcheSection() {
  const { copy } = useAegisLandingLocale();
  return (
    <LandingSection
      id="comment"
      label={copy.comment.label}
      title={copy.comment.title}
      className="bg-[#F4F4F5]/50"
    >
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        {copy.comment.steps.map((step, i) => (
          <div key={step.title}>
            <StepIcon index={i} />
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--aegis-bronze-ink)]">
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-2 font-cormorant text-2xl">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--aegis-muted)]">{step.body}</p>
          </div>
        ))}
      </div>
    </LandingSection>
  );
}
