import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { STORY_ICE, STORY_WARM } from "../storyTheme";

const COUNT = 900;

type Props = {
  onComplete: () => void;
};

/** Volumetric-feeling fog as a light particle field the pointer clears. */
export function FogScene({ onComplete }: Props) {
  const pointsRef = useRef<THREE.Points>(null);
  const clearedRef = useRef(0);
  const doneRef = useRef(false);
  const pointer3 = useRef(new THREE.Vector3());
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  const { positions, opacities, base } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const opacities = new Float32Array(COUNT);
    const base = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      const x = (Math.random() - 0.5) * 14;
      const y = (Math.random() - 0.5) * 9;
      const z = (Math.random() - 0.5) * 6;
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      base[i3] = x;
      base[i3 + 1] = y;
      base[i3 + 2] = z;
      opacities[i] = 0.35 + Math.random() * 0.55;
    }
    return { positions, opacities, base };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aOpacity", new THREE.BufferAttribute(opacities, 1));
    return geo;
  }, [positions, opacities]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uColor: { value: new THREE.Color(STORY_ICE) },
          uWarm: { value: new THREE.Color(STORY_WARM) },
          uTime: { value: 0 },
        },
        vertexShader: /* glsl */ `
          attribute float aOpacity;
          varying float vOpacity;
          uniform float uTime;
          void main() {
            vOpacity = aOpacity;
            vec3 p = position;
            p.x += sin(uTime * 0.35 + position.y) * 0.08;
            p.y += cos(uTime * 0.28 + position.x) * 0.06;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = (18.0 * aOpacity) * (1.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          precision highp float;
          uniform vec3 uColor;
          uniform vec3 uWarm;
          varying float vOpacity;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if (d > 0.5) discard;
            float soft = smoothstep(0.5, 0.05, d);
            vec3 col = mix(uColor, uWarm, 0.25);
            gl_FragColor = vec4(col, soft * vOpacity * 0.55);
          }
        `,
      }),
    [],
  );

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame((state, dt) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    const pts = pointsRef.current;
    if (!pts) return;

    raycaster.setFromCamera(state.pointer, state.camera);
    raycaster.ray.intersectPlane(plane, hit);
    if (hit) pointer3.current.copy(hit);

    const pos = pts.geometry.attributes.position as THREE.BufferAttribute;
    const opac = pts.geometry.attributes.aOpacity as THREE.BufferAttribute;
    const px = pointer3.current.x;
    const py = pointer3.current.y;
    let cleared = clearedRef.current;

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      const dx = pos.getX(i) - px;
      const dy = pos.getY(i) - py;
      const dist = Math.hypot(dx, dy);
      if (dist < 1.35) {
        const next = Math.max(0, opac.getX(i) - dt * 1.8);
        if (opac.getX(i) > 0.05 && next <= 0.05) cleared += 1 / COUNT;
        opac.setX(i, next);
      } else if (opac.getX(i) < 0.15) {
        // keep cleared; gentle drift on remaining fog
      } else {
        const t = state.clock.elapsedTime;
        pos.setXYZ(
          i,
          base[i3] + Math.sin(t * 0.4 + i) * 0.12,
          base[i3 + 1] + Math.cos(t * 0.35 + i * 0.7) * 0.1,
          base[i3 + 2],
        );
      }
    }
    opac.needsUpdate = true;
    pos.needsUpdate = true;
    clearedRef.current = cleared;

    if (!doneRef.current && cleared >= 0.36) {
      doneRef.current = true;
      onComplete();
    }
  });

  return (
    <>
      <points ref={pointsRef} geometry={geometry} material={material} />
      <mesh position={[0, 0, -4]} rotation={[0, 0, 0]}>
        <planeGeometry args={[30, 20]} />
        <meshBasicMaterial color="#080a0e" />
      </mesh>
    </>
  );
}
