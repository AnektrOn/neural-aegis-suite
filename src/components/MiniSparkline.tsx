import { memo, useId } from "react";
import { cn } from "@/lib/utils";

interface Props {
  values: number[];
  /** Chart height in px */
  height?: number;
  className?: string;
  strokeClassName?: string;
  ariaLabel?: string;
}

function MiniSparklineBase({
  values,
  height = 28,
  className,
  strokeClassName = "stroke-primary/70",
  ariaLabel,
}: Props) {
  const gradId = useId();
  const width = 64;
  const pad = 2;

  const hasData = values.some((v) => v > 0);
  const max = Math.max(...values, 1);
  const min = Math.min(...values.filter((v) => v > 0), max);
  const range = Math.max(max - min, 0.5);

  const points = values.map((v, i) => {
    const x = pad + (i / Math.max(values.length - 1, 1)) * (width - pad * 2);
    const norm = hasData ? (v - min) / range : 0.5;
    const y = pad + (1 - norm) * (height - pad * 2);
    return `${x},${y}`;
  });

  const linePath = points.length > 0 ? `M ${points.join(" L ")}` : "";
  const areaPath =
    points.length > 0
      ? `${linePath} L ${width - pad},${height - pad} L ${pad},${height - pad} Z`
      : "";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("block shrink-0", className)}
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {hasData && areaPath ? (
        <path d={areaPath} fill={`url(#${gradId})`} className="opacity-80" />
      ) : null}
      {linePath ? (
        <path
          d={linePath}
          fill="none"
          className={cn(strokeClassName, "stroke-[1.5]")}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ) : (
        <line
          x1={pad}
          x2={width - pad}
          y1={height / 2}
          y2={height / 2}
          className="stroke-border/60 stroke-[1]"
          strokeDasharray="3 3"
        />
      )}
    </svg>
  );
}

export const MiniSparkline = memo(MiniSparklineBase);
