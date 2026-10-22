import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BlendFunction, Effect } from "postprocessing";
import * as THREE from "three";

const fragment = /* glsl */ `
uniform vec2 lightPosition;
uniform float density;
uniform float decay;
uniform float weight;
uniform float exposure;
uniform vec3 blendColor;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 delta = (uv - lightPosition) * density / 56.0;
  vec2 coord = uv;
  vec3 acc = vec3(0.0);
  float illum = 1.0;

  for (int i = 0; i < 56; i++) {
    coord -= delta;
    vec2 clamped = clamp(coord, 0.0, 1.0);
    vec3 s = texture2D(inputBuffer, clamped).rgb;
    float lum = max(0.0, dot(s, vec3(0.26, 0.22, 0.14)) - 0.38);
    acc += s * lum * illum * weight;
    illum *= decay;
  }

  outputColor = vec4(inputColor.rgb + acc * blendColor * exposure, inputColor.a);
}
`;

class MonolithGodraysEffect extends Effect {
  constructor() {
    super("MonolithGodrays", fragment, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ["lightPosition", new THREE.Uniform(new THREE.Vector2(0.5, 0.55))],
        ["density", new THREE.Uniform(0.72)],
        ["decay", new THREE.Uniform(0.93)],
        ["weight", new THREE.Uniform(0.16)],
        ["exposure", new THREE.Uniform(0.55)],
        ["blendColor", new THREE.Uniform(new THREE.Color("#d19d7b"))],
      ]),
    });
  }
}

const LIGHT = new THREE.Vector3(0, 8.2, 0);
const NDC = new THREE.Vector3();

export function MonolithGodrays() {
  const camera = useThree((s) => s.camera);
  const effect = useMemo(() => new MonolithGodraysEffect(), []);
  const pos = useRef(effect.uniforms.get("lightPosition")!);

  useFrame(() => {
    NDC.copy(LIGHT).project(camera);
    pos.current.value.set(NDC.x * 0.5 + 0.5, NDC.y * 0.5 + 0.5);
  });

  return <primitive object={effect} />;
}
