import { Suspense, lazy, useState } from "react";
import {
  LANDING_CANVAS_MIN_WIDTH,
  LANDING_HERO_STILL,
} from "../armillary/armillaryConstants";
import { useAegisLandingLocale } from "../i18n/AegisLandingLocaleProvider";
import { LandingButton } from "./LandingButton";
import { LandingPill } from "./LandingPill";
import { useMediaQuery } from "./useMediaQuery";

const ArmillarySphereCanvas = lazy(() =>
  import("../armillary/ArmillarySphereCanvas").then((m) => ({
    default: m.ArmillarySphereCanvas,
  })),
);

function HeroStill({ dimmed }: { dimmed: boolean }) {
  return (
    <img
      src={LANDING_HERO_STILL.src}
      srcSet={LANDING_HERO_STILL.srcSet}
      sizes="(min-width: 1440px) 1440px, 100vw"
      alt=""
      aria-hidden
      fetchPriority="high"
      decoding="async"
      className={`pointer-events-none absolute inset-0 h-full w-full object-cover object-[right_68%] transition-opacity duration-500 md:object-right ${
        dimmed ? "opacity-0" : "opacity-100"
      }`}
      width={800}
      height={446}
    />
  );
}

export function LandingHero() {
  const { copy, audience } = useAegisLandingLocale();
  const showCanvas = useMediaQuery(`(min-width: ${LANDING_CANVAS_MIN_WIDTH}px)`);
  const highQuality = useMediaQuery("(min-width: 1440px)");
  const [webglFailed, setWebglFailed] = useState(false);
  const [webglReady, setWebglReady] = useState(false);
  const liveCanvas = showCanvas && !webglFailed;
  const showStill = !liveCanvas || !webglReady;

  return (
    <div className="aegis-landing__container pb-8 md:pb-12">
      <div className="aegis-landing__hero-stage relative min-h-[min(58vh,520px)] overflow-hidden rounded-[32px] md:min-h-[min(82vh,760px)]">
        <HeroStill dimmed={liveCanvas && webglReady} />
        {showStill ? <div className="aegis-landing__hero-veil" aria-hidden /> : null}
        {liveCanvas ? (
          <Suspense fallback={null}>
            <ArmillarySphereCanvas
              className="pointer-events-none absolute inset-0 z-[2]"
              interactive={false}
              adaptFraming
              quality={highQuality ? "high" : "low"}
              onError={() => setWebglFailed(true)}
              onReady={() => setWebglReady(true)}
            />
          </Suspense>
        ) : null}
        <p className="sr-only">{copy.hero.chip}</p>
        <div className="pointer-events-none relative z-10 flex min-h-[min(58vh,520px)] flex-col justify-between p-5 pb-6 md:min-h-[min(82vh,760px)] md:p-10 md:pb-12">
          <div
            className={`pointer-events-auto pt-2 md:pt-8 ${
              audience === "entreprise" ? "max-w-lg md:max-w-[30rem]" : "max-w-xl md:max-w-[34rem]"
            }`}
          >
            <LandingPill className="mb-4 md:mb-6">{copy.hero.chip}</LandingPill>
            <h1 className="aegis-landing__headline whitespace-pre-line text-[clamp(1.75rem,8vw,3.5rem)] text-[color:var(--aegis-text)]">
              {copy.hero.title}
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[color:var(--aegis-muted)] md:mt-5 md:text-[17px] md:leading-[1.6]">
              {copy.hero.subtitle}
            </p>
            <div className="mt-8 hidden flex-col items-start gap-3 sm:flex">
              <LandingButton href="#tarif" variant="dark">
                {copy.hero.cta}
              </LandingButton>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[color:var(--aegis-text-secondary)]">
                {copy.hero.caption}
              </p>
            </div>
          </div>
          <div className="hidden items-end justify-between md:flex">
            <a
              href="#probleme"
              className="pointer-events-auto flex min-h-[44px] min-w-[44px] items-center justify-center text-[color:var(--aegis-text-secondary)]"
              aria-label={copy.hero.scrollLabel}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path
                  d="M10 4v12M10 16l-4-4M10 16l4-4"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <span
              className="pointer-events-none select-none font-cinzel text-4xl tracking-[0.25em] text-[color:var(--aegis-text)]/10 md:text-5xl"
              aria-hidden
            >
              {copy.hero.ghostWordmark}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:hidden">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-[color:var(--aegis-text-secondary)]">
          {copy.hero.caption}
        </p>
      </div>
    </div>
  );
}
