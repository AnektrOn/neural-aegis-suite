import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useAegisHealthScore } from "@/hooks/useAegisHealthScore";
import { useLanguage } from "@/i18n/LanguageContext";

interface AegisHealthSectionProps {
  /** Persona glimpse: tighter card, no ethereal-glass */
  variant?: "default" | "compact";
}

export default function AegisHealthSection({ variant = "default" }: AegisHealthSectionProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { score, trend, isLoading } = useAegisHealthScore(user?.id);
  const compact = variant === "compact";
  const shellClass = compact ? "glass-card rounded-2xl p-4 space-y-4" : "ethereal-glass p-8 space-y-6";
  const titleKey = compact ? "aegis.title" : "aegis.profileTitle";

  if (isLoading && !score) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={shellClass}
      >
        <p className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {t("aegis.computing")}
        </p>
      </motion.div>
    );
  }

  if (!score) return null;

  const dims = [
    { key: "mood", label: t("aegis.dimMood"), value: Number(score.mood_score) },
    { key: "decision", label: t("aegis.dimDecision"), value: Number(score.decision_score) },
    { key: "habit", label: t("aegis.dimHabit"), value: Number(score.habit_score) },
    { key: "journal", label: t("aegis.dimJournal"), value: Number(score.journal_score) },
    { key: "relation", label: t("aegis.dimRelation"), value: Number(score.relation_score) },
    { key: "regularity", label: t("aegis.dimRegularity"), value: Number(score.log_regularity) },
  ];

  const chartData = trend.map((s) => ({
    date: s.score_date.slice(5),
    score: Number(s.overall_score),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className={shellClass}
    >
      <div className="flex items-center gap-2">
        <Activity size={compact ? 16 : 18} strokeWidth={1.5} className="text-primary" />
        <p className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {t(titleKey)}
        </p>
      </div>

      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "font-display text-foreground tabular-nums",
            compact ? "text-4xl" : "text-5xl",
          )}
        >
          {Math.round(Number(score.overall_score))}
        </span>
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">/ 100</span>
      </div>

      {!compact ? <p className="text-sm text-muted-foreground">{t("aegis.explainer")}</p> : null}

      {chartData.length > 1 && (
        <div className={cn(compact ? "h-24 -mx-1" : "h-32 -mx-2")}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="date"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  color: "hsl(var(--foreground))",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 2, fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className={cn("grid grid-cols-2 sm:grid-cols-3 gap-2", !compact && "gap-3 pt-2")}>
        {dims.map((d) => (
          <div key={d.key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{d.label}</span>
              <span className="text-[11px] font-display tabular-nums text-foreground">
                {Math.round(d.value)}
              </span>
            </div>
            <div className="h-1 rounded-full bg-border/40 overflow-hidden">
              <div
                className="h-full bg-primary/70"
                style={{ width: `${Math.max(2, d.value)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
