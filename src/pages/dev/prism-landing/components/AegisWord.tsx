import * as THREE from "three";
import { useMemo } from "react";
import { Center, Text3D, type FontData } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import cinzel from "../assets/fonts/Cinzel_SemiBold.json";

export type AegisReveal = {
  uLit: { value: number };
  uHit: THREE.Vector3;
};

const REVEAL_COLOR = new THREE.Color("#e8c98a");

function createRevealMaterial(reveal: AegisReveal): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color: "#c9a66b",
    roughness: 0.32,
    metalness: 0.72,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uLit = reveal.uLit;
    shader.uniforms.uHit = { value: reveal.uHit };
    shader.uniforms.uRevealColor = { value: REVEAL_COLOR };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vRevealPos;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vRevealPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vRevealPos;
uniform float uLit;
uniform vec3 uHit;
uniform vec3 uRevealColor;`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        {
          float d = distance(vRevealPos.xy, uHit.xy);
          float pool = 0.5 + 0.5 * exp(-(d * d) / 9.0);
          float facing = mix(0.55, 1.0, smoothstep(0.15, 0.85, normal.z));
          totalEmissiveRadiance += uRevealColor * uLit * pool * facing;
        }`,
      );
  };
  material.customProgramCacheKey = () => "aegis-reveal";
  return material;
}

export type AegisWordProps = Omit<ThreeElements["group"], "ref"> & {
  reveal: AegisReveal;
};

export function AegisWord({ reveal, ...props }: AegisWordProps) {
  const material = useMemo(() => createRevealMaterial(reveal), [reveal]);

  return (
    <group {...props}>
      <Center>
        <Text3D
          renderOrder={20}
          font={cinzel as unknown as FontData}
          size={1.45}
          height={0.2}
          bevelEnabled
          bevelThickness={0.028}
          bevelSize={0.0168}
          bevelSegments={6}
          curveSegments={20}
          letterSpacing={0.26}
        >
          AEGIS
          <primitive object={material} attach="material" />
        </Text3D>
      </Center>
    </group>
  );
}
