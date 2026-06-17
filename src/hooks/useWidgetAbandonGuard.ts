import { useEffect, useRef, type MutableRefObject } from "react";
import type { ToolboxCompletionPayload } from "@/lib/toolbox-completion";
import { shouldTreatUnmountAsAbandon } from "@/lib/widget-lifecycle";

/** Calls onAbandon on unmount only when the user truly left (not app background). */
export function useWidgetAbandonGuard(
  hasStartedRef: MutableRefObject<boolean>,
  completedRef: MutableRefObject<boolean>,
  onAbandon?: (payload?: ToolboxCompletionPayload) => void,
  getAbandonPayload?: () => ToolboxCompletionPayload | undefined,
): void {
  const onAbandonRef = useRef(onAbandon);
  onAbandonRef.current = onAbandon;
  const getPayloadRef = useRef(getAbandonPayload);
  getPayloadRef.current = getAbandonPayload;

  useEffect(() => {
    return () => {
      if (hasStartedRef.current && !completedRef.current && shouldTreatUnmountAsAbandon()) {
        const payload = getPayloadRef.current?.();
        onAbandonRef.current?.(payload);
      }
    };
  }, []);
}
