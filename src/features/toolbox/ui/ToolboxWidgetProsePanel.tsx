import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ToolboxWidgetProsePanel({
  children,
  className,
  label,
  align = "start",
  maxHeightClass = "max-h-[min(42dvh,18rem)] sm:max-h-[min(36dvh,22rem)]",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
  align?: "start" | "center";
  maxHeightClass?: string;
}) {
  if (!children) return null;

  return (
    <div
      data-slot="toolbox-widget-prose-panel"
      className={cn(
        "w-full rounded-xl border border-border/30 bg-secondary/15",
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      {label ? (
        <p className="px-4 pt-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      ) : null}
      <div
        className={cn(
          "overflow-y-auto overscroll-contain px-4 pb-4 pt-2 [-webkit-overflow-scrolling:touch]",
          maxHeightClass,
          label ? "pt-1" : "pt-3",
        )}
      >
        <div className="text-sm leading-relaxed text-foreground/90">{children}</div>
      </div>
    </div>
  );
}
