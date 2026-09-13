import { cn } from "@/lib/utils";
import {
  toolboxWidgetProgressFillClass,
  toolboxWidgetProgressTrackClass,
} from "./toolboxWidgetClasses";

export function ToolboxWidgetProgress({
  value,
  max = 1,
  className,
  fillClassName,
  accentColor,
}: {
  value: number;
  max?: number;
  className?: string;
  fillClassName?: string;
  accentColor?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div
      data-slot="toolbox-widget-progress"
      className={cn(toolboxWidgetProgressTrackClass, className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div
        className={cn(toolboxWidgetProgressFillClass, fillClassName)}
        style={{
          width: `${pct}%`,
          ...(accentColor ? { backgroundColor: accentColor } : undefined),
        }}
      />
    </div>
  );
}
