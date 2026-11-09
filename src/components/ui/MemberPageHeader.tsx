import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MemberPageHeaderProps = {
  /** Upper kicker / category — uses Cinzel with wide tracking */
  kicker: ReactNode;
  /** Primary H1 — uses Cormorant Garamond font-light */
  title: ReactNode;
  /** Subtitle / description — uses Barlow font-sans */
  subtitle?: ReactNode;
  /** Optional right-aligned action (e.g. CTA, filter, button) */
  action?: ReactNode;
  className?: string;
  /** Page title block alignment — `center` for immersive / carousel pages. */
  align?: "left" | "center";
};

/**
 * Standard Member Page Header (Bio-Executive DA v2).
 * Kicker: Cinzel uppercase tracking-[0.24em]
 * Title H1: Cormorant Garamond font-light
 * Subtitle: Barlow font-sans text-sm leading-relaxed
 */
export function MemberPageHeader({
  kicker,
  title,
  subtitle,
  action,
  className,
  align = "left",
}: MemberPageHeaderProps) {
  const centered = align === "center";

  return (
    <header className={cn("space-y-2 pb-2", centered && "text-center", className)}>
      <div
        className={cn(
          "flex flex-col gap-3",
          centered ? "items-center" : "sm:flex-row sm:items-start justify-between",
        )}
      >
        <div className={cn("space-y-1.5", centered && "max-w-2xl mx-auto")}>
          <p className="font-cinzel text-[10.5px] font-semibold tracking-[0.24em] uppercase text-accent-primary dark:text-[#c9a24b] text-[#9e7828]">
            {kicker}
          </p>
          <h1 className="font-cormorant text-3xl sm:text-4xl font-light tracking-tight text-foreground dark:text-[#e9e4d8] text-[#141412]">
            {title}
          </h1>
          {subtitle && (
            <p
              className={cn(
                "font-sans text-sm text-muted-foreground dark:text-[#9a968b] text-[#615d54] leading-relaxed",
                centered ? "max-w-md mx-auto" : "max-w-2xl",
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className={cn("shrink-0", centered ? "mx-auto" : "self-start sm:self-auto")}>{action}</div>
        )}
      </div>
    </header>
  );
}
