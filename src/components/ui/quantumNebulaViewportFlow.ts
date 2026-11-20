import * as THREE from "three";
import type { WordMaskData } from "./quantumNebulaWordMask";

export const VIEWPORT_ANTI_PARTICLE_RATIO = 0.35;
export const VIEWPORT_LIGHT_PARTICLE_SIZE_SCALE = 11.5;

export type ViewportFlowMode = "auto" | "wave" | "vortex";

export interface ViewportFlowTuning {
  friction: number;
  noiseSpeed: number;
  noiseScale: number;
  flowSpeed: number;
  manualVortexMix: number;
  vortexDirMode: "auto" | 1 | -1;
  waveDirMode: "auto" | "manual";
  waveAngleDeg: number;
}

export const defaultViewportFlowTuning: ViewportFlowTuning = {
  friction: 0.915,
  noiseSpeed: 0.24,
  noiseScale: 1.15,
  flowSpeed: 0.25,
  manualVortexMix: 1,
  vortexDirMode: -1,
  waveDirMode: "auto",
  waveAngleDeg: 0,
};

export interface ViewportFlowBuffers {
  waveLayers: Float32Array;
  waveSeeds: Float32Array;
  particleDirs: Int8Array;
  particleColorJitter: Float32Array;
}

export function initViewportFlowParticles(
  count: number,
  spanX: number,
  spanY: number,
  dominant: THREE.Color,
  antiColor: THREE.Color,
  isLight: boolean,
): {
  positions: Float32Array;
  colors: Float32Array;
  pointSizes: Float32Array;
  buffers: ViewportFlowBuffers;
} {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const pointSizes = new Float32Array(count);
  const waveLayers = new Float32Array(count);
  const waveSeeds = new Float32Array(count);
  const particleDirs = new Int8Array(count);
  const particleColorJitter = new Float32Array(count);
  const tmp = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const isDust = Math.random() < 0.12;
    const layerIdx = isDust
      ? (Math.random() - 0.5) * 2.4
      : (Math.floor(Math.random() * 5) - 2) * 0.42;
    waveLayers[i] = layerIdx;
    waveSeeds[i] = Math.random();
    const jitter = Math.random() - 0.5;
    particleColorJitter[i] = jitter;

    positions[i3] = (Math.random() - 0.5) * spanX;
    positions[i3 + 1] = (Math.random() - 0.5) * spanY;
    positions[i3 + 2] = layerIdx * 0.55 + (Math.random() - 0.5) * 0.35;

    const isAnti = Math.random() < VIEWPORT_ANTI_PARTICLE_RATIO;
    particleDirs[i] = isAnti ? -1 : 1;

    if (isAnti) {
      tmp.copy(antiColor);
      tmp.offsetHSL(jitter * 0.025, 0, jitter * 0.08);
    } else {
      tmp.copy(dominant);
      if (!isLight) {
        tmp.offsetHSL(jitter * 0.03, 0, jitter * 0.08);
      }
    }
    colors[i3] = tmp.r;
    colors[i3 + 1] = tmp.g;
    colors[i3 + 2] = tmp.b;
    pointSizes[i] = isDust ? 0.65 + Math.random() * 0.6 : 0.8 + Math.random() * 0.55;
  }

  return {
    positions,
    colors,
    pointSizes,
    buffers: { waveLayers, waveSeeds, particleDirs, particleColorJitter },
  };
}

export interface ViewportFlowStepParams {
  count: number;
  flowMix: number;
  figureMix: number;
  reflexionMix: number;
  elapsedTime: number;
  bassLevel: number;
  tuning: ViewportFlowTuning;
  flowMode: ViewportFlowMode;
  positions: Float32Array;
  velocities: Float32Array;
  colors: Float32Array;
  restColors: Float32Array;
  pointSizes: Float32Array;
  buffers: ViewportFlowBuffers;
  figureTargets: Float32Array;
  neural: {
    targets: Float32Array;
    sizes: Float32Array;
    brightness: Float32Array;
    phase: Float32Array;
  };
  wordMask: WordMaskData | null;
  passBehindWord: boolean;
  pupilRadius: number;
  smoothVortexDirRef: { current: number };
  smoothDirRef: { x: number; y: number };
  vortexMixRef: { current: number };
  colorsDirtyRef: { current: boolean };
  reflexionPulseSpeed: number;
  reflexionWaveAmplitude: number;
  reflexionGlowBoost: number;
  reflexionSizePulse: number;
  wordOffsetX?: number;
  wordOffsetY?: number;
  /** 0 = mot « pulverisé », 1 = silhouette pleine. */
  wordReveal?: number;
}

/** GenerativeArtSceneV3 viewport flow — wave ↔ vortex, word/pupil bounce (repos / flow states). */
export function stepViewportFlow(params: ViewportFlowStepParams): void {
  const {
    count,
    flowMix,
    figureMix,
    reflexionMix,
    elapsedTime,
    bassLevel,
    tuning,
    flowMode,
    positions: posArr,
    velocities: velArr,
    colors: colArr,
    restColors,
    pointSizes: sizeArr,
    buffers,
    figureTargets,
    neural,
    wordMask,
    passBehindWord,
    pupilRadius,
    smoothVortexDirRef,
    smoothDirRef,
    vortexMixRef,
    colorsDirtyRef,
    reflexionPulseSpeed,
    reflexionWaveAmplitude,
    reflexionGlowBoost,
    reflexionSizePulse,
    wordOffsetX = 0,
    wordOffsetY = 0,
    wordReveal = 1,
  } = params;

  const { waveLayers, waveSeeds, particleDirs } = buffers;

  let targetVortex = tuning.manualVortexMix;
  if (flowMode === "auto") {
    const cycle = (Math.sin(elapsedTime * 0.28 - 0.8) + 1) * 0.5;
    targetVortex = cycle < 0.35 ? 0 : cycle > 0.68 ? 1 : (cycle - 0.35) / 0.33;
  } else if (flowMode === "wave") {
    targetVortex = 0;
  } else if (flowMode === "vortex") {
    targetVortex = 1;
  }
  vortexMixRef.current += (targetVortex - vortexMixRef.current) * 0.045;
  const vortexMix = vortexMixRef.current;
  const waveMix = 1 - vortexMix;
  const transitionEddy = Math.sin(vortexMix * Math.PI);

  let targetVortexDir = 1;
  if (tuning.vortexDirMode === "auto") {
    targetVortexDir = Math.sin(elapsedTime * 0.14) >= 0 ? 1 : -1;
  } else {
    targetVortexDir = tuning.vortexDirMode;
  }
  smoothVortexDirRef.current +=
    (targetVortexDir - smoothVortexDirRef.current) * 0.035;
  const smoothVortexDir = smoothVortexDirRef.current;

  let targetAngleRad = (tuning.waveAngleDeg * Math.PI) / 180;
  if (tuning.waveDirMode === "auto") {
    targetAngleRad =
      (elapsedTime * 0.16 + Math.sin(elapsedTime * 0.23) * 0.65) % (Math.PI * 2);
  }
  smoothDirRef.x += (Math.cos(targetAngleRad) - smoothDirRef.x) * 0.06;
  smoothDirRef.y += (Math.sin(targetAngleRad) - smoothDirRef.y) * 0.06;
  const dirNorm = Math.hypot(smoothDirRef.x, smoothDirRef.y) || 1;
  const cosA = smoothDirRef.x / dirNorm;
  const sinA = smoothDirRef.y / dirNorm;

  const wordActive = wordMask?.active ?? false;
  const halfW = wordActive ? wordMask!.planeW * 0.5 : 0;
  const halfH = wordActive ? wordMask!.planeH * 0.5 : 0;
  const invW = wordActive ? 1 / wordMask!.planeW : 0;
  const invH = wordActive ? 1 / wordMask!.planeH : 0;
  const gridW = wordActive ? wordMask!.gridW : 0;
  const gridH = wordActive ? wordMask!.gridH : 0;
  const wordBlurred = wordActive ? wordMask!.blurred : null;
  const wordGradX = wordActive ? wordMask!.gradX : null;
  const wordGradY = wordActive ? wordMask!.gradY : null;
  const passBehind = passBehindWord;
  const pupilR = pupilRadius;
  const pupilShell = pupilR * 1.08;

  const speedMul = tuning.flowSpeed;
  const vortexOriginR = wordActive ? 0 : pupilR * 1.05;
  const vortexSpinSpeed = (0.0095 + bassLevel * 0.012) * speedMul;
  const vortexTime = elapsedTime * 0.9 * speedMul;
  const waveTime = elapsedTime * 0.85 * speedMul;
  const halfSpanX = 5.2;
  const halfSpanY = 2.9;

  const needColorUpdate = reflexionMix > 0.005 || colorsDirtyRef.current;
  const nSpeed = elapsedTime * tuning.noiseSpeed * speedMul;
  const nScale = tuning.noiseScale;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    let px = posArr[i3];
    let py = posArr[i3 + 1];
    let pz = posArr[i3 + 2];
    let vx = velArr[i3];
    let vy = velArr[i3 + 1];
    let vz = velArr[i3 + 2];
    const layer = waveLayers[i];
    const seed = waveSeeds[i];
    const pDir = particleDirs[i];

    if (flowMix > 0.005) {
      let fx = 0;
      let fy = 0;
      let fz = 0;
      let ridge = 0.5;

      const curlX = Math.sin(py * nScale + nSpeed);
      const curlY = Math.cos(pz * nScale + nSpeed);
      const curlZ = Math.sin(px * nScale + nSpeed);

      if (waveMix > 0.005) {
        const pCos = cosA * pDir;
        const pSin = sinA * pDir;
        const u = px * pCos + py * pSin;
        const v = -px * pSin + py * pCos;

        const warpU = u * 0.62 - waveTime + layer * 1.3;
        const warpV = v * 0.85 + Math.sin(warpU * 0.7) * 0.65;
        const swell1 = Math.sin(warpU + Math.cos(warpV) * 0.55);
        const swell2 = Math.cos(u * 0.42 - waveTime * 0.72 + v * 0.52);

        const targetV = swell1 * 0.85 + swell2 * 0.42 + layer * 0.72;
        const targetZ = Math.cos(warpU * 0.85 + layer) * 0.55 + layer * 0.48;
        ridge = 0.5 + 0.5 * swell1;

        const driftSpeed = (0.014 + seed * 0.012 + bassLevel * 0.025) * speedMul;
        const fu = driftSpeed;
        const fv = (targetV - v) * 0.014;

        fx += (fu * pCos - fv * pSin + curlX * 0.0022) * waveMix;
        fy += (fu * pSin + fv * pCos + curlY * 0.0028) * waveMix;
        fz += ((targetZ - pz) * 0.018 + curlZ * 0.002) * waveMix;
      }

      if (vortexMix > 0.005) {
        const vox = wordActive ? wordOffsetX : 0;
        const voy = wordActive ? wordOffsetY : 0;
        const rx = px - vox;
        const ry = py - voy;
        const rXY = Math.sqrt(rx * rx + ry * ry) + 0.001;
        const invR = 1 / rXY;
        const baseTangX = -ry * invR;
        const baseTangY = rx * invR;
        const spinDir = smoothVortexDir * pDir;
        const tangX = baseTangX * spinDir;
        const tangY = baseTangY * spinDir;

        const tightBand = seed * seed * seed * 2.45 + Math.abs(layer) * 0.18;
        const breatheR = Math.sin(elapsedTime * 0.85 + seed * 6.283 + layer * 2) * 0.08;
        const targetR = Math.max(vortexOriginR, vortexOriginR + tightBand + breatheR);

        const speedByRadius =
          vortexSpinSpeed * (0.55 + 0.65 * (rXY / (0.35 + rXY))) * (0.7 + seed * 0.6);

        const vt = vx * baseTangX + vy * baseTangY;
        const centripetal = Math.min(0.035, (vt * vt) / (rXY + 0.08));
        const radialPull = (targetR - rXY) * 0.032 - centripetal;

        const funnelZ =
          layer * 0.22 + Math.sin(rXY * 1.5 - vortexTime * pDir) * 0.12 - rXY * 0.06;
        const zPull = (funnelZ - pz) * 0.035;

        const spiralArm =
          0.5 +
          0.5 *
            Math.sin(rXY * 2.6 - vortexTime * pDir + (tangX - tangY) * 2.0 + layer * 2.4);
        ridge = ridge * waveMix + spiralArm * vortexMix;

        fx += (tangX * speedByRadius + rx * invR * radialPull + curlX * 0.0012) * vortexMix;
        fy += (tangY * speedByRadius + ry * invR * radialPull + curlY * 0.0012) * vortexMix;
        fz += (zPull + curlZ * 0.0012) * vortexMix;
      }

      if (transitionEddy > 0.05) {
        const rad = Math.sqrt(px * px + py * py) + 0.25;
        const whip = (transitionEddy * 0.0042 * speedMul) / (0.45 + rad * 0.35);
        const eddyDir = smoothVortexDir * pDir;
        fx += (-py * eddyDir - px * 0.35) * whip + curlX * transitionEddy * 0.0022;
        fy += (px * 0.75 * eddyDir - py * 0.35) * whip + curlY * transitionEddy * 0.0022;
        fz += curlZ * transitionEddy * 0.0025;
      }

      vx = (vx + fx * flowMix) * tuning.friction;
      vy = (vy + fy * flowMix) * tuning.friction;
      vz = (vz + fz * flowMix) * tuning.friction;

      px += vx;
      py += vy;
      pz += vz;

      if (waveMix > 0.35) {
        if (px > halfSpanX) px = -halfSpanX;
        else if (px < -halfSpanX) px = halfSpanX;
        if (py > halfSpanY + 0.6) py = -halfSpanY - 0.6;
        else if (py < -halfSpanY - 0.6) py = halfSpanY + 0.6;
      }

      const targetSz = (0.72 + ridge * 0.65) * (1 + bassLevel * 0.35);
      sizeArr[i] += (targetSz - sizeArr[i]) * 0.12;
    }

    if (figureMix > 0.01) {
      const tx = figureTargets[i3];
      const ty = figureTargets[i3 + 1];
      const tz = figureTargets[i3 + 2];
      const pull = figureMix * (0.045 + figureMix * 0.14);
      px += (tx - px) * pull;
      py += (ty - py) * pull;
      pz += (tz - pz) * pull;
      vx *= 0.86;
      vy *= 0.86;
      vz *= 0.86;
    }

    if (reflexionMix > 0.005) {
      const thought = Math.sin(elapsedTime * reflexionPulseSpeed + neural.phase[i]);
      const wave = reflexionWaveAmplitude * (1.15 - neural.brightness[i]) * reflexionMix;
      const nx =
        neural.targets[i3] + Math.cos(elapsedTime * 1.3 + neural.phase[i]) * wave;
      const ny =
        neural.targets[i3 + 1] + Math.sin(elapsedTime * 1.1 + neural.phase[i] * 0.85) * wave;
      const nz = neural.targets[i3 + 2] + thought * wave * 0.45;
      px += (nx - px) * reflexionMix * 0.16;
      py += (ny - py) * reflexionMix * 0.16;
      pz += (nz - pz) * reflexionMix * 0.16;
      vx *= 1 - reflexionMix * 0.25;
      vy *= 1 - reflexionMix * 0.25;
      vz *= 1 - reflexionMix * 0.25;

      const glow =
        1 +
        reflexionMix *
          neural.brightness[i] *
          reflexionGlowBoost *
          (1 + Math.max(0, thought) * 0.2);
      colArr[i3] += (restColors[i3] * glow - colArr[i3]) * 0.14;
      colArr[i3 + 1] += (restColors[i3 + 1] * glow - colArr[i3 + 1]) * 0.14;
      colArr[i3 + 2] += (restColors[i3 + 2] * glow - colArr[i3 + 2]) * 0.14;
      sizeArr[i] +=
        (neural.sizes[i] * (0.92 + thought * reflexionSizePulse) - sizeArr[i]) * 0.14;
    } else if (colorsDirtyRef.current) {
      colArr[i3] += (restColors[i3] - colArr[i3]) * 0.12;
      colArr[i3 + 1] += (restColors[i3 + 1] - colArr[i3 + 1]) * 0.12;
      colArr[i3 + 2] += (restColors[i3 + 2] - colArr[i3 + 2]) * 0.12;
    }

    if (wordActive && wordReveal > 0.02 && wordBlurred && wordGradX && wordGradY) {
      const lx = px - wordOffsetX;
      const ly = py - wordOffsetY;
      if (lx > -halfW && lx < halfW && ly > -halfH && ly < halfH) {
        if (!passBehind || pz > -0.22) {
          const gx = Math.floor((lx + halfW) * invW * (gridW - 1));
          const gy = Math.floor((1 - (ly + halfH) * invH) * (gridH - 1));
          const idx = gy * gridW + gx;
          const density = wordBlurred[idx];
          if (density > 0.08 * wordReveal) {
            const nx = wordGradX[idx];
            const ny = wordGradY[idx];
            const inward = vx * nx + vy * ny;
            if (inward < 0) {
              vx -= nx * inward * 1.65;
              vy -= ny * inward * 1.65;
            }
            const repel = density * (passBehind ? 0.012 : 0.018) * wordReveal;
            vx += nx * repel;
            vy += ny * repel;
            if (density > 0.35) {
              px += nx * 0.035;
              py += ny * 0.035;
              if (passBehind && pz > -0.05) {
                vz -= 0.006;
              }
            }
          }
        }
      }
    } else {
      const r = Math.sqrt(px * px + py * py + pz * pz) + 0.0001;
      if (r < pupilShell) {
        const nx = px / r;
        const ny = py / r;
        const nz = pz / r;
        px = nx * pupilShell;
        py = ny * pupilShell;
        pz = nz * pupilShell;
        const inward = vx * nx + vy * ny + vz * nz;
        if (inward < 0) {
          vx -= nx * inward * 1.45;
          vy -= ny * inward * 1.45;
          vz -= nz * inward * 1.45;
        }
      }
    }

    posArr[i3] = px;
    posArr[i3 + 1] = py;
    posArr[i3 + 2] = pz;
    velArr[i3] = vx;
    velArr[i3 + 1] = vy;
    velArr[i3 + 2] = vz;
  }

  if (needColorUpdate && reflexionMix <= 0.01) {
    colorsDirtyRef.current = false;
  } else if (reflexionMix > 0.01) {
    colorsDirtyRef.current = true;
  }
}

export const VIEWPORT_PARTICLE_VERTEX_SHADER = `
  attribute vec3 color;
  attribute float a_size;
  varying vec3 vColor;
  varying float vAlpha;

  uniform float u_pointSize;
  uniform float u_pupilRadius;
  uniform float u_wordActive;
  uniform float u_wordReveal;
  uniform vec2 u_wordHalfSize;
  uniform vec2 u_wordCenter;
  uniform sampler2D u_wordTex;
  uniform float u_passBehind;

  void main() {
    vColor = color;
    vAlpha = 1.0;

    float wordGate = u_wordActive * u_wordReveal;
    if (u_wordActive > 0.5 && wordGate >= 0.02) {
      vec2 uv = ((position.xy - u_wordCenter) / (u_wordHalfSize * 2.0)) + 0.5;
      if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
        float letterMask = texture2D(u_wordTex, uv).a;
        if (letterMask > 0.25 * wordGate) {
          if (u_passBehind < 0.5 || position.z > -0.02) {
            vAlpha = 0.0;
            gl_PointSize = 0.0;
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            return;
          }
        }
      }
    } else if (u_wordActive < 0.5) {
      float r = length(position);
      if (r < u_pupilRadius * 1.04) {
        vAlpha = 0.0;
        gl_PointSize = 0.0;
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        return;
      }
    }

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float depth = max(0.8, -mvPosition.z);
    vAlpha = clamp(1.25 - depth * 0.11, 0.28, 1.0);
    gl_PointSize = min(14.0, u_pointSize * a_size * (4.5 / depth));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const VIEWPORT_PARTICLE_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vAlpha;
  uniform float u_isLight;

  void main() {
    if (vAlpha <= 0.01) discard;
    vec2 c = gl_PointCoord - vec2(0.5);
    float d2 = dot(c, c);
    if (d2 > 0.25) discard;
    float core = exp(-d2 * 15.0);
    float alpha = core * vAlpha * (u_isLight > 0.5 ? 0.85 : 0.78);
    if (alpha < 0.015) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`;