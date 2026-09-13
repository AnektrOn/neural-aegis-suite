import { ToolboxNebula } from "./ToolboxNebula";
import { useToolboxNebulaAmbientOptional } from "./ToolboxNebulaAmbientContext";
import { cn } from "@/lib/utils";
import { Z_INDEX } from "@/lib/zIndex";

interface ToolboxAmbientNebulaLayerProps {
  /** Full viewport layer above dialog overlay (z-51). */
  mode?: "fullscreen" | "embedded";
  className?: string;
}

export function ToolboxAmbientNebulaLayer({
  mode = "embedded",
  className,
}: ToolboxAmbientNebulaLayerProps) {
  const ambient = useToolboxNebulaAmbientOptional();
  if (!ambient?.enabled) return null;

  const fullscreen = mode === "fullscreen";

  return (
    <div
      className={cn(
        "pointer-events-none",
        fullscreen ? `fixed inset-0 z-[${Z_INDEX.ambientNebula}]` : "absolute inset-0 z-0 min-h-[320px]",
        className,
      )}
      aria-hidden
    >
      <ToolboxNebula
        preset={ambient.preset}
        stateOverride={ambient.state}
        figureOverride={ambient.figure}
        fullscreen={fullscreen}
        className="h-full w-full"
      />
      {fullscreen ? (
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/35 to-black/55 dark:from-black/40 dark:via-black/50 dark:to-black/70" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/20 to-background/40" />
      )}
    </div>
  );
}
