import { useEffect, useRef, type MutableRefObject, type ReactNode } from "react";
import { holdChapterMix, type HoldState } from "@/features/intro/useHoldProgress";
import type { IntroPhase } from "@/features/intro/useIntroMachine";

type Props = {
  hold: MutableRefObject<HoldState>;
  phase?: IntroPhase;
  children: ReactNode;
  className?: string;
  lowPower?: boolean;
};

/** Ken-Burns style drift for the 2D neural backdrop (same documentary pacing as 3D rigs). */
export function DocumentaryTravel2D({ hold, phase, children, className, lowPower = false }: Props) {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = layer.current;
    if (!node) return;
    let raf = 0;
    const start = performance.now();

    const tick = () => {
      const t = (performance.now() - start) * 0.001;
      const s = hold.current;
      const motion = lowPower ? 0.42 : 1;
      const holdZoom = holdChapterMix(s, phase ?? "entry") * (lowPower ? 0.04 : 0.06);
      const phaseRate = phase === "interact" ? 1.15 : phase === "narrate" ? 1.05 : 1;

      const scale = 1.03 + Math.sin(t * 0.07 * phaseRate) * 0.022 * motion + holdZoom;
      const tx = Math.sin(t * 0.11 * phaseRate) * 1.4 * motion;
      const ty = Math.cos(t * 0.09 * phaseRate) * 1.0 * motion;

      node.style.transform = `translate3d(${tx}%, ${ty}%, 0) scale(${scale})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hold, phase, lowPower]);

  return (
    <div className={className}>
      <div
        ref={layer}
        className="absolute inset-0 origin-center will-change-transform"
        style={{ transform: "translate3d(0,0,0) scale(1.04)" }}
      >
        {children}
      </div>
    </div>
  );
}
