import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { landingR3fCameraSheet } from "../cinematic/landingR3fTheatre";
import { useOptionalPrismR3fLandingChapter } from "../config/PrismR3fLandingChapterContext";
import { R3F_SHATTERED_CUBE_LIGHT_LAYER } from "../scene/shatteredCube/r3fShatteredCubeConstants";
import { beatTheatreTime } from "./prismR3fLandingBeats";

/**
 * Playback Theatre (séquence + nav chapitres). Caméra = keyframes JSON / Studio — pas de tween manuel.
 */
export function PrismR3fLandingTheatreRig() {
  const chapterCtx = useOptionalPrismR3fLandingChapter();
  const chapterCtxRef = useRef(chapterCtx);
  chapterCtxRef.current = chapterCtx;
  const lastBeatRef = useRef(0);
  const mountedRef = useRef(false);
  const chapterIndex = chapterCtx?.chapterIndex ?? 0;

  useEffect(() => {
    const sequence = landingR3fCameraSheet.sequence;
    sequence.position = beatTheatreTime(0);
    lastBeatRef.current = 0;
    mountedRef.current = true;
  }, []);

  useEffect(() => {
    const ctx = chapterCtxRef.current;
    if (!ctx || !mountedRef.current) return;
    const beatIndex = chapterIndex;
    const prevBeat = lastBeatRef.current;
    if (beatIndex === prevBeat) return;

    const sequence = landingR3fCameraSheet.sequence;
    if (beatIndex < prevBeat || beatIndex !== prevBeat + 1) {
      sequence.pause();
      sequence.position = beatTheatreTime(beatIndex);
      ctx.setIsTransitioning(false);
      lastBeatRef.current = beatIndex;
      return;
    }

    const fromTime = beatTheatreTime(prevBeat);
    const toTime = beatTheatreTime(beatIndex);
    ctx.setIsTransitioning(true);
    sequence.position = fromTime;

    const durationMs = Math.max(500, (toTime - fromTime) * 1000);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      try {
        sequence.pause();
        sequence.position = toTime;
      } catch {
        /* sequence peut déjà être disposée au HMR */
      }
      chapterCtxRef.current?.setIsTransitioning(false);
      lastBeatRef.current = beatIndex;
    };

    const failSafe = window.setTimeout(finish, durationMs + 200);
    try {
      const playback = sequence.play({
        iterationCount: 1,
        range: [fromTime, toTime],
      });
      void playback.then(finish).catch(finish);
    } catch {
      finish();
    }

    return () => {
      window.clearTimeout(failSafe);
    };
  }, [chapterIndex]);

  useFrame(({ camera }) => {
    camera.layers.enable(0);
    camera.layers.enable(R3F_SHATTERED_CUBE_LIGHT_LAYER);
  });

  return null;
}
