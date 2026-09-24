import { Environment, Sparkles, Stars } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { DrinkingGourdModel } from "./DrinkingGourdModel";
import { STORY_WARM } from "../storyTheme";

export function StoryAtmosphere({ dense = false }: { dense?: boolean }) {
  return (
    <>
      <color attach="background" args={["#06080c"]} />
      <fog attach="fog" args={["#06080c", dense ? 4 : 8, dense ? 18 : 28]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 2]} intensity={0.55} color={STORY_WARM} />
      <pointLight position={[-3, 2, 4]} intensity={0.7} color="#7a9bb0" distance={20} />
      <Environment preset="night" environmentIntensity={0.45} />
      <Stars radius={60} depth={40} count={dense ? 1200 : 2200} factor={3.2} saturation={0} fade speed={0.4} />
      <Sparkles
        count={dense ? 40 : 80}
        scale={dense ? 8 : 14}
        size={2.2}
        speed={0.25}
        opacity={0.45}
        color={STORY_WARM}
      />
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom intensity={0.85} luminanceThreshold={0.2} luminanceSmoothing={0.4} mipmapBlur />
        <Noise opacity={0.035} />
        <Vignette eskil={false} offset={0.22} darkness={0.85} />
      </EffectComposer>
    </>
  );
}

export function SilenceScene() {
  return (
    <>
      <StoryAtmosphere />
      <DrinkingGourdModel scale={2.2} position={[0, 0.15, 0]} emissiveIntensity={0.7} />
    </>
  );
}

export function ThresholdScene() {
  return (
    <>
      <StoryAtmosphere />
      <DrinkingGourdModel
        scale={2.6}
        position={[0, 0.1, 0]}
        rotationSpeed={0.12}
        emissiveIntensity={1.05}
      />
    </>
  );
}
