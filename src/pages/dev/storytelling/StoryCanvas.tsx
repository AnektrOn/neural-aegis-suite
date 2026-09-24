import { Suspense, useCallback, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import type { StoryChapterId } from "./storyCopy";
import { STORY_BG } from "./storyTheme";
import { FogScene } from "./chapters/FogScene";
import { TraceScene, TraceCameraRig } from "./chapters/TraceScene";
import { NetworkScene } from "./chapters/NetworkScene";
import { SilenceScene, ThresholdScene, StoryAtmosphere } from "./chapters/AmbientScenes";
import { DrinkingGourdModel } from "./chapters/DrinkingGourdModel";

type Props = {
  chapter: StoryChapterId;
  onChapterComplete: (id: StoryChapterId) => void;
  className?: string;
};

function ChapterRouter({
  chapter,
  onComplete,
}: {
  chapter: StoryChapterId;
  onComplete: () => void;
}) {
  switch (chapter) {
    case "silence":
      return <SilenceScene />;
    case "fog":
      return (
        <>
          <StoryAtmosphere dense />
          <DrinkingGourdModel
            scale={1.2}
            position={[0, 0.4, -2]}
            emissiveIntensity={0.25}
            rotationSpeed={0.04}
          />
          <FogScene onComplete={onComplete} />
        </>
      );
    case "trace":
      return (
        <>
          <StoryAtmosphere dense />
          <TraceCameraRig />
          <TraceScene onComplete={onComplete} />
        </>
      );
    case "network":
      return (
        <>
          <StoryAtmosphere dense />
          <NetworkScene onComplete={onComplete} />
        </>
      );
    case "map":
      return (
        <>
          <StoryAtmosphere dense />
          <NetworkScene mapMode onComplete={onComplete} />
        </>
      );
    case "threshold":
      return <ThresholdScene />;
    default:
      return null;
  }
}

export function StoryCanvas({ chapter, onChapterComplete, className }: Props) {
  const completedFor = useRef<StoryChapterId | null>(null);

  useEffect(() => {
    completedFor.current = null;
  }, [chapter]);

  const handleComplete = useCallback(() => {
    if (completedFor.current === chapter) return;
    completedFor.current = chapter;
    onChapterComplete(chapter);
  }, [chapter, onChapterComplete]);

  return (
    <div className={className}>
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
        style={{ width: "100%", height: "100%", touchAction: "none" }}
        onCreated={({ gl }) => {
          gl.setClearColor(STORY_BG, 1);
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0.6, 7]} fov={42} near={0.1} far={100} />
        <Suspense fallback={null}>
          <ChapterRouter key={chapter} chapter={chapter} onComplete={handleComplete} />
        </Suspense>
      </Canvas>
    </div>
  );
}
