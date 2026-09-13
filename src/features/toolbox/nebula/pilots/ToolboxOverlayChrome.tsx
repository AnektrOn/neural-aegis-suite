import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { toolboxWidgetCardClass } from "@/features/toolbox/ui/toolboxWidgetClasses";

interface ToolboxOverlayChromeProps {
  children: ReactNode;
  className?: string;
}

/** Compact glass tray for widget controls over particle/matter canvas. */
export function ToolboxOverlayChrome({ children, className }: ToolboxOverlayChromeProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center px-3 pb-3">
      <div
        data-slot="toolbox-overlay-chrome"
        className={cn(
          "pointer-events-auto max-h-[min(38%,20rem)] w-[min(100%,24rem)] overflow-y-auto [-webkit-overflow-scrolling:touch]",
          toolboxWidgetCardClass,
          "border-border/35 bg-background/75 p-3 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-4",
          "[&_[data-slot=toolbox-widget]]:max-w-none [&_[data-slot=toolbox-widget]]:py-2 [&_[data-slot=toolbox-widget]]:space-y-4",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
