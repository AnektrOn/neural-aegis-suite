import { Helmet } from "react-helmet-async";
import { lazyWithRetry as lazy } from "@/lib/lazyWithRetry";
import { Suspense } from "react";
import { useNavigate } from "react-router-dom";
import "./aegisLanding.css";
import { AegisLandingLocaleProvider, useAegisLandingLocale } from "./i18n/AegisLandingLocaleProvider";
import type { AegisLandingAudience } from "./i18n/aegisLandingCopy";
import { LANDING_QUIZ_HREF } from "./landingCtaHrefs";
import { LandingNav } from "./components/LandingNav";
import { LandingHero } from "./components/LandingHero";
import { MobileStickyCta } from "./components/MobileStickyCta";
import { LandingFooter } from "./components/LandingFooter";
import { WelcomeView } from "@/features/welcome/components/WelcomeView";

const ProblemSection = lazy(() =>
  import("./sections/ProblemSection").then((m) => ({ default: m.ProblemSection })),
);
const ManifestoSection = lazy(() =>
  import("./sections/ManifestoSection").then((m) => ({ default: m.ManifestoSection })),
);
const RecevezSection = lazy(() =>
  import("./sections/RecevezSection").then((m) => ({ default: m.RecevezSection })),
);
const CommentCaMarcheSection = lazy(() =>
  import("./sections/CommentCaMarcheSection").then((m) => ({ default: m.CommentCaMarcheSection })),
);
const ComparatifSection = lazy(() =>
  import("./sections/ComparatifSection").then((m) => ({ default: m.ComparatifSection })),
);
const PourQuiSection = lazy(() =>
  import("./sections/PourQuiSection").then((m) => ({ default: m.PourQuiSection })),
);
const DonneesSection = lazy(() =>
  import("./sections/DonneesSection").then((m) => ({ default: m.DonneesSection })),
);
const TarifSection = lazy(() =>
  import("./sections/TarifSection").then((m) => ({ default: m.TarifSection })),
);
const FaqSection = lazy(() =>
  import("./sections/FaqSection").then((m) => ({ default: m.FaqSection })),
);
const FinalCtaSection = lazy(() =>
  import("./sections/FinalCtaSection").then((m) => ({ default: m.FinalCtaSection })),
);

const LANDING_OG_IMAGE =
  "https://aegis.humancatalystbeacon.com/aegis-landing/hero-scene-1440.jpg";
const LANDING_CANONICAL_INDIV = "https://aegis.humancatalystbeacon.com/";
const LANDING_CANONICAL_ENT = "https://aegis.humancatalystbeacon.com/entreprise";

function LandingHelmet({ audience }: { audience: AegisLandingAudience }) {
  const { copy, locale } = useAegisLandingLocale();
  const canonical =
    audience === "entreprise" ? LANDING_CANONICAL_ENT : LANDING_CANONICAL_INDIV;
  return (
    <Helmet>
      <title>{copy.meta.title}</title>
      <meta name="description" content={copy.meta.description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={copy.meta.ogTitle} />
      <meta property="og:description" content={copy.meta.description} />
      <meta property="og:image" content={LANDING_OG_IMAGE} />
      <meta property="og:locale" content={locale === "en" ? "en_US" : "fr_FR"} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={copy.meta.ogTitle} />
      <meta name="twitter:description" content={copy.meta.description} />
      <meta name="twitter:image" content={LANDING_OG_IMAGE} />
      <meta name="theme-color" content="#0b0b0a" />
    </Helmet>
  );
}

function LandingSections() {
  return (
    <>
      <ProblemSection />
      <ManifestoSection />
      <RecevezSection />
      <CommentCaMarcheSection />
      <ComparatifSection />
      <PourQuiSection />
      <DonneesSection />
      <TarifSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}

/** Public AEGIS marketing page. `audience` is chosen by the route (`/` vs `/entreprise`). */
export default function AegisLandingPage({
  audience = "individuel",
}: {
  audience?: AegisLandingAudience;
}) {
  const navigate = useNavigate();

  if (audience === "individuel") {
    return (
      <AegisLandingLocaleProvider audience={audience}>
        <LandingHelmet audience={audience} />
        <WelcomeView onStartAudit={() => navigate(LANDING_QUIZ_HREF)} />
      </AegisLandingLocaleProvider>
    );
  }

  return (
    <AegisLandingLocaleProvider audience={audience}>
      <LandingHelmet audience={audience} />
      <div className="aegis-landing relative min-h-dvh pb-32 sm:pb-0">
        <LandingSkip />
        <LandingNav />
        <main id="aegis-landing-main">
          <LandingHero />
          <Suspense fallback={null}>
            <LandingSections />
          </Suspense>
        </main>
        <LandingFooter />
        <MobileStickyCta />
      </div>
    </AegisLandingLocaleProvider>
  );
}

function LandingSkip() {
  const { copy } = useAegisLandingLocale();
  return (
    <a className="aegis-landing__skip" href="#aegis-landing-main">
      {copy.nav.skip}
    </a>
  );
}
