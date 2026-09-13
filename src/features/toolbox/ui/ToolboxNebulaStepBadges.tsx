import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOOLBOX_STOP_STEP_COLORS, hslWithAlpha } from "./toolboxPhaseColors";

export interface ToolboxNebulaStepBadgeItem {
  id: string;
  label: string;
}

export function ToolboxNebulaStepBadges({
  steps,
  activeIndex,
  completedIndexes,
}: {
  steps: ToolboxNebulaStepBadgeItem[];
  activeIndex: number;
  completedIndexes: Set<number>;
}) {
  return (
    <div className="flex justify-center gap-1.5">
      {steps.map((step, index) => {
        const done = completedIndexes.has(index);
        const active = activeIndex >= 0 && index === activeIndex;
        const accent = TOOLBOX_STOP_STEP_COLORS[index] ?? TOOLBOX_STOP_STEP_COLORS[0];

        return (
          <div
            key={step.id}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
              done && "border-primary/40 bg-primary/15 text-primary",
              !done && !active && "border-border/25 bg-background/40 text-muted-foreground/70",
            )}
            style={
              active && !done
                ? {
                    borderColor: hslWithAlpha(accent, 0.55),
                    backgroundColor: hslWithAlpha(accent, 0.35),
                    color: "hsl(var(--foreground))",
                  }
                : undefined
            }
          >
            {done ? <Check className="h-4 w-4" aria-hidden /> : step.label}
          </div>
        );
      })}
    </div>
  );
}
