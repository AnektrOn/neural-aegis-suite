import { Mesh, Program, Renderer, Triangle, Vec3 } from "ogl";
import { useEffect, useRef } from "react";
import { hexToVec3, orbFrag, orbVert } from "@/components/react-bits/orbShader";
import "./Orb.css";

interface OrbProps {
  hue?: number;
  hoverIntensity?: number;
  rotateOnHover?: boolean;
  forceHoverState?: boolean;
  backgroundColor?: string;
  /** Caps framebuffer size — use 1 for small embedded orbs */
  maxDpr?: number;
  className?: string;
}

export default function Orb({
  hue = 0,
  hoverIntensity = 0.2,
  rotateOnHover = true,
  forceHoverState = false,
  backgroundColor = "#000000",
  maxDpr = 2,
  className,
}: OrbProps) {
  const ctnDom = useRef<HTMLDivElement>(null);
  const forceHoverRef = useRef(forceHoverState);
  forceHoverRef.current = forceHoverState;

  useEffect(() => {
    const container = ctnDom.current;
    if (!container) return;

    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: orbVert,
      fragment: orbFrag,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new Vec3(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height),
        },
        hue: { value: hue },
        hover: { value: 0 },
        rot: { value: 0 },
        hoverIntensity: { value: hoverIntensity },
        backgroundColor: { value: hexToVec3(backgroundColor) },
        zoneType: { value: 0 },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      if (!container) return;
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      renderer.setSize(width * dpr, height * dpr);
      gl.canvas.style.width = `${width}px`;
      gl.canvas.style.height = `${height}px`;
      program.uniforms.iResolution.value.set(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height);
    }

    window.addEventListener("resize", resize);
    resize();

    let targetHover = forceHoverRef.current ? 1 : 0;
    let lastTime = 0;
    let currentRot = 0;
    const rotationSpeed = 0.3;

    const handleMouseMove = (e: MouseEvent) => {
      if (forceHoverRef.current) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const width = rect.width;
      const height = rect.height;
      const size = Math.min(width, height);
      const centerX = width / 2;
      const centerY = height / 2;
      const uvX = ((x - centerX) / size) * 2.0;
      const uvY = ((y - centerY) / size) * 2.0;
      targetHover = Math.sqrt(uvX * uvX + uvY * uvY) < 0.8 ? 1 : 0;
    };

    const handleMouseLeave = () => {
      if (!forceHoverRef.current) targetHover = 0;
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    let rafId = 0;
    let orbTime = 0;
    const update = (t: number) => {
      rafId = requestAnimationFrame(update);
      const dt = lastTime > 0 ? (t - lastTime) * 0.001 : 0;
      lastTime = t;
      program.uniforms.hue.value = hue;
      program.uniforms.hoverIntensity.value = hoverIntensity;
      program.uniforms.backgroundColor.value = hexToVec3(backgroundColor);

      const effectiveHover = forceHoverRef.current ? 1 : targetHover;
      const hover = program.uniforms.hover.value;
      const newHover = hover + (effectiveHover - hover) * 0.1;
      program.uniforms.hover.value = newHover;

      const isAnimating = newHover > 0.02;
      if (isAnimating) orbTime += dt;

      program.uniforms.iTime.value = isAnimating ? orbTime : 0;

      if (rotateOnHover && newHover > 0.5) {
        currentRot += dt * rotationSpeed;
      } else {
        currentRot *= 0.9;
        if (Math.abs(currentRot) < 0.001) currentRot = 0;
      }
      program.uniforms.rot.value = isAnimating ? currentRot : 0;

      renderer.render({ scene: mesh });
    };
    rafId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      if (container.contains(gl.canvas)) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [hue, hoverIntensity, rotateOnHover, backgroundColor, maxDpr]);

  return <div ref={ctnDom} className={className ? `orb-container ${className}` : "orb-container"} />;
}
