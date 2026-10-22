import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import {
  Sparkles,
  Play,
  Pause,
  Zap,
  RotateCcw,
  Sliders,
  Sun,
  Grid,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createShatteredCubeGroup,
  type ShatteredCubeInstance,
} from "../scene/shatteredCubeAssets";
import { createStudioEnvMap } from "../scene/cubeEnvironment";
import {
  attachVisibilityPauseRaf,
  resolveRendererPixelRatio,
} from "../scene/prismLandingPerformance";

type StageProps = {
  size?: number;
  grid?: number;
  seed?: number;
  autoPlay?: boolean;
  glow?: string;
  defragDepth?: number;
  onPhaseChange?: (phase: "hold" | "burst" | "reform") => void;
  manualTriggerRef?: React.MutableRefObject<(() => void) | null>;
};

function ShatteredCubeStage({
  size = 2.25,
  grid = 10,
  seed = 5,
  autoPlay = true,
  glow = "#e2f1ff",
  defragDepth = 0.6,
  onPhaseChange,
  manualTriggerRef,
}: StageProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ShatteredCubeInstance | null>(null);

  useEffect(() => {
    instanceRef.current?.setAutoPlay(autoPlay);
  }, [autoPlay]);

  useEffect(() => {
    instanceRef.current?.setGlow(glow);
  }, [glow]);

  useEffect(() => {
    instanceRef.current?.setDefragDepth(defragDepth);
  }, [defragDepth]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog("#05070b", 18, 52);

    const camera = new THREE.PerspectiveCamera(
      34,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      100,
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(resolveRendererPixelRatio("optimized"));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    container.replaceChildren(renderer.domElement);

    const studio = createStudioEnvMap(renderer);
    scene.environment = studio.envMap;
    scene.environmentIntensity = 1.05;

    const ambient = new THREE.AmbientLight("#cbd5e1", 0.22);
    scene.add(ambient);

    const instance = createShatteredCubeGroup({
      size,
      grid,
      seed,
      position: new THREE.Vector3(0, 0.15, 0),
      autoPlay,
      glow,
      defragDepth,
      envMap: studio.envMap,
      studioLights: true,
      onPhaseChange,
    });
    instanceRef.current = instance;
    scene.add(instance.group);

    if (manualTriggerRef) {
      manualTriggerRef.current = () => instance.triggerBurst();
    }

    let isDragging = false;
    let downX = 0;
    let downY = 0;
    let sphericalTheta = 0.78;
    let sphericalPhi = 1.72;
    let radius = 16.5;
    let pointerDownX = 0;
    let pointerDownY = 0;

    const updateCamera = () => {
      camera.position.x = radius * Math.sin(sphericalPhi) * Math.sin(sphericalTheta);
      camera.position.y = radius * Math.cos(sphericalPhi) + 0.15;
      camera.position.z = radius * Math.sin(sphericalPhi) * Math.cos(sphericalTheta);
      camera.lookAt(0, 0.15, 0);
    };
    updateCamera();

    const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      downX = e.clientX;
      downY = e.clientY;
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      sphericalTheta -= dx * 0.006;
      sphericalPhi = Math.max(0.35, Math.min(Math.PI - 0.35, sphericalPhi - dy * 0.006));
      downX = e.clientX;
      downY = e.clientY;
      updateCamera();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      const moved = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
      if (moved < 5) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(instance.meshes, false);
        if (hits.length > 0) instance.triggerBurst();
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius = Math.max(7, Math.min(26, radius + e.deltaY * 0.01));
      updateCamera();
    };

    const domElem = renderer.domElement;
    domElem.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    domElem.addEventListener("wheel", onWheel, { passive: false });

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / Math.max(container.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    const tStart = performance.now() * 0.001;
    let rafId = 0;

    const cancelAnimate = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    };
    const animate = () => {
      if (document.hidden) {
        rafId = 0;
        return;
      }
      rafId = requestAnimationFrame(animate);
      const elapsed = performance.now() * 0.001 - tStart;
      instance.update(elapsed);
      renderer.render(scene, camera);
    };
    const startAnimate = () => {
      if (rafId) return;
      animate();
    };
    startAnimate();

    const visibilityPause = attachVisibilityPauseRaf(cancelAnimate, startAnimate);

    return () => {
      visibilityPause.dispose();
      cancelAnimate();
      window.removeEventListener("resize", onResize);
      domElem.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      domElem.removeEventListener("wheel", onWheel);
      if (manualTriggerRef) manualTriggerRef.current = null;
      instance.dispose();
      studio.dispose();
      renderer.dispose();
      instanceRef.current = null;
    };
    // Rebuild only when grid/seed/size change — live params via setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, grid, seed]);

  return (
    <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
  );
}

const PRESETS = [
  {
    name: "Monolithe Glaciaire (Réf.)",
    glow: "#e2f1ff",
    bg: "from-slate-950 via-zinc-900 to-black",
  },
  {
    name: "Basalte & Cyan (CITY)",
    glow: "#7dd3fc",
    bg: "from-slate-900 via-slate-950 to-zinc-950",
  },
  {
    name: "Obsidienne & Blanc Pur",
    glow: "#ffffff",
    bg: "from-black via-zinc-950 to-neutral-950",
  },
  {
    name: "Noyau Ambre & Basalte",
    glow: "#ff8a2b",
    bg: "from-zinc-950 via-stone-950 to-black",
  },
];

export default function ShatteredCubeDevPage() {
  const [autoPlay, setAutoPlay] = useState(true);
  const [presetIdx, setPresetIdx] = useState(0);
  const [grid, setGrid] = useState(10);
  const [seed, setSeed] = useState(5);
  const [defragDepth, setDefragDepth] = useState(0.6);
  const [currentPhase, setCurrentPhase] = useState<"hold" | "burst" | "reform">("burst");
  const [showControls, setShowControls] = useState(true);

  const manualTriggerRef = useRef<(() => void) | null>(null);
  const activePreset = PRESETS[presetIdx];

  const phaseLabels = {
    hold: "Phase : Monolithe Compact (Avant explosion)",
    burst: "Phase : Explosion Supernova (Cubes hors du centre)",
    reform: "Phase : Rappel Gravitationnel vers le Cœur",
  };

  return (
    <div
      className={`relative w-full h-screen overflow-hidden bg-gradient-to-b ${activePreset.bg} text-slate-100 font-sans select-none`}
    >
      <Button variant="ghost" size="sm" className="absolute top-4 left-4 z-20 gap-2" asChild>
        <Link to="/dev">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Dev Lab
        </Link>
      </Button>

      <ShatteredCubeStage
        size={2.25}
        grid={grid}
        seed={seed}
        autoPlay={autoPlay}
        glow={activePreset.glow}
        defragDepth={defragDepth}
        onPhaseChange={setCurrentPhase}
        manualTriggerRef={manualTriggerRef}
      />

      <header className="absolute top-0 left-0 right-0 p-6 pt-16 flex flex-wrap items-center justify-between gap-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 px-4 py-2.5 rounded-2xl shadow-xl">
          <Sparkles className="w-5 h-5" style={{ color: activePreset.glow }} />
          <div>
            <h1 className="text-sm font-bold text-white">
              Monolithe — Défragmentation Cubique ({grid}×{grid}×{grid})
            </h1>
            <p className="text-xs text-zinc-400">{phaseLabels[currentPhase]}</p>
          </div>
        </div>
      </header>

      <aside className="absolute bottom-6 left-6 right-6 md:left-auto md:top-20 md:bottom-auto md:w-80 pointer-events-none flex flex-col gap-3">
        <div className="pointer-events-auto bg-zinc-900/85 backdrop-blur-xl border border-zinc-800/90 rounded-2xl p-4 shadow-2xl flex flex-col gap-3.5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Sliders className="w-3.5 h-3.5 text-sky-300" />
              <span>Monolithe & Défragmentation</span>
            </div>
            <button
              type="button"
              onClick={() => setShowControls(!showControls)}
              className="text-xs text-zinc-400 hover:text-white transition"
            >
              {showControls ? "Masquer" : "Afficher"}
            </button>
          </div>

          {showControls ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAutoPlay(!autoPlay)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    autoPlay
                      ? "bg-sky-500/20 border-sky-400/50 text-sky-200"
                      : "bg-zinc-800/70 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  {autoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {autoPlay ? "Cycle : ON" : "Continu"}
                </button>

                <button
                  type="button"
                  onClick={() => manualTriggerRef.current?.()}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-zinc-950 hover:bg-white transition"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Basculer État
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5" /> Atmosphère & Cube Émetteur
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESETS.map((p, idx) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setPresetIdx(idx)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-left text-xs font-medium transition ${
                        presetIdx === idx
                          ? "bg-zinc-800 border-sky-400/60 text-white"
                          : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: p.glow,
                          boxShadow: `0 0 6px ${p.glow}`,
                        }}
                      />
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Grid className="w-3.5 h-3.5" /> Grille ({grid}×{grid}×{grid})
                  </span>
                  <span className="font-mono text-zinc-200">{grid} strates</span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={14}
                  step={1}
                  value={grid}
                  onChange={(e) => setGrid(Number(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Force d&apos;explosion</span>
                  <span className="font-mono text-zinc-200">
                    {Math.round(defragDepth * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={0.6}
                  step={0.05}
                  value={defragDepth}
                  onChange={(e) => setDefragDepth(Number(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => setSeed((s) => s + 1)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-medium text-zinc-200 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Nouvelle découpe (Seed #{seed})
              </button>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
