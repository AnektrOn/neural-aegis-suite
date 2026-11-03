import { useEffect } from "react";
import { useR3fSceneConfig } from "../config/r3fSceneConfigContext";
import { usePrismR3fLandingDirector } from "../config/PrismR3fLandingDirectorContext";
import { getPrismLandingBeat } from "./prismR3fLandingBeats";
import { subjectVisibilityForBeat } from "./prismR3fLandingSubjects";

/**
 * Director lumière / cube par beat (storyboard cube → marbre → fente).
 * - 0 CORE : burst + godrays cube
 * - 1 IGNITION (ciné) : burst cube dans le hall
 * - 2 MARBLE hero
 * - 3 CONVERGE (ciné) : marbre + fente
 * - 4 PORTAL hero fente
 * - 5 LEGACY CTA wide
 */
export function usePrismLandingBeatEffects(beatIndex: number) {
  const { requestCubeBurst, resetCubeToHold, setSubjectVisibility } = usePrismR3fLandingDirector();
  const { setConfig } = useR3fSceneConfig();

  useEffect(() => {
    const beat = getPrismLandingBeat(beatIndex);
    if (beat.scenePatch) {
      setConfig(beat.scenePatch);
    }
    setSubjectVisibility(subjectVisibilityForBeat(beatIndex));

    switch (beatIndex) {
      case 0:
        requestCubeBurst();
        break;
      case 1:
        requestCubeBurst();
        break;
      case 2:
        resetCubeToHold();
        break;
      case 3:
        resetCubeToHold();
        break;
      case 4:
        resetCubeToHold();
        break;
      case 5:
        resetCubeToHold();
        break;
      default:
        break;
    }
  }, [beatIndex, requestCubeBurst, resetCubeToHold, setConfig, setSubjectVisibility]);
}
