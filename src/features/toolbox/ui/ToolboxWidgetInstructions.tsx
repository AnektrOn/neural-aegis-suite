import { cn } from "@/lib/utils";
import { toolboxWidgetInstructionsClass } from "./toolboxWidgetClasses";
import { ToolboxWidgetProsePanel } from "./ToolboxWidgetProsePanel";
import { isLongToolboxCopy } from "./toolboxStepText";

export function ToolboxWidgetInstructions({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  if (!children) return null;
  const text = typeof children === "string" ? children : null;
  if (text && isLongToolboxCopy(text)) {
    return (
      <ToolboxWidgetProsePanel label={label} className={className} align="start">
        {text}
      </ToolboxWidgetProsePanel>
    );
  }
  return (
    <p data-slot="toolbox-widget-instructions" className={cn(toolboxWidgetInstructionsClass, className)}>
      {children}
    </p>
  );
}
