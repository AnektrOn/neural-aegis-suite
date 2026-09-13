import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { toolboxWidgetSecondaryButtonClass } from "./toolboxWidgetClasses";

export function ToolboxWidgetSecondaryButton({
  children,
  className,
  ...props
}: React.ComponentProps<"button"> & { children: ReactNode }) {
  return (
    <button
      type="button"
      data-slot="toolbox-widget-secondary-button"
      className={cn(toolboxWidgetSecondaryButtonClass, className)}
      {...props}
    >
      {children}
    </button>
  );
}
