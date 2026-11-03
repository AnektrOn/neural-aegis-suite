import type { ReactNode } from "react";

export function LandingPill({
  children,
  tone = "bronze",
  className = "",
}: {
  children: ReactNode;
  tone?: "bronze" | "neutral";
  className?: string;
}) {
  const bg =
    tone === "bronze"
      ? "bg-[color:var(--aegis-bronze)] text-[color:var(--aegis-text)]"
      : "bg-[#F4F4F5] text-[color:var(--aegis-text-secondary)]";
  return (
    <span
      className={`inline-flex min-h-[28px] items-center rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${bg} ${className}`}
    >
      {children}
    </span>
  );
}
