import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

export type MaquetteCarouselMetrics = {
  BW: number;
  BH: number;
  FW: number;
  FH: number;
  G: number;
  PAD: number;
  PADY: number;
  uniform: boolean;
};

export const PRACTICES_HUB_LAB_VEDETTE: MaquetteCarouselMetrics = {
  BW: 140,
  BH: 240,
  FW: 280,
  FH: 360,
  G: 4,
  PAD: 14,
  PADY: 22,
  uniform: false,
};

/** Uniform tiles (reference maquette mode). */
export const PRACTICES_HUB_LAB_MAQUETTE: MaquetteCarouselMetrics = {
  BW: 188,
  BH: 300,
  FW: 188,
  FH: 300,
  G: 14,
  PAD: 14,
  PADY: 22,
  uniform: true,
};

function wrapIndex(a: number, n: number): number {
  return ((a % n) + n) % n;
}

type UsePracticesHubLabMaquetteCarouselOptions = {
  tileCount: number;
  metrics?: MaquetteCarouselMetrics;
};

/** Reference HTML carousel — default vedette (featured tile morph). */
export function usePracticesHubLabMaquetteCarousel({
  tileCount,
  metrics = PRACTICES_HUB_LAB_VEDETTE,
}: UsePracticesHubLabMaquetteCarouselOptions) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const offRef = useRef(0);
  const targetRef = useRef(0);
  const draggingRef = useRef(false);
  const sxRef = useRef(0);
  const soRef = useRef(0);
  const velRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const snapIndexRef = useRef(0);
  const kickRef = useRef<() => void>(() => {});
  const [focusedIndex, setFocusedIndex] = useState(0);

  const step = metrics.BW + metrics.G;

  const syncFocusedIndex = useCallback(
    (off: number) => {
      if (tileCount <= 0) return;
      const nextFocus = wrapIndex(Math.round(off / step), tileCount);
      if (nextFocus === snapIndexRef.current) return;
      snapIndexRef.current = nextFocus;
      setFocusedIndex(nextFocus);
    },
    [step, tileCount],
  );

  const render = useCallback(() => {
    const tiles = tileRefs.current;
    if (tileCount <= 0) return;

    const off = offRef.current;
    const p = off / step;
    const a = Math.floor(p);
    const t = p - a;
    let x = metrics.PAD - t * step - metrics.G - metrics.BW;
    const maxH = Math.max(metrics.BH, metrics.FH);

    for (let k = -1; k <= tileCount - 2; k += 1) {
      const fk = metrics.uniform ? 0 : k === 0 ? 1 - t : k === 1 ? t : 0;
      const w = metrics.BW + (metrics.FW - metrics.BW) * fk;
      const h = metrics.BH + (metrics.FH - metrics.BH) * fk;
      const y = (maxH - h) / 2 + metrics.PADY;
      const el = tiles[wrapIndex(a + k, tileCount)];
      if (!el) continue;
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.transform = `translate3d(${x}px,${y}px,0)`;
      el.style.setProperty("--f", String(fk));
      el.style.zIndex = fk > 0.5 ? "2" : "1";
      x += w + metrics.G;
    }

    if (!metrics.uniform) {
      const featuredLive = wrapIndex(a + (t >= 0.5 ? 1 : 0), tileCount);
      if (featuredLive !== snapIndexRef.current) {
        snapIndexRef.current = featuredLive;
        setFocusedIndex(featuredLive);
      }
    }
  }, [metrics, step, tileCount]);

  const loop = useCallback(() => {
    if (!draggingRef.current) {
      const target = targetRef.current;
      offRef.current += (target - offRef.current) * 0.16;
      if (Math.abs(target - offRef.current) < 0.3) {
        offRef.current = target;
        render();
        syncFocusedIndex(offRef.current);
        rafRef.current = null;
        return;
      }
    }
    render();
    rafRef.current = requestAnimationFrame(loop);
  }, [render, syncFocusedIndex]);

  const kick = useCallback(() => {
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [loop]);

  kickRef.current = kick;

  const go = useCallback(
    (delta: number) => {
      targetRef.current = Math.round(offRef.current / step) * step + delta * step;
      kick();
    },
    [kick, step],
  );

  const setTileRef = useCallback((index: number, el: HTMLButtonElement | null) => {
    tileRefs.current[index] = el;
    if (el) kickRef.current();
  }, []);

  useLayoutEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    vp.style.height = `${Math.max(metrics.BH, metrics.FH) + metrics.PADY * 2}px`;
    targetRef.current = 0;
    offRef.current = 0;
    snapIndexRef.current = 0;
    setFocusedIndex(0);
    kick();
  }, [kick, metrics.BH, metrics.FH, metrics.PADY, tileCount]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      draggingRef.current = true;
      sxRef.current = e.clientX;
      soRef.current = offRef.current;
      lastXRef.current = e.clientX;
      lastTRef.current = performance.now();
      velRef.current = 0;
      viewportRef.current?.classList.add("practices-hub-lab__vp--drag");
      viewportRef.current?.setPointerCapture(e.pointerId);
      kick();
    },
    [kick],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const now = performance.now();
      velRef.current = (lastXRef.current - e.clientX) / Math.max(1, now - lastTRef.current);
      lastXRef.current = e.clientX;
      lastTRef.current = now;
      offRef.current = soRef.current - (e.clientX - sxRef.current);
      kick();
    },
    [kick],
  );

  const endDrag = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    viewportRef.current?.classList.remove("practices-hub-lab__vp--drag");
    targetRef.current = Math.round((offRef.current + velRef.current * 220) / step) * step;
    kick();
  }, [kick, step]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    },
    [go],
  );

  return {
    viewportRef,
    setTileRef,
    focusedIndex,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onKeyDown,
  };
}
