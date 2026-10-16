import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { exocortexCameraY, exocortexZoom } from "../exocortexCamera";
import { FRAGMENT, VERTEX } from "./Orb";

const RING_RADIUS = 2.9;
const PLANE = 10;
const ORB_SIZE = 0.89;
const INTRO_SECONDS = 1.1;
const SPEED = 3;
const HOVER = 0;
const TRAIL = 0.25;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function ShieldOrb() {
  const reduce = useMemo(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    [],
  );
  const material = useMemo(() => {
    const colors = ["#ff6a3d", "#ffc35c", "#4a1206"].map((hex) => new THREE.Color(hex));
    return new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: {
        uResolution: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uRotation: { value: 0 },
        uReach: { value: new THREE.Vector2() },
        uNear: { value: 0 },
        uAwake: { value: 0 },
        uBackground: { value: new THREE.Vector3(0, 0, 0) },
        uColor1: { value: colors[0] },
        uColor2: { value: colors[1] },
        uColor3: { value: colors[2] },
        uScale: { value: 1 },
        uWobble: { value: 0.25 },
        uGlow: { value: 0.3 },
        uBleed: { value: 0.25 },
        uHighlight: { value: 1.2 },
        uSwirl: { value: 0 },
        uOrbit: { value: 0 },
        uEcho: { value: new THREE.Vector2(0.55, 0) },
        uReveal: { value: 1 },
        uOpacity: { value: 1 },
        uTrail: { value: TRAIL },
        uTilt: { value: new THREE.Vector2() },
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      toneMapped: false,
    });
  }, []);

  const motion = useRef({
    time: 0,
    swirl: 0,
    orbit: 0,
    echo: 1,
    rotation: 0,
    hover: 0,
    near: 0,
    reachX: 0,
    reachY: 0,
    reachSpeedX: 0,
    reachSpeedY: 0,
    pulse: 0,
    pulseSpeed: 0,
    kick: 0,
    reveal: 1,
  });

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, delta) => {
    const dt = clamp(delta, 0.0005, 0.05);
    const width = state.size.width;
    const height = state.size.height;
    const zoom = exocortexZoom(width, height);
    const camY = exocortexCameraY(width);
    const centerX = width / 2;
    const centerY = height / 2 + camY * zoom;
    const side = (RING_RADIUS * zoom) / (0.4 * ORB_SIZE);
    const cssX = (state.pointer.x * 0.5 + 0.5) * width;
    const cssY = (0.5 - state.pointer.y * 0.5) * height;
    const localX = cssX - (centerX - side / 2);
    const localY = cssY - (centerY - side / 2);
    const inside =
      localX >= 0 && localY >= 0 && localX <= side && localY <= side;

    const m = motion.current;
    const scale = 1 / (ORB_SIZE * (1 + m.pulse));
    const px = ((localX - side / 2) / side) * 2 * scale;
    const py = ((side / 2 - localY) / side) * 2 * scale;
    const distance = Math.hypot(px, py);
    const region = inside && !reduce ? clamp((1.45 - distance) / 0.4, 0, 1) : 0;
    const zone = region * region * (3 - 2 * region);
    const aimed = zone * clamp((distance - 0.15) / 0.45, 0, 1);
    const near = zone > 0.5;
    const step = dt * SPEED * (reduce ? 0 : 1);

    m.hover += (zone - m.hover) * (1 - Math.exp(-dt / 0.16));
    const reach = 0.075 * HOVER * aimed;
    const goalX = distance > 0.0001 ? (px / distance) * reach : 0;
    const goalY = distance > 0.0001 ? (py / distance) * reach : 0;
    m.reachSpeedX += (70 * (goalX - m.reachX) - 7 * m.reachSpeedX) * dt;
    m.reachSpeedY += (70 * (goalY - m.reachY) - 7 * m.reachSpeedY) * dt;
    m.reachX += m.reachSpeedX * dt;
    m.reachY += m.reachSpeedY * dt;
    m.near += (aimed * HOVER - m.near) * (1 - Math.exp(-dt / 0.12));
    m.time += step;
    m.swirl += step * 2 * (1 + m.kick);
    m.echo = Math.min(1, m.echo + dt / 1.2);
    if (near && !reduce) {
      const aim = Math.atan2(py, px);
      const turn = Math.atan2(Math.sin(aim - m.orbit), Math.cos(aim - m.orbit));
      m.orbit += turn * (1 - Math.exp(-dt * 6));
    } else {
      m.orbit -= step;
    }
    m.orbit = Math.atan2(Math.sin(m.orbit), Math.cos(m.orbit));
    m.pulseSpeed += (-170 * m.pulse - 11 * m.pulseSpeed) * dt;
    m.pulse += m.pulseSpeed * dt;
    m.kick *= Math.exp(-dt * 2.5);
    if (reduce) m.reveal = 1;
    else if (m.reveal < 1) m.reveal = Math.min(1, m.reveal + dt / INTRO_SECONDS);

    const reveal = m.reveal;
    const back = reveal - 1;
    const grow = 1 + 2.2 * back * back * back + 1.2 * back * back;
    const base = (0.8 * (PLANE / 2)) / RING_RADIUS;
    const u = material.uniforms;
    u.uTime.value = m.time;
    u.uRotation.value = m.rotation;
    u.uReach.value.set(m.reachX, m.reachY);
    u.uNear.value = m.near;
    u.uAwake.value = m.hover * HOVER * 0.18;
    u.uScale.value = base / ((1 + m.pulse) * (0.62 + 0.38 * grow));
    u.uSwirl.value = m.swirl;
    u.uOrbit.value = m.orbit;
    u.uEcho.value.set(m.echo * 0.55, m.echo < 1 ? (1 - m.echo) * (1 - m.echo) : 0);
    u.uReveal.value =
      Math.min(1, reveal / 0.55) *
      Math.min(1, reveal / 0.55) *
      (3 - 2 * Math.min(1, reveal / 0.55));
  });

  return (
    <mesh
      position={[0, 0, 0]}
      scale={[PLANE, PLANE, 1]}
      material={material}
      renderOrder={-1}
    >
      <planeGeometry />
    </mesh>
  );
}
