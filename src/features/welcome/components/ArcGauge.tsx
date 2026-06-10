import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Normalized path length — dash math matches any arc geometry. */
const PATH_LEN = 100;

interface ArcGaugeProps {
  value: number;
  max?: number;
  label: string;
  sublabel?: string;
  centerPrimary: string;
  centerSecondary?: string;
  /** Optional % shown under the label (computed from value/max). */
  showProgressPct?: boolean;
  accent?: "primary" | "neural" | "info" | "warning";
  className?: string;
}

const ACCENT_STROKE: Record<NonNullable<ArcGaugeProps["accent"]>, string> = {
  primary: "hsl(var(--primary))",
  neural: "hsl(var(--neural-accent))",
  info: "hsl(var(--info))",
  warning: "hsl(var(--warning))",
};

export function ArcGauge({
  value,
  max = 100,
  label,
  sublabel,
  centerPrimary,
  centerSecondary,
  showProgressPct = true,
  accent = "primary",
  className,
}: ArcGaugeProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const safeMax = Math.max(max, 1);
  const progress = Math.min(1, Math.max(0, value / safeMax));
  const pct = Math.round(progress * 100);
  const dashOffset = PATH_LEN * (1 - progress);
  const stroke = ACCENT_STROKE[accent];

  const trackPath = "M 14 76 A 56 56 0 0 1 126 76";

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg
        viewBox="0 0 140 88"
        className="w-[min(42vw,160px)] h-auto"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label}: ${value} / ${max}`}
      >
        <defs>
          <linearGradient id={`${id}-arc`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.3" />
            <stop offset="100%" stopColor={stroke} stopOpacity="1" />
          </linearGradient>
        </defs>
        <path
          d={trackPath}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="6"
          strokeLinecap="round"
          pathLength={PATH_LEN}
        />
        <motion.path
          d={trackPath}
          fill="none"
          stroke={`url(#${id}-arc)`}
          strokeWidth="6"
          strokeLinecap="round"
          pathLength={PATH_LEN}
          strokeDasharray={PATH_LEN}
          initial={reduceMotion ? { strokeDashoffset: dashOffset } : { strokeDashoffset: PATH_LEN }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="-mt-10 text-center space-y-0.5 px-2">
        <p className="font-display text-xl sm:text-2xl tabular-nums text-foreground tracking-tight">
          {centerPrimary}
        </p>
        {centerSecondary ? (
          <p className="text-[11px] text-muted-foreground tabular-nums">{centerSecondary}</p>
        ) : null}
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-display pt-1">
          {label}
        </p>
        {showProgressPct ? (
          <p className="text-[10px] tabular-nums font-display text-muted-foreground/80">{pct}%</p>
        ) : null}
        {sublabel ? (
          <p
            className={cn(
              "text-[10px] uppercase tracking-[0.18em] font-display",
              accent === "warning" ? "text-[hsl(var(--warning))]" : "text-primary/80",
            )}
          >
            {sublabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}
