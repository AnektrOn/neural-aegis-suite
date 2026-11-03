import type { ReactNode } from "react";

export function LandingCard({
  children,
  dark = false,
  className = "",
}: {
  children: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  const base = dark
    ? "aegis-landing__glass text-[color:var(--aegis-dark-text)] rounded-[18px]"
    : "bg-white/90 border border-[color:var(--aegis-hairline)] text-[color:var(--aegis-text)] rounded-[18px] shadow-[0_12px_40px_rgba(18,18,18,0.04)]";
  return <div className={`${base} p-6 md:p-8 ${className}`}>{children}</div>;
}
