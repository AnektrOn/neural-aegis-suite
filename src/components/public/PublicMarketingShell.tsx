import type { ReactNode } from "react";
import "@/pages/aegis-landing/aegisLanding.css";
import "./public-marketing.css";

/** Shared outer shell — same palette as `/` landing (`.aegis-landing`). */
export const publicMarketingPageShell =
  "aegis-landing public-marketing min-h-dvh flex flex-col bg-[color:var(--aegis-page)] text-[color:var(--aegis-text)] relative overflow-x-hidden";

export const publicMarketingHeaderShell =
  "border-b border-[color:var(--aegis-hairline)] bg-[color:var(--aegis-page)]/90 backdrop-blur-md";

export function PublicMarketingShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${publicMarketingPageShell} ${className}`}>{children}</div>;
}