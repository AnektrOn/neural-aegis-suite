import type { ReactNode } from "react";
import type { ToolboxRenderableItem } from "@/lib/toolbox-renderer-registry";
import {
  ToolboxNebulaAmbientProvider,
} from "./ToolboxNebulaAmbientContext";
import { shouldEnableToolboxNebula } from "./resolveToolboxNebulaPreset";
import { ToolboxAmbientNebulaLayer } from "./ToolboxAmbientNebulaLayer";
import { cn } from "@/lib/utils";

interface ToolboxExerciseAmbientFrameProps {
  item: ToolboxRenderableItem;
  mode?: "fullscreen" | "embedded";
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/** Wraps toolbox exercise UI with ambient particles + shared nebula context for widgets. */
export function ToolboxExerciseAmbientFrame({
  item,
  mode = "embedded",
  children,
  className,
  contentClassName,
}: ToolboxExerciseAmbientFrameProps) {
  const enabled = shouldEnableToolboxNebula(item);

  return (
    <ToolboxNebulaAmbientProvider item={item} enabled={enabled}>
      {enabled && mode === "fullscreen" ? <ToolboxAmbientNebulaLayer mode="fullscreen" /> : null}
      <div
        className={cn(
          mode === "embedded" && "relative min-h-[min(52dvh,520px)] overflow-hidden",
          mode === "fullscreen" && "relative min-h-[min(70dvh,640px)]",
          className,
        )}
      >
        {enabled && mode === "embedded" ? <ToolboxAmbientNebulaLayer mode="embedded" /> : null}
        <div className={cn("relative z-10", contentClassName)}>{children}</div>
      </div>
    </ToolboxNebulaAmbientProvider>
  );
}
