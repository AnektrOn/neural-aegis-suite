import { Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatToolboxCountdown,
  useToolboxCountdown,
} from "../hooks/useToolboxCountdown";
import { toolboxWidgetProgressFillClass, toolboxWidgetProgressTrackClass } from "@/features/toolbox/ui/toolboxWidgetClasses";

export interface ToolboxTimerProps {
  durationSec: number;
  className?: string;
  autoStart?: boolean;
  onComplete?: () => void;
  labels?: {
    play?: string;
    pause?: string;
    reset?: string;
  };
}

export function ToolboxTimer({
  durationSec,
  className,
  autoStart = false,
  onComplete,
  labels,
}: ToolboxTimerProps) {
  const { remainingSec, isRunning, progress, toggle, reset } = useToolboxCountdown({
    durationSec,
    autoStart,
    onComplete,
  });

  const playLabel = labels?.play ?? "Démarrer";
  const pauseLabel = labels?.pause ?? "Pause";
  const resetLabel = labels?.reset ?? "Réinitialiser";

  return (
    <div
      data-slot="toolbox-timer"
      className={cn(
        "flex flex-col items-center gap-4 rounded-2xl border border-border/30 bg-secondary/10 px-6 py-5",
        className,
      )}
    >
      <div
        className="font-mono text-4xl tabular-nums tracking-tight text-foreground"
        aria-live="polite"
        aria-atomic="true"
      >
        {formatToolboxCountdown(remainingSec)}
      </div>

      <div className={cn(toolboxWidgetProgressTrackClass, "max-w-xs")} aria-hidden>
        <div
          className={cn(toolboxWidgetProgressFillClass, "bg-foreground/25")}
          style={{ width: `${Math.min(100, progress * 100)}%` }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex size-11 items-center justify-center rounded-xl border border-border/40 bg-background/50 text-foreground transition-colors hover:bg-background/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label={isRunning ? pauseLabel : playLabel}
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} className="ms-0.5" />}
        </button>
        <button
          type="button"
          onClick={reset}
          className="inline-flex size-11 items-center justify-center rounded-xl border border-border/40 bg-background/50 text-foreground transition-colors hover:bg-background/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label={resetLabel}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
