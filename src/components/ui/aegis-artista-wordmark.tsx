import * as React from "react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

import "./aegis-artista-wordmark.css";

/**
 * Each letter uses its own local coordinate system (matching the individual SVG exports).
 * `dx` positions the letter in the combined 197×36 viewBox via `translate(dx, 0)`.
 */
const LETTERS = [
  {
    key: "A",
    dx: 0,
    d: "M18.65 13.00L34 48.50L28.15 48.50L17 19.40L18.65 13.00M7.90 45.15Q7.55 46.15 7.80 46.85Q8.05 47.55 8.63 47.92Q9.20 48.30 9.80 48.30L10.25 48.30L10.25 48.80L0 48.80L0 48.30Q0 48.30 0.22 48.30Q0.45 48.30 0.45 48.30Q1.60 48.30 2.83 47.57Q4.05 46.85 4.85 45.15L7.90 45.15M18.65 13.00L19.05 17.35L6.55 48.65L3.30 48.65L16.15 18.60Q16.20 18.50 16.53 17.82Q16.85 17.15 17.23 16.20Q17.60 15.25 17.90 14.35Q18.20 13.45 18.20 13.00L18.65 13.00M25.10 35.75L25.10 37.45L9.80 37.45L9.80 35.75L25.10 35.75M26.85 45.15L32.50 45.15Q33.30 46.85 34.52 47.57Q35.75 48.30 36.90 48.30Q36.90 48.30 37.10 48.30Q37.30 48.30 37.30 48.30L37.30 48.80L24.50 48.80L24.50 48.30L24.95 48.30Q25.95 48.30 26.70 47.47Q27.45 46.65 26.85 45.15Z",
  },
  {
    key: "E",
    dx: 51.7,
    d: "M8.50 13.80L8.50 48.80L3.85 48.80L3.85 13.80L8.50 13.80M21.90 47.05L22.30 48.80L8.35 48.80L8.35 47.05L21.90 47.05M19.85 30.70L19.85 32.40L8.35 32.40L8.35 30.70L19.85 30.70M22.10 13.80L22.10 15.55L8.35 15.55L8.35 13.80L22.10 13.80M25.15 40L22.45 48.80L13.65 48.80L15.45 47.05Q18.05 47.05 19.80 46.17Q21.55 45.30 22.70 43.70Q23.85 42.10 24.65 40L25.15 40M19.85 32.30L19.85 36.10L19.35 36.10L19.35 35.45Q19.35 34.20 18.50 33.30Q17.65 32.40 16.35 32.40L16.35 32.30L19.85 32.30M19.85 27.00L19.85 30.80L16.35 30.80L16.35 30.70Q17.65 30.65 18.50 29.75Q19.35 28.85 19.35 27.60L19.35 27.00L19.85 27.00M22.10 15.40L22.10 20.00L21.60 20.00L21.60 19.20Q21.60 17.65 20.58 16.60Q19.55 15.55 17.95 15.50L17.95 15.40L22.10 15.40M22.10 12.90L22.10 14.35L16 13.80Q17.10 13.80 18.33 13.65Q19.55 13.50 20.60 13.30Q21.65 13.10 22.10 12.90M4 45.15L4 48.80L0 48.80L0 48.30Q0 48.30 0.33 48.30Q0.65 48.30 0.65 48.30Q1.95 48.30 2.88 47.38Q3.80 46.45 3.85 45.15L4 45.15M4 17.45L3.85 17.45Q3.85 16.15 2.90 15.22Q1.95 14.30 0.65 14.30Q0.65 14.30 0.35 14.30Q0.05 14.30 0.05 14.30L0 13.80L4 13.80L4 17.45Z",
  },
  {
    key: "G",
    dx: 94,
    d: "M33.45 34.80L33.45 43.05Q32.30 44.55 30.20 46.05Q28.10 47.55 25.13 48.52Q22.15 49.50 18.25 49.50Q12.85 49.45 8.73 47.20Q4.60 44.95 2.30 40.88Q0 36.80 0 31.30Q0 25.80 2.30 21.70Q4.60 17.60 8.73 15.35Q12.85 13.10 18.35 13.10Q21.10 13.10 23.45 13.52Q25.80 13.95 27.70 14.67Q29.60 15.40 31.05 16.30L31.75 23.85L31.30 23.85Q30.50 20.75 28.75 18.77Q27 16.80 24.48 15.80Q21.95 14.80 18.85 14.80Q14.70 14.80 11.63 16.85Q8.55 18.90 6.88 22.62Q5.20 26.35 5.20 31.40Q5.20 36.30 6.85 40Q8.50 43.70 11.48 45.72Q14.45 47.75 18.50 47.80Q20.55 47.80 22.48 47.25Q24.40 46.70 26.05 45.70Q27.70 44.70 28.80 43.25L28.85 34.80Q28.85 32.55 26.30 32.55L25.50 32.55L25.50 32.05L36.70 32.05L36.70 32.55L35.95 32.55Q33.35 32.55 33.45 34.80Z",
  },
  {
    key: "I",
    dx: 147,
    d: "M8.50 13.80L8.50 48.80L3.85 48.80L3.85 13.80L8.50 13.80M4 45.15L4 48.80L0 48.80L0 48.30Q0 48.30 0.33 48.30Q0.65 48.30 0.65 48.30Q1.95 48.30 2.88 47.38Q3.80 46.45 3.85 45.15L4 45.15M4 17.45L3.85 17.45Q3.80 16.15 2.88 15.22Q1.95 14.30 0.65 14.30Q0.65 14.30 0.33 14.30Q0 14.30 0 14.30L0 13.80L4 13.80L4 17.45M8.35 45.15L8.50 45.15Q8.55 46.45 9.48 47.38Q10.40 48.30 11.70 48.30Q11.70 48.30 12 48.30Q12.30 48.30 12.35 48.30L12.35 48.80L8.35 48.80L8.35 45.15M8.35 17.45L8.35 13.80L12.35 13.80L12.35 14.30Q12.30 14.30 12 14.30Q11.70 14.30 11.70 14.30Q10.40 14.30 9.48 15.22Q8.55 16.15 8.50 17.45L8.35 17.45Z",
  },
  {
    key: "S",
    dx: 177.25,
    d: "M10.25 13.10Q11.10 13.10 12.20 13.20Q13.30 13.30 14.43 13.47Q15.55 13.65 16.43 13.82Q17.30 14.00 17.70 14.20L17.50 20.15L17.05 20.15Q17.05 17.70 15.30 16.25Q13.55 14.80 10.90 14.80Q8.10 14.80 6.38 16.42Q4.65 18.05 4.65 20.25Q4.60 21.35 5.23 22.57Q5.85 23.80 7.15 24.85L16.90 33Q18.65 34.35 19.38 36.13Q20.10 37.90 20.05 39.80Q19.95 44.20 17.10 46.85Q14.25 49.50 9.40 49.50Q7.85 49.50 6.08 49.20Q4.30 48.90 2.75 48.27Q1.20 47.65 0.25 46.65Q0 45.75 0.03 44.42Q0.05 43.10 0.33 41.70Q0.60 40.30 1.05 39.20L1.50 39.20Q1.25 41.75 2.23 43.75Q3.20 45.75 5.08 46.82Q6.95 47.90 9.40 47.80Q12.35 47.70 14.28 45.97Q16.20 44.25 16.20 41.45Q16.20 40 15.55 38.80Q14.90 37.60 13.55 36.65L4.25 28.75Q2.35 27.35 1.55 25.45Q0.75 23.55 0.85 21.65Q0.95 19.40 2.05 17.42Q3.15 15.45 5.23 14.27Q7.30 13.10 10.25 13.10M17.70 13.60L17.70 14.65L13.20 14.65L13.20 13.60L17.70 13.60Z",
  },
] as const;

/** Combined viewBox: x=0, y=12.9 (min y across all letters), width=197.35, height=36.6 */
const VIEWBOX = "0 12.9 197.35 36.6";

/** Artista easing */
const EASE = "cubic-bezier(0.47, 0, 0.745, 0.715)";

/** Delay between letters */
const STAGGER_S = 0.3;

const STROKE_MS = 1000;
const FILL_MS = 700;

/** Draw + undraw: wait until the slowest letter (stroke vs fill) has finished — avoids cutting CSS mid-transition. */
function phaseHoldMs(n: number, staggerS: number) {
  const last = n - 1;
  const strokeEnd = last * staggerS * 1000 + STROKE_MS;
  const fillDelay = (0.8 + last * staggerS * 0.6) * 1000;
  const fillEnd = fillDelay + FILL_MS;
  return Math.ceil(Math.max(strokeEnd, fillEnd) + 150);
}

const DRAW_PHASE_MS = phaseHoldMs(LETTERS.length, STAGGER_S);
const UNDRAW_PHASE_MS = phaseHoldMs(LETTERS.length, STAGGER_S);
const PAUSE_MS = 500;

type Phase = "idle" | "draw" | "undraw";

export function AegisArtistaWordmark({ className, ...props }: React.ComponentProps<"svg">) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const pathRefs = React.useRef<(SVGPathElement | null)[]>([]);
  const reduceMotion = useReducedMotion();

  const [lengths, setLengths] = React.useState<number[] | null>(null);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [instant, setInstant] = React.useState(false);

  React.useLayoutEffect(() => {
    if (reduceMotion) return;
    const next = pathRefs.current.map((p) =>
      p ? Math.max(1, p.getTotalLength()) : 1
    );
    setLengths(next);
  }, [reduceMotion]);

  React.useEffect(() => {
    if (reduceMotion || !lengths) return;

    let cancelled = false;
    let drawTimer: ReturnType<typeof setTimeout>;
    let undrawTimer: ReturnType<typeof setTimeout>;
    let pauseTimer: ReturnType<typeof setTimeout>;

    const reflow = () => void svgRef.current?.getBoundingClientRect();

    const cycle = () => {
      if (cancelled) return;
      setInstant(true);
      setPhase("idle");
      reflow();
      requestAnimationFrame(() => {
        if (cancelled) return;
        setInstant(false);
        requestAnimationFrame(() => {
          if (cancelled) return;
          setPhase("draw");
          drawTimer = setTimeout(() => {
            if (cancelled) return;
            setPhase("undraw");
            undrawTimer = setTimeout(() => {
              if (cancelled) return;
              setInstant(true);
              setPhase("idle");
              reflow();
              requestAnimationFrame(() => {
                if (cancelled) return;
                setInstant(false);
                pauseTimer = setTimeout(cycle, PAUSE_MS);
              });
            }, UNDRAW_PHASE_MS);
          }, DRAW_PHASE_MS);
        });
      });
    };

    cycle();
    return () => {
      cancelled = true;
      clearTimeout(drawTimer);
      clearTimeout(undrawTimer);
      clearTimeout(pauseTimer);
    };
  }, [reduceMotion, lengths]);

  const ink = "hsl(var(--foreground))";
  const ready = lengths !== null;

  const letterPaths = LETTERS.map(({ key, dx, d }, i) => {
    const len = lengths?.[i] ?? 1;
    const strokeDashoffset =
      phase === "draw" ? 0 : phase === "undraw" ? len * 2 : len;
    const fill = phase === "draw" ? ink : "transparent";

    const strokeDelay = `${i * STAGGER_S}s`;
    // draw: fill appears after stroke has drawn (Artista pattern)
    const drawFillDelay = `${0.8 + i * STAGGER_S * 0.6}s`;

    /** Undraw mirrors draw: same durations, same stagger, same easing (smooth both ways). */
    const transition = instant
      ? "none"
      : `stroke-dashoffset 1s ${EASE} ${strokeDelay}, fill 0.7s ${EASE} ${drawFillDelay}`;

    return (
      <g key={key} transform={`translate(${dx}, 0)`}>
        <path
          ref={(el) => {
            pathRefs.current[i] = el;
          }}
          d={d}
          stroke={ink}
          fill={fill}
          strokeWidth={0.6}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={strokeDashoffset}
          style={{ transition }}
        />
      </g>
    );
  });

  if (reduceMotion) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={VIEWBOX}
        role="img"
        aria-label="AEGIS"
        className={cn("aegis-artista shrink-0 overflow-visible", className)}
        {...props}
      >
        {LETTERS.map(({ key, dx, d }) => (
          <g key={key} transform={`translate(${dx}, 0)`}>
            <path d={d} fill={ink} stroke="none" />
          </g>
        ))}
      </svg>
    );
  }

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={VIEWBOX}
      role="img"
      aria-label="AEGIS"
      className={cn(
        "aegis-artista shrink-0 overflow-visible",
        ready ? "opacity-100 transition-opacity duration-150" : "opacity-0",
        className
      )}
      {...props}
    >
      {letterPaths}
    </svg>
  );
}
