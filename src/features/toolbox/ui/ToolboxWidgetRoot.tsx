import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { toolboxWidgetRootClass } from "./toolboxWidgetClasses";

export function ToolboxWidgetRoot({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-slot="toolbox-widget" className={cn(toolboxWidgetRootClass, className)}>
      {children}
    </div>
  );
}
