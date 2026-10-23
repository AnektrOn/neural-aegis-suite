import {
  BlendFunction,
  DepthOfFieldEffect,
  Effect,
  EffectPass,
  SSAOEffect,
} from "postprocessing";
import type { EffectComposer } from "postprocessing";
import * as THREE from "three";
import type { PerspectiveCamera } from "three";

const PORTAL_VOLUME_FRAG = /* glsl */ `
uniform vec3 uPortal;
uniform float uStrength;
uniform float uSteps;
uniform float uTime;

float ign(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 col = inputColor.rgb;
  if (uStrength <= 0.001) {
    outputColor = inputColor;
    return;
  }
  vec3 accum = vec3(0.0);
  float trans = 1.0;
  float steps = max(uSteps, 8.0);
  float dither = ign(gl_FragCoord.xy + uTime * 17.0) - 0.5;
  for (float i = 0.0; i < 24.0; i++) {
    if (i >= steps) break;
    float t = (i + dither) / steps;
    vec3 p = mix(uPortal, uPortal + vec3(0.0, 6.5, 2.2), t);
    float cone = 1.0 - smoothstep(0.0, 1.0, abs(p.x - uPortal.x) / (1.2 + t * 2.5));
    float density = cone * (0.08 + 0.12 * (1.0 - t)) * uStrength;
    vec3 warm = vec3(1.0, 0.55, 0.22) * density;
    accum += warm * trans;
    trans *= 1.0 - density * 0.35;
    if (trans < 0.05) break;
  }
  outputColor = vec4(col + accum * 0.85, inputColor.a);
}
`;

class LandingPortalVolumeEffect extends Effect {
  constructor() {
    super("LandingPortalVolume", PORTAL_VOLUME_FRAG, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ["uPortal", new THREE.Uniform(new THREE.Vector3())],
        ["uStrength", new THREE.Uniform(0)],
        ["uSteps", new THREE.Uniform(20)],
        ["uTime", new THREE.Uniform(0)],
      ]),
    });
  }
}

export type LandingPmndrsRealismBundle = {
  ssaoEffect: SSAOEffect;
  dofEffect: DepthOfFieldEffect;
  portalEffect: LandingPortalVolumeEffect;
  realismPass: EffectPass;
  setSsaoEnabled: (on: boolean) => void;
  setPortalVolumeStrength: (strength: number) => void;
  setDofEnabled: (on: boolean) => void;
  setDofStrength: (strength: number) => void;
  tickPortal: (t: number, portal: THREE.Vector3) => void;
  dispose: () => void;
};

export function attachLandingPmndrsRealism(
  composer: EffectComposer,
  camera: PerspectiveCamera,
  insertIndex: number,
): LandingPmndrsRealismBundle {
  const ssaoEffect = new SSAOEffect(camera, undefined, {
    intensity: 1.2,
    radius: 0.12,
    bias: 0.025,
  });
  ssaoEffect.blendMode.opacity.value = 0;

  const dofEffect = new DepthOfFieldEffect(camera, {
    focusDistance: 14,
    focusRange: 10,
    bokehScale: 1.0,
    resolutionScale: 0.5,
  });
  dofEffect.blendMode.opacity.value = 0;

  const portalEffect = new LandingPortalVolumeEffect();
  const uStrength = portalEffect.uniforms.get("uStrength")!;
  uStrength.value = 0;

  const realismPass = new EffectPass(camera, ssaoEffect, portalEffect, dofEffect);
  realismPass.enabled = false;
  composer.addPass(realismPass, insertIndex);

  return {
    ssaoEffect,
    dofEffect,
    portalEffect,
    realismPass,
    setSsaoEnabled(on) {
      ssaoEffect.blendMode.opacity.value = on ? 1 : 0;
      realismPass.enabled =
        ssaoEffect.blendMode.opacity.value > 0 ||
        dofEffect.blendMode.opacity.value > 0 ||
        (uStrength.value as number) > 0.001;
    },
    setPortalVolumeStrength(strength) {
      uStrength.value = strength;
      realismPass.enabled =
        strength > 0.001 ||
        ssaoEffect.blendMode.opacity.value > 0 ||
        dofEffect.blendMode.opacity.value > 0;
    },
    setDofEnabled(on) {
      dofEffect.blendMode.opacity.value = on ? 1 : 0;
      realismPass.enabled =
        on ||
        ssaoEffect.blendMode.opacity.value > 0 ||
        (uStrength.value as number) > 0.001;
    },
    setDofStrength(strength) {
      dofEffect.bokehScale = 0.5 + strength * 2.5;
    },
    tickPortal(t, portal) {
      portalEffect.uniforms.get("uPortal")!.value.copy(portal);
      portalEffect.uniforms.get("uTime")!.value = t;
    },
    dispose() {
      realismPass.dispose();
    },
  };
}
