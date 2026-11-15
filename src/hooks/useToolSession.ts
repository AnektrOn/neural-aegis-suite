import { useEffect } from "react";
import type { ToolId } from "@/components/tools/toolsRegistry";
import { saveToolSession } from "@/lib/tools/toolsMemory";

export function useToolSessionPersistence(
  toolId: ToolId,
  resultsVisible: boolean,
  inputs: Record<string, unknown>,
  outputs: Record<string, unknown>,
): void {
  useEffect(() => {
    if (!resultsVisible) return;
    saveToolSession({ toolId, inputs, outputs });
  }, [resultsVisible, toolId, inputs, outputs]);
}