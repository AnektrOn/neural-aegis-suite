import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { toolboxWidgetCardClass } from "./toolboxWidgetClasses";

export function ToolboxWidgetCard({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div data-slot="toolbox-widget-card" className={cn(toolboxWidgetCardClass, className)} style={style}>
      {children}
    </div>
  );
}
