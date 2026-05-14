import { useState, useEffect, useCallback } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";

interface BreakdownItem {
  criteria_id: string;
  label: string;
  earned: number;
  max: number;
  met: boolean;
}

type ScoreboardWidgetProps = {
  /** Dense row for mobile dashboard rail */
  compact?: boolean;
};

export default function ScoreboardWidget({ compact = false }: ScoreboardWidgetProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [score, setScore] = useState<{ total: number; max: number; breakdown: BreakdownItem[] } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadScoreboard = useCallback(async () => {
    if (!user) {
      setScore(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const scoreDate = yesterday.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("daily_scoreboards" as any)
      .select("total_score, max_score, breakdown")
      .eq("user_id", user.id)
      .eq("score_date", scoreDate)
      .maybeSingle();

    if (error) {
      console.error("scoreboard load", error);
      setScore(null);
    } else if (data) {
      setScore({
        total: (data as any).total_score,
        max: (data as any).max_score,
        breakdown: (data as any).breakdown as BreakdownItem[],
      });
    } else {
      setScore(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadScoreboard();
  }, [loadScoreboard]);

  if (loading) {
    if (compact) return <div className="skeleton h-[72px] rounded-2xl sm:rounded-[18px]" />;
    return null;
  }

  if (!score) {
    if (compact) {
      return (
        <NavLink
          to="/analytics"
          className="flex h-[72px] flex-col items-center justify-center rounded-2xl border border-border/50 bg-[hsl(var(--aegis-s1))] px-3 text-center text-[11px] text-muted-foreground transition-colors active:opacity-90"
        >
          <Trophy size={16} className="mb-1 text-primary/50" aria-hidden />
          {t("scoreboard.compactEmpty")}
        </NavLink>
      );
    }
    return null;
  }

  const pct = score.max > 0 ? Math.round((score.total / score.max) * 100) : 0;
  const color = pct >= 80 ? "text-emerald-500" : pct >= 50 ? "text-amber-400" : "text-red-400";

  if (compact) {
    return (
      <NavLink
        to="/analytics"
        className="block rounded-2xl border-[0.5px] border-[hsl(var(--aegis-border))] bg-[hsl(var(--aegis-s1))] p-3.5 shadow-[0_4px_20px_hsl(0_0%_0%/0.08)] transition-all active:scale-[0.98]"
        style={{ WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Trophy size={16} className="shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
              <p className="font-barlow text-[10px] font-medium uppercase tracking-[0.16em] text-text-tertiary/80">
                {t("scoreboard.yesterday")}
              </p>
              <p className={`font-display text-lg tabular-nums leading-tight ${color}`}>
                {score.total}/{score.max}{" "}
                <span className="text-xs font-normal text-muted-foreground">{t("scoreboard.pts")}</span>
              </p>
            </div>
          </div>
          <span className="font-display text-sm tabular-nums text-text-primary shrink-0">{pct}%</span>
        </div>
      </NavLink>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border-subtle bg-bg-surface p-6 shadow-card"
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Trophy size={18} className="text-primary" />
          <div>
            <p className="text-neural-label text-left">{t("scoreboard.yesterday")}</p>
            <p className={`text-2xl font-display ${color}`}>
              {score.total}/{score.max} <span className="text-sm text-muted-foreground">{t("scoreboard.pts")}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48" aria-hidden>
              <circle cx="24" cy="24" r="20" fill="none" stroke="#1E2030" strokeWidth="3" />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="#4F8EF7"
                strokeWidth="3"
                strokeDasharray={`${(pct / 100) * 125.6} 125.6`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-display text-text-primary">{pct}%</span>
          </div>
          {expanded ? <ChevronUp size={14} className="text-text-tertiary" strokeWidth={1.5} /> : <ChevronDown size={14} className="text-text-tertiary" strokeWidth={1.5} />}
        </div>
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="mt-4 space-y-2 border-t border-border-subtle/60 pt-4"
        >
          {score.breakdown.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                {item.met ? (
                  <Check size={12} className="text-emerald-500" />
                ) : (
                  <X size={12} className="text-red-400" />
                )}
                <span className="text-sm text-text-primary">{item.label}</span>
              </div>
              <span className={`text-xs font-display ${item.met ? "text-accent-positive" : "text-text-secondary"}`}>
                {item.earned}/{item.max} {t("scoreboard.pts")}
              </span>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
