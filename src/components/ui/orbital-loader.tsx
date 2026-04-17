import * as React from "react";
import { cva } from "class-variance-authority";
import { motion } from "motion/react";

import { AegisArtistaWordmark } from "@/components/ui/aegis-artista-wordmark";
import { cn } from "@/lib/utils";

const spin = (duration: number) => ({
  duration,
  repeat: Number.POSITIVE_INFINITY,
  ease: "linear" as const,
});

function OrbitalRings({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-foreground"
        animate={{ rotate: 360 }}
        transition={spin(1)}
      />
      <motion.div
        className="absolute inset-2 rounded-full border-2 border-transparent border-t-foreground"
        animate={{ rotate: -360 }}
        transition={spin(1.5)}
      />
      <motion.div
        className="absolute inset-4 rounded-full border-2 border-transparent border-t-foreground"
        animate={{ rotate: 360 }}
        transition={spin(0.8)}
      />
    </div>
  );
}

const orbitalLoaderVariants = cva("flex items-center justify-center gap-2", {
  variants: {
    messagePlacement: {
      bottom: "flex-col",
      top: "flex-col-reverse",
      right: "flex-row",
      left: "flex-row-reverse",
    },
  },
  defaultVariants: {
    messagePlacement: "bottom",
  },
});

export interface OrbitalLoaderProps {
  /** When set, shows the brand label (AEGIS = Artista stroke SVG, no ring spinner). */
  brand?: string;
  message?: string;
  /**
   * Position of the message relative to the spinner.
   * @default bottom
   */
  messagePlacement?: "top" | "bottom" | "left" | "right";
}

function isAegisBrand(brand: string) {
  return brand.trim().toUpperCase() === "AEGIS";
}

export function OrbitalLoader({
  className,
  brand,
  message,
  messagePlacement,
  ...props
}: React.ComponentProps<"div"> & OrbitalLoaderProps) {
  const showBrand = brand != null && brand !== "";
  const aegisOnly = showBrand && isAegisBrand(brand);

  const brandBlock = showBrand ? (
    isAegisBrand(brand) ? (
      <div className="flex w-full shrink-0 justify-center px-2">
        <AegisArtistaWordmark className="aegis-mark-responsive" />
      </div>
    ) : (
      <span className="text-center text-lg font-semibold uppercase tracking-wide text-foreground">
        {brand}
      </span>
    )
  ) : null;

  const spinners = (
    <div className={cn("flex flex-col items-center", showBrand && (aegisOnly ? "gap-3" : "gap-5"))}>
      {brandBlock}
      {!aegisOnly ? (
        <div className={cn("relative h-16 w-16 shrink-0", className)} {...props}>
          <OrbitalRings className="absolute inset-0 h-full w-full" />
        </div>
      ) : null}
    </div>
  );

  return (
    <div className={cn(orbitalLoaderVariants({ messagePlacement }), aegisOnly && className)} {...(aegisOnly ? props : {})}>
      {spinners}
      {message ? <div>{message}</div> : null}
    </div>
  );
}
