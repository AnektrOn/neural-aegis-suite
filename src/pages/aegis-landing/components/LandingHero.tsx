import { Suspense, lazy, useState } from "react";
import {
  LANDING_CAM,
  LANDING_CANVAS_MIN_WIDTH,
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

export function LandingHero() {
  const { copy, audience } = useAegisLandingLocale();
  const showCanvas = useMediaQuery(`(min-width: ${LANDING_CANVAS_MIN_WIDTH}px)`);
  const highQuality = useMediaQuery("(min-width: 1440px)");
  const [webglFailed, setWebglFailed] = useState(false);
  const liveCanvas = showCanvas && !webglFailed;

  return (
    <div className="aegis-landing__container pb-8 md:pb-12">
      <div className="aegis-landing__hero-stage relative overflow-hidden rounded-[32px]">
        <p className="sr-only">{copy.hero.chip}</p>
        <div className="pointer-events-none relative z-10 flex min-h-[min(58vh,520px)] flex-col p-5 pb-6 md:min-h-[min(72vh,680px)] md:p-10 md:pb-12 lg:min-h-[min(82vh,760px)]">
          <div className="flex flex-1 flex-col lg:flex-row lg:items-center lg:gap-8 xl:gap-12">
            <div
              className={`pointer-events-auto shrink-0 pt-2 md:pt-4 lg:pt-0 ${
                audience === "entreprise"
                  ? "max-w-lg md:max-w-[30rem]"
                  : "max-w-xl md:max-w-[34rem]"
              }`}
            >
              <LandingPill className="mb-4 md:mb-6">{copy.hero.chip}</LandingPill>
              <h1 className="aegis-landing__headline whitespace-pre-line text-[clamp(1.75rem,8vw,3.5rem)] text-[color:var(--aegis-text)]">
                {copy.hero.title}
              </h1>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[color:var(--aegis-muted)] md:mt-5 md:text-[17px] md:leading-[1.6]">
                {copy.hero.subtitle}
              </p>
              <div className="mt-8 flex flex-col items-stretch gap-3 sm:items-start">
                <LandingButton href="/auth?signup=1" variant="bronze" className="w-full sm:w-auto">
                  {copy.nav.signUpFree}
                </LandingButton>
                <LandingButton href="#tarif" variant="dark" className="w-full sm:w-auto">
                  {copy.hero.cta}
                </LandingButton>
                <LandingButton href="/auth" variant="ghost" className="w-full sm:w-auto">
                  {copy.nav.signIn}
                </LandingButton>
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[color:var(--aegis-text-secondary)]">
                  {copy.hero.caption}
                </p>
              </div>
            </div>

            {liveCanvas ? (
              <div
                className="relative min-h-[min(56vh,520px)] w-full flex-1 self-stretch"
                aria-hidden
              >
                <Suspense fallback={null}>
                  <ArmillarySphereCanvas
                    className="absolute inset-0"
                    interactive={false}
                    quality={highQuality ? "high" : "low"}
                    initialAzimuth={LANDING_CAM.az}
                    initialPolar={LANDING_CAM.pol}
                    initialDistance={LANDING_CAM.dist}
                    initialTarget={LANDING_CAM.target}
                    onError={() => setWebglFailed(true)}
                  />
                </Suspense>
              </div>
            ) : null}
          </div>

          <div className="mt-8 hidden items-end justify-between md:flex lg:mt-4">
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
    </div>
  );
}
