import { useLayoutEffect, useMemo, useRef } from "react";
import { enableR3fCubeGodrayOcclusion } from "../shatteredCube/r3fCubeGodrayOcclusion";
import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  R3F_WASTELAND_GROUND_SIZE,
  R3F_WASTELAND_TEX_METERS_PER_REPEAT,
} from "./r3fWastelandConfig";
import { R3F_WASTELAND_TEXTURE_URLS, r3fWastelandTexturePaths } from "./r3fWastelandTextures";

const HAS_WASTELAND_MAPS = R3F_WASTELAND_TEXTURE_URLS.every((url) => Boolean(url));

if (HAS_WASTELAND_MAPS) {
  useTexture.preload([...R3F_WASTELAND_TEXTURE_URLS]);
}

/** Normal map exportée DirectX → invert Y pour Three.js */
const WASTELAND_NORMAL_SCALE = new THREE.Vector2(1, -1);

function configureRepeatingMap(
  tex: THREE.Texture,
  repeat: number,
  colorSpace: THREE.ColorSpace,
  maxAnisotropy: number,
) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = Math.min(8, maxAnisotropy);
  tex.colorSpace = colorSpace;
  tex.needsUpdate = true;
}

function WastelandPbrMaterial() {
  const maxAnisotropy = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const [albedo, roughness, normal] = useTexture([
    r3fWastelandTexturePaths.albedo,
    r3fWastelandTexturePaths.roughness,
    r3fWastelandTexturePaths.normal,
  ]);

  const uvRepeat = useMemo(() => 1 / R3F_WASTELAND_TEX_METERS_PER_REPEAT, []);

  useLayoutEffect(() => {
    configureRepeatingMap(albedo, uvRepeat, THREE.SRGBColorSpace, maxAnisotropy);
    configureRepeatingMap(roughness, uvRepeat, THREE.NoColorSpace, maxAnisotropy);
    configureRepeatingMap(normal, uvRepeat, THREE.NoColorSpace, maxAnisotropy);
  }, [albedo, roughness, normal, uvRepeat, maxAnisotropy]);

  return (
    <meshStandardMaterial
      map={albedo}
      roughnessMap={roughness}
      normalMap={normal}
      normalScale={WASTELAND_NORMAL_SCALE}
      roughness={1}
      metalness={0.02}
      color="#e8e2da"
    />
  );
}

/**
 * Sol wasteland PBR (albedo / roughness / normal DX).
 * Sans PNG locaux (gitignore) : fallback couleur unie pour ne pas casser le lab / le build.
 */
export function LandingR3fWastelandGround() {
  const meshRef = useRef<THREE.Mesh>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    enableR3fCubeGodrayOcclusion(mesh);
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.02, 0]}
      castShadow
      receiveShadow
      name="r3f-wasteland-ground"
    >
      <planeGeometry args={[R3F_WASTELAND_GROUND_SIZE, R3F_WASTELAND_GROUND_SIZE, 1, 1]} />
      {HAS_WASTELAND_MAPS ? (
        <WastelandPbrMaterial />
      ) : (
        <meshStandardMaterial color="#e8e2da" roughness={1} metalness={0.02} />
      )}
    </mesh>
  );
}
