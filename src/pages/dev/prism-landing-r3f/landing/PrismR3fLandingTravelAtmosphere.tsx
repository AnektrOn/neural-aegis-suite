import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { landingR3fCameraSheet } from "../cinematic/landingR3fTheatre";
import { useOptionalPrismR3fLandingChapter } from "../config/PrismR3fLandingChapterContext";
import { useR3fSceneConfig } from "../config/r3fSceneConfigContext";
import { R3F_SCENE_CONFIG_DEFAULTS } from "../config/r3fSceneConfig";
import { R3F_PMNDRS_POST_DEFAULTS } from "../scene/post/r3fPmndrsPostDefaults";
import { beatTheatreTime, getPrismLandingBeat } from "./prismR3fLandingBeats";
import { getPrismLandingAtmosphereHold } from "./prismR3fLandingAtmosphere";

const fogColorScratch = new THREE.Color();

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

function travelPeak(t: number, from: number, to: number) {
  const span = to - from;
  if (span <= 0) return 0;
  const u = clamp01((t - from) / span);
  return Math.sin(u * Math.PI);
}

/**
 * Ambiance hold légère + travel discret (fog / bloom / godrays) — ne touche pas la caméra (Theatre).
 */
export function PrismR3fLandingTravelAtmosphere() {
  const chapterCtx = useOptionalPrismR3fLandingChapter();
  const { configRef } = useR3fSceneConfig();
  const baselineBloom = useRef(R3F_PMNDRS_POST_DEFAULTS.bloomStrength);

  useEffect(() => {
    return () => {
      const cfg = configRef.current;
      cfg.bloomStrength = baselineBloom.current;
      cfg.godraysDensity = R3F_SCENE_CONFIG_DEFAULTS.godraysDensity;
    };
  }, [configRef]);

  useFrame(({ scene }) => {
    const fog = scene.fog;
    const t = landingR3fCameraSheet.sequence.position;
    const beatIndex = chapterCtx?.chapterIndex ?? 0;
    const beat = getPrismLandingBeat(beatIndex);
    const hold = getPrismLandingAtmosphereHold(beatIndex);
    const cfg = configRef.current;

    let peak = 0;
    const transitioning = chapterCtx?.isTransitioning ?? false;
    if (transitioning && beatIndex > 0) {
      const from = beatTheatreTime(beatIndex - 1);
      const to = beatTheatreTime(beatIndex);
      peak = travelPeak(t, from, to);
    }

    if (fog instanceof THREE.Fog) {
      fog.near = THREE.MathUtils.lerp(hold.fogNear, hold.travelFogNear, peak * 0.35);
      fog.far = THREE.MathUtils.lerp(hold.fogFar, hold.travelFogFar, peak * 0.25);
      fogColorScratch.set(hold.fogColor);
      fog.color.copy(fogColorScratch);
    }

    cfg.environmentIntensity = hold.environmentIntensity + peak * 0.04;

    const holdBloom =
      beat.scenePatch?.bloomStrength ?? R3F_PMNDRS_POST_DEFAULTS.bloomStrength;
    cfg.bloomStrength = holdBloom + peak * 0.1;
    cfg.bloomEnabled = true;
    cfg.gradeEnabled = true;

    const baseDensity =
      beat.scenePatch?.godraysDensity ?? R3F_SCENE_CONFIG_DEFAULTS.godraysDensity;
    if (peak > 0) {
      cfg.godraysDensity = baseDensity * (1 + peak * 0.22);
    }
  });

  return null;
}
