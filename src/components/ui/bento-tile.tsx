import * as React from "react";
import { cn } from "@/lib/utils";

export interface BentoTileProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "solar" | "mineral" | "interactive";
  glow?: boolean;
}

/**
 * BentoTile: AEGIS luxury-brutalist bento tile with matte blurry glass texture
 * inspired by the executive dock island.
 */
export const BentoTile = React.forwardRef<HTMLDivElement, BentoTileProps>(
  ({ className, variant = "default", glow = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "aegis-bento-tile relative flex flex-col overflow-hidden p-5 transition-all duration-300",
          variant === "solar" &&
            "border-[#c9a24b]/40 bg-[linear-gradient(180deg,rgba(210,174,94,0.18)_0%,rgba(166,127,46,0.08)_100%)] shadow-[0_8px_30px_rgba(201,162,75,0.14)]",
          variant === "mineral" &&
            "bg-[linear-gradient(180deg,rgba(45,40,34,0.72)_0%,rgba(26,23,20,0.85)_100%)] border-[rgba(233,228,216,0.12)]",
          variant === "interactive" &&
            "cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]",
          glow &&
            "after:pointer-events-none after:absolute after:inset-0 after:rounded-[1.25rem] after:bg-[radial-gradient(circle_at_50%_0%,rgba(201,162,75,0.15),transparent_60%)]",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

BentoTile.displayName = "BentoTile";
