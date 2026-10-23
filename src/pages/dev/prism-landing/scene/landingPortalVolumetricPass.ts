import * as THREE from "three";
import { Pass, FullScreenQuad } from "three/addons/postprocessing/Pass.js";

/** Cône volumétrique court (demi-résolution) depuis la fente portail. */
export const LANDING_PORTAL_VOLUME_SHADER = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    tDepth: { value: null as THREE.DepthTexture | null },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uPortal: { value: new THREE.Vector3() },
    uStrength: { value: 0.65 },
    uSteps: { value: 20 },
    uCameraNear: { value: 0.1 },
    uCameraFar: { value: 400 },
    uTime: { value: 0 },
    uHasDepth: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform float uHasDepth;
    uniform vec2 uResolution;
    uniform vec3 uPortal;
    uniform float uStrength;
    uniform float uSteps;
    uniform float uCameraNear;
    uniform float uCameraFar;
    uniform float uTime;
    varying vec2 vUv;

    float ign(vec2 p) {
      return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
    }

    float linearizeDepth(float d) {
      float z = d * 2.0 - 1.0;
      return (2.0 * uCameraNear * uCameraFar) / (uCameraFar + uCameraNear - z * (uCameraFar - uCameraNear));
    }

    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      if (uStrength <= 0.001) {
        gl_FragColor = base;
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
      vec3 col = base.rgb + accum * 0.85;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export class LandingPortalVolumetricPass extends Pass {
  material: THREE.ShaderMaterial;
  fsQuad: FullScreenQuad;

  constructor() {
    super();
    this.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(LANDING_PORTAL_VOLUME_SHADER.uniforms),
      vertexShader: LANDING_PORTAL_VOLUME_SHADER.vertexShader,
      fragmentShader: LANDING_PORTAL_VOLUME_SHADER.fragmentShader,
    });
    this.fsQuad = new FullScreenQuad(this.material);
    this.needsSwap = true;
  }

  setSize(width: number, height: number) {
    this.material.uniforms.uResolution.value.set(width, height);
  }

  render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    readBuffer: THREE.WebGLRenderTarget,
  ) {
    this.material.uniforms.tDiffuse.value = readBuffer.texture;
    this.material.uniforms.tDepth.value = readBuffer.depthTexture;
    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
    } else {
      renderer.setRenderTarget(writeBuffer);
    }
    this.fsQuad.render(renderer);
  }

  dispose() {
    this.material.dispose();
    this.fsQuad.dispose();
  }
}
