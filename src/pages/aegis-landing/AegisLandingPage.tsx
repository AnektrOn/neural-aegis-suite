import { Helmet } from "react-helmet-async";
import { lazyWithRetry as lazy } from "@/lib/lazyWithRetry";
import { Suspense } from "react";
import "./aegisLanding.css";
import { AegisLandingLocaleProvider, useAegisLandingLocale } from "./i18n/AegisLandingLocaleProvider";
import type { AegisLandingAudience } from "./i18n/aegisLandingCopy";
import { LandingNav } from "./components/LandingNav";
import { LandingHero } from "./components/LandingHero";
import { MobileStickyCta } from "./components/MobileStickyCta";
import { LandingFooter } from "./components/LandingFooter";

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

function LandingHelmet() {
  const { copy } = useAegisLandingLocale();
  return (
    <Helmet>
      <title>{copy.meta.title}</title>
      <meta name="description" content={copy.meta.description} />
      <meta property="og:title" content={copy.meta.title} />
      <meta property="og:description" content={copy.meta.description} />
      <meta name="theme-color" content="#f3eeec" />
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
  return (
    <AegisLandingLocaleProvider audience={audience}>
      <LandingHelmet />
      <div className="aegis-landing relative min-h-dvh pb-24 sm:pb-0">
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
