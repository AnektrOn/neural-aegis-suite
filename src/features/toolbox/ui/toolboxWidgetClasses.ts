import { cn } from "@/lib/utils";

export const toolboxWidgetRootClass = "flex flex-col space-y-6 py-4 max-w-lg mx-auto w-full";

export const toolboxWidgetHeaderClass = "flex items-center gap-2 text-neural-label";

export const toolboxWidgetInstructionsClass =
  "text-xs text-center text-muted-foreground leading-relaxed px-2";

export const toolboxWidgetLabelClass = "text-neural-label text-[10px] uppercase tracking-[0.2em]";

export const toolboxWidgetInputClass =
  "h-11 w-full rounded-xl border border-border/30 bg-secondary/30 px-4 text-sm text-foreground placeholder:text-muted-foreground/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

export const toolboxWidgetTextareaClass =
  "w-full min-h-[140px] rounded-xl border border-border/30 bg-secondary/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 transition-colors resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

export const toolboxWidgetCardClass =
  "rounded-2xl border border-border/30 bg-secondary/15 p-6";

export const toolboxWidgetProgressTrackClass = "h-1.5 w-full rounded-full bg-secondary overflow-hidden";

export const toolboxWidgetProgressFillClass = "h-full rounded-full bg-primary/70 transition-all duration-150";

export const toolboxWidgetTimerButtonClass =
  "inline-flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border/30 bg-background/40 text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-40";

export const toolboxWidgetSecondaryButtonClass =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-border/40 bg-background/40 px-6 text-xs uppercase tracking-[0.14em] text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-40";

export function toolboxWidgetChatInputClass(side: "start" | "end", accent: string, className?: string) {
  return cn(
    "max-w-[85%] rounded-2xl border bg-secondary/30 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
    side === "start" ? "rounded-tl-md" : "rounded-tr-md",
    className,
  );
}

export function toolboxWidgetChatInputStyle(accent: string) {
  return {
    borderColor: `color-mix(in srgb, ${accent} 35%, transparent)`,
  } as const;
}
