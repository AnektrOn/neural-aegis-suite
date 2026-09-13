import { cn } from "@/lib/utils";
import { toolboxWidgetInstructionsClass } from "./toolboxWidgetClasses";

export function ToolboxWidgetInstructions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return (
    <p data-slot="toolbox-widget-instructions" className={cn(toolboxWidgetInstructionsClass, className)}>
      {children}
    </p>
  );
}
