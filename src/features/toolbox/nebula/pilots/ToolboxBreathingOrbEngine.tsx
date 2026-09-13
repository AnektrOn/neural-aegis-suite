import { useEffect, useRef, type MutableRefObject, type ReactNode } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export interface BreathingOrbDrive {
  breath: number;
}

const ORB_CONFIG = {
  radius: { min: 1.1, max: 1.9 },
  colors: { inhaleHue: 195, exhaleHue: 260 },
  camera: { distance: 5.2, parallaxIntensity: 0.6 },
  jitter: 0.15,
  pointSize: 0.03,
};

function resolveParticleCount(): number {
  if (typeof window === "undefined") return 24000;
  const cores = navigator.hardwareConcurrency || 4;
  const small = window.innerWidth < 768 || cores <= 4;
  return small ? 16000 : 24000;
}

interface ToolboxBreathingOrbEngineProps {
  driveRef: MutableRefObject<BreathingOrbDrive>;
  className?: string;
  children?: ReactNode;
}

export function ToolboxBreathingOrbEngine({
  driveRef,
  className,
  children,
}: ToolboxBreathingOrbEngineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const particleCount = resolveParticleCount();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    camera.position.z = ORB_CONFIG.camera.distance;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const positions = new Float32Array(particleCount * 3);
    const dirs = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const jitterPhase = new Float32Array(particleCount);
    const baseColor = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const dx = Math.sin(phi) * Math.cos(theta);
      const dy = Math.sin(phi) * Math.sin(theta);
      const dz = Math.cos(phi);
      dirs[i3] = dx;
      dirs[i3 + 1] = dy;
      dirs[i3 + 2] = dz;

      positions[i3] = dx * ORB_CONFIG.radius.min;
      positions[i3 + 1] = dy * ORB_CONFIG.radius.min;
      positions[i3 + 2] = dz * ORB_CONFIG.radius.min;

      jitterPhase[i] = Math.random() * Math.PI * 2;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        u_pointSize: {
          value: ORB_CONFIG.pointSize * renderer.getPixelRatio() * 100,
        },
      },
      vertexShader: `
        attribute vec3 color;
        varying vec3 vColor;
        uniform float u_pointSize;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = u_pointSize * (1.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float strength = distance(gl_PointCoord, vec2(0.5));
          strength = 1.0 - smoothstep(0.3, 0.5, strength);
          if (strength < 0.01) discard;
          gl_FragColor = vec4(vColor, strength);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    const mouse = new THREE.Vector2(0, 0);
    const clock = new THREE.Clock();
    let raf = 0;

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      particleMaterial.uniforms.u_pointSize.value =
        ORB_CONFIG.pointSize * renderer.getPixelRatio() * 100;
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      const breath = Math.min(1, Math.max(0, driveRef.current.breath ?? 0));
      const radius =
        ORB_CONFIG.radius.min +
        (ORB_CONFIG.radius.max - ORB_CONFIG.radius.min) * breath;
      const hue =
        (ORB_CONFIG.colors.exhaleHue +
          (ORB_CONFIG.colors.inhaleHue - ORB_CONFIG.colors.exhaleHue) * breath) /
        360;

      const pos = particleGeometry.attributes.position.array as Float32Array;
      const col = particleGeometry.attributes.color.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const wob = Math.sin(elapsed * 1.3 + jitterPhase[i]) * ORB_CONFIG.jitter;
        const r = radius + wob;
        pos[i3] = dirs[i3] * r;
        pos[i3 + 1] = dirs[i3 + 1] * r;
        pos[i3 + 2] = dirs[i3 + 2] * r;

        baseColor.setHSL(hue, 0.75, 0.6);
        col[i3] = baseColor.r;
        col[i3 + 1] = baseColor.g;
        col[i3 + 2] = baseColor.b;
      }
      particleGeometry.attributes.position.needsUpdate = true;
      particleGeometry.attributes.color.needsUpdate = true;

      particleSystem.rotation.y += 0.0015;

      camera.position.x +=
        (mouse.x * ORB_CONFIG.camera.parallaxIntensity - camera.position.x) * 0.02;
      camera.position.y +=
        (-mouse.y * ORB_CONFIG.camera.parallaxIntensity - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);
    onResize();
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [driveRef]);

  return (
    <div ref={containerRef} className={cn("absolute inset-0", className)}>
      {children}
    </div>
  );
}
