import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function ToolsBackToHubLink({ className }: { className?: string }) {
  return (
    <Link
      to="/tools"
      className={cn(
        "inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[color:var(--aegis-cardline)] bg-[color:var(--aegis-surface-elevated)] px-3 font-cinzel text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--aegis-ink-muted)] transition hover:border-[color:var(--aegis-cardline-hover)] hover:text-[color:var(--aegis-gold)]",
        className,
      )}
    >
      <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
      Retour aux outils
    </Link>
  );
}