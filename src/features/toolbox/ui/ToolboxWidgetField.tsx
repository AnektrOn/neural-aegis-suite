import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { toolboxWidgetLabelClass } from "./toolboxWidgetClasses";

export function ToolboxWidgetField({
  label,
  children,
  className,
  labelClassName,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <div data-slot="toolbox-widget-field" className={cn("space-y-1.5", className)}>
      {label ? (
        <span className={cn("block", toolboxWidgetLabelClass, labelClassName)}>{label}</span>
      ) : null}
      {children}
    </div>
  );
}
