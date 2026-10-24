import { memo, useLayoutEffect, useMemo, useRef } from "react";
import { TransformControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { useR3fSceneConfig } from "../../config/r3fSceneConfigContext";
import type { R3fSlitGeometryConfig } from "../../config/r3fSceneConfig";
import { useRegisterGutterLight } from "../../config/R3fGutterLightContext";
import { enableR3fCubeGodrayOcclusion } from "../shatteredCube/r3fCubeGodrayOcclusion";
import { R3F_SLIT_PILLAR_SPILL } from "./r3fGodraysHallConstants";
import {
  getEmitterLocalPosition,
  getEmitterLocalZ,
  getGutterBackZLocal,
  getGutterOpenZLocal,
  getGutterRearCapZLocal,
  getMonolithCenterY,
  getPillarSpillLocalPosition,
  R3F_SLIT_MONOLITH_GROUP_NAME,
} from "./r3fSlitSceneMath";

const pillarMaterial = new THREE.MeshStandardMaterial({
  color: "#08080a",
  roughness: 0.95,
  metalness: 0.02,
});

const tileMaterial = new THREE.MeshStandardMaterial({
  color: "#040405",
  roughness: 1,
  metalness: 0,
});

const emissiveMaterial = new THREE.MeshStandardMaterial({
  color: "#000000",
  toneMapped: false,
  side: THREE.FrontSide,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
});

/**
 * Tuile gouttière : canal en U, fermé à l’arrière (−Z), ouvert sur la face +Z seulement.
 */
const GutterTileMeshes = memo(function GutterTileMeshes({
  geometry,
  monolithHeight,
  slitEmitterIntensity,
  emitterColor,
}: {
  geometry: R3fSlitGeometryConfig;
  monolithHeight: number;
  slitEmitterIntensity: number;
  emitterColor: THREE.Color;
}) {
  const { gapWidth, pillarWidth, pillarDepth, gutterDepth, gutterWallThickness } = geometry;

  const halfGap = gapWidth / 2;
  const halfW = pillarWidth / 2;
  const leftX = -halfGap - halfW;
  const rightX = halfGap + halfW;
  const centerY = getMonolithCenterY(geometry);
  const h = monolithHeight * 0.96;
  const wallT = gutterWallThickness;

  const backZ = getGutterBackZLocal(geometry);
  const openZ = getGutterOpenZLocal(geometry);
  const channelMidZ = (backZ + openZ) / 2;
  const channelDepth = gutterDepth;
  const rearCapZ = getGutterRearCapZLocal(geometry);
  const emitterZ = getEmitterLocalZ(geometry);

  emissiveMaterial.emissive.copy(emitterColor);
  emissiveMaterial.emissiveIntensity = slitEmitterIntensity;

  return (
    <>
      <mesh position={[leftX, centerY, 0]} castShadow receiveShadow material={pillarMaterial} dispose={null}>
        <boxGeometry args={[pillarWidth, monolithHeight, pillarDepth]} />
      </mesh>
      <mesh position={[rightX, centerY, 0]} castShadow receiveShadow material={pillarMaterial} dispose={null}>
        <boxGeometry args={[pillarWidth, monolithHeight, pillarDepth]} />
      </mesh>

      <mesh position={[0, centerY, rearCapZ]} castShadow receiveShadow material={tileMaterial} dispose={null}>
        <boxGeometry args={[gapWidth + wallT * 2, h, wallT]} />
      </mesh>

      <mesh
        position={[0, centerY, backZ + wallT / 2]}
        castShadow
        receiveShadow
        material={tileMaterial}
        dispose={null}
      >
        <boxGeometry args={[gapWidth, h, wallT]} />
      </mesh>

      <mesh
        position={[-halfGap - wallT / 2, centerY, channelMidZ]}
        castShadow
        receiveShadow
        material={tileMaterial}
        dispose={null}
      >
        <boxGeometry args={[wallT, h, channelDepth]} />
      </mesh>
      <mesh
        position={[halfGap + wallT / 2, centerY, channelMidZ]}
        castShadow
        receiveShadow
        material={tileMaterial}
        dispose={null}
      >
        <boxGeometry args={[wallT, h, channelDepth]} />
      </mesh>

      <mesh position={[-halfGap - wallT / 2, centerY, openZ]} castShadow receiveShadow material={tileMaterial} dispose={null}>
        <boxGeometry args={[wallT, h, wallT]} />
      </mesh>
      <mesh position={[halfGap + wallT / 2, centerY, openZ]} castShadow receiveShadow material={tileMaterial} dispose={null}>
        <boxGeometry args={[wallT, h, wallT]} />
      </mesh>
      <mesh position={[0, centerY + h / 2 - wallT / 2, openZ]} castShadow receiveShadow material={tileMaterial} dispose={null}>
        <boxGeometry args={[gapWidth, wallT, wallT]} />
      </mesh>
      <mesh position={[0, centerY - h / 2 + wallT / 2, openZ]} castShadow receiveShadow material={tileMaterial} dispose={null}>
        <boxGeometry args={[gapWidth, wallT, wallT]} />
      </mesh>

      <mesh
        position={[0, centerY, emitterZ]}
        castShadow={false}
        receiveShadow={false}
        renderOrder={2}
        material={emissiveMaterial}
        dispose={null}
      >
        <planeGeometry args={[gapWidth - wallT * 2, h - wallT * 2]} />
      </mesh>
    </>
  );
});

const emitLightColorScratch = new THREE.Color();

function GutterPillarSpillLights({
  geometry,
  emitLightIntensity,
  slitEmitterColor,
}: {
  geometry: R3fSlitGeometryConfig;
  emitLightIntensity: number;
  slitEmitterColor: string;
}) {
  const leftPos = useMemo(
    () => getPillarSpillLocalPosition(geometry, "left").clone(),
    [geometry],
  );
  const rightPos = useMemo(
    () => getPillarSpillLocalPosition(geometry, "right").clone(),
    [geometry],
  );
  const spillIntensity = Math.max(
    R3F_SLIT_PILLAR_SPILL.minIntensity,
    emitLightIntensity * R3F_SLIT_PILLAR_SPILL.intensityFromEmit,
  );

  const spillProps = {
    color: slitEmitterColor,
    intensity: spillIntensity,
    distance: R3F_SLIT_PILLAR_SPILL.distance,
    decay: R3F_SLIT_PILLAR_SPILL.decay,
    castShadow: false as const,
  };

  return (
    <>
      <pointLight
        {...spillProps}
        position={leftPos}
        name="r3f-pillar-spill-left"
        layers={0}
      />
      <pointLight
        {...spillProps}
        position={rightPos}
        name="r3f-pillar-spill-right"
        layers={0}
      />
    </>
  );
}

function GutterPointLight({
  geometry,
  emitLightIntensity,
  emitLightDistance,
  slitEmitterColor,
}: {
  geometry: R3fSlitGeometryConfig;
  emitLightIntensity: number;
  emitLightDistance: number;
  slitEmitterColor: string;
}) {
  const registerGutterLight = useRegisterGutterLight();
  const lightRef = useRef<THREE.PointLight>(null);
  const emitterPosition = useMemo(
    () => getEmitterLocalPosition(geometry).clone(),
    [geometry],
  );

  useLayoutEffect(() => {
    registerGutterLight(lightRef.current);
    return () => registerGutterLight(null);
  }, [registerGutterLight]);

  useLayoutEffect(() => {
    const light = lightRef.current;
    if (!light) return;
    emitLightColorScratch.set(slitEmitterColor);
    light.intensity = emitLightIntensity;
    light.distance = emitLightDistance;
    light.decay = 2;
    light.color.copy(emitLightColorScratch);
    light.shadow.camera.far = Math.min(emitLightDistance * 1.35, 120);
    light.shadow.camera.updateProjectionMatrix();
  }, [emitLightIntensity, emitLightDistance, slitEmitterColor]);

  useLayoutEffect(() => {
    const light = lightRef.current;
    if (!light) return;
    light.position.copy(emitterPosition);
  }, [emitterPosition]);

  useLayoutEffect(() => {
    const light = lightRef.current;
    if (!light) return;
    light.layers.set(0);
  });

  return (
    <pointLight
      ref={lightRef}
      position={emitterPosition}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0002}
      shadow-camera-near={0.4}
      shadow-camera-far={80}
      name="r3f-gutter-point-light"
    />
  );
}

type Props = {
  orbitRef: React.RefObject<OrbitControlsImpl | null>;
};

export function LandingR3fSlitMonolith({ orbitRef }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const draggingRef = useRef(false);
  const { config, setConfig, configRef } = useR3fSceneConfig();

  const geometry = useMemo(
    (): R3fSlitGeometryConfig => ({
      monolithFootY: config.monolithFootY,
      monolithHeight: config.monolithHeight,
      gapWidth: config.gapWidth,
      pillarWidth: config.pillarWidth,
      pillarDepth: config.pillarDepth,
      gutterDepth: config.gutterDepth,
      gutterWallThickness: config.gutterWallThickness,
      monolithCenterX: config.monolithCenterX,
      monolithCenterZ: config.monolithCenterZ,
    }),
    [
      config.monolithFootY,
      config.monolithHeight,
      config.gapWidth,
      config.pillarWidth,
      config.pillarDepth,
      config.gutterDepth,
      config.gutterWallThickness,
      config.monolithCenterX,
      config.monolithCenterZ,
    ],
  );

  const emitterColor = useMemo(
    () => new THREE.Color(config.slitEmitterColor),
    [config.slitEmitterColor],
  );

  const groupPosition: [number, number, number] = [
    config.monolithCenterX,
    0,
    config.monolithCenterZ,
  ];

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g || draggingRef.current) return;
    g.position.set(config.monolithCenterX, 0, config.monolithCenterZ);
  }, [config.monolithCenterX, config.monolithCenterZ]);

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    enableR3fCubeGodrayOcclusion(g);
  });

  const meshes = (
    <>
      <GutterTileMeshes
        geometry={geometry}
        monolithHeight={config.monolithHeight}
        slitEmitterIntensity={config.slitEmitterIntensity}
        emitterColor={emitterColor}
      />
      <GutterPillarSpillLights
        geometry={geometry}
        emitLightIntensity={config.emitLightIntensity}
        slitEmitterColor={config.slitEmitterColor}
      />
      <GutterPointLight
        geometry={geometry}
        emitLightIntensity={config.emitLightIntensity}
        emitLightDistance={config.emitLightDistance}
        slitEmitterColor={config.slitEmitterColor}
      />
    </>
  );

  const commitGroupPosition = () => {
    const g = groupRef.current;
    if (!g) return;
    const patch = {
      monolithCenterX: g.position.x,
      monolithCenterZ: g.position.z,
    };
    configRef.current = { ...configRef.current, ...patch };
    setConfig(patch);
  };

  if (config.sceneEditMode) {
    return (
      <TransformControls
        mode="translate"
        showY={false}
        onDraggingChanged={(dragging) => {
          draggingRef.current = dragging;
          if (orbitRef.current) orbitRef.current.enabled = !dragging;
          if (!dragging) commitGroupPosition();
        }}
      >
        <group ref={groupRef} name={R3F_SLIT_MONOLITH_GROUP_NAME}>
          {meshes}
        </group>
      </TransformControls>
    );
  }

  return (
    <group ref={groupRef} position={groupPosition} name={R3F_SLIT_MONOLITH_GROUP_NAME}>
      {meshes}
    </group>
  );
}
