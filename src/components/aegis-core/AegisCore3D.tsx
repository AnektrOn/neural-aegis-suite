import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { createAegisCoreScene } from "./createAegisCoreScene";
import type { AegisEvolutionState } from "./evolutionStates";

export interface AegisCore3DProps {
  className?: string;
  size?: number | "100%";
  backgroundColor?: string | null;
  maxDpr?: number;
  animate?: boolean;
  interactive?: boolean;
  autoRotate?: boolean;
  evolutionState?: AegisEvolutionState;
}

function resolveDpr(maxDpr?: number): number {
  const native = window.devicePixelRatio || 1;
  const cap = maxDpr ?? 3;
  return Math.min(native, cap);
}

function whenContainerReady(container: HTMLElement): Promise<void> {
  if (container.clientWidth >= 32 && container.clientHeight >= 32) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const ro = new ResizeObserver(() => {
      if (container.clientWidth >= 32 && container.clientHeight >= 32) {
        ro.disconnect();
        resolve();
      }
    });
    ro.observe(container);
    requestAnimationFrame(() => {
      if (container.clientWidth >= 32 && container.clientHeight >= 32) {
        ro.disconnect();
        resolve();
      }
    });
  });
}

export function AegisCore3D({
  className,
  size = "100%",
  backgroundColor = "#e5e4e2",
  maxDpr,
  animate = true,
  interactive = false,
  autoRotate = true,
  evolutionState = "emerging",
}: AegisCore3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ReturnType<typeof createAegisCoreScene> | null>(null);

  useEffect(() => {
    sceneRef.current?.setEvolutionState(evolutionState);
  }, [evolutionState]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let scene: ReturnType<typeof createAegisCoreScene> | null = null;
    let ro: ResizeObserver | null = null;
    let rafId = 0;
    let start = 0;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shouldAnimate = animate && !reducedMotion;
    const initialState = evolutionState;

    const syncSize = () => {
      if (!scene) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w < 32 || h < 32) return;
      scene.setPixelRatio(resolveDpr(maxDpr));
      scene.resize(w, h);
      if (!shouldAnimate && !interactive) scene.render();
    };

    void whenContainerReady(container).then(() => {
      if (cancelled) return;

      scene = createAegisCoreScene(container, {
        backgroundColor,
        dpr: resolveDpr(maxDpr),
        animate: shouldAnimate,
        interactive,
        autoRotate: shouldAnimate && autoRotate,
        evolutionState: initialState,
      });
      sceneRef.current = scene;
      scene.setEvolutionState(evolutionState);

      syncSize();
      ro = new ResizeObserver(() => syncSize());
      ro.observe(container);

      const loop = (t: number) => {
        rafId = requestAnimationFrame(loop);
        if (!start) start = t;
        scene?.tick((t - start) * 0.001);
        scene?.render();
      };

      if (shouldAnimate || interactive) {
        rafId = requestAnimationFrame(loop);
      } else {
        scene.render();
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      ro?.disconnect();
      scene?.dispose();
      sceneRef.current = null;
    };
  }, [animate, autoRotate, backgroundColor, interactive, maxDpr]);

  const fixedSize = typeof size === "number";

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", !fixedSize && "h-full w-full", className)}
      style={fixedSize ? { width: size, height: size } : undefined}
      role="img"
      aria-label="Aegis Core"
    />
  );
}
