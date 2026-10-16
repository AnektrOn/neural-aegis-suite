import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useThemeClassRevision } from "@/lib/theme";
import {
  prismStageLightLevels,
  prismStageToneMappingExposure,
  readPrismStageLightColors,
  type PrismStageLightingVariant,
} from "../prismStageLighting";

export type PrismStageLightingProps = {
  variant?: PrismStageLightingVariant;
};

/**
 * Hero IBL + key/fill/rim rig synced to app light/dark tokens.
 */
export function PrismStageLighting({
  variant = "hero",
}: PrismStageLightingProps) {
  const themeRevision = useThemeClassRevision();
  const gl = useThree((state) => state.gl);
  const colors = useMemo(
    () => readPrismStageLightColors(),
    [themeRevision],
  );
  const levels = useMemo(
    () => prismStageLightLevels(variant),
    [variant, themeRevision],
  );

  const keyRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.DirectionalLight>(null);
  const accentRef = useRef<THREE.PointLight>(null);

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = prismStageToneMappingExposure();
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl, themeRevision]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const breathe = 0.94 + 0.06 * Math.sin(t * 0.35);
    const rimPulse = 0.9 + 0.1 * Math.sin(t * 0.55 + 1.2);

    if (keyRef.current) {
      keyRef.current.intensity = levels.key * breathe;
    }
    if (rimRef.current) {
      rimRef.current.intensity = levels.rim * rimPulse;
    }
    if (accentRef.current) {
      accentRef.current.intensity = levels.accentPoint * breathe;
    }
  });

  const accentHex = colors.accent.getHexString();

  return (
    <>
      <Environment
        key={themeRevision}
        resolution={512}
        environmentIntensity={levels.environmentIntensity}
      >
        <Lightformer
          form="rect"
          intensity={2.4}
          color={colors.key}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 8, -2]}
          scale={[18, 8, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.1}
          color={colors.fill}
          rotation={[0, Math.PI / 2, 0]}
          position={[-9, 2, 2]}
          scale={[14, 10, 1]}
        />
        <Lightformer
          form="ring"
          intensity={1.6}
          color={colors.rim}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, -1, -6]}
          scale={[14, 14, 1]}
        />
        <Lightformer
          form="ring"
          intensity={0.85}
          color={`#${accentHex}`}
          position={[5, 4, 6]}
          scale={[2.5, 2.5, 1]}
        />
      </Environment>

      <hemisphereLight
        color={colors.hemisphereSky}
        groundColor={colors.hemisphereGround}
        intensity={levels.hemisphere}
      />

      <directionalLight
        ref={keyRef}
        position={[5, 9, 11]}
        intensity={levels.key}
        color={colors.key}
      />
      <directionalLight
        position={[-8, 4, 6]}
        intensity={levels.fill}
        color={colors.fill}
      />
      <directionalLight
        ref={rimRef}
        position={[-6, 2, -9]}
        intensity={levels.rim}
        color={colors.rim}
      />

      <pointLight
        ref={accentRef}
        position={[0, 6, 4]}
        intensity={levels.accentPoint}
        decay={2}
        distance={28}
        color={colors.accent}
      />
      <pointLight
        position={[0, -5, 2]}
        intensity={levels.topFill * 0.65}
        decay={2}
        distance={22}
        color={colors.fill}
      />
    </>
  );
}
