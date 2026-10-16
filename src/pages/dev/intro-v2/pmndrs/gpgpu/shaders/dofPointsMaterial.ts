import * as THREE from "three";
import { extend } from "@react-three/fiber";
import { INTRO_V2_PALETTE } from "../../../introV2Palette";
import { INTRO_V2_FLOW } from "../../../introV2FlowPreset";

const _flowBlur =
  (INTRO_V2_FLOW.apertureBias - INTRO_V2_FLOW.aperture) * INTRO_V2_FLOW.blurMultiplier;

const _dom = new THREE.Color(INTRO_V2_PALETTE.dominant);
const _acc = new THREE.Color(INTRO_V2_PALETTE.accent);

class DofPointsMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader: `uniform sampler2D positions;
      uniform float uTime;
      uniform float uFocus;
      uniform float uFov;
      uniform float uBlur;
      uniform float uPointSizeBoost;
      varying float vDistance;
      void main() { 
        vec3 pos = texture2D(positions, position.xy).xyz;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        vDistance = abs(uFocus - -mvPosition.z);
        float size = vDistance * uBlur * uPointSizeBoost;
        gl_PointSize = step(1.0 - (1.0 / uFov), position.x) * clamp(size, 0.0, 36.0);
      }`,
      fragmentShader: `uniform float uOpacity;
      uniform float uGoldMix;
      uniform float uAlphaFalloff;
      uniform vec3 uDominant;
      uniform vec3 uAccent;
      varying float vDistance;
      void main() {
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        if (dot(cxy, cxy) > 1.0) discard;
        float alpha = (1.04 - clamp(vDistance * uAlphaFalloff, 0.0, 1.0)) * uOpacity;
        float gold = smoothstep(0.35, 1.0, 1.0 - vDistance * 0.18);
        vec3 col = mix(uDominant, uAccent, gold * uGoldMix);
        gl_FragColor = vec4(col, alpha);
      }`,
      uniforms: {
        positions: { value: null },
        uTime: { value: 0 },
        uFocus: { value: INTRO_V2_FLOW.focus },
        uFov: { value: INTRO_V2_FLOW.fov },
        uBlur: { value: _flowBlur },
        uPointSizeBoost: { value: 1 },
        uOpacity: { value: 1 },
        uGoldMix: { value: 0.42 },
        uAlphaFalloff: { value: 1.5 },
        uDominant: { value: new THREE.Vector3(_dom.r, _dom.g, _dom.b) },
        uAccent: { value: new THREE.Vector3(_acc.r, _acc.g, _acc.b) },
      },
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
  }
}

extend({ DofPointsMaterial });
