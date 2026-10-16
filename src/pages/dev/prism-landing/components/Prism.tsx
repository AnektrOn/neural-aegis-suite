import * as THREE from "three";
import { useLayoutEffect, useMemo } from "react";
import { useLoader, useThree, type ThreeElements } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import { GLTFLoader, type GLTF } from "three-stdlib";
import { applyPbrTextureQuality } from "../applyPbrTextureQuality";
import {
  PRISM_GLTF_MESH_NAME,
  PRISM_GLB_URL,
  PRISM_RENDER_MODE,
  PRISM_TARGET_HEIGHT,
} from "../prismAsset";
import {
  bakePrismGeometry,
  findPrismMesh,
  preparePrismGeometry,
} from "../resolvePrismGeometry";
import { PMNDRS_PRISM_GLASS } from "../pmndrsPrismUpstream";
import type {
  PrismMaterialConfig,
  PrismTextureSlot,
} from "../prismMaterialConfig";
import {
  DEFAULT_PRISM_MATERIAL_CONFIG,
  DEFAULT_SHIELD_PHYSICAL,
} from "../prismMaterialConfig";
import { usePrismImportedTextures } from "../usePrismImportedTextures";

export type PrismProps = Omit<ThreeElements["group"], "ref"> & {
  targetHeight?: number;
  /** Uniform scale after centering. Exocortex hero uses 0.7. */
  uniformScale?: number;
  envMap?: THREE.Texture;
  materialConfig?: PrismMaterialConfig;
};

export { PMNDRS_PRISM_GLASS };

type PrismSurfaceProps = {
  geometry: THREE.BufferGeometry;
  materialConfig: PrismMaterialConfig;
  envMap?: THREE.Texture;
};

function PrismSurface({ geometry, materialConfig, envMap }: PrismSurfaceProps) {
  const gl = useThree((state) => state.gl);
  const textures = usePrismImportedTextures(
    materialConfig.textures,
    materialConfig.textureFlipY,
    materialConfig.textureRepeat,
  );
  const physical = materialConfig.physical ?? DEFAULT_SHIELD_PHYSICAL;
  const normalScale = useMemo(
    () =>
      new THREE.Vector2(physical.normalScale, physical.normalScale),
    [physical.normalScale],
  );

  useLayoutEffect(() => {
    const level = Math.min(16, gl.capabilities.getMaxAnisotropy());
    const entries = Object.entries(textures) as [
      keyof typeof textures,
      THREE.Texture | undefined,
    ][];
    for (const [slot, tex] of entries) {
      if (!tex) continue;
      applyPbrTextureQuality(tex, slot as PrismTextureSlot, level);
    }
  }, [gl, textures]);

  if (materialConfig.look === "textured") {
    if (!textures.map) return null;
    return (
      <mesh renderOrder={10} dispose={null} geometry={geometry}>
        <meshPhysicalMaterial
          color={materialConfig.color}
          metalness={materialConfig.metalness}
          roughness={materialConfig.roughness}
          map={textures.map}
          normalMap={textures.normalMap}
          normalScale={normalScale}
          roughnessMap={textures.roughnessMap}
          metalnessMap={textures.metalnessMap}
          aoMap={textures.aoMap}
          aoMapIntensity={physical.aoMapIntensity}
          envMap={envMap}
          envMapIntensity={physical.envMapIntensity}
          clearcoat={physical.clearcoat}
          clearcoatRoughness={physical.clearcoatRoughness}
          ior={physical.ior}
          sheen={physical.sheen}
          sheenRoughness={physical.sheenRoughness}
          sheenColor={physical.sheenColor}
          specularIntensity={1}
          specularColor="#ffffff"
        />
      </mesh>
    );
  }

  return (
    <mesh renderOrder={10} dispose={null} geometry={geometry}>
      <MeshTransmissionMaterial
        {...PMNDRS_PRISM_GLASS}
        normalMap={
          materialConfig.normalOnGlass ? textures.normalMap : undefined
        }
      />
    </mesh>
  );
}

function PmndrsPrism({
  geometry,
  materialConfig,
  envMap,
  ...props
}: PrismProps & { geometry: THREE.BufferGeometry }) {
  const mat = materialConfig ?? DEFAULT_PRISM_MATERIAL_CONFIG;
  return (
    <group {...props}>
      <group position={[0, 0, 0.6]} scale={2}>
        <PrismSurface geometry={geometry} materialConfig={mat} envMap={envMap} />
      </group>
    </group>
  );
}

function AegisPrism({
  geometry,
  materialConfig,
  envMap,
  ...props
}: PrismProps & { geometry: THREE.BufferGeometry }) {
  const mat = materialConfig ?? DEFAULT_PRISM_MATERIAL_CONFIG;
  return (
    <group {...props}>
      <PrismSurface geometry={geometry} materialConfig={mat} envMap={envMap} />
    </group>
  );
}

export function Prism({
  targetHeight,
  uniformScale,
  materialConfig,
  ...props
}: PrismProps) {
  const gltf = useLoader(GLTFLoader, PRISM_GLB_URL) as GLTF;
  const height = targetHeight ?? PRISM_TARGET_HEIGHT;

  const pmndrsGeometry = useMemo(() => {
    if (PRISM_RENDER_MODE !== "pmndrs") return null;
    const mesh = findPrismMesh(gltf, PRISM_GLTF_MESH_NAME);
    return mesh.geometry;
  }, [gltf]);

  const aegisGeometry = useMemo(() => {
    if (PRISM_RENDER_MODE !== "aegis") return null;
    const mesh = findPrismMesh(gltf, PRISM_GLTF_MESH_NAME);
    return uniformScale != null
      ? bakePrismGeometry(mesh, uniformScale)
      : preparePrismGeometry(mesh, height);
  }, [gltf, height, uniformScale]);

  if (PRISM_RENDER_MODE === "pmndrs" && pmndrsGeometry) {
    return (
      <PmndrsPrism
        {...props}
        materialConfig={materialConfig}
        geometry={pmndrsGeometry}
      />
    );
  }

  if (aegisGeometry) {
    return (
      <AegisPrism
        {...props}
        materialConfig={materialConfig}
        geometry={aegisGeometry}
      />
    );
  }

  return null;
}
