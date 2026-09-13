import { useEffect, useRef, type MutableRefObject } from "react";

/** Keeps a drive object hot at 60fps without React re-renders. */
export function useToolboxParticleDriveRef<T extends object>(
  compute: () => T,
): MutableRefObject<T> {
  const driveRef = useRef<T>({} as T);
  const computeRef = useRef(compute);
  computeRef.current = compute;

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      Object.assign(driveRef.current, computeRef.current());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return driveRef;
}
