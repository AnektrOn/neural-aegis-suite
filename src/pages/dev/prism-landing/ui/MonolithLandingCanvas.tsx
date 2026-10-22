import { useEffect, useId, useRef, useState } from "react";
import type { CosmicMonolithHandle } from "../scene/createCosmicMonolithScene";
import type { PrismPerformanceProfile } from "../scene/prismLandingPerformance";

/** Cosmic monolith: WebGL scene with its own post-processing chain (godrays, bloom, ACES grade). */

const DEFAULT_GLOW = 1.15;

const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

function friendlyError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  if (/webgl/i.test(message)) {
    return `WebGL n'est pas disponible sur cet appareil ou ce navigateur. (${message})`;
  }
  return message;
}

type MonolithLandingCanvasProps = {
  performanceProfile?: PrismPerformanceProfile;
};

export default function MonolithLandingCanvas({
  performanceProfile = "default",
}: MonolithLandingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<CosmicMonolithHandle | null>(null);
  const glowRef = useRef(DEFAULT_GLOW);
  const atmosphereRef = useRef(0);
  const glowInputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [cinematic, setCinematic] = useState(true);
  const [glow, setGlow] = useState(DEFAULT_GLOW);
  const [atmosphere, setAtmosphere] = useState(0);

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
    let handle: CosmicMonolithHandle | null = null;

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

    /* The parent can change size without a window resize (side panels, layout shifts). */
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
        const { createCosmicMonolithScene } = await import(
          "../scene/createCosmicMonolithScene"
        );
        /* Scene setup generates textures synchronously: let the loading label paint first. */
        await nextFrame();
        await nextFrame();
        if (disposed) return;
        handle = createCosmicMonolithScene(canvas, setCinematic, {
          performanceProfile,
        });
        if (disposed) {
          handle.dispose();
          handle = null;
          return;
        }
        handleRef.current = handle;
        handle.setGlow(glowRef.current);
        handle.jumpAtmosphere(atmosphereRef.current);
        fit();
        setReady(true);
      } catch (err) {
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
  }, [performanceProfile]);

  const controlsDisabled = !ready || error !== null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="monolith-r3f-canvas"
        style={{ background: "#0b0f17" }}
        aria-label="Monolithe cosmique : deux piliers de pierre séparés par une fente lumineuse"
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
      <div className="cosmic-dock" aria-busy={!ready && !error}>
        <button
          type="button"
          className="cosmic-dock-primary"
          disabled={controlsDisabled}
          onClick={() => handleRef.current?.resetCamera()}
        >
          Cadrage Original
        </button>
        <button
          type="button"
          disabled={controlsDisabled}
          onClick={() => handleRef.current?.focusMarbleMonolith()}
        >
          Monolithe de marbre
        </button>
        <button
          type="button"
          disabled={controlsDisabled}
          onClick={() => handleRef.current?.focusShatteredCube()}
        >
          Cube brisé
        </button>
        <button
          type="button"
          aria-pressed={cinematic}
          disabled={controlsDisabled}
          onClick={() => {
            const next = !cinematic;
            setCinematic(next);
            handleRef.current?.setCinematic(next);
          }}
        >
          Mouvement Cinéma : {cinematic ? "ON" : "OFF"}
        </button>
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
            aria-valuetext={`${glow.toFixed(2)}`}
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
      </div>
    </>
  );
}