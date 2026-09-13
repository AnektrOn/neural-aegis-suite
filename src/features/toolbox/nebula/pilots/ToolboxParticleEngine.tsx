import { useEffect, useRef, type MutableRefObject, type ReactNode } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { cn } from "@/lib/utils";
import {
  TOOLBOX_SHAPE_LIBRARY,
  type ToolboxShapeId,
  lungAnatomyColorAtPosition,
  lungInflateWeightAtPosition,
} from "../toolboxParticleShapes";

/**
 * Precision V3 particle cloud — additive points, curl, mouse, bloom, parallax.
 * Separate from Anomalous Matter (icosa / fresnel), which is its own visual language.
 */
export interface ToolboxV3Drive {
  /** Home-cloud scale (breath). 0.65 exhale → ~1.35 inhale. */
  cloudScale?: number;
  /** Curl ornament strength. Keep low for precision. */
  noiseForce?: number;
  /** Curl time speed. */
  noiseSpeed?: number;
  /** Mouse repulsion multiplier. */
  mouseRepulsion?: number;
  /** Extra outward push along radius 0–1. */
  radialPush?: number;
  /** Extra pull to origin 0–1 (on top of home spring). */
  centerPull?: number;
  /**
   * 0 = loose swirl, 1 = locked to scaled homes.
   * High = precise silhouette (breath hold, STOP « O »).
   */
  coherence?: number;
  bloomStrength?: number;
  /** 1 = hard freeze (STOP « O ») — velocities killed. */
  freeze?: number;
  /** Scan beam: world Y of attractor. */
  attractorY?: number;
  attractorStrength?: number;
  /** Home figure. Sphere is only the default, not the product look. */
  shape?: ToolboxShapeId;
  /** Y-axis rotation in degrees (lung viewer). */
  rotationY?: number;
  /** X-axis tilt in degrees (lung viewer). */
  tiltX?: number;
}

const DEFAULT_DRIVE: Required<ToolboxV3Drive> = {
  cloudScale: 1,
  noiseForce: 0.55,
  noiseSpeed: 0.7,
  mouseRepulsion: 0.85,
  radialPush: 0,
  centerPull: 0,
  coherence: 0.72,
  bloomStrength: 0.36,
  freeze: 0,
  attractorY: 0,
  attractorStrength: 0,
  shape: "sphere",
  rotationY: 0,
  tiltX: 0,
};

interface ToolboxParticleEngineProps {
  driveRef?: MutableRefObject<ToolboxV3Drive>;
  particleCount?: number;
  baseHue?: number;
  hueVariance?: number;
  className?: string;
  children?: ReactNode;
  /** Seed homes on this figure so breath/STOP don't morph from a sphere. */
  initialShape?: ToolboxShapeId;
}

function resolveCount(requested?: number): number {
  if (requested) return requested;
  if (typeof window === "undefined") return 24000;
  const cores = navigator.hardwareConcurrency || 4;
  const small = window.innerWidth < 768 || cores <= 4;
  return small ? 16000 : 28000;
}

/** Smooth value noise → cheap curl (divergence-free-ish). */
function hash3(x: number, y: number, z: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

function valueNoise3(p: THREE.Vector3, t: number): number {
  const x = p.x + t;
  const y = p.y + t * 0.7;
  const z = p.z + t * 1.1;
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);
  const n000 = hash3(ix, iy, iz);
  const n100 = hash3(ix + 1, iy, iz);
  const n010 = hash3(ix, iy + 1, iz);
  const n110 = hash3(ix + 1, iy + 1, iz);
  const n001 = hash3(ix, iy, iz + 1);
  const n101 = hash3(ix + 1, iy, iz + 1);
  const n011 = hash3(ix, iy + 1, iz + 1);
  const n111 = hash3(ix + 1, iy + 1, iz + 1);
  const nx00 = n000 * (1 - ux) + n100 * ux;
  const nx10 = n010 * (1 - ux) + n110 * ux;
  const nx01 = n001 * (1 - ux) + n101 * ux;
  const nx11 = n011 * (1 - ux) + n111 * ux;
  const nxy0 = nx00 * (1 - uy) + nx10 * uy;
  const nxy1 = nx01 * (1 - uy) + nx11 * uy;
  return nxy0 * (1 - uz) + nxy1 * uz;
}

export function ToolboxParticleEngine({
  driveRef,
  particleCount: particleCountProp,
  baseHue = 285,
  hueVariance = 18,
  className,
  children,
  initialShape = "sphere",
}: ToolboxParticleEngineProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const driveRefStable = useRef(driveRef);
  driveRefStable.current = driveRef;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const particleCount = resolveCount(particleCountProp);
    const radius = 1.85;
    const isLungAnatomy =
      initialShape === "lungs" && initialShape in TOOLBOX_SHAPE_LIBRARY;
    const particleSize = isLungAnatomy ? 0.014 : 0.013;
    const mouseRepulsionBase = 0.0042;
    const friction = 0.92;
    const homeSpringBase = 0.045;
    const cameraDistance = 5.1;
    const parallaxIntensity = 0.18;
    const mouseRadius = 1.55;

    const mouse = new THREE.Vector2(0, 0);
    const mouseSmooth = new THREE.Vector2(0, 0);
    const smoothDrive = { ...DEFAULT_DRIVE };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      Math.max(mount.clientWidth, 1) / Math.max(mount.clientHeight, 1),
      0.1,
      100,
    );
    camera.position.z = cameraDistance;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(mount.clientWidth, mount.clientHeight),
      isLungAnatomy ? 0.08 : 0.32,
      isLungAnatomy ? 0.12 : 0.22,
      isLungAnatomy ? 0.5 : 0.28,
    );
    const composer = new EffectComposer(
      renderer,
      new THREE.WebGLRenderTarget(
        Math.max(mount.clientWidth, 1),
        Math.max(mount.clientHeight, 1),
        { type: THREE.HalfFloatType, format: THREE.RGBAFormat },
      ),
    );
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(bloomPass);

    const positions = new Float32Array(particleCount * 3);
    const basePositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3).fill(0);
    const baseColor = new THREE.Color();

    const seedShape: ToolboxShapeId =
      initialShape && initialShape in TOOLBOX_SHAPE_LIBRARY ? initialShape : "sphere";
    const shapeCache: Partial<Record<ToolboxShapeId, Float32Array>> = {
      [seedShape]: TOOLBOX_SHAPE_LIBRARY[seedShape](particleCount, radius),
    };
    const startHomes = shapeCache[seedShape]!;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      basePositions[i3] = startHomes[i3]!;
      basePositions[i3 + 1] = startHomes[i3 + 1]!;
      basePositions[i3 + 2] = startHomes[i3 + 2]!;
      positions[i3] = basePositions[i3];
      positions[i3 + 1] = basePositions[i3 + 1];
      positions[i3 + 2] = basePositions[i3 + 2];

      if (isLungAnatomy) {
        const [cr, cg, cb] = lungAnatomyColorAtPosition(
          basePositions[i3]!,
          basePositions[i3 + 1]!,
          basePositions[i3 + 2]!,
          radius,
        );
        const j = (Math.random() - 0.5) * 0.07;
        colors[i3] = Math.min(1, Math.max(0, cr + j));
        colors[i3 + 1] = Math.min(1, Math.max(0, cg + j));
        colors[i3 + 2] = Math.min(1, Math.max(0, cb + j));
      } else {
        const hue = (baseHue + (Math.random() - 0.5) * hueVariance) / 360;
        const light = 0.55 + Math.random() * 0.18;
        baseColor.setHSL(hue, 0.78, light);
        colors[i3] = baseColor.r;
        colors[i3 + 1] = baseColor.g;
        colors[i3 + 2] = baseColor.b;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_pointSize: { value: particleSize * renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute vec3 color;
        varying vec3 vColor;
        uniform float u_pointSize;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = u_pointSize * (10.0 / max(0.45, -mvPosition.z));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 c = gl_PointCoord - vec2(0.5);
          float d = length(c);
          if (d > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.22, 0.5, d);
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: isLungAnatomy ? THREE.NormalBlending : THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const tmpP = new THREE.Vector3();
    const noiseP = new THREE.Vector3();
    const home = new THREE.Vector3();
    const curl = new THREE.Vector3();
    const mouseTarget = new THREE.Vector3();
    const mouseForce = new THREE.Vector3();
    const eps = 0.08;
    const clock = new THREE.Clock();
    let frameId = 0;
    let prevTime = 0;

    const sampleCurl = (p: THREE.Vector3, t: number, scale: number, out: THREE.Vector3) => {
      // Finite-difference pseudo-curl — smoother than raw sin stack.
      const sp = scale;
      noiseP.copy(p).multiplyScalar(sp);
      const n = valueNoise3(noiseP, t);
      const nx = valueNoise3(noiseP.set(p.x + eps, p.y, p.z).multiplyScalar(sp), t);
      const ny = valueNoise3(noiseP.set(p.x, p.y + eps, p.z).multiplyScalar(sp), t);
      const nz = valueNoise3(noiseP.set(p.x, p.y, p.z + eps).multiplyScalar(sp), t);
      const gx = (nx - n) / eps;
      const gy = (ny - n) / eps;
      const gz = (nz - n) / eps;
      out.set(gy - gz, gz - gx, gx - gy);
      const len = out.length();
      if (len > 1e-6) out.multiplyScalar(1 / len);
      else out.set(0, 0, 0);
    };

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      const dt = Math.min(0.033, Math.max(0.008, elapsed - prevTime || 0.016));
      prevTime = elapsed;

      const incoming = driveRefStable.current?.current ?? {};
      const targetFreeze = Math.min(1, Math.max(0, incoming.freeze ?? 0));
      const snapFreeze = targetFreeze >= 0.9;
      const lerp = 1 - Math.exp(-dt * (snapFreeze ? 28 : 9));
      smoothDrive.cloudScale += ((incoming.cloudScale ?? 1) - smoothDrive.cloudScale) * lerp;
      smoothDrive.noiseForce += ((incoming.noiseForce ?? 0.55) - smoothDrive.noiseForce) * lerp;
      smoothDrive.noiseSpeed += ((incoming.noiseSpeed ?? 0.7) - smoothDrive.noiseSpeed) * lerp;
      smoothDrive.mouseRepulsion +=
        ((incoming.mouseRepulsion ?? 0.85) - smoothDrive.mouseRepulsion) * lerp;
      smoothDrive.radialPush += ((incoming.radialPush ?? 0) - smoothDrive.radialPush) * lerp;
      smoothDrive.centerPull += ((incoming.centerPull ?? 0) - smoothDrive.centerPull) * lerp;
      smoothDrive.coherence += ((incoming.coherence ?? 0.72) - smoothDrive.coherence) * lerp;
      smoothDrive.bloomStrength +=
        ((incoming.bloomStrength ?? 0.48) - smoothDrive.bloomStrength) * lerp;
      if (snapFreeze) {
        smoothDrive.freeze = targetFreeze;
        smoothDrive.noiseForce = incoming.noiseForce ?? 0;
        smoothDrive.noiseSpeed = incoming.noiseSpeed ?? 0;
      } else {
        smoothDrive.freeze += (targetFreeze - smoothDrive.freeze) * lerp;
      }
      smoothDrive.attractorY += ((incoming.attractorY ?? 0) - smoothDrive.attractorY) * lerp;
      smoothDrive.attractorStrength +=
        ((incoming.attractorStrength ?? 0) - smoothDrive.attractorStrength) * lerp;
      smoothDrive.rotationY += ((incoming.rotationY ?? 0) - smoothDrive.rotationY) * lerp;
      smoothDrive.tiltX += ((incoming.tiltX ?? 0) - smoothDrive.tiltX) * lerp;

      const requestedShape = incoming.shape;
      const shapeId: ToolboxShapeId =
        requestedShape && requestedShape in TOOLBOX_SHAPE_LIBRARY ? requestedShape : "sphere";
      if (!shapeCache[shapeId]) {
        shapeCache[shapeId] = TOOLBOX_SHAPE_LIBRARY[shapeId](particleCount, radius);
      }
      const targetHomes = shapeCache[shapeId]!;
      const morphK = 1 - Math.exp(-dt * (snapFreeze ? 8 : 3.4));

      bloomPass.strength = smoothDrive.bloomStrength;

      mouseSmooth.x += (mouse.x - mouseSmooth.x) * 0.12;
      mouseSmooth.y += (mouse.y - mouseSmooth.y) * 0.12;

      const scale = smoothDrive.cloudScale;
      const coherence = Math.min(1, Math.max(0, smoothDrive.coherence));
      const freeze = smoothDrive.freeze;
      const spring = homeSpringBase * (0.35 + coherence * 1.4);
      const noiseAmp =
        freeze > 0.85 ? 0 : 0.00055 * smoothDrive.noiseForce * (1.05 - coherence * 0.75);
      const noiseT = elapsed * 0.55 * smoothDrive.noiseSpeed;
      const repulsion = mouseRepulsionBase * smoothDrive.mouseRepulsion;
      const lobeBreath = shapeId === "lungs";
      const hilumY = radius * 0.48;
      const maxR = radius * (lobeBreath ? 1 + (scale - 1) * 0.92 : scale) * 2.45;

      mouseTarget.set(
        mouseSmooth.x * radius * 0.95 * scale,
        mouseSmooth.y * radius * 0.95 * scale,
        0,
      );

      const pos = geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        basePositions[i3] += (targetHomes[i3]! - basePositions[i3]) * morphK;
        basePositions[i3 + 1] += (targetHomes[i3 + 1]! - basePositions[i3 + 1]) * morphK;
        basePositions[i3 + 2] += (targetHomes[i3 + 2]! - basePositions[i3 + 2]) * morphK;
        tmpP.set(pos[i3], pos[i3 + 1], pos[i3 + 2]);
        const bx = basePositions[i3]!;
        const by = basePositions[i3 + 1]!;
        const bz = basePositions[i3 + 2]!;

        if (lobeBreath) {
          const lobeWeight = lungInflateWeightAtPosition(bx, by, bz, radius);
          const breathScale = 1 + (scale - 1) * lobeWeight;
          if (lobeWeight > 0.001) {
            home.set(bx * breathScale, hilumY + (by - hilumY) * breathScale, bz * breathScale);
          } else {
            home.set(bx, by, bz);
          }
        } else {
          home.set(bx * scale, by * scale, bz * scale);
        }

        // Primary: spring to scaled home (precision breath / silhouette).
        velocities[i3] += (home.x - tmpP.x) * spring;
        velocities[i3 + 1] += (home.y - tmpP.y) * spring;
        velocities[i3 + 2] += (home.z - tmpP.z) * spring;

        // Secondary: smooth curl ornament.
        if (noiseAmp > 1e-7) {
          sampleCurl(tmpP, noiseT, 0.85, curl);
          velocities[i3] += curl.x * noiseAmp;
          velocities[i3 + 1] += curl.y * noiseAmp;
          velocities[i3 + 2] += curl.z * noiseAmp;
        }

        // Mouse: smooth quadratic falloff (no hard cliff).
        const dx = tmpP.x - mouseTarget.x;
        const dy = tmpP.y - mouseTarget.y;
        const dz = tmpP.z - mouseTarget.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-4;
        const mr = mouseRadius * scale;
        if (dist < mr && repulsion > 1e-8) {
          const fall = 1 - dist / mr;
          const strength = repulsion * fall * fall;
          mouseForce.set(dx / dist, dy / dist, dz / dist).multiplyScalar(strength);
          velocities[i3] += mouseForce.x;
          velocities[i3 + 1] += mouseForce.y;
          velocities[i3 + 2] += mouseForce.z;
        }

        if (smoothDrive.centerPull > 0.001) {
          const pull = smoothDrive.centerPull * 0.012 * coherence;
          velocities[i3] -= tmpP.x * pull;
          velocities[i3 + 1] -= tmpP.y * pull;
          velocities[i3 + 2] -= tmpP.z * pull;
        }
        if (smoothDrive.radialPush > 0.001) {
          const len = tmpP.length() + 1e-4;
          const push = smoothDrive.radialPush * 0.014;
          velocities[i3] += (tmpP.x / len) * push;
          velocities[i3 + 1] += (tmpP.y / len) * push;
          velocities[i3 + 2] += (tmpP.z / len) * push;
        }

        if (smoothDrive.attractorStrength > 0.001) {
          const ay = smoothDrive.attractorY * radius * scale;
          velocities[i3 + 1] += (ay - tmpP.y) * smoothDrive.attractorStrength * 0.02;
        }

        const damp = friction - coherence * 0.04;
        velocities[i3] *= damp;
        velocities[i3 + 1] *= damp;
        velocities[i3 + 2] *= damp;

        if (freeze > 0.02) {
          const kill = 1 - freeze;
          velocities[i3] *= kill;
          velocities[i3 + 1] *= kill;
          velocities[i3 + 2] *= kill;
        }
        if (freeze > 0.88) {
          velocities[i3] = 0;
          velocities[i3 + 1] = 0;
          velocities[i3 + 2] = 0;
        }

        pos[i3] += velocities[i3];
        pos[i3 + 1] += velocities[i3 + 1];
        pos[i3 + 2] += velocities[i3 + 2];

        // Soft spherical containment (no wrap pop).
        const pr = Math.sqrt(pos[i3] * pos[i3] + pos[i3 + 1] * pos[i3 + 1] + pos[i3 + 2] * pos[i3 + 2]);
        if (pr > maxR && pr > 1e-6) {
          const k = maxR / pr;
          pos[i3] *= k;
          pos[i3 + 1] *= k;
          pos[i3 + 2] *= k;
          velocities[i3] *= 0.4;
          velocities[i3 + 1] *= 0.4;
          velocities[i3 + 2] *= 0.4;
        }
      }

      geometry.attributes.position.needsUpdate = true;

      points.rotation.y = (smoothDrive.rotationY * Math.PI) / 180;
      points.rotation.x = (smoothDrive.tiltX * Math.PI) / 180;

      camera.position.x += (mouseSmooth.x * parallaxIntensity - camera.position.x) * 0.06;
      camera.position.y += (-mouseSmooth.y * parallaxIntensity - camera.position.y) * 0.06;
      camera.position.z = cameraDistance;
      camera.lookAt(0, 0, 0);

      renderer.setClearColor(0x000000, 0);
      composer.render();
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(mount);
    window.addEventListener("mousemove", onMouseMove);
    onResize();

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      composer.dispose();
      renderer.dispose();
    };
  }, [particleCountProp, baseHue, hueVariance, initialShape]);

  return (
    <div className={cn("absolute inset-0 h-full w-full", className)}>
      <div ref={mountRef} className="absolute inset-0 h-full w-full" />
      {children ? (
        <div className="pointer-events-none absolute inset-0 z-10">{children}</div>
      ) : null}
    </div>
  );
}
