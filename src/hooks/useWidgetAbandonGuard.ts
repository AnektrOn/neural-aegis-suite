import { useEffect, useRef, type MutableRefObject } from "react";
import { shouldTreatUnmountAsAbandon } from "@/lib/widget-lifecycle";

/** Calls onAbandon on unmount only when the user truly left (not app background). */
export function useWidgetAbandonGuard(
  hasStartedRef: MutableRefObject<boolean>,
  completedRef: MutableRefObject<boolean>,
  onAbandon?: () => void,
): void {
  const onAbandonRef = useRef(onAbandon);
  onAbandonRef.current = onAbandon;

  useEffect(() => {
    return () => {
      if (hasStartedRef.current && !completedRef.current && shouldTreatUnmountAsAbandon()) {
        onAbandonRef.current?.();
      }
    };
  }, []);
}
