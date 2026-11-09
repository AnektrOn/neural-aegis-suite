import React from "react";
import { cn } from "@/lib/utils";

/** Static class maps so Tailwind can see every variant. */
const COL_SPAN: Record<number, string> = {
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
  9: "lg:col-span-9",
};

export interface MemberSplitLayoutProps {
  /** Master focus pane (Left on desktop, Top on mobile) */
  left: React.ReactNode;
  /** Content / feed / secondary pane (Right on desktop, Bottom on mobile) */
  right: React.ReactNode;
  /** Left pane width in 12-col grid (lg+). Default 5. */
  leftColSpan?: number;
  /** Right pane width in 12-col grid (lg+). Default 5. */
  rightColSpan?: number;
  /** Override left pane column classes (takes precedence over leftColSpan). */
  leftCols?: string;
  /** Override right pane column classes (takes precedence over rightColSpan). */
  rightCols?: string;
  /** Additional styling for the outer grid container */
  className?: string;
  /** Optional header displayed above both panes (full width) */
  header?: React.ReactNode;
  /** Right pane scrolls internally on desktop (default true). */
  scrollRight?: boolean;
  /** Left pane scrolls internally if content exceeds viewport height (default true, never clips). */
  scrollLeft?: boolean;
  /** Whether the left pane activates the Dashboard's Abyssal Arena mode (Noir Abyssal #070707 + solar radial glow). Default true. */
  arenaLeft?: boolean;
}

/**
 * Bio-Executive 100vh edge-to-edge split — same structure as the dashboard:
 * `grid lg:grid-cols-12 lg:gap-0 lg:p-0`, columns divided by a hairline `border-r`,
 * no centered max-width container, no floating gutter.
 * Left pane inherits the Dashboard's Abyssal Arena (#070707 + aura dorée).
 * Right pane hosts matte blurry glass tiles on basalte (#161614).
 * Mobile collapses to one stacked column.
 */
export function MemberSplitLayout({
  left,
  right,
  leftColSpan = 5,
  rightColSpan = 7,
  leftCols,
  rightCols,
  className,
  header,
  scrollRight = true,
  scrollLeft = true,
  arenaLeft = true,
}: MemberSplitLayoutProps) {
  const leftPaneInset =
    "px-4 py-5 sm:px-6 lg:px-8 lg:pt-7 lg:pb-[calc(var(--mobile-dock-padding,5rem)+1.25rem)]";
  const rightPaneInset =
    "px-4 pt-5 pb-[calc(var(--mobile-dock-padding,5rem)+1.5rem)] sm:px-6 lg:px-8 lg:pt-7 lg:pb-[calc(var(--mobile-dock-padding,5rem)+1.25rem)]";
  return (
    <div className={cn("flex flex-1 min-h-0 flex-col w-full h-full", className)}>
      {header ? (
        <div className={cn("shrink-0 border-b border-border/25 bg-[#0b0b0a]", leftPaneInset)}>
          {header}
        </div>
      ) : null}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 p-0 flex-1 min-h-0 h-full items-stretch">
        {/* Left Pane (Master Focus / Interactive Stage / Abyssal Arena) */}
        <div
          className={cn(
            "min-h-0 relative flex flex-col border-b border-border/25 lg:border-b-0 lg:border-r",
            arenaLeft ? "bg-[#070707] text-[#e9e4d8]" : "bg-background/40",
            leftPaneInset,
            scrollLeft ? "lg:overflow-y-auto no-scrollbar" : "lg:overflow-hidden",
            leftCols ?? COL_SPAN[leftColSpan] ?? "lg:col-span-5",
          )}
        >
          {arenaLeft && (
            <div
              className="pointer-events-none absolute left-1/2 top-[24%] -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(201,162,75,0.16)_0%,rgba(201,162,75,0.04)_42%,transparent_70%)] blur-[26px] z-0"
              aria-hidden="true"
            />
          )}
          <div className="relative z-10 flex flex-col flex-1 min-h-0">{left}</div>
        </div>

        {/* Right Pane (Feed / Stream / Details / Bento Stream) */}
        <div
          className={cn(
            "min-h-0 relative flex flex-col bg-[#161614]/60 dark:bg-[#161614]/60",
            rightPaneInset,
            scrollRight ? "lg:overflow-y-auto no-scrollbar" : "lg:overflow-hidden",
            rightCols ?? COL_SPAN[rightColSpan] ?? "lg:col-span-7",
          )}
        >
          <div className="relative z-10 flex flex-col flex-1 min-h-0">{right}</div>
        </div>
      </div>
    </div>
  );
}
