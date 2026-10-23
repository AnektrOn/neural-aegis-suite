import { useEffect, useId, useMemo, useRef, useState } from "react";
import { LANDING_CAMERA_KEYFRAMES } from "../layout/sceneLayout";
import {
  keyframeStepIndexForU,
  sortPathKeyframesByU,
} from "../camera/pathSamplerByKeyframeU";
import type { CosmicMonolithLandingHandle } from "../scene/createCosmicMonolithLandingScene";
import {
  LANDING_RENDER_TUNING_DEFAULTS,
  type LandingRenderTuning,
} from "../scene/landingRenderTuning";
import PrismLandingSettingsPanel from "./PrismLandingSettingsPanel";

const DEFAULT_GLOW = 1.15;
const PATH_UI_SYNC_MS = 200;

const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

function friendlyError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  if (/webgl/i.test(message)) {
    return `WebGL n'est pas disponible sur cet appareil ou ce navigateur. (${message})`;
  }
  return message;
}

export default function PrismLandingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<CosmicMonolithLandingHandle | null>(null);
  const glowRef = useRef(DEFAULT_GLOW);
  const atmosphereRef = useRef(0);
  const pathInputId = useId();
  const glowInputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [glow, setGlow] = useState(DEFAULT_GLOW);
  const [atmosphere, setAtmosphere] = useState(0);
  const [pathU, setPathU] = useState(0);
  const [pathPlaying, setPathPlaying] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [renderTuning, setRenderTuning] = useState<LandingRenderTuning>(() => ({
    ...LANDING_RENDER_TUNING_DEFAULTS,
  }));
  const [performanceDebug, setPerformanceDebug] = useState<
    | {
        profile: string;
        pixelRatio: number;
        pausedByVisibility: boolean;
        idleThrottleActive: boolean;
      }
    | undefined
  >(undefined);

  const applyAtmosphere = (level: number) => {
    const next = Math.min(2, Math.max(0, level));
    atmosphereRef.current = next;
    setAtmosphere(next);
    handleRef.current?.setAtmosphere(next);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let handle: CosmicMonolithLandingHandle | null = null;

    const fit = () => {
      const parent = canvas.parentElement;
      handle?.resize(
        parent?.clientWidth || window.innerWidth,
        parent?.clientHeight || window.innerHeight,
      );
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      if (!disposed) {
        setError("Le contexte WebGL a été perdu. Recharge la page pour relancer la scène.");
      }
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    const parent = canvas.parentElement;
    const observer =
      parent && typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    if (observer && parent) {
      observer.observe(parent);
    } else {
      window.addEventListener("resize", fit);
    }

    void (async () => {
      try {
        const { createCosmicMonolithLandingScene } = await import(
          "../scene/createCosmicMonolithLandingScene"
        );
        await nextFrame();
        await nextFrame();
        if (disposed) return;
        handle = await createCosmicMonolithLandingScene(canvas);
        if (disposed) {
          handle.dispose();
          handle = null;
          return;
        }
        handleRef.current = handle;
        handle.setGlow(glowRef.current);
        handle.jumpAtmosphere(atmosphereRef.current);
        setPathU(handle.getPathU());
        setRenderTuning(handle.getLandingRenderTuning());
        fit();
        setReady(true);
      } catch (err) {
        handle?.dispose();
        handle = null;
        handleRef.current = null;
        if (!disposed) {
          setError(friendlyError(err));
        }
      }
    })();

    return () => {
      disposed = true;
      canvas.removeEventListener("webglcontextlost", onContextLost);
      observer?.disconnect();
      window.removeEventListener("resize", fit);
      handleRef.current = null;
      handle?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!ready || !pathPlaying) return;
    const id = window.setInterval(() => {
      const h = handleRef.current;
      if (!h) return;
      const u = h.getPathU();
      const playing = h.isPathPlaying();
      setPathU((prev) => (prev !== u ? u : prev));
      setPathPlaying((prev) => (prev !== playing ? playing : prev));
    }, PATH_UI_SYNC_MS);
    return () => window.clearInterval(id);
  }, [ready, pathPlaying]);

  useEffect(() => {
    if (!ready || !settingsOpen) return;
    const id = window.setInterval(() => {
      const telemetry = handleRef.current?.getPerformanceTelemetry?.();
      if (telemetry) setPerformanceDebug(telemetry);
    }, 400);
    return () => window.clearInterval(id);
  }, [ready, settingsOpen]);

  const controlsDisabled = !ready || error !== null;

  const pathKeyframes = useMemo(
    () => sortPathKeyframesByU([...LANDING_CAMERA_KEYFRAMES]),
    [],
  );
  const pathStepIndex = keyframeStepIndexForU(pathKeyframes, pathU);

  const goToPathStep = (stepIndex: number) => {
    const kf = pathKeyframes[stepIndex];
    if (!kf) return;
    setPathPlaying(false);
    handleRef.current?.pausePath();
    setPathU(kf.u);
    handleRef.current?.setPathU(kf.u);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="monolith-r3f-canvas"
        style={{ background: "#0b0f17" }}
        aria-label="Scène AEGIS : travelling caméra cube, marbre et portail"
      />
      {error ? (
        <p className="monolith-webgl-fallback" role="alert">
          {error}
        </p>
      ) : null}
      {!ready && !error ? (
        <p
          className="monolith-webgl-fallback"
          role="status"
          style={{ background: "transparent", pointerEvents: "none" }}
        >
          Chargement de la scène…
        </p>
      ) : null}
      <div className="cosmic-dock cosmic-dock-landing" aria-busy={!ready && !error}>
        <label>
          <span>
            Étape {pathStepIndex + 1}/{pathKeyframes.length}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(0, pathKeyframes.length - 1)}
            step={1}
            value={pathStepIndex}
            disabled={controlsDisabled}
            onChange={(event) => goToPathStep(Number(event.target.value))}
          />
        </label>
        <label htmlFor={pathInputId}>
          <span>u</span>
          <input
            id={pathInputId}
            type="range"
            min={0}
            max={1}
            step={0.002}
            value={pathU}
            disabled={controlsDisabled}
            onChange={(event) => {
              const value = Number(event.target.value);
              setPathU(value);
              setPathPlaying(false);
              handleRef.current?.pausePath();
              handleRef.current?.setPathU(value);
            }}
          />
        </label>
        <button
          type="button"
          aria-pressed={pathPlaying}
          disabled={controlsDisabled}
          onClick={() => {
            const h = handleRef.current;
            if (!h) return;
            if (h.isPathPlaying()) {
              h.pausePath();
              setPathPlaying(false);
            } else {
              h.playPath();
              setPathPlaying(true);
            }
          }}
        >
          {pathPlaying ? "Pause" : "Play"}
        </button>
        <span className="cosmic-dock-hint" role="status">
          Souris : orbiter / zoom
        </span>
        <label htmlFor={glowInputId}>
          <span>Intensité</span>
          <input
            id={glowInputId}
            type="range"
            min={0.5}
            max={2}
            step={0.05}
            value={glow}
            disabled={controlsDisabled}
            onChange={(event) => {
              const value = Number(event.target.value);
              glowRef.current = value;
              setGlow(value);
              handleRef.current?.setGlow(value);
            }}
          />
        </label>
        <button
          type="button"
          aria-pressed={atmosphere === 0}
          disabled={controlsDisabled}
          onClick={() => applyAtmosphere(0)}
        >
          Obscurité
        </button>
        <button
          type="button"
          aria-pressed={atmosphere === 1}
          disabled={controlsDisabled}
          onClick={() => applyAtmosphere(1)}
        >
          Éveil
        </button>
        <button
          type="button"
          aria-pressed={atmosphere === 2}
          disabled={controlsDisabled}
          onClick={() => applyAtmosphere(2)}
        >
          Lumière
        </button>
        <button
          type="button"
          aria-pressed={settingsOpen}
          disabled={controlsDisabled}
          onClick={() => setSettingsOpen((open) => !open)}
        >
          Réglages
        </button>
      </div>
      {settingsOpen && ready && !error ? (
        <PrismLandingSettingsPanel
          tuning={renderTuning}
          onChange={(next) => {
            setRenderTuning(next);
            handleRef.current?.setLandingRenderTuning(next);
          }}
          onClose={() => setSettingsOpen(false)}
          performanceDebug={performanceDebug}
        />
      ) : null}
    </>
  );
}
