import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { AppIconProps } from "@/lib/icons/appIcon";

export const FilledCircle = forwardRef<SVGSVGElement, AppIconProps>(function FilledCircle(
  { className, size = 24, width, height, strokeWidth: _strokeWidth, ...props },
  ref,
) {
  const dim = width ?? height ?? size;
  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={width ?? dim}
      height={height ?? dim}
      className={cn("shrink-0", className)}
      aria-hidden={props["aria-hidden"] ?? true}
      {...props}
    >
      <circle cx="12" cy="12" r="6" fill="currentColor" />
    </svg>
  );
});