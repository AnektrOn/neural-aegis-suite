import * as THREE from "three";
import { TONE_HDR_DEFAULTS } from "./monolithEmissiveLevels";

export type ExposureMeterDiagnostics = {
  measuredAverage: number;
  targetExposure: number;
  currentExposure: number;
  readbackPending: boolean;
  frame: number;
};

const METER_W = 64;
const METER_H = 36;

const meterVertex = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const meterFragment = `
uniform sampler2D tInput;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tInput, vUv).rgb;
  float l = max(dot(c, vec3(0.2126, 0.7152, 0.0722)), 0.0);
  float encoded = l / (l + 1.0);
  gl_FragColor = vec4(encoded, encoded, encoded, 1.0);
}
`;

function decodeLuminance(encoded: number) {
  return encoded / Math.max(0.0001, 1 - encoded);
}

/**
 * 64×36 encoded luminance meter + asymmetric adaptation (scene-referred skill).
 */
export class MonolithExposureMeter {
  readonly diagnostics: ExposureMeterDiagnostics = {
    measuredAverage: 0.18,
    targetExposure: TONE_HDR_DEFAULTS.middleGrey / 0.18,
    currentExposure: 0.72,
    readbackPending: false,
    frame: 0,
  };

  private readonly rt: THREE.WebGLRenderTarget;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.OrthographicCamera;
  private readonly quad: THREE.Mesh;
  private readonly pixels = new Uint8Array(METER_W * METER_H * 4);
  private readbackPending = false;

  constructor(private readonly renderer: THREE.WebGLRenderer) {
    this.rt = new THREE.WebGLRenderTarget(METER_W, METER_H, {
      type: THREE.UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false,
    });
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const mat = new THREE.ShaderMaterial({
      vertexShader: meterVertex,
      fragmentShader: meterFragment,
      uniforms: { tInput: { value: null as THREE.Texture | null } },
      depthTest: false,
      depthWrite: false,
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    this.scene.add(this.quad);
    this.diagnostics.currentExposure = 0.72;
    this.diagnostics.targetExposure = 0.72;
  }

  dispose() {
    this.rt.dispose();
    this.quad.geometry.dispose();
    (this.quad.material as THREE.Material).dispose();
  }

  sampleHdrTexture(texture: THREE.Texture) {
    if (this.readbackPending) return;
    if (
      this.diagnostics.frame % TONE_HDR_DEFAULTS.meterIntervalFrames !==
      0
    ) {
      return;
    }

    const mat = this.quad.material as THREE.ShaderMaterial;
    mat.uniforms.tInput.value = texture;
    const prev = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.rt);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(prev);

    this.readbackPending = true;
    this.diagnostics.readbackPending = true;
    this.renderer
      .readRenderTargetPixelsAsync(this.rt, 0, 0, METER_W, METER_H, this.pixels)
      .then(() => {
        let sumLog = 0;
        let sumWeight = 0;
        for (let i = 0; i < METER_W * METER_H; i++) {
          const encoded = this.pixels[i * 4] / 255;
          const l = decodeLuminance(encoded);
          const weight = l > TONE_HDR_DEFAULTS.minLuminance ? 1 : 0.15;
          sumLog += Math.log(Math.max(l, 0.0001)) * weight;
          sumWeight += weight;
        }
        const average = Math.exp(sumLog / Math.max(sumWeight, 1e-6));
        this.diagnostics.measuredAverage = average;
        this.readbackPending = false;
        this.diagnostics.readbackPending = false;
      })
      .catch(() => {
        this.readbackPending = false;
        this.diagnostics.readbackPending = false;
        this.diagnostics.targetExposure = 1;
      });
  }

  adapt(
    dt: number,
    compensationEv: number,
    manualExposure: number,
    enabled: boolean,
  ): number {
    this.diagnostics.frame += 1;
    if (!enabled) {
      this.diagnostics.currentExposure = manualExposure;
      this.diagnostics.targetExposure = manualExposure;
      return manualExposure;
    }

    const avg = Math.max(this.diagnostics.measuredAverage, 0.0001);
    const target = THREE.MathUtils.clamp(
      (TONE_HDR_DEFAULTS.middleGrey / avg) * Math.pow(2, compensationEv),
      TONE_HDR_DEFAULTS.minExposure,
      TONE_HDR_DEFAULTS.maxExposure,
    );
    this.diagnostics.targetExposure = target;

    const current = this.diagnostics.currentExposure;
    const speed =
      target > current
        ? TONE_HDR_DEFAULTS.adaptationSpeedUp
        : TONE_HDR_DEFAULTS.adaptationSpeedDown;
    const amount = 1 - Math.exp(-Math.max(dt, 0) * speed);
    this.diagnostics.currentExposure = current + (target - current) * amount;
    return this.diagnostics.currentExposure;
  }
}
