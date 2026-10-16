import * as THREE from "three";
import { useEffect, useMemo, useState, useRef } from "react";
import { createPortal, useFrame, type ThreeElements } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import type { MutableRefObject } from "react";
import type { HoldState } from "@/features/intro/useHoldProgress";
import type { IntroPhase } from "@/features/intro/useIntroMachine";
import {
  flowClearKnobsFromPreset,
  flowHoldVisualMix,
  resolveFlowTuningFromHold,
  type FlowGpgpuDevKnobs,
} from "../../flowGpgpuHoldMorph";
import "./shaders/simulationMaterial";
import "./shaders/dofPointsMaterial";

type ParticlesProps = ThreeElements["points"] & {
  hold: MutableRefObject<HoldState>;
  phase?: IntroPhase;
  devKnobs?: FlowGpgpuDevKnobs;
  lowPower?: boolean;
};

const SIM_POSITIONS = new Float32Array([
  -1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0,
]);
const SIM_UVS = new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]);

function capSimSize(size: number, lowPower: boolean): number {
  return lowPower ? Math.min(256, size) : size;
}

export function Particles({ hold, phase, devKnobs, lowPower = false, ...props }: ParticlesProps) {
  const clearKnobs = devKnobs ?? flowClearKnobsFromPreset();
  const [simSize, setSimSize] = useState(() =>
    capSimSize(
      clearKnobs.holdAnimEnabled === false ? clearKnobs.simSize : 512,
      lowPower,
    ),
  );
  const simRef = useRef<THREE.ShaderMaterial>(null);
  const renderRef = useRef<THREE.ShaderMaterial>(null);
  const [scene] = useState(() => new THREE.Scene());
  const [camera] = useState(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1),
  );

  const target = useFBO(simSize, simSize, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
  });

  const simGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(SIM_POSITIONS, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(SIM_UVS, 2));
    return geo;
  }, []);

  const particles = useMemo(() => {
    const length = simSize * simSize;
    const data = new Float32Array(length * 3);
    for (let i = 0; i < length; i++) {
      const i3 = i * 3;
      data[i3 + 0] = (i % simSize) / simSize;
      data[i3 + 1] = i / simSize / simSize;
      data[i3 + 2] = 0;
    }
    return data;
  }, [simSize]);

  const pointsGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(particles, 3));
    return geo;
  }, [particles]);

  const _dom = useMemo(() => new THREE.Color(0x18bec7), []);
  const _acc = useMemo(() => new THREE.Color(0xe8b923), []);

  const uniformsBootstrapped = useRef(false);
  const simClock = useRef(0);
  useEffect(() => {
    uniformsBootstrapped.current = false;
  }, [simSize]);

  useFrame((state, delta) => {
    const sim = simRef.current;
    const render = renderRef.current;
    if (!sim || !render) return;

    const holdMix = flowHoldVisualMix(hold.current, phase, clearKnobs.holdAnimEnabled ?? true);
    const tuning = resolveFlowTuningFromHold(clearKnobs, holdMix);
    const nextSize = capSimSize(tuning.simSize, lowPower);
    setSimSize((prev) => (prev === nextSize ? prev : nextSize));
    const smooth = tuning.paramSmoothing;
    const targetBlur = (tuning.apertureBias - tuning.aperture) * tuning.blurMultiplier;

    if (!uniformsBootstrapped.current) {
      render.uniforms.uFocus.value = tuning.focus;
      render.uniforms.uFov.value = tuning.fov;
      render.uniforms.uBlur.value = targetBlur;
      sim.uniforms.uCurlFreq.value = tuning.curl;
      uniformsBootstrapped.current = true;
    }

    state.gl.setRenderTarget(target);
    state.gl.clear();
    state.gl.render(scene, camera);
    state.gl.setRenderTarget(null);

    render.uniforms.positions.value = target.texture;
    render.uniforms.uTime.value = state.clock.elapsedTime;
    render.uniforms.uFocus.value = THREE.MathUtils.lerp(render.uniforms.uFocus.value, tuning.focus, smooth);
    render.uniforms.uFov.value = THREE.MathUtils.lerp(render.uniforms.uFov.value, tuning.fov, smooth);
    render.uniforms.uBlur.value = THREE.MathUtils.lerp(render.uniforms.uBlur.value, targetBlur, smooth);
    render.uniforms.uPointSizeBoost.value = tuning.pointSizeBoost;
    render.uniforms.uOpacity.value = tuning.particleOpacity;
    render.uniforms.uGoldMix.value = tuning.goldMix;
    render.uniforms.uAlphaFalloff.value = tuning.alphaFalloff;
    render.uniforms.uDominant.value.set(_dom.r, _dom.g, _dom.b);
    render.uniforms.uAccent.value.set(_acc.r, _acc.g, _acc.b);

    simClock.current += delta * tuning.speed;
    sim.uniforms.uTime.value = simClock.current;
    sim.uniforms.uCurlFreq.value = THREE.MathUtils.lerp(sim.uniforms.uCurlFreq.value, tuning.curl, smooth);
    sim.uniforms.uTimeScale.value = tuning.simTimeScale;
    sim.uniforms.uOctaveStrength.value = tuning.octaveStrength;
    sim.uniforms.uCurlMix.value = tuning.curlMix;
  });

  return (
    <>
      {createPortal(
        <mesh geometry={simGeometry} frustumCulled={false}>
          <simulationMaterial ref={simRef} />
        </mesh>,
        scene,
      )}
      <points {...props} geometry={pointsGeometry} frustumCulled={false}>
        <dofPointsMaterial ref={renderRef} />
      </points>
    </>
  );
}
