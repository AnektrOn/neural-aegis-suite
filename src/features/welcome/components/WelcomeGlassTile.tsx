import type { ReactNode } from "react";
import { Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeGlassTileProps {
  title: string;
  headline: string;
  detail?: string;
  actionLabel: string;
  icon?: ReactNode;
  onClick: () => void;
  className?: string;
}

export function WelcomeGlassTile({
  title,
  headline,
  detail,
  actionLabel,
  icon,
  onClick,
  className,
}: WelcomeGlassTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "welcome-glass-tile group flex min-h-[140px] flex-col p-4 text-left transition-all",
        "hover:border-primary/40",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {title}
        </span>
        <Maximize2
          size={14}
          strokeWidth={1.5}
          className="text-muted-foreground opacity-60 group-hover:opacity-100 shrink-0"
          aria-hidden
        />
      </div>
      {icon ? <div className="mb-2 text-primary">{icon}</div> : null}
      <p className="font-display text-2xl sm:text-3xl text-foreground leading-none tracking-tight">
        {headline}
      </p>
      {detail ? (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed flex-1">{detail}</p>
      ) : (
        <div className="flex-1" />
      )}
      <span className="mt-3 inline-flex self-start rounded-full border border-border/50 bg-background/30 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] font-display text-foreground/90 group-hover:border-primary/40 transition-colors">
        {actionLabel}
      </span>
    </button>
  );
}
