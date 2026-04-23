import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, TrendingDown, TrendingUp, Minus, ChevronDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import type { AegisHealthScore } from "@/types/aegisHealth";

interface AegisHealthCardProps {
  score: AegisHealthScore | null;
  previous: AegisHealthScore | null;
  isLoading?: boolean;
}

const dims = (
  score: AegisHealthScore,
): Array<{ key: string; labelKey: TranslationKey; value: number }> => [
  { key: "mood", labelKey: "aegis.dimMood", value: Number(score.mood_score) },
  { key: "decision", labelKey: "aegis.dimDecision", value: Number(score.decision_score) },
  { key: "habit", labelKey: "aegis.dimHabit", value: Number(score.habit_score) },
  { key: "journal", labelKey: "aegis.dimJournal", value: Number(score.journal_score) },
  { key: "relation", labelKey: "aegis.dimRelation", value: Number(score.relation_score) },
];

export function AegisHealthCard({ score, previous, isLoading }: AegisHealthCardProps) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  if (isLoading || !score) {
    return (
      <div className="ethereal-glass rounded-[14px] p-5 min-h-[160px] flex items-center justify-center">
        <span className="text-[10px] tracking-[0.18em] uppercase text-text-tertiary font-display">
          {t("aegis.computing")}
        </span>
      </div>
    );
  }

  const overall = Math.round(Number(score.overall_score));
  const delta = previous
    ? Math.round((Number(score.overall_score) - Number(previous.overall_score)) * 10) / 10
    : 0;

  const trendIcon =
    delta > 1 ? <TrendingUp size={12} strokeWidth={1.5} className="text-accent-positive" /> :
    delta < -1 ? <TrendingDown size={12} strokeWidth={1.5} className="text-accent-danger" /> :
    <Minus size={12} strokeWidth={1.5} className="text-text-tertiary" />;

  const deltaColor =
    delta > 1 ? "text-accent-positive" : delta < -1 ? "text-accent-danger" : "text-text-tertiary";

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="w-full text-left ethereal-glass rounded-[14px] p-5 min-h-[160px] hover:border-primary/30 transition-colors"
      aria-expanded={expanded}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity size={12} strokeWidth={1.5} className="text-primary" />
          <span className="text-[10px] tracking-[0.18em] uppercase text-text-tertiary font-display">
            {t("aegis.title")}
          </span>
        </div>
        <ChevronDown
          size={14}
          strokeWidth={1.5}
          className={`text-text-tertiary/60 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </div>

      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-4xl font-display text-foreground tabular-nums">{overall}</span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-text-tertiary">/ 100</span>
      </div>

      <div className={`flex items-center gap-1.5 text-[11px] font-medium ${deltaColor} mb-3`}>
        {trendIcon}
        <span className="tabular-nums">
          {delta > 0 ? `+${delta}` : delta}
        </span>
        <span className="text-text-tertiary/70 font-normal">{t("aegis.vsYesterday")}</span>
      </div>

      {/* mini bars */}
      <div className="grid grid-cols-5 gap-1.5">
        {dims(score).map((d) => (
          <div key={d.key} className="space-y-1">
            <div className="h-1 rounded-full bg-border/40 overflow-hidden">
              <div
                className="h-full bg-primary/70 transition-all"
                style={{ width: `${Math.max(2, d.value)}%` }}
              />
            </div>
            <p className="text-[8px] tracking-[0.12em] uppercase text-text-tertiary/70 truncate">
              {t(d.labelKey)}
            </p>
          </div>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-border/40 space-y-2">
              {dims(score).map((d) => (
                <div key={d.key} className="flex items-center justify-between text-[11px]">
                  <span className="text-text-secondary">{t(d.labelKey)}</span>
                  <span className="font-display tabular-nums text-foreground">
                    {Math.round(d.value)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-border/30">
                <span className="text-text-secondary">{t("aegis.dimRegularity")}</span>
                <span className="font-display tabular-nums text-foreground">
                  {Math.round(Number(score.log_regularity))}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-secondary">{t("aegis.dimArchetype")}</span>
                <span className="font-display tabular-nums text-foreground">
                  {Math.round(Number(score.archetype_coherence))}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
