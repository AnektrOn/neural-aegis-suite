import { Mesh, Program, Renderer, Triangle, Vec3 } from "ogl";
import { useEffect, useRef } from "react";
import { hexToVec3, orbFrag, orbVert } from "@/components/react-bits/orbShader";
import type { OrbZone } from "./v4CartographyUtils";
import { ORB_HOVER_INTENSITY, ZONE_ORB_CONFIG } from "./v4CartographyUtils";

export interface ConstellationOrbInstance {
  id: string;
  x: number;
  y: number;
  sizePx: number;
  zone: OrbZone;
  hot: boolean;
}

interface Props {
  instances: ConstellationOrbInstance[];
}

export function V4ConstellationOrbCanvas({ instances }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instancesRef = useRef(instances);
  instancesRef.current = instances;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: orbVert,
      fragment: orbFrag,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Vec3(1, 1, 1) },
        hue: { value: 0 },
        hover: { value: 0 },
        rot: { value: 0 },
        hoverIntensity: { value: ORB_HOVER_INTENSITY },
        backgroundColor: { value: hexToVec3("#000000") },
        zoneType: { value: 0 },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    const hoverState = new Map<string, number>();
    const rotState = new Map<string, number>();
    const timeState = new Map<string, number>();

    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      if (!container) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = container.clientWidth;
      height = container.clientHeight;
      if (width === 0 || height === 0) return;
      renderer.setSize(width * dpr, height * dpr);
      gl.canvas.style.width = `${width}px`;
      gl.canvas.style.height = `${height}px`;
    }

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    window.addEventListener("resize", resize);
    resize();

    let lastTime = 0;
    let rafId = 0;

    const update = (t: number) => {
      rafId = requestAnimationFrame(update);
      if (width === 0 || height === 0) return;

      const dt = lastTime > 0 ? (t - lastTime) * 0.001 : 0;
      lastTime = t;

      program.uniforms.hoverIntensity.value = ORB_HOVER_INTENSITY;
      program.uniforms.hue.value = 0;

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);

      for (const orb of instancesRef.current) {
        const size = Math.max(orb.sizePx, 1);
        const prevHover = hoverState.get(orb.id) ?? 0;
        const targetHover = orb.hot ? 1 : 0;
        const hover = prevHover + (targetHover - prevHover) * 0.1;
        hoverState.set(orb.id, hover);

        const isAnimating = hover > 0.02;
        let orbTime = timeState.get(orb.id) ?? 0;
        if (isAnimating) {
          orbTime += dt;
          timeState.set(orb.id, orbTime);
        }

        let rot = rotState.get(orb.id) ?? 0;
        if (hover > 0.5) {
          rot += dt * 0.3;
        } else {
          rot *= 0.9;
          if (Math.abs(rot) < 0.001) rot = 0;
        }
        rotState.set(orb.id, rot);

        const cfg = ZONE_ORB_CONFIG[orb.zone];
        const vpW = Math.round(size * dpr);
        const vpH = Math.round(size * dpr);
        const vpX = Math.round((orb.x - size / 2) * dpr);
        const vpY = Math.round((height - orb.y - size / 2) * dpr);

        if (vpW <= 0 || vpH <= 0) continue;
        if (vpX + vpW < 0 || vpY + vpH < 0) continue;
        if (vpX > gl.canvas.width || vpY > gl.canvas.height) continue;

        gl.viewport(vpX, vpY, vpW, vpH);
        program.uniforms.iResolution.value.set(vpW, vpH, vpW / vpH);
        program.uniforms.iTime.value = isAnimating ? orbTime : 0;
        program.uniforms.hover.value = hover;
        program.uniforms.rot.value = isAnimating ? rot : 0;
        program.uniforms.zoneType.value = cfg.zoneType;
        program.uniforms.backgroundColor.value = hexToVec3(cfg.backgroundColor);

        program.use();
        mesh.draw();
      }
    };

    rafId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("resize", resize);
      if (container.contains(gl.canvas)) container.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <div ref={containerRef} className="pointer-events-none absolute inset-0 z-[3]" aria-hidden />;
}
