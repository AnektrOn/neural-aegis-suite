import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PersonaStatBarProps {
  value: number;
  max?: number;
  color?: string;
  className?: string;
}

export function PersonaStatBar({
  value,
  max = 100,
  color = "hsl(var(--primary))",
  className,
}: PersonaStatBarProps) {
  const reduceMotion = useReducedMotion();
  const pct = Math.min(100, Math.max(0, (value / Math.max(max, 1)) * 100));

  return (
    <div
      className={cn("h-1 w-full overflow-hidden rounded-full bg-muted/40", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={reduceMotion ? { width: `${pct}%` } : { width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
