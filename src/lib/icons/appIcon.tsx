import { forwardRef, type ComponentType, type SVGProps } from "react";
import { cn } from "@/lib/utils";

export type AppIconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  strokeWidth?: number | string;
};

export type AppIcon = ComponentType<AppIconProps>;

type HeroSvg = ComponentType<SVGProps<SVGSVGElement>>;

export function createAppIcon(Hero: HeroSvg, displayName?: string): AppIcon {
  const Wrapped = forwardRef<SVGSVGElement, AppIconProps>(function AppIcon(
    { size = 24, className, strokeWidth: _strokeWidth, width, height, ...rest },
    ref,
  ) {
    const dim = width ?? height ?? size;
    return (
      <Hero
        ref={ref}
        width={width ?? dim}
        height={height ?? dim}
        className={cn("shrink-0", className)}
        aria-hidden={rest["aria-hidden"] ?? true}
        {...rest}
      />
    );
  });
  Wrapped.displayName = displayName ?? "AppIcon";
  return Wrapped;
}