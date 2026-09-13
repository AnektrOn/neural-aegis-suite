import { Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toolboxWidgetTimerButtonClass } from "./toolboxWidgetClasses";

export function ToolboxWidgetTimerControls({
  isRunning,
  onToggle,
  onReset,
  disabled,
  className,
  playLabel,
  pauseLabel,
  resetLabel,
}: {
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
  disabled?: boolean;
  className?: string;
  playLabel: string;
  pauseLabel: string;
  resetLabel: string;
}) {
  return (
    <div
      data-slot="toolbox-widget-timer-controls"
      className={cn("flex items-center justify-center gap-3", className)}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={cn(toolboxWidgetTimerButtonClass, isRunning && "border-primary/40 bg-primary/10")}
        aria-label={isRunning ? pauseLabel : playLabel}
      >
        {isRunning ? <Pause size={18} /> : <Play size={18} className="ms-0.5" />}
      </button>
      <button
        type="button"
        onClick={onReset}
        disabled={disabled}
        className={toolboxWidgetTimerButtonClass}
        aria-label={resetLabel}
      >
        <RotateCcw size={16} />
      </button>
    </div>
  );
}

export function ToolboxWidgetLaunchButton({
  children,
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="toolbox-widget-launch-button"
      className={cn("btn-neural min-h-[44px] px-6 disabled:opacity-40 disabled:pointer-events-none", className)}
      {...props}
    >
      {children}
    </button>
  );
}
