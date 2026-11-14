import { cn } from "@/lib/utils";

const WIDTHS = {
  /** Settings, messages, forms */
  narrow: "max-w-3xl",
  /** Hubs, lists, trackers */
  default: "max-w-5xl",
  /** Analytics, calendar, people */
  wide: "max-w-7xl",
  full: "max-w-none",
} as const;

type MemberPageScaffoldProps = {
  children: React.ReactNode;
  className?: string;
  /** Full-bleed (no horizontal padding) — rare; dashboard uses its own lab frame. */
  bleed?: boolean;
  /** Max content width (centered, no card / background). Default: `default`. */
  width?: keyof typeof WIDTHS;
  /**
   * When true, locks desktop layout into 100dvh (minus bottom dock reserve)
   * eliminating window scroll and enabling dual-pane split layouts.
   */
  viewport?: boolean;
};

/**
 * Default content inset for member routes under MemberAppShell v2.
 * The dock reserve is handled by the shell (`main` paddingBottom) — not added here.
 */
export function MemberPageScaffold({
  children,
  className,
  bleed = false,
  width = "default",
  viewport = false,
}: MemberPageScaffoldProps) {
  return (
    <div
      data-member-page
      data-viewport-page={viewport ? "" : undefined}
      className={cn(
        "w-full min-h-0",
        viewport
          ? // The shell reserves the top dock vertically on mobile; panes own their insets.
            "max-w-none mx-0 flex flex-col lg:h-[100dvh] lg:max-h-[100dvh] lg:overflow-hidden lg:p-0"
          : cn(
              "mx-auto",
              !bleed &&
                 "py-4 lg:py-5 px-3 sm:px-5 lg:px-6",
              WIDTHS[width],
            ),
        className,
      )}
    >
      {children}
    </div>
  );
}
