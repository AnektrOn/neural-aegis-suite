import type { ComponentPropsWithoutRef } from "react";

type Variant = "dark" | "bronze" | "ghost";

const variantClass: Record<Variant, string> = {
  dark:
    "bg-[color:var(--aegis-text)] text-white hover:bg-[#1a1a1a] border border-transparent",
  bronze:
    "bg-[color:var(--aegis-bronze)] text-[color:var(--aegis-text)] hover:bg-[color:var(--aegis-bronze-hover)] border border-transparent",
  ghost:
    "bg-transparent text-[color:var(--aegis-text)] border border-[color:var(--aegis-hairline)] hover:border-[color:var(--aegis-bronze)]",
};

type Props = ComponentPropsWithoutRef<"a"> & {
  variant?: Variant;
};

export function LandingButton({
  variant = "dark",
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <a
      className={`aegis-landing__btn-glow inline-flex min-h-[44px] items-center justify-center rounded-full px-6 font-mono text-xs uppercase tracking-[0.14em] ${variantClass[variant]} ${className}`}
      {...rest}
    >
      {children}
    </a>
  );
}
