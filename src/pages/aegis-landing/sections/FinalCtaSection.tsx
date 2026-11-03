import { useAegisLandingLocale } from "../i18n/AegisLandingLocaleProvider";
import { LandingButton } from "../components/LandingButton";
import { RevealOnScroll } from "../components/RevealOnScroll";

export function FinalCtaSection() {
  const { copy } = useAegisLandingLocale();
  return (
    <section className="relative overflow-hidden bg-[color:var(--aegis-dark)] py-20 md:py-28">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(211,157,123,0.12), transparent)",
        }}
        aria-hidden
      />
      <div className="aegis-landing__container relative text-center">
        <RevealOnScroll>
          <h2 className="aegis-landing__headline mx-auto max-w-3xl whitespace-pre-line text-[clamp(2rem,4vw,3rem)] text-[color:var(--aegis-dark-text)]">
            {copy.finalCta.title}
          </h2>
          <LandingButton href="#tarif" variant="bronze" className="mt-10">
            {copy.finalCta.cta}
          </LandingButton>
          {copy.finalCta.caption ? (
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.14em] text-[color:var(--aegis-dark-secondary)]">
              {copy.finalCta.caption}
            </p>
          ) : null}
        </RevealOnScroll>
      </div>
    </section>
  );
}
