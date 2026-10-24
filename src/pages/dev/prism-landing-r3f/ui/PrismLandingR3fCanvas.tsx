import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { resolvePerformanceConfig } from "@/pages/dev/prism-landing/scene/prismLandingPerformance";
import { initLandingR3fTheatreStudio } from "../cinematic/landingR3fTheatreStudio";
import { LandingR3fSceneContent } from "../scene/LandingR3fSceneContent";

initLandingR3fTheatreStudio();

const perf = resolvePerformanceConfig("default");

export default function PrismLandingR3fCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, perf.maxPixelRatio]}
      gl={{
        antialias: false,
        powerPreference: "high-performance",
        alpha: false,
      }}
      camera={{ fov: 52, near: 0.4, far: 320, position: [49, 11, 58] }}
    >
      <Suspense fallback={null}>
        <LandingR3fSceneContent />
      </Suspense>
    </Canvas>
  );
}
