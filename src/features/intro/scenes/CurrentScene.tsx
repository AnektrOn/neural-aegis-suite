import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Sky, Water } from "three-stdlib";
import type { SceneProps } from "./FullscreenShader";

const WATER_NORMALS_URL = "/textures/waternormals.jpg";
useLoader.preload(THREE.TextureLoader, WATER_NORMALS_URL);

const SUN_ELEVATION_START = 1.5;
const SUN_ELEVATION_END = 6;
const SUN_AZIMUTH = 180;
/** Sky radiance grows sharply with elevation, so exposure falls as the sun rises. */
const EXPOSURE_DUSK = 0.3;
const EXPOSURE_DAY = 0.14;
const EXPOSURE_SUN_CLOSEUP = 1.4;
const INTRO_TRAVEL_S = 5;
const CLOSEUP_FOV = 5;
const WIDE_FOV = 55;
const CLOSEUP_POSITION = new THREE.Vector3(0, 3, 200);

/**
 * Ocean at dusk, after three.js `webgpu_ocean` (WebGL `Water` + `Sky`).
 * Holding raises the sun, stirs the swell and lifts a polished monolith out of the sea.
 */
export function CurrentScene({ hold }: SceneProps) {
  const { gl, scene, camera } = useThree();
  const normals = useLoader(THREE.TextureLoader, WATER_NORMALS_URL);
  const monolith = useRef<THREE.Mesh>(null);
  const eased = useRef({ progress: 0, holding: 0, yaw: 0, pitch: 0, intro: 0 });
  const view = useMemo(
    () => ({ wide: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3(), look: new THREE.Vector3() }),
    [],
  );

  const { water, sky, sun } = useMemo(() => {
    normals.wrapS = normals.wrapT = THREE.RepeatWrapping;
    const water = new Water(new THREE.PlaneGeometry(10000, 10000), {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: normals,
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 2,
      fog: false,
    });
    water.rotation.x = -Math.PI / 2;
    const sky = new Sky();
    sky.scale.setScalar(10000);
    const u = sky.material.uniforms;
    u.turbidity.value = 10;
    u.rayleigh.value = 2;
    u.mieCoefficient.value = 0.005;
    u.mieDirectionalG.value = 0.8;
    return { water, sky, sun: new THREE.Vector3() };
  }, [normals]);

  // Environment map from the sky (as in the example), refreshed while the sun moves.
  const env = useMemo(() => ({ pmrem: new THREE.PMREMGenerator(gl), scene: new THREE.Scene(), target: null as THREE.WebGLRenderTarget | null, lastElevation: -1 }), [gl]);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const prev = { far: cam.far, fov: cam.fov, exposure: gl.toneMappingExposure, env: scene.environment };
    cam.far = 20000;
    cam.fov = CLOSEUP_FOV;
    cam.updateProjectionMatrix();
    gl.toneMappingExposure = EXPOSURE_SUN_CLOSEUP;
    return () => {
      cam.far = prev.far;
      cam.fov = prev.fov;
      cam.updateProjectionMatrix();
      gl.toneMappingExposure = prev.exposure;
      scene.environment = prev.env;
      env.target?.dispose();
      env.pmrem.dispose();
      water.geometry.dispose();
      water.material.dispose();
    };
  }, [camera, gl, scene, env, water]);

  useFrame(({ clock }, delta) => {
    const s = hold.current;
    const e = eased.current;
    const k = 1 - Math.exp(-delta * 1.8);
    e.progress += (s.progress - e.progress) * k;
    e.holding += ((s.holding ? 1 : 0) - e.holding) * k;
    e.yaw += ((s.pointer.x - 0.5) - e.yaw) * k;
    e.pitch += ((s.pointer.y - 0.5) - e.pitch) * k;
    e.intro = Math.min(1, e.intro + delta / INTRO_TRAVEL_S);
    const ei = e.intro < 0.5 ? 4 * e.intro ** 3 : 1 - (-2 * e.intro + 2) ** 3 / 2;

    const elevation = THREE.MathUtils.lerp(SUN_ELEVATION_START, SUN_ELEVATION_END, e.progress);
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(SUN_AZIMUTH + e.yaw * 30);
    sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms.sunPosition.value.copy(sun);
    const wu = water.material.uniforms;
    wu.sunDirection.value.copy(sun).normalize();
    wu.time.value += delta * (0.6 + e.holding * 1.4 + e.progress * 0.6);
    wu.distortionScale.value = 1.6 + e.holding * 3.2 + e.progress * 1.2;
    wu.size.value = 1.2 - e.holding * 0.4;

    if (Math.abs(elevation - env.lastElevation) > 1) {
      env.lastElevation = elevation;
      env.target?.dispose();
      env.scene.add(sky);
      env.target = env.pmrem.fromScene(env.scene);
      scene.add(sky);
      scene.environment = env.target.texture;
    }

    const exposure = THREE.MathUtils.lerp(EXPOSURE_DUSK, EXPOSURE_DAY, Math.sqrt(e.progress));
    gl.toneMappingExposure = THREE.MathUtils.lerp(EXPOSURE_SUN_CLOSEUP, exposure, ei);

    // Reverse travelling: open on a tight, overexposed shot of the sun (continuing the
    // storm's closing light), then pull back and widen to the ocean.
    const t = clock.elapsedTime;
    const cam = camera as THREE.PerspectiveCamera;
    const wide = view.wide.set(
      e.yaw * 40 + Math.sin(t * 0.2) * 2,
      14 + e.pitch * 10 - e.holding * 4 + Math.sin(t * 0.6) * 0.6,
      120 - e.progress * 25 - e.holding * 8,
    );
    cam.position.lerpVectors(CLOSEUP_POSITION, wide, ei);
    const toSun = view.a.copy(sun).normalize();
    const toTarget = view.b.set(0, 8 + e.progress * 6, 0).sub(cam.position).normalize();
    const dir = toSun.lerp(toTarget, ei).normalize();
    cam.lookAt(view.look.copy(cam.position).add(dir));
    const fov = THREE.MathUtils.lerp(CLOSEUP_FOV, WIDE_FOV, ei);
    if (Math.abs(cam.fov - fov) > 1e-3) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    const m = monolith.current;
    if (m) {
      m.position.y = THREE.MathUtils.lerp(-10, 14, e.progress) + Math.sin(t * 0.9) * 1.5;
      m.rotation.x = t * 0.25 + e.holding * 0.4;
      m.rotation.z = t * 0.26;
    }
  });

  return (
    <>
      <primitive object={water} />
      <primitive object={sky} />
      <mesh ref={monolith} position={[0, -10, 0]}>
        <octahedronGeometry args={[9, 0]} />
        <meshStandardMaterial color="#f3d49c" metalness={1} roughness={0.05} envMapIntensity={2.4} />
      </mesh>
    </>
  );
}
