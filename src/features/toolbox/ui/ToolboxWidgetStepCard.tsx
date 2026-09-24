import { cn } from "@/lib/utils";
import { parseToolboxStepBullet } from "./toolboxStepText";
import { toolboxWidgetLabelClass } from "./toolboxWidgetClasses";

export function ToolboxWidgetStepCard({
  stepText,
  stepIndex,
  stepTotal,
  className,
  metaRight,
  accentColor,
}: {
  stepText: string;
  stepIndex: number;
  stepTotal: number;
  className?: string;
  metaRight?: React.ReactNode;
  accentColor?: string;
}) {
  const { title, body } = parseToolboxStepBullet(stepText);

  return (
    <div
      data-slot="toolbox-widget-step-card"
      className={cn(
        "w-full rounded-2xl border border-border/30 bg-secondary/15 p-4 sm:p-5",
        className,
      )}
      style={
        accentColor
          ? {
              borderColor: `color-mix(in srgb, ${accentColor} 28%, transparent)`,
              background: `color-mix(in srgb, ${accentColor} 6%, transparent)`,
            }
          : undefined
      }
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className={toolboxWidgetLabelClass} style={accentColor ? { color: accentColor } : undefined}>
          {stepIndex + 1} / {stepTotal}
        </span>
        {metaRight ? <span className="shrink-0 text-[10px] font-mono text-muted-foreground">{metaRight}</span> : null}
      </div>
      {title ? (
        <p className="text-sm font-medium leading-snug text-foreground">{title}</p>
      ) : null}
      <p
        className={cn(
          "text-sm leading-relaxed text-foreground/85",
          title ? "mt-2" : "",
          "max-h-[min(50dvh,24rem)] overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]",
        )}
      >
        {body}
      </p>
    </div>
  );
}
