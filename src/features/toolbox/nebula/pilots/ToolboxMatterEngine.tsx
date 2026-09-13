import { useEffect, useRef, type MutableRefObject, type ReactNode } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import { MATTER_FRAGMENT, MATTER_VERTEX } from "./toolboxMatterShaders";

/**
 * Anomalous Matter — standalone visual language (user GenerativeArtScene).
 * Not composited with the V3 particle cloud.
 */
export interface ToolboxMatterDrive {
  /** Normal displacement amplitude. */
  displace?: number;
  /** Spatial frequency of simplex. */
  noiseScale?: number;
  /** Rim glow. */
  fresnel?: number;
  /** Time multiplier (user scene used ~0.3 / sec). */
  timeScale?: number;
  /** Uniform mesh scale. */
  meshScale?: number;
  opacity?: number;
  hue?: number;
  rotation?: number;
  /** 1 = stop living (hold, edge lock). */
  freeze?: number;
}

const DEFAULT_DRIVE: Required<ToolboxMatterDrive> = {
  displace: 0.2,
  noiseScale: 2,
  fresnel: 0.5,
  timeScale: 0.3,
  meshScale: 1,
  opacity: 0.85,
  hue: 200,
  rotation: 1,
  freeze: 0,
};

interface ToolboxMatterEngineProps {
  driveRef?: MutableRefObject<ToolboxMatterDrive>;
  className?: string;
  children?: ReactNode;
}

export function ToolboxMatterEngine({
  driveRef,
  className,
  children,
}: ToolboxMatterEngineProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const driveRefStable = useRef(driveRef);
  driveRefStable.current = driveRef;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const mouse = new THREE.Vector2(0, 0);
    const smoothDrive = { ...DEFAULT_DRIVE };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      Math.max(mount.clientWidth, 1) / Math.max(mount.clientHeight, 1),
      0.1,
      1000,
    );
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const detail = window.innerWidth < 768 ? 24 : 40;
    const geometry = new THREE.IcosahedronGeometry(0.92, detail);
    const color = new THREE.Color().setHSL(DEFAULT_DRIVE.hue / 360, 0.55, 0.62);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_displace: { value: 0.2 },
        u_noiseScale: { value: 2 },
        u_color: { value: color },
        u_lightPos: { value: new THREE.Vector3(0, 0, 5) },
        u_fresnel: { value: 0.5 },
        u_opacity: { value: 0.85 },
      },
      vertexShader: MATTER_VERTEX,
      fragmentShader: MATTER_FRAGMENT,
      transparent: true,
      wireframe: true,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const ndc = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const lightPos = new THREE.Vector3(0, 0, 5);
    const clock = new THREE.Clock();
    let frameId = 0;

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      const dt = 0.016;
      const incoming = driveRefStable.current?.current ?? {};
      const freeze = Math.min(1, Math.max(0, incoming.freeze ?? 0));
      const lerp = 1 - Math.exp(-dt * (freeze > 0.7 ? 18 : 10));
      const scaleLerp = 1 - Math.exp(-dt * 14);
      smoothDrive.displace += ((incoming.displace ?? 0.2) - smoothDrive.displace) * lerp;
      smoothDrive.noiseScale += ((incoming.noiseScale ?? 2) - smoothDrive.noiseScale) * lerp;
      smoothDrive.fresnel += ((incoming.fresnel ?? 0.5) - smoothDrive.fresnel) * lerp;
      smoothDrive.timeScale += ((incoming.timeScale ?? 0.3) - smoothDrive.timeScale) * lerp;
      smoothDrive.meshScale += ((incoming.meshScale ?? 1) - smoothDrive.meshScale) * scaleLerp;
      smoothDrive.opacity += ((incoming.opacity ?? 0.85) - smoothDrive.opacity) * lerp;
      smoothDrive.hue += ((incoming.hue ?? 200) - smoothDrive.hue) * lerp;
      smoothDrive.rotation += ((incoming.rotation ?? 1) - smoothDrive.rotation) * lerp;
      smoothDrive.freeze += (freeze - smoothDrive.freeze) * lerp;

      const liveTime = 1 - smoothDrive.freeze;
      material.uniforms.u_time.value = elapsed * smoothDrive.timeScale * liveTime;
      material.uniforms.u_displace.value = smoothDrive.displace * (0.15 + 0.85 * liveTime);
      material.uniforms.u_noiseScale.value = smoothDrive.noiseScale;
      material.uniforms.u_fresnel.value = smoothDrive.fresnel;
      material.uniforms.u_opacity.value = smoothDrive.opacity;
      color.setHSL(smoothDrive.hue / 360, 0.55, 0.62);

      mesh.scale.setScalar(smoothDrive.meshScale);
      mesh.rotation.y += 0.0005 * smoothDrive.rotation * liveTime;
      mesh.rotation.x += 0.0002 * smoothDrive.rotation * liveTime;

      ndc.set(mouse.x, mouse.y, 0.5).unproject(camera);
      dir.copy(ndc).sub(camera.position).normalize();
      const dist = -camera.position.z / Math.max(0.08, dir.z);
      lightPos.copy(camera.position).add(dir.multiplyScalar(dist));
      material.uniforms.u_lightPos.value.copy(lightPos);

      renderer.render(scene, camera);
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
      renderer.dispose();
    };
  }, []);

  return (
    <div className={cn("absolute inset-0 h-full w-full", className)}>
      <div ref={mountRef} className="absolute inset-0 h-full w-full" />
      {children ? (
        <div className="pointer-events-none absolute inset-0 z-10">{children}</div>
      ) : null}
    </div>
  );
}
