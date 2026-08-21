import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type GuardianOverlayPlacement = "left" | "right" | "mobile";

interface Props {
  open: boolean;
  title: string;
  placement: GuardianOverlayPlacement;
  children: ReactNode;
}

/**
 * Guardian log panel:
 * - desktop left/right rail (nebula stays visible in the center)
 * - mobile sheet over the nebula (no blur — keep Guardian sharp)
 */
export function GuardianOverlayFrame({ open, title, placement, children }: Props) {
  if (!open || typeof document === "undefined") return null;

  const isMobile = placement === "mobile";

  return createPortal(
    <div
      className={cn(
        "fixed z-[200]",
        isMobile && "inset-0 flex items-end justify-center",
        placement === "right" &&
          "inset-y-0 right-0 flex w-[min(440px,42vw)] items-stretch p-4 pl-0",
        placement === "left" &&
          "inset-y-0 left-0 flex w-[min(440px,42vw)] items-stretch p-4 pr-0",
      )}
      role="dialog"
      aria-modal={isMobile}
      aria-label={title}
    >
      {isMobile ? (
        <div className="absolute inset-0 bg-background/20 dark:bg-black/20" aria-hidden />
      ) : null}

      <div
        className={cn(
          "relative z-10 flex flex-col overflow-hidden border border-border/60 text-foreground shadow-2xl",
          isMobile
            ? "mb-[max(0.25rem,env(safe-area-inset-bottom))] max-h-[min(88dvh,720px)] w-[min(100vw-0.75rem,420px)] rounded-2xl bg-background/90 dark:bg-black/70"
            : "h-full w-full rounded-2xl bg-background/80 backdrop-blur-xl dark:bg-black/50",
        )}
      >
        <div className="shrink-0 border-b border-border/50 px-4 py-3">
          <p className="font-display text-base tracking-wide">{title}</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
