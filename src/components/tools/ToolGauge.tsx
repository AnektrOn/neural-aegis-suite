import type { ReactNode } from "react";
import { toolsMetricLabel, toolsMetricValue } from "./toolsDesign";

interface ToolGaugeProps {
  value: number;
  max?: number;
  label: string;
  tone?: "gold" | "copper" | "danger";
  suffix?: string;
}

export function ToolGauge({
  value,
  max = 100,
  label,
  tone = "gold",
  suffix = "%",
}: ToolGaugeProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const stroke =
    tone === "copper" ? "hsl(var(--secondary))" : tone === "danger" ? "hsl(var(--destructive))" : "hsl(var(--primary))";

  const track = "hsl(var(--muted))";
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <GaugeFrame className="relative mx-auto h-28 w-28">
        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" stroke={track} />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            stroke={stroke}
            className="transition-all duration-500"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={toolsMetricValue}>
            {Math.round(value)}
            {suffix}
          </span>
        </div>
      </GaugeFrame>
      <p className={`text-center ${toolsMetricLabel}`}>{label}</p>
    </div>
  );
}

function GaugeFrame({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={className}>{children}</div>;
}