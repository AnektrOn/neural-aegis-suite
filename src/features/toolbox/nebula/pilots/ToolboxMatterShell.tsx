import type { ReactNode, MutableRefObject } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ToolboxMatterEngine, type ToolboxMatterDrive } from "./ToolboxMatterEngine";
import { ToolboxOverlayChrome } from "./ToolboxOverlayChrome";

interface ToolboxMatterShellProps {
  driveRef: MutableRefObject<ToolboxMatterDrive>;
  variant?: "modal" | "panel";
  embedded?: boolean;
  children: ReactNode;
  className?: string;
}

export function ToolboxMatterShell({
  driveRef,
  variant = "panel",
  embedded = false,
  children,
  className,
}: ToolboxMatterShellProps) {
  const isModal = variant === "modal";

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        isModal
          ? "h-full min-h-[100dvh] rounded-none"
          : cn(
              "rounded-xl border border-border/30",
              embedded ? "min-h-[min(52dvh,520px)]" : "min-h-[min(72dvh,680px)]",
            ),
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_rgba(10,6,22,0.95)_0%,_rgba(3,2,8,0.98)_75%)]"
      />
      <ToolboxMatterEngine driveRef={driveRef} className="z-[1]">
        <div className="absolute left-1/2 top-2 z-10 -translate-x-1/2">
          <Badge
            variant="secondary"
            className="border-primary/25 bg-black/40 text-[10px] uppercase tracking-wider text-foreground/90 backdrop-blur-sm"
          >
            Matière
          </Badge>
        </div>
        <ToolboxOverlayChrome>{children}</ToolboxOverlayChrome>
      </ToolboxMatterEngine>
    </div>
  );
}
