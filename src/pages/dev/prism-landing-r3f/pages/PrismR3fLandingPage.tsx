import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { R3fSceneConfigProvider } from "../config/r3fSceneConfigContext";
import { PRISM_R3F_LANDING_SCENE_DEFAULTS } from "../config/prismR3fLandingSceneDefaults";
import { PrismR3fLandingChapterProvider } from "../config/PrismR3fLandingChapterContext";
import { PrismR3fLandingDirectorProvider } from "../config/PrismR3fLandingDirectorContext";
import { PrismR3fLandingShell } from "../landing/PrismR3fLandingShell";
import { initLandingR3fTheatreStudio } from "../cinematic/landingR3fTheatreStudio";

/** Landing produit fullscreen — `/dev/prism` (Hubtown-like, placeholders). */
export default function PrismR3fLandingPage() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (searchParams.get("theatre") === "0") return;
    initLandingR3fTheatreStudio();
  }, [searchParams]);
  return (
    <R3fSceneConfigProvider initialOverrides={PRISM_R3F_LANDING_SCENE_DEFAULTS}>
      <PrismR3fLandingDirectorProvider>
        <PrismR3fLandingChapterProvider>
          <PrismR3fLandingShell />
        </PrismR3fLandingChapterProvider>
      </PrismR3fLandingDirectorProvider>
    </R3fSceneConfigProvider>
  );
}
