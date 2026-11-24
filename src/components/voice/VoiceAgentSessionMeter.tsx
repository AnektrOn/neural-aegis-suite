import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  estimateVoiceSessionCost,
  formatVoiceCostEur,
  formatVoiceDuration,
} from "@/features/logos/voiceSessionCost";
import type { VoiceUsageBudget } from "@/features/logos/voiceBudgetService";
import { fetchVoiceUsageBudget } from "@/features/logos/voiceBudgetService";
import { cn } from "@/lib/utils";

type Props = {
  userId: string;
  active: boolean;
  onLimitReached: () => void;
  className?: string;
};

export function VoiceAgentSessionMeter({
  userId,
  active,
  onLimitReached,
  className,
}: Props) {
  const { t, locale } = useLanguage();
  const [budget, setBudget] = useState<VoiceUsageBudget | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const sessionStartRef = useRef<number | null>(null);
  const limitFiredRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void fetchVoiceUsageBudget(userId).then((b) => {
      if (!cancelled) setBudget(b);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!active) {
      sessionStartRef.current = null;
      setElapsed(0);
      limitFiredRef.current = false;
      return;
    }
    sessionStartRef.current = performance.now();
    const id = window.setInterval(() => {
      const start = sessionStartRef.current;
      if (start == null) return;
      setElapsed(Math.floor((performance.now() - start) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [active]);

  const monthRemaining = budget
    ? Math.max(0, budget.remaining_seconds - elapsed)
    : null;

  useEffect(() => {
    if (!active || monthRemaining == null || limitFiredRef.current) return;
    if (monthRemaining <= 0) {
      limitFiredRef.current = true;
      onLimitReached();
    }
  }, [active, monthRemaining, onLimitReached]);

  if (!budget) return null;

  const cost = estimateVoiceSessionCost(elapsed);
  const monthUsedWithLive = budget.used_seconds + elapsed;
  const monthPct =
    budget.limit_seconds > 0
      ? Math.min(100, Math.round((monthUsedWithLive / budget.limit_seconds) * 100))
      : 0;

  return (
    <div
      className={cn(
        "w-full max-w-sm rounded-lg border border-border/35 bg-background/40 px-3 py-2 text-left backdrop-blur-sm",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-mono text-[11px] tabular-nums text-foreground">
          {t("voiceAgent.meterSession", {
            duration: formatVoiceDuration(elapsed),
            cost: formatVoiceCostEur(cost.eur, locale),
          })}
        </span>
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
          {t("voiceAgent.meterMonthRemaining", {
            remaining: formatVoiceDuration(monthRemaining ?? 0),
          })}
        </span>
      </div>
      <div
        className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border/40"
        aria-hidden
      >
        <div
          className={cn(
            "h-full transition-[width] duration-500",
            monthPct >= 95 ? "bg-destructive" : monthPct >= 80 ? "bg-amber-500/90" : "bg-primary/70",
          )}
          style={{ width: `${monthPct}%` }}
        />
      </div>
      <p className="mt-1.5 font-display text-[9px] uppercase tracking-[0.2em] text-muted-foreground/80">
        {t("voiceAgent.meterFootnote")}
      </p>
    </div>
  );
}