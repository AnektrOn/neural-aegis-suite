import { SeoHelmet } from "@/seo/SeoHelmet";
import { ENTREPRISE_SEO_COPY } from "@/seo/seoPages";
import { seoCanonical } from "@/seo/site";
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
        <WelcomeView onStartAudit={() => navigate(LANDING_QUIZ_HREF)} />
      </AegisLandingLocaleProvider>
    );
  }

  return (
      <AegisLandingLocaleProvider audience={audience}>
      <SeoHelmet
        variant="page"
        title={ENTREPRISE_SEO_COPY.title}
        description={ENTREPRISE_SEO_COPY.description}
        canonical={seoCanonical("/entreprise")}
        ogTitle={ENTREPRISE_SEO_COPY.ogTitle}
        pageName={ENTREPRISE_SEO_COPY.title}
      />
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
